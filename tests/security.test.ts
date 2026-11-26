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
  safeSecretEqual,
  sanitizeSellersForUser,
} from '../src/server/security.ts';
import type { SellerStore } from '../src/types.ts';

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

test('safeSecretEqual e cifragem de escalePayWebhookSecret funcionam corretamente', () => {
  const master = 'test-master-secret-32-bytes-minimum';
  assert.equal(safeSecretEqual('segredo-123', 'segredo-123'), true);
  assert.equal(safeSecretEqual('segredo-123', 'segredo-124'), false);
  assert.equal(safeSecretEqual('curto', 'muito-mais-longo'), false);

  const gw = encryptGatewaySecrets(
    {
      escalePayWebhookSecret: 'ep_wh_secret_999',
    },
    master
  );
  assert.ok(gw?.escalePayWebhookSecret?.startsWith('enc:v1:'));
  const dec = decryptGatewaySecrets(gw, master);
  assert.equal(dec?.escalePayWebhookSecret, 'ep_wh_secret_999');
});

test('sanitizeSellersForUser oculta KYC, comprovativos e dados bancários para terceiros', () => {
  const sampleSeller: SellerStore = {
    id: 'seller-1',
    ownerUserId: 'user-seller-1',
    name: 'Tech258',
    slug: 'tech258',
    documentId: '110100258001A',
    mainCategory: 'Smartphones',
    description: 'Loja oficial',
    logoText: 'T2',
    accentColor: '#10b981',
    bannerImage: 'https://example.com/banner.jpg',
    status: 'active',
    verified: true,
    rating: 5,
    reviewCount: 1,
    joinedDate: '2026-11-25',
    tenureLabel: 'Novo',
    location: 'Maputo',
    kyc: {
      status: 'verified',
      fullName: 'Carlos Machel',
      documentType: 'BI',
      documentNumber: '110100258001A',
      documentFrontUrl: '/api/assets/kyc/front.png',
    },
    activation: {
      profileCompleted: true,
      kycCompleted: true,
      feePaid: true,
      feeStatus: 'verified',
      feePhone: '840000001',
      feeTransactionId: 'MP26TX01',
      feeProofUrl: '/api/assets/fee/proof.png',
    },
    payoutInfo: {
      bankName: 'Millennium BIM',
      accountType: 'Conta Corrente',
      accountNumber: '1234567890',
      pixOrWallet: '840000001',
    },
  };

  // Visitante anónimo não recebe PII/KYC/banco
  const anon = sanitizeSellersForUser([sampleSeller], null)[0];
  assert.equal(anon.documentId, '');
  assert.equal(anon.kyc?.documentNumber, undefined);
  assert.equal(anon.kyc?.documentFrontUrl, undefined);
  assert.equal(anon.kyc?.status, 'verified');
  assert.equal(anon.activation?.feeTransactionId, undefined);
  assert.equal(anon.activation?.feePhone, undefined);
  assert.equal(anon.payoutInfo.accountNumber, '');

  // Outro vendedor também não recebe
  const other = sanitizeSellersForUser([sampleSeller], { id: 'user-other', role: 'seller', sellerId: 'seller-2' })[0];
  assert.equal(other.payoutInfo.accountNumber, '');

  // O próprio dono e o Admin recebem os dados completos
  const owner = sanitizeSellersForUser([sampleSeller], { id: 'user-seller-1', role: 'seller', sellerId: 'seller-1' })[0];
  assert.equal(owner.payoutInfo.accountNumber, '1234567890');
  const admin = sanitizeSellersForUser([sampleSeller], { id: 'user-admin', role: 'admin' })[0];
  assert.equal(admin.kyc?.documentNumber, '110100258001A');
});
