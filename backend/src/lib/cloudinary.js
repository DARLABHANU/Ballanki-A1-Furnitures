const crypto = require('crypto');
const { fail } = require('./http');

async function uploadProductImage(value) {
  const match = typeof value === 'string' && value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) fail(400, 'Choose a PNG, JPEG or WebP image');
  const buffer = Buffer.from(match[2], 'base64');
  // Keep each JSON request below the frontend hosting request-size limit.
  if (buffer.length > 3 * 1024 * 1024) fail(413, 'Maximum image size is 3 MB');
  const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const webp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!(match[1] === 'png' && png || match[1] === 'jpeg' && jpeg || match[1] === 'webp' && webp)) fail(400, 'Invalid image contents');
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) fail(503, 'Image uploads are not configured yet. Contact the store administrator.');
  const folder = 'ballanki/products';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('sha256').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');
  const body = new FormData();
  body.set('file', value);
  body.set('folder', folder);
  body.set('timestamp', String(timestamp));
  body.set('api_key', key);
  body.set('signature', signature);
  let response, result;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, { method: 'POST', body, signal: AbortSignal.timeout(45000) });
    result = await response.json();
  } catch { fail(502, 'Image storage is unavailable. Please retry the upload.'); }
  if (!response.ok || !result.secure_url || !result.public_id || !result.secure_url.startsWith('https://res.cloudinary.com/')) fail(502, 'Image storage rejected the upload. Please check the Cloudinary configuration.');
  return { url: result.secure_url, public_id: result.public_id };
}
module.exports = { uploadProductImage };
