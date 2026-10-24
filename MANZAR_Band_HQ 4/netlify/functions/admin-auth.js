const { createSession, validSession, setCookie, json } = require('../lib/auth');
exports.handler = async event => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !process.env.ADMIN_PASSWORD) return json(503, { error: 'Admin authentication is not configured in Netlify environment variables.' });
  if (event.httpMethod === 'GET') return json(200, { authenticated: validSession(event, secret) });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'GET, POST' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  if (body.action === 'logout') return json(200, { authenticated: false }, { 'Set-Cookie': setCookie('') });
  if (typeof body.password !== 'string' || body.password.length > 512) return json(400, { error: 'Enter your admin password.' });
  const crypto = require('node:crypto');
  const a = Buffer.from(body.password), b = Buffer.from(process.env.ADMIN_PASSWORD);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return json(401, { error: 'Incorrect admin password.' });
  return json(200, { authenticated: true }, { 'Set-Cookie': setCookie(createSession(secret)) });
};
