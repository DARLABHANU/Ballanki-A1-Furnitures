const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const otp = require('../lib/emailOtp');
const mail = require('../lib/email');
const { EmailChallenge } = require('../models/Email');
const User = require('../models/User');
const { verifyGoogleToken } = require('../lib/googleAuth');
const { asyncRoute: wrap, fail, pick } = require('../lib/http');
const { authenticate, tokens, secret } = require('../middleware/auth');
const email = value => { if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(400, 'Enter a valid email'); return value.trim().toLowerCase(); };
const password = value => { if (typeof value !== 'string' || value.length < 8 || value.length > 72) fail(400, 'Password must contain 8–72 characters'); return value; };
const attempts = new Map();
router.use((req, res, next) => {
  if (!['/login', '/google', '/signup', '/forgot-password', '/reset-password', '/verify-otp', '/send-otp', '/resend-otp', '/verify-email-otp'].includes(req.path)) return next();
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
  await otp.issue(accountEmail, 'registration', { full_name: name, password_hash: await bcrypt.hash(accountPassword, 12) });
  res.status(201).json({ requires_verification: true, email: accountEmail, message: mail.localMode() ? 'Verification code saved in the local email outbox.' : 'Check your email for the verification code.' });
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
  if (!user.is_verified && user.role === 'customer') {
    await otp.issue(user.email, 'registration', { full_name: user.full_name, password_hash: user.hashed_password });
    return res.status(403).json({ code: 'EMAIL_VERIFICATION_REQUIRED', email: user.email, error: 'Please verify your email. A verification code has been sent.' });
  }
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
const recoveryMessage = () => ({ message: mail.localMode() ? 'If this account exists, a code was saved in the local email outbox.' : 'If this account exists, a verification code has been sent to its email address.' });
const sendRecovery = async accountEmail => {
  mail.requireEmail();
  const user = await User.findOne({ email: accountEmail, is_active: true });
  if (user) await otp.issue(accountEmail, 'password_reset');
};
router.post('/forgot-password', wrap(async (req, res) => {
  await sendRecovery(email(req.body.email)); res.json(recoveryMessage());
}));
const resend = wrap(async (req, res) => {
  const accountEmail = email(req.body.email || req.body.identifier);
  if (req.body.channel && req.body.channel !== 'email') fail(400, 'Only email verification is supported.');
  if (req.body.purpose === 'password_reset') {
    await sendRecovery(accountEmail); return res.json(recoveryMessage());
  }
  mail.requireEmail();
  const pending = await EmailChallenge.findOne({ email: accountEmail, purpose: 'registration' }).select('+password_hash');
  if (pending?.password_hash) await otp.issue(accountEmail, 'registration', { full_name: pending.full_name, password_hash: pending.password_hash });
  res.json({ message: 'If registration is pending, a new verification code has been sent.' });
});
router.post('/send-otp', resend); router.post('/resend-otp', resend);
const verifyEmail = wrap(async (req, res) => {
  const accountEmail = email(req.body.email || req.body.identifier);
  const purpose = req.body.purpose === 'password_reset' ? 'password_reset' : 'registration';
  const challenge = await otp.verify(accountEmail, purpose, req.body.otp || req.body.otpCode);
  const resetToken = crypto.randomBytes(32).toString('hex');
  const claimed = await EmailChallenge.findOneAndUpdate({ _id: challenge._id, code_hash: challenge.code_hash, expires_at: { $gt: new Date() } }, { $set: { expires_at: new Date(0), ...(purpose === 'password_reset' ? { reset_token_hash: otp.hash(resetToken), reset_token_expires: new Date(Date.now() + 600000) } : {}) } }, { new: true }).select('+password_hash');
  if (!claimed) fail(400, 'This code has already been used.');
  if (purpose === 'password_reset') return res.json({ success: true, reset_token: resetToken });
  let user = await User.findOne({ email: accountEmail }).select('+hashed_password');
  if (user) {
    if (!user.is_active || user.role !== 'customer' || user.is_verified || user.hashed_password !== claimed.password_hash) fail(409, 'Account changed. Please sign in again.');
    user.is_verified = true; await user.save();
  } else {
    user = await User.create({ email: accountEmail, full_name: claimed.full_name, hashed_password: claimed.password_hash, is_verified: true, role: 'customer' });
  }
  await EmailChallenge.deleteOne({ _id: challenge._id });
  res.json(tokens(user));
});
router.post('/verify-otp', verifyEmail); router.post('/verify-email-otp', verifyEmail);
router.post('/reset-password', wrap(async (req, res) => {
  const accountEmail = email(req.body.email);
  const newPassword = password(req.body.new_password);
  if (typeof req.body.reset_token !== 'string' || !/^[a-f0-9]{64}$/.test(req.body.reset_token)) fail(400, 'Password reset session is invalid. Request a new code.');
  const challenge = await EmailChallenge.findOneAndDelete({ email: accountEmail, purpose: 'password_reset', reset_token_hash: otp.hash(req.body.reset_token), reset_token_expires: { $gt: new Date() } });
  if (!challenge) fail(400, 'Password reset session expired or has already been used.');
  const user = await User.findOneAndUpdate({ email: accountEmail, is_active: true }, { $set: { hashed_password: await bcrypt.hash(newPassword, 12), is_verified: true }, $inc: { token_version: 1 }, $unset: { reset_hash: 1, reset_expires: 1 } }, { new: true });
  if (!user) fail(400, 'Password reset session is invalid.');
  res.json({ success: true });
}));
for (const route of ['magic-link-request', 'verify-magic-token']) router.post(`/${route}`, (req, res) => res.status(503).json({ error: 'Use email and password or Continue with Google.' }));
module.exports = router;
