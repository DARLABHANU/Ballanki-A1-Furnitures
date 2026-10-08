const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
const database = 'ballanki_google_test_' + crypto.randomBytes(8).toString('hex');
let server;
async function run() {
  const { OAuth2Client } = require('google-auth-library');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  // Local certificates exercise Google's real signature and claim verification without network requests.
  const originalCertificates = OAuth2Client.prototype.getFederatedSignonCertsAsync;
  OAuth2Client.prototype.getFederatedSignonCertsAsync = async () => ({ certs: { test: publicKey.export({ type: 'spki', format: 'pem' }) } });
  const { verifyGoogleToken } = require('../src/lib/googleAuth');
  const sign = overrides => require('jsonwebtoken').sign({ sub: 'verified-test', email: 'verified@example.test', email_verified: true, iss: 'https://accounts.google.com', aud: process.env.GOOGLE_CLIENT_ID, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, ...overrides }, privateKey, { algorithm: 'RS256', keyid: 'test' });
  assert.equal((await verifyGoogleToken(sign({}))).sub, 'verified-test');
  for (const claims of [{ aud: 'wrong-client' }, { iss: 'https://invalid.example' }, { exp: Math.floor(Date.now() / 1000) - 1000 }, { email_verified: false }]) await assert.rejects(verifyGoogleToken(sign(claims)), error => error.status === 401);
  await assert.rejects(verifyGoogleToken('not-a-valid-token'), error => error.status === 401);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  await assert.rejects(verifyGoogleToken('token'), error => error.status === 503);
  process.env.GOOGLE_CLIENT_ID = clientId;
  await assert.rejects(verifyGoogleToken(''), error => error.status === 400);
  OAuth2Client.prototype.getFederatedSignonCertsAsync = originalCertificates;
  // Only the Google provider is mocked: real routes, password checks, JWTs and MongoDB run below.
  require('../src/lib/googleAuth').verifyGoogleToken = async token => {
    if (token === 'invalid') { const error = new Error('Invalid Google token'); error.status = 401; throw error; }
    return { sub: token, email: token === 'existing' ? 'existing@example.test' : token === 'admin' ? 'admin@example.test' : token + '@example.test', name: 'Google Test', email_verified: true };
  };
  if (process.env.MONGODB_DNS_SERVERS) require('dns').setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(x => x.trim()));
  await mongoose.connect(process.env.MONGODB_URI, { dbName: database, serverSelectionTimeoutMS: 10000 });
  const User = require('../src/models/User');
  await User.init();
  server = require('../src/app').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  let checks = 8;
  async function call(path, body, expected = 200, token) {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/v1/auth/' + path, { method: path === 'profile' ? 'PUT' : path === 'me' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    assert.equal(response.status, expected, JSON.stringify(data)); checks++; return data;
  }
  await call('google', { idToken: 'invalid' }, 401);
  const first = await call('google', { idToken: 'new', role: 'admin' });
  assert.equal(first.role, 'customer'); assert.ok(first.access_token); assert.equal(first.user.google_sub, undefined);
  const second = await call('google', { idToken: 'new' }); assert.equal(second.user_id, first.user_id);
  assert.equal(await User.countDocuments({ email: 'new@example.test' }), 1);
  await call('me', null, 200, first.access_token);
  await call('profile', { full_name: 'Updated Google Customer' }, 200, first.access_token);
  await call('login', { email: 'new@example.test', password: 'Password123!' }, 401);
  await call('change-password', { current_password: '', new_password: 'Password123!' }, 400, first.access_token);
  for (const role of ['customer', 'admin']) {
    const name = role === 'admin' ? 'admin' : 'existing';
    const user = await User.create({ email: name + '@example.test', full_name: 'Existing Account', role, hashed_password: await bcrypt.hash('Password123!', 4) });
    const link = await call('google', { idToken: name }, 409); assert.equal(link.code, 'GOOGLE_LINK_REQUIRED');
    await call('google', { idToken: name, password: 'WrongPassword!' }, 401);
    assert.equal((await User.findById(user._id).select('+google_sub')).google_sub, undefined);
    const linked = await call('google', { idToken: name, password: 'Password123!' }); assert.equal(linked.role, role); assert.equal(linked.user_id, String(user._id));
    await call('google', { idToken: name });
    await call('login', { email: user.email, password: 'Password123!' });
  }
  await User.updateOne({ email: 'new@example.test' }, { is_active: false });
  await call('google', { idToken: 'new' }, 403);
  console.log('Google authentication passed: ' + checks + ' verification and HTTP checks.');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === database && database.startsWith('ballanki_google_test_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
