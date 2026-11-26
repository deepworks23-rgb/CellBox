import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decryptGatewaySecrets,
  decryptSecret,
  encryptGatewaySecrets,
  encryptSecret,
  hasRole,
  LoginRateLimiter,
  normalizeClientIp,
  requireRole,
} from '../src/server/security.ts';

test('normalizeClientIp agrupa IPv6 em /64 e normaliza IPv4-mapped', () => {
  assert.equal(normalizeClientIp('::ffff:192.168.1.50'), '192.168.1.50');
  assert.equal(normalizeClientIp('203.0.113.4:54321'), '203.0.113.4');

  const a = normalizeClientIp('2001:db8:abcd:0012::1');
  const b = normalizeClientIp('2001:db8:abcd:12:ffff:ffff:ffff:9999');
  assert.equal(a, '2001:0db8:abcd:0012::/64');
  assert.equal(a, b);
});

test('LoginRateLimiter bloqueia par identificador+IP sem trancar outros IPs e faz faxina', () => {
  let now = 1_700_000_000_000;
  const limiter = new LoginRateLimiter({
    maxAttempts: 3,
    windowMs: 60_000,
    blockMs: 120_000,
    nowFn: () => now,
  });

  limiter.recordFailure('admin@cellbox.co.mz', '2001:db8:1:2::10');
  limiter.recordFailure('admin@cellbox.co.mz', '2001:db8:1:2::20');
  assert.equal(limiter.check('admin@cellbox.co.mz', '2001:db8:1:2::30').allowed, true);

  // Terceira falha no mesmo /64 dispara bloqueio
  limiter.recordFailure('admin@cellbox.co.mz', '2001:db8:1:2::40');
  const blocked = limiter.check('admin@cellbox.co.mz', '2001:db8:1:2::99');
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);

  // Outro IP não fica trancado para o mesmo identificador (Conformidade 6.7)
  assert.equal(limiter.check('admin@cellbox.co.mz', '198.51.100.8').allowed, true);

  // Após expirar o bloqueio, a faxina limpa a entrada expirada
  now += 121_000;
  assert.equal(limiter.check('admin@cellbox.co.mz', '2001:db8:1:2::10').allowed, true);
  assert.equal(limiter.size, 0);
});

test('encryptSecret e decryptSecret cifram em AES-256-GCM com retrocompatibilidade', () => {
  const master = 'test-master-secret-32-bytes-minimum';
  const encrypted = encryptSecret('sk_live_paysuite_12345', master);
  assert.ok(encrypted.startsWith('enc:v1:'));
  assert.notEqual(encrypted, 'sk_live_paysuite_12345');
  assert.equal(decryptSecret(encrypted, master), 'sk_live_paysuite_12345');

  // Não recifra o que já está cifrado
  assert.equal(encryptSecret(encrypted, master), encrypted);

  // Valor legado em texto claro continua legível
  assert.equal(decryptSecret('legacy_plain_secret', master), 'legacy_plain_secret');

  // Cifragem de estrutura de gateways preserva campos não secretos
  const gw = encryptGatewaySecrets(
    {
      paySuite: {
        enabled: true,
        apiKey: 'ps_key_abc',
        webhookSecret: 'ps_wh_xyz',
        environment: 'sandbox',
      },
    },
    master
  );
  assert.ok(gw?.paySuite?.apiKey?.startsWith('enc:v1:'));
  assert.ok(gw?.paySuite?.webhookSecret?.startsWith('enc:v1:'));
  assert.equal(gw?.paySuite?.enabled, true);

  const decryptedGw = decryptGatewaySecrets(gw, master);
  assert.equal(decryptedGw?.paySuite?.apiKey, 'ps_key_abc');
  assert.equal(decryptedGw?.paySuite?.webhookSecret, 'ps_wh_xyz');
});

test('hasRole e requireRole centralizam decisão de acesso', () => {
  assert.equal(hasRole({ role: 'admin' }, ['admin']), true);
  assert.equal(hasRole({ role: 'buyer' }, ['admin', 'seller']), false);
  assert.equal(hasRole(null, ['admin']), false);

  let statusCode = 0;
  let body: unknown = null;
  const mockRes = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Parameters<typeof requireRole>[2];

  assert.equal(requireRole(null, ['admin'], mockRes, 'Sem permissão'), false);
  assert.equal(statusCode, 401);
  assert.ok(body);

  assert.equal(requireRole({ role: 'buyer' }, ['admin'], mockRes, 'Apenas admin'), false);
  assert.equal(statusCode, 403);
  assert.deepEqual(body, { error: 'Apenas admin' });

  assert.equal(requireRole({ role: 'admin' }, ['admin'], mockRes, 'Apenas admin'), true);
});
