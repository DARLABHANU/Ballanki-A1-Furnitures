const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const User = require('../models/User');
const { verifyGoogleToken } = require('../lib/googleAuth');
const { asyncRoute: wrap, fail, pick } = require('../lib/http');
const { authenticate, tokens, secret } = require('../middleware/auth');
const email = value => { if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(400, 'Enter a valid email'); return value.trim().toLowerCase(); };
const password = value => { if (typeof value !== 'string' || value.length < 8 || value.length > 72) fail(400, 'Password must contain 8–72 characters'); return value; };
const attempts = new Map();
router.use((req, res, next) => {
  if (!['/login', '/google', '/signup', '/forgot-password', '/reset-password', '/verify-otp'].includes(req.path)) return next();
  const key = req.ip; const now = Date.now(); const item = attempts.get(key);
  if (!item || item.until < now) attempts.set(key, { count: 1, until: now + 60000 });
  else if (++item.count > 30) return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  if (attempts.size > 10000) for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  next();
});
router.post('/signup', wrap(async (req, res) => {
  const name = String(req.body.full_name || '').trim(); if (name.length < 2) fail(400, 'Full name is required');
  const accountEmail = email(req.body.email);
  const accountPassword = password(req.body.password);
  if (await User.exists({ email: accountEmail })) fail(409, 'An account with this email already exists. Please sign in.');
  let user;
  try {
    user = await User.create({ email: accountEmail, full_name: name, hashed_password: await bcrypt.hash(accountPassword, 12), role: 'customer' });
  } catch (error) {
    if (error.code !== 11000) throw error;
    // Confirm an email conflict instead of treating every unique index as an existing account.
    if (await User.exists({ email: accountEmail })) fail(409, 'An account with this email already exists. Please sign in.');
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    console.error('Signup blocked by a conflicting users index:', fields.length ? fields.join(', ') : 'unknown index');
    fail(500, 'Registration is blocked by a database index configuration problem.');
  }
  res.status(201).json(tokens(user));
}));
router.post('/google', wrap(async (req, res) => {
  const profile = await verifyGoogleToken(req.body.idToken);
  const accountEmail = email(profile.email);
  let user = await User.findOne({ google_sub: profile.sub }).select('+google_sub');
  if (!user) {
    user = await User.findOne({ email: accountEmail }).select('+hashed_password +google_sub');
    if (user) {
      if (!user.is_active || user.role === 'merchant') fail(403, 'This account is unavailable.');
      if (user.google_sub && user.google_sub !== profile.sub) fail(409, 'This account is linked to another Google account.');
      // Prove ownership of an existing account before linking, including admin accounts.
      if (!req.body.password) return res.status(409).json({ code: 'GOOGLE_LINK_REQUIRED', error: 'Enter your existing website password to link this Google account.' });
      if (!user.hashed_password || typeof req.body.password !== 'string' || !await bcrypt.compare(req.body.password, user.hashed_password)) fail(401, 'Your existing website password is incorrect.');
      const linked = await User.findOneAndUpdate({ _id: user._id, $or: [{ google_sub: { $exists: false } }, { google_sub: profile.sub }] }, { $set: { google_sub: profile.sub, is_verified: true } }, { new: true });
      if (!linked) fail(409, 'Account linking changed. Please sign in again.');
      user = linked;
    } else {
      try {
        user = await User.create({ email: accountEmail, full_name: String(profile.name || accountEmail.split('@')[0]).slice(0, 150), google_sub: profile.sub, is_verified: true, role: 'customer' });
      } catch (error) {
        if (error.code !== 11000) throw error;
        // Concurrent requests can create only one identity; retry without linking by email.
        user = await User.findOne({ google_sub: profile.sub });
        if (!user) fail(409, 'An account was created with this email. Please try signing in again.');
      }
    }
  }
  if (!user.is_active) fail(403, 'This account is unavailable.');
  res.json(tokens(user));
}));
router.post('/login', wrap(async (req, res) => {
  const user = await User.findOne({ email: email(req.body.email) }).select('+hashed_password');
  if (!user || !user.is_active || !user.hashed_password || typeof req.body.password !== 'string' || !await bcrypt.compare(req.body.password, user.hashed_password)) fail(401, 'Invalid email or password. If you registered with Google, use Continue with Google.');
  res.json(tokens(user));
}));
router.post('/refresh', wrap(async (req, res) => {
  let payload; try { payload = jwt.verify(req.body.refresh_token, secret(), { algorithms: ['HS256'] }); } catch { fail(401, 'Session expired'); }
  const user = await User.findById(payload.user_id);
  if (payload.type !== 'refresh' || !user?.is_active || payload.version !== (user.token_version || 0)) fail(401, 'Session expired');
  res.json(tokens(user));
}));
router.get('/me', authenticate, (req, res) => res.json(req.user));
router.post('/logout', authenticate, wrap(async (req, res) => { req.user.token_version += 1; await req.user.save(); res.json({ success: true }); }));
router.put('/profile', authenticate, wrap(async (req, res) => {
  if (!String(req.body.full_name || '').trim()) fail(400, 'Full name is required');
  Object.assign(req.user, pick(req.body, ['full_name', 'phone'])); await req.user.save(); res.json(req.user);
}));
router.put('/payout-settings', authenticate, wrap(async (req, res) => {
  req.user.payout_settings = pick(req.body, ['mode', 'upi_id', 'bank_name', 'account_holder_name', 'account_number', 'ifsc_code', 'payout_bank_name', 'payout_account_number', 'payout_ifsc_code', 'payout_account_holder_name', 'payout_upi_id']);
  await req.user.save(); res.json(req.user);
}));
router.post('/change-password', authenticate, wrap(async (req, res) => {
  const user = await User.findById(req.user._id).select('+hashed_password');
  if (!user.hashed_password) fail(400, 'This account uses Google sign-in and has no website password.');
  if (!await bcrypt.compare(String(req.body.current_password || ''), user.hashed_password)) fail(400, 'Current password is incorrect');
  user.hashed_password = await bcrypt.hash(password(req.body.new_password), 12); user.token_version += 1; await user.save(); res.json(tokens(user));
}));
router.post('/forgot-password', wrap(async (req, res) => {
  if (process.env.LOCAL_EMAIL_OUTBOX !== 'true' || process.env.NODE_ENV === 'production') fail(503, 'Email delivery is not configured. Contact your administrator.');
  const user = await User.findOne({ email: email(req.body.email) });
  if (user) {
    const code = String(crypto.randomInt(100000, 1000000));
    user.reset_hash = crypto.createHash('sha256').update(code).digest('hex'); user.reset_expires = new Date(Date.now() + 10 * 60000); user.reset_attempts = 0; await user.save();
    const folder = path.resolve(__dirname, '../../local-outbox'); await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, `${user._id}.json`), JSON.stringify({ to: user.email, subject: 'Local password recovery', code, expires: user.reset_expires }, null, 2));
  }
  res.json({ message: 'If the account exists, a recovery code was saved in backend/local-outbox on this computer. No email was sent.' });
}));
const checkReset = async body => {
  const user = await User.findOne({ email: email(body.email || body.identifier) }).select('+reset_hash +reset_expires +reset_attempts');
  if (!user || !user.reset_hash || user.reset_expires < new Date() || user.reset_attempts >= 5) fail(400, 'Recovery code is invalid or expired');
  if (user.reset_hash !== crypto.createHash('sha256').update(String(body.otp || body.otpCode || '')).digest('hex')) { user.reset_attempts += 1; await user.save(); fail(400, 'Recovery code is invalid or expired'); }
  return user;
};
router.post('/verify-otp', wrap(async (req, res) => { await checkReset(req.body); res.json({ success: true, message: 'Recovery code verified' }); }));
router.post('/reset-password', wrap(async (req, res) => {
  const user = await checkReset(req.body); user.hashed_password = await bcrypt.hash(password(req.body.new_password), 12); user.reset_hash = undefined; user.reset_expires = undefined; user.token_version += 1; await user.save(); res.json({ success: true });
}));
for (const route of ['resend-otp', 'send-otp', 'magic-link-request', 'verify-magic-token', 'verify-email-otp']) router.post(`/${route}`, (req, res) => res.status(503).json({ error: 'This sign-in provider is not configured. Use email and password, or password recovery.' }));
module.exports = router;
