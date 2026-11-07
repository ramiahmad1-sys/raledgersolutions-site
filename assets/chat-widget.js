(function () {
  // Set this to the URL of your chat backend (see note below). Leave empty to show a contact fallback.
  var CHAT_API_URL = 'https://ra-ledger-phone.onrender.com/chat';

  var css = ''
  + '#ra-chat-btn{position:fixed;right:16px;bottom:16px;z-index:9999;background:#12314f;color:#fff;border:0;border-radius:28px;padding:12px 18px;font:600 15px system-ui,Arial,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}'
  + '#ra-chat-box{position:fixed;right:16px;bottom:72px;z-index:9999;width:min(340px,calc(100vw - 32px));height:440px;display:none;flex-direction:column;background:#fff;border:1px solid #c9d1da;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.25);font:14px system-ui,Arial,sans-serif;color:#1a1a1a}'
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
  btn.textContent = 'Chat with us';

  var box = document.createElement('div');
  box.id = 'ra-chat-box';
  box.setAttribute('role', 'dialog');
  box.innerHTML = '<div id="ra-chat-head"><span>RA Ledger Assistant</span><button type="button" aria-label="Close chat">&times;</button></div>'
    + '<div id="ra-chat-log"></div>'
    + '<div class="ra-disc">Automated assistant. It does not give tax or legal advice. For a free 20-minute call, email certifiedacct10@gmail.com.</div>'
    + '<form id="ra-chat-form"><input id="ra-chat-input" type="text" maxlength="500" placeholder="Ask a question..." aria-label="Your question"><button type="submit">Send</button></form>';

  // Stay hidden until the chat backend answers, so visitors never see a broken chat button.
  btn.style.display = 'none';
  document.body.appendChild(btn);
  document.body.appendChild(box);
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
    if (!CHAT_API_URL) { add('The chat is not connected yet. Please email certifiedacct10@gmail.com.', 'bot'); return; }
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
      var reply = String(data.reply || 'Sorry, I could not answer that. Please email certifiedacct10@gmail.com.');
      wait.remove();
      add(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      wait.textContent = 'Sorry, the chat is unavailable right now. Please email certifiedacct10@gmail.com.';
    }
  });
})();
