# Contact form spam protection

Page side (already wired in `contact/index.html` and `script.js`):
- Hidden honeypots `_gotcha` and `website`, plus `_ts` (milliseconds the visitor spent on the form).
- Cloudflare Turnstile widget. Replace `TURNSTILE_SITE_KEY` in `contact/index.html` with your site key.

Server side (Render service `ra-ledger-phone`, `POST /contact-form`):
1. Copy `spam-guard.js` into that service.
2. Before sending the notification email, call `checkSubmission({ fields, ip })`.
   - `silent: true` (honeypot, too fast): return the normal success response but do not send the email.
   - otherwise (`status` 429 or 400): return that status and do not send.
3. In Render, set the environment variable `TURNSTILE_SECRET` to your Turnstile secret key.
4. `ip` should be the real client IP (e.g. `CF-Connecting-IP`, or the first `X-Forwarded-For` entry).

Tests: `node --test form-server/spam-guard.test.js`
