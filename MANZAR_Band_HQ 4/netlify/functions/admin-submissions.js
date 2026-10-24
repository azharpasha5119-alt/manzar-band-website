const { validSession, json } = require('../lib/auth');
exports.handler = async event => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' }, { Allow: 'GET' });
  if (!validSession(event, process.env.ADMIN_SESSION_SECRET)) return json(401, { error: 'Please sign in again.' });
  const token = process.env.NETLIFY_AUTH_TOKEN, siteId = process.env.NETLIFY_SITE_ID;
  if (!token || !siteId) return json(503, { error: 'Optional admin booking list is not configured. View reservations under Forms in Netlify.' });
  try {
    const r = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/submissions`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (!r.ok) return json(502, { error: 'Could not read Netlify form submissions.' });
    const all = await r.json();
    const items = all.filter(x => (x.form_name || x.formName || '') === 'reservations').map(x => ({ id: x.id, created_at: x.created_at, data: x.data || {} }));
    return json(200, { submissions: items });
  } catch { return json(502, { error: 'Could not load reservations from Netlify.' }); }
};
