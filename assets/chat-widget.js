(function () {
  if (window.__raChatLoaded) return; // never start twice on one page
  window.__raChatLoaded = true;
  // The Free Tools page promises that nothing typed there is sent anywhere, so the chat stays off it.
  if (/^\/tools(\/|$)/.test(location.pathname)) return;
  // Set this to the URL of your chat backend (see note below). Leave empty to show a contact fallback.
  var CHAT_API_URL = 'https://ra-ledger-phone.onrender.com/chat';

  var css = ''
  + '#ra-chat-btn{position:fixed;right:16px;bottom:16px;z-index:9999;display:inline-flex;align-items:center;gap:10px;background:#c9973f;color:#0b2038;border:3px solid #fff;border-radius:999px;padding:14px 22px 14px 16px;font:700 17px system-ui,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 22px rgba(11,32,56,.35);animation:ra-pulse 2.4s ease-out 1.5s 3}'
  + '#ra-chat-btn:hover{background:#dcae57;transform:translateY(-1px)}'
  + '#ra-chat-btn svg{width:26px;height:26px;flex:none}'
  + '@keyframes ra-pulse{0%{box-shadow:0 0 0 0 rgba(201,151,63,.65),0 6px 22px rgba(11,32,56,.35)}100%{box-shadow:0 0 0 18px rgba(201,151,63,0),0 6px 22px rgba(11,32,56,.35)}}'
  + '@media (prefers-reduced-motion:reduce){#ra-chat-btn{animation:none}}'
  + '@media (max-width:480px){#ra-chat-btn{font-size:16px;padding:13px 18px 13px 14px}}'
  + '#ra-chat-box{position:fixed;right:16px;bottom:72px;z-index:9999;width:min(340px,calc(100vw - 32px));height:440px;max-height:calc(100vh - 170px);display:none;flex-direction:column;background:#fff;border:1px solid #c9d1da;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.25);font:14px system-ui,Arial,sans-serif;color:#1a1a1a}'
  + '#ra-chat-box.open{display:flex}'
  + '#ra-chat-head{background:#12314f;color:#fff;padding:10px 12px;border-radius:12px 12px 0 0;font-weight:600;display:flex;justify-content:space-between;align-items:center}'
  + '#ra-chat-head button{background:none;border:0;color:#fff;font-size:18px;cursor:pointer}'
  + '#ra-chat-log{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px}'
  + '.ra-msg{padding:8px 10px;border-radius:10px;max-width:85%;white-space:pre-wrap;line-height:1.4}'
  + '.ra-bot{background:#f1f4f8;align-self:flex-start}.ra-user{background:#12314f;color:#fff;align-self:flex-end}'
  + '#ra-chat-form{display:flex;gap:6px;padding:8px;border-top:1px solid #e1e6ec}'
  + '#ra-chat-form input{flex:1;padding:8px;border:1px solid #c9d1da;border-radius:8px;font:inherit}'
  + '#ra-chat-form button{background:#c9973f;color:#fff;border:0;border-radius:8px;padding:0 14px;font:600 14px system-ui,Arial,sans-serif;cursor:pointer}'
  + '.ra-disc{font-size:11px;color:#666;padding:0 10px 6px}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'ra-chat-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open chat with RA Ledger Solutions');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.2 1.1 4.2 3 5.6V21l3.7-2.2c1 .3 2.1.4 3.3.4 5.5 0 10-3.6 10-8.2S17.5 3 12 3zm-4.5 9.4a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm4.5 0a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm4.5 0a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6z"/></svg><span>Chat with us</span>';

  var box = document.createElement('div');
  box.id = 'ra-chat-box';
  box.setAttribute('role', 'dialog');
  box.innerHTML = '<div id="ra-chat-head"><span>RA Ledger Assistant</span><button type="button" aria-label="Close chat">&times;</button></div>'
    + '<div id="ra-chat-log"></div>'
    + '<div class="ra-disc">Automated assistant. Your messages are sent to our AI service to write a reply, so please don\'t share sensitive details. Not tax or legal advice. Questions? Call 718-285-6959.</div>'
    + '<form id="ra-chat-form"><input id="ra-chat-input" type="text" maxlength="500" placeholder="Ask a question..." aria-label="Your question"><button type="submit">Send</button></form>';

  // On phones the site shows a fixed call bar along the bottom; sit above it instead of covering it.
  function place() {
    var bar = document.querySelector('.call-bar');
    var lift = 0;
    if (bar) {
      var cs = window.getComputedStyle(bar);
      if (cs.display !== 'none' && cs.position === 'fixed') lift = Math.round(bar.getBoundingClientRect().height);
    }
    btn.style.bottom = (16 + lift) + 'px';
    box.style.bottom = (84 + lift) + 'px';
  }

  // Stay hidden until the chat backend answers, so visitors never see a broken chat button.
  btn.style.display = 'none';
  document.body.appendChild(btn);
  document.body.appendChild(box);
  place();
  window.addEventListener('resize', place);
  if (CHAT_API_URL) {
    fetch(CHAT_API_URL, { method: 'GET' }).then(function (r) { if (r.ok) btn.style.display = ''; }).catch(function () {});
  }

  var log = box.querySelector('#ra-chat-log');
  var form = box.querySelector('#ra-chat-form');
  var input = box.querySelector('#ra-chat-input');
  var history = [];

  function add(text, who) {
    var d = document.createElement('div');
    d.className = 'ra-msg ' + (who === 'user' ? 'ra-user' : 'ra-bot');
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  btn.addEventListener('click', function () {
    box.classList.toggle('open');
    if (box.classList.contains('open') && !log.childElementCount) {
      add('Hi! I can answer general questions about RA Ledger Solutions bookkeeping and QuickBooks services. What can I help with?', 'bot');
    }
    input.focus();
  });
  box.querySelector('#ra-chat-head button').addEventListener('click', function () { box.classList.remove('open'); });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    add(q, 'user');
    history.push({ role: 'user', content: q });
    if (!CHAT_API_URL) { add('The chat is not connected yet. Please email info@raledgersolutions.com.', 'bot'); return; }
    var wait = document.createElement('div');
    wait.className = 'ra-msg ra-bot';
    wait.textContent = '...';
    log.appendChild(wait);
    try {
      var res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      var reply = String(data.reply || 'Sorry, I could not answer that. Please email info@raledgersolutions.com.');
      wait.remove();
      add(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      wait.textContent = 'Sorry, the chat is unavailable right now. Please email info@raledgersolutions.com.';
    }
  });
})();
