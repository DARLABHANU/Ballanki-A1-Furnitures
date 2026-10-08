const { OAuth2Client } = require('google-auth-library');
const { fail } = require('./http');
const client = new OAuth2Client();
client.transporter.defaults = { ...client.transporter.defaults, timeout: 10000, retry: false };

async function verifyGoogleToken(idToken) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) fail(503, 'Google sign-in is not configured. Please use email and password.');
  if (typeof idToken !== 'string' || !idToken || idToken.length > 10000) fail(400, 'A Google sign-in token is required.');
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience });
    payload = ticket.getPayload();
  } catch {
    fail(401, 'Google sign-in expired or could not be verified. Please try again.');
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) fail(401, 'Please use a verified Google email address.');
  return payload;
}
module.exports = { verifyGoogleToken };
