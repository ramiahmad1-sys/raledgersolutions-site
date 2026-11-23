'use strict';
// Drop-in spam protection for the contact-form endpoint (POST /contact-form) on the Render service.
// No dependencies; Node 18+. Usage:
//   const { checkSubmission } = require('./spam-guard');
//   const verdict = await checkSubmission({ fields, ip });   // fields = parsed form body
//   if (!verdict.ok) { /* respond 200 {ok:true} for honeypot/silent, 4xx for others; do NOT send the email */ }
// Env: TURNSTILE_SECRET (required in production). Without it, Turnstile is skipped and a warning is logged once.

const HITS = new Map(); // ip -> [timestamps]
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const MIN_FILL_MS = 3000; // humans rarely finish this form in under 3 seconds
let warned = false;

function rateLimited(ip, now = Date.now()) {
  const list = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  HITS.set(ip, list);
  if (HITS.size > 5000) for (const [k, v] of HITS) if (!v.some((t) => now - t < WINDOW_MS)) HITS.delete(k);
  return list.length > MAX_PER_WINDOW;
}

async function verifyTurnstile(token, ip, fetchImpl = fetch) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    if (!warned) { warned = true; console.warn('TURNSTILE_SECRET not set: skipping Turnstile verification'); }
    return true;
  }
  if (!token) return false;
  try {
    const r = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip || '' }),
    });
    return !!(await r.json()).success;
  } catch (e) {
    return false;
  }
}

async function checkSubmission({ fields, ip, now = Date.now(), fetchImpl }) {
  // Honeypots: any value means a bot. Reply as if it worked so the bot learns nothing.
  if (fields._gotcha || fields.website) return { ok: false, silent: true, reason: 'honeypot' };
  const fill = Number(fields._ts);
  if (Number.isFinite(fill) && fill >= 0 && fill < MIN_FILL_MS) return { ok: false, silent: true, reason: 'too-fast' };
  if (rateLimited(ip || 'unknown', now)) return { ok: false, status: 429, reason: 'rate-limit' };
  if (!(await verifyTurnstile(fields['cf-turnstile-response'], ip, fetchImpl))) return { ok: false, status: 400, reason: 'turnstile' };
  return { ok: true };
}

module.exports = { checkSubmission, rateLimited, verifyTurnstile, _HITS: HITS };
