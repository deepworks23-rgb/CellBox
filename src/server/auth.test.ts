import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionToken,
  hashPassword,
  parseCookieHeader,
  verifyPassword,
  verifySessionToken,
} from './auth.ts';

test('hashPassword produces unique salted hashes and verifies correctly', () => {
  const h1 = hashPassword('cellbox123');
  const h2 = hashPassword('cellbox123');
  assert.notEqual(h1, h2, 'Each password hash must use a unique random salt');
  assert.equal(verifyPassword('cellbox123', h1), true);
  assert.equal(verifyPassword('cellbox123', h2), true);
  assert.equal(verifyPassword('wrongpass', h1), false);
  assert.equal(verifyPassword('', h1), false);
  assert.equal(verifyPassword('cellbox123', 'malformed-hash'), false);
});

test('createSessionToken and verifySessionToken validate signatures and expiry', () => {
  const secret = 'test-cellbox-secret-key';
  const now = 1_700_000_000_000;
  const token = createSessionToken('user-buyer-1', secret, 60_000, now);

  assert.deepEqual(verifySessionToken(token, secret, now + 10_000), { userId: 'user-buyer-1' });
  assert.equal(verifySessionToken(token, 'wrong-secret', now + 10_000), null);
  assert.equal(verifySessionToken(`${token}tampered`, secret, now + 10_000), null);
  assert.equal(verifySessionToken(token, secret, now + 60_001), null);
});

test('parseCookieHeader extracts named cookies safely', () => {
  const parsed = parseCookieHeader('foo=bar; cellbox_session=abc.def%3D1; theme=light');
  assert.equal(parsed.foo, 'bar');
  assert.equal(parsed.cellbox_session, 'abc.def=1');
  assert.equal(parsed.theme, 'light');
  assert.deepEqual(parseCookieHeader(undefined), {});
});
