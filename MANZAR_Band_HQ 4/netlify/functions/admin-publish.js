const { validSession, json } = require('../lib/auth');
const API = 'https://api.github.com';
function cleanText(v, max = 1000) { return String(v ?? '').trim().slice(0, max); }
function normalizeShow(s) {
  const id = cleanText(s.id, 80).replace(/[^a-zA-Z0-9_-]/g, '-');
  const title = cleanText(s.title, 120), venue = cleanText(s.venue, 120), city = cleanText(s.city || 'Bengaluru', 80);
  const date = cleanText(s.date, 10), time = cleanText(s.time, 5);
  const capacity = Number(s.capacity);
  if (!id || !title || !venue || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !Number.isInteger(capacity) || capacity < 1 || capacity > 5000) throw new Error('Each show needs a title, venue, valid date/time, ID, and capacity from 1 to 5000.');
  const status = ['draft', 'published', 'cancelled'].includes(s.status) ? s.status : 'draft';
  const poster = cleanText(s.poster, 1500);
  if (poster) {
    let parsed; try { parsed = new URL(poster); } catch { throw new Error('Poster must be a valid HTTPS image URL.'); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || /[\s\"'()<>]/.test(poster)) throw new Error('Poster must be a valid HTTPS image URL without spaces or special CSS characters.');
  }
  return { id, title, venue, city, address: cleanText(s.address, 250), date, time, endTime: cleanText(s.endTime, 5), capacity, status, featured: !!s.featured, poster, description: cleanText(s.description, 1000), notes: cleanText(s.notes, 300) };
}
exports.handler = async event => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  if (!validSession(event, process.env.ADMIN_SESSION_SECRET)) return json(401, { error: 'Please sign in again.' });
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return json(503, { error: 'Publishing is not configured. Add GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO and GITHUB_BRANCH in Netlify.' });
  let shows;
  try { shows = JSON.parse(event.body || '{}').shows; } catch { return json(400, { error: 'Invalid JSON.' }); }
  if (!Array.isArray(shows) || shows.length > 300) return json(400, { error: 'Shows must be a list of no more than 300 items.' });
  try {
    const normalized = shows.map(normalizeShow);
    if (new Set(normalized.map(s => s.id)).size !== normalized.length) throw new Error('Every show must have a unique ID.');
    const path = 'data/shows.json';
    const headers = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'MANZAR-Netlify-Publisher' };
    const existing = await fetch(`${API}/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${path}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, { headers });
    let sha;
    if (existing.ok) sha = (await existing.json()).sha;
    else if (existing.status !== 404) return json(502, { error: 'Could not read the current shows file from GitHub.' });
    const response = await fetch(`${API}/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${path}`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Update MANZAR shows via admin dashboard`, content: Buffer.from(JSON.stringify(normalized, null, 2) + '\n').toString('base64'), branch: GITHUB_BRANCH, ...(sha ? { sha } : {}) })
    });
    if (!response.ok) { const details = await response.json().catch(() => ({})); return json(502, { error: details.message || 'GitHub could not publish the show data. Check repository permissions and branch.' }); }
    return json(200, { ok: true, message: 'Shows saved. Netlify will deploy the updated website shortly.', count: normalized.length });
  } catch (error) { return json(400, { error: error.message || 'Could not publish shows.' }); }
};
