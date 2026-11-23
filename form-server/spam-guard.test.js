const test = require('node:test');
const assert = require('node:assert');
const { checkSubmission, _HITS } = require('./spam-guard');

const ok = async () => ({ json: async () => ({ success: true }) });
const bad = async () => ({ json: async () => ({ success: false }) });

test('honeypot is silently rejected', async () => {
  _HITS.clear();
  const r = await checkSubmission({ fields: { _gotcha: 'x' }, ip: '1.1.1.1' });
  assert.deepStrictEqual([r.ok, r.silent], [false, true]);
});
test('too-fast submit is silently rejected', async () => {
  _HITS.clear();
  const r = await checkSubmission({ fields: { _ts: '500' }, ip: '1.1.1.2' });
  assert.strictEqual(r.reason, 'too-fast');
});
test('rate limit after 3 per window', async () => {
  _HITS.clear();
  delete process.env.TURNSTILE_SECRET;
  for (let i = 0; i < 3; i++) assert.ok((await checkSubmission({ fields: { _ts: '9000' }, ip: '2.2.2.2' })).ok);
  assert.strictEqual((await checkSubmission({ fields: { _ts: '9000' }, ip: '2.2.2.2' })).status, 429);
});
test('turnstile required and verified when secret set', async () => {
  _HITS.clear();
  process.env.TURNSTILE_SECRET = 's';
  assert.strictEqual((await checkSubmission({ fields: { _ts: '9000' }, ip: '3.3.3.3', fetchImpl: ok })).reason, 'turnstile');
  assert.strictEqual((await checkSubmission({ fields: { _ts: '9000', 'cf-turnstile-response': 't' }, ip: '3.3.3.3', fetchImpl: bad })).reason, 'turnstile');
  assert.ok((await checkSubmission({ fields: { _ts: '9000', 'cf-turnstile-response': 't' }, ip: '3.3.3.3', fetchImpl: ok })).ok);
  delete process.env.TURNSTILE_SECRET;
});
