const crypto = require('node:crypto');
const COOKIE = 'manzar_admin_session';
const MAX_AGE = 8 * 60 * 60;
function b64url(value) { return Buffer.from(value).toString('base64url'); }
function sign(payload, secret) { return crypto.createHmac('sha256', secret).update(payload).digest('base64url'); }
function cookieValue(event) {
  const raw = event.headers.cookie || event.headers.Cookie || '';
  const item = raw.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : '';
}
function createSession(secret) {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE, nonce: crypto.randomBytes(16).toString('hex') }));
  return `${payload}.${sign(payload, secret)}`;
}
function validSession(event, secret) {
  if (!secret) return false;
  const token = cookieValue(event);
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expected = sign(payload, secret);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Math.floor(Date.now() / 1000); } catch { return false; }
}
function setCookie(value, secure = true) { return `${COOKIE}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${value ? MAX_AGE : 0}`; }
function json(statusCode, body, extra = {}) { return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }, body: JSON.stringify(body) }; }
module.exports = { COOKIE, createSession, validSession, setCookie, json };
