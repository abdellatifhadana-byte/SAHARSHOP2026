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
