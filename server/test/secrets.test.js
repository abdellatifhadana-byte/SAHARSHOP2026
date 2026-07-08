'use strict';
// Tests for secrets-at-rest encryption (H-1)
const { test } = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci-1234567890';
const secrets = require('../lib/secrets');

test('encrypt/decrypt round-trip', () => {
  const enc = secrets.encrypt('sk-secret-123');
  assert.ok(enc.startsWith('enc:v1:'), 'should be tagged ciphertext');
  assert.strictEqual(secrets.decrypt(enc), 'sk-secret-123');
});

test('decrypt passthrough for legacy plaintext', () => {
  assert.strictEqual(secrets.decrypt('plain-old-key'), 'plain-old-key');
});

test('empty string stays empty (not encrypted)', () => {
  assert.strictEqual(secrets.encrypt(''), '');
});

test('encryptSettings encrypts known secrets, leaves non-secrets untouched', () => {
  const s = { ai: { apiKey: 'sk-x', model: 'gpt-4o' }, social: { whatsapp: { accessToken: 'wa', pageId: '1' } }, brand: { name: 'Sahar' } };
  const enc = secrets.encryptSettings(s);
  assert.ok(enc.ai.apiKey.startsWith('enc:v1:'));
  assert.strictEqual(enc.ai.model, 'gpt-4o');
  assert.ok(enc.social.whatsapp.accessToken.startsWith('enc:v1:'));
  assert.strictEqual(enc.social.whatsapp.pageId, '1');
  assert.strictEqual(enc.brand.name, 'Sahar');
  // caller's object must not be mutated
  assert.strictEqual(s.ai.apiKey, 'sk-x');
});

test('decryptSettings reverses encryptSettings', () => {
  const s = { ai: { apiKey: 'sk-y' }, cloudinaryApiSecret: 'cld', security: { hcaptchaSecret: 'hc' } };
  const dec = secrets.decryptSettings(secrets.encryptSettings(s));
  assert.strictEqual(dec.ai.apiKey, 'sk-y');
  assert.strictEqual(dec.cloudinaryApiSecret, 'cld');
  assert.strictEqual(dec.security.hcaptchaSecret, 'hc');
});

// ── H-1 (جانب العميل): القناع وتجريده ─────────────────────────
test('maskSettings replaces secrets with MASK, keeps non-secrets and empties', () => {
  const s = { ai: { apiKey: 'sk-x', geminiKey: '', model: 'gpt-4o' }, social: { whatsapp: { accessToken: 'wa', pageId: '1' } } };
  const m = secrets.maskSettings(s);
  assert.strictEqual(m.ai.apiKey, secrets.MASK);
  assert.strictEqual(m.ai.geminiKey, '');
  assert.strictEqual(m.ai.model, 'gpt-4o');
  assert.strictEqual(m.social.whatsapp.accessToken, secrets.MASK);
  assert.strictEqual(m.social.whatsapp.pageId, '1');
  // caller object untouched
  assert.strictEqual(s.ai.apiKey, 'sk-x');
});

test('stripMasked drops MASK values recursively, keeps real edits', () => {
  const incoming = { ai: { apiKey: secrets.MASK, model: 'gpt-4o' }, social: { whatsapp: { accessToken: secrets.MASK, pageId: '2' } }, brand: { name: 'Y' } };
  const out = secrets.stripMasked(incoming);
  assert.strictEqual(out.ai.apiKey, undefined);
  assert.strictEqual(out.ai.model, 'gpt-4o');
  assert.strictEqual(out.social.whatsapp.accessToken, undefined);
  assert.strictEqual(out.social.whatsapp.pageId, '2');
  assert.strictEqual(out.brand.name, 'Y');
});

test('stripMasked keeps empty string (explicit clear) and arrays', () => {
  const out = secrets.stripMasked({ ai: { apiKey: '' }, list: [1, 2] });
  assert.strictEqual(out.ai.apiKey, '');
  assert.deepStrictEqual(out.list, [1, 2]);
});
