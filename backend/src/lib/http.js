const mongoose = require('mongoose');
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
const pick = (data, keys) => Object.fromEntries(keys.filter(k => data[k] !== undefined).map(k => [k, data[k]]));
const id = value => { if (!mongoose.isValidObjectId(value)) fail(400, 'Invalid record ID'); return String(value); };
const plain = doc => { if (!doc) return null; const v = doc.toObject ? doc.toObject() : doc; const { _id, __v, ...rest } = v; return { ...rest, id: String(_id || v.id), created_at: v.created_at || v.createdAt, updated_at: v.updated_at || v.updatedAt }; };
const page = (items, q = {}) => { const size = Math.max(1, Math.min(100, Number(q.page_size || q.limit) || 20)); const n = Math.max(1, Number(q.page) || 1); return { items: items.slice((n-1)*size,n*size), total: items.length, page:n, page_size:size, pages:Math.max(1,Math.ceil(items.length/size)) }; };
module.exports = { asyncRoute, fail, pick, id, plain, page };
