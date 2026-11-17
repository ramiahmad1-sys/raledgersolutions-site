# RA Ledger Solutions — Phone Assistant, Chat and Website Setup

Working notes. Last updated 2026-11-16.

## Where things live

| Piece | Location |
|---|---|
| Website (GitHub Pages, raledgersolutions.com) | repo `ramiahmad1-sys/raledgersolutions-site`, branch `main` |
| Phone assistant, chat server, contact-form endpoint | repo `ramiahmad1-sys/raledgersolutions`, folder `phone-agent/`, branch `claude/sweet-faraday-st9wci`; Render service `ra-ledger-phone` (manual deploys) |
| Client portal | same repo, `main` branch; Google Cloud VM `raledger` (us-east1-b, 34.24.115.250). Deploy: SSH in, `sudo raledger-update` |
| Domain DNS | GoDaddy |
| Phone number | Twilio (718) 285-6959 |

## How changes get published

Claude sessions cannot push to either repo. Working route: Claude loads files on GitHub's upload page in Rami's browser and Rami clicks **Commit changes**. Claude can run Render's Manual Deploy; it is not permitted to open the Google Cloud SSH terminal.

## Phone service (phone-agent/server.js)

- Twilio speech → Groq → spoken reply. Facts in `knowledge.js` (no payroll; 718-285-6959; info@raledgersolutions.com). Persona "Alex", states it is automated if asked.
- Voice: `VOICE` env var, currently `Google.en-US-Chirp3-HD-Charon`. If `ELEVENLABS_API_KEY` is set, lines are spoken by ElevenLabs (`ELEVENLABS_VOICE_ID`, default `iP95p4xoKVk53GoZ742B`) and fall back to `VOICE` on any failure.
- `/chat`: website chat (rate limited, raledgersolutions.com only).
- `/contact-form`: website contact form, emailed to `ALERT_EMAIL_TO` through Resend with reply-to set to the visitor. Tested live 2026-11-16.
- `/check`: status page showing Groq, voice and alert channels.
- Call alerts: email (Resend) and ntfy.

## Website

- Chat widget `assets/chat-widget.js`, loaded site-wide by `script.js`, hidden on `/tools*`.
- Free tools: Books Checkup, Runway Check, Cash-Flow Forecaster (`/tools/cash-flow`).
- `/privacy.html` and `/sms-consent.html` exist for the Twilio A2P campaign links.

## Open items (2026-11-16)

1. Commit `thank-you/index.html` (form success page) if not yet done.
2. ElevenLabs: Rami creates an account and API key, adds `ELEVENLABS_API_KEY` in Render, then redeploys.
3. Test call to confirm the current voice works.
4. Portal email settings in `/etc/raledger.env` on the VM (sender/receiver info@raledgersolutions.com).
5. Twilio A2P campaign status unknown since Nov 6.
6. Google reviews: none yet; review link https://g.page/r/CdsIRr50wkQ3ECE/review
