'use strict';
// Tests for input validation/sanitization middleware
const { test } = require('node:test');
const assert = require('node:assert');

const { isValidPhone, isValidEmail, sanitizeStr } = require('../middleware/validate');

test('Moroccan phone validation', () => {
  assert.ok(isValidPhone('0612345678'), '0-prefixed mobile');
  assert.ok(isValidPhone('212612345678'), 'country-code mobile');
  assert.ok(isValidPhone('+212 612-345-678'), 'formatted');
  assert.ok(!isValidPhone('123'), 'too short');
  assert.ok(!isValidPhone(''), 'empty');
});

test('email validation', () => {
  assert.ok(isValidEmail('a@b.com'));
  assert.ok(isValidEmail('user.name@store.ma'));
  assert.ok(!isValidEmail('not-an-email'));
  assert.ok(!isValidEmail('a@b'));
});

test('sanitizeStr strips angle brackets (basic XSS)', () => {
  const out = sanitizeStr('<script>x</script>');
  assert.ok(!out.includes('<') && !out.includes('>'), 'no angle brackets');
});

test('sanitizeStr truncates to maxLen and trims', () => {
  assert.strictEqual(sanitizeStr('abcdef', 3), 'abc');
  assert.strictEqual(sanitizeStr('  hi  '), 'hi');
});

test('sanitizeStr handles null/undefined', () => {
  assert.strictEqual(sanitizeStr(null), '');
  assert.strictEqual(sanitizeStr(undefined), '');
});
