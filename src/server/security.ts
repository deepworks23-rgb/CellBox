import crypto from 'node:crypto';
import type { Response } from 'express';
import type { SellerStore, SiteCustomization } from '../types.ts';

export type UserRole = 'admin' | 'seller' | 'buyer';

const ENCRYPTED_PREFIX = 'enc:v1:';
const SENSITIVE_GATEWAY_KEYS = [
  'apiKey',
  'webhookSecret',
  'publicKey',
  'emolaApiKey',
  'emolaPublicKey',
] as const;

/**
 * Comparação de segredos em tempo constante para webhooks e tokens.
 */
export function safeSecretEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Centraliza a verificação de papel do usuário (Conformidade 6.2).
 * Nenhuma rota deve comparar papéis manualmente fora deste helper.
 */
export function hasRole(
  user: { role?: string } | null | undefined,
  allowed: readonly UserRole[]
): boolean {
  if (!user || !user.role) return false;
  return allowed.includes(user.role as UserRole);
}

/**
 * Exige que o usuário autenticado possua um dos papéis permitidos.
 * Responde 401/403 e retorna false quando não autorizado.
 */
export function requireRole<T extends { role?: string }>(
  user: T | null | undefined,
  allowed: readonly UserRole[],
  res: Response,
  forbiddenMessage: string
): user is T {
  if (!user) {
    res.status(401).json({ error: 'Autenticação necessária para aceder a este recurso.' });
    return false;
  }
  if (!hasRole(user, allowed)) {
    res.status(403).json({ error: forbiddenMessage });
    return false;
  }
  return true;
}

/**
 * Normaliza o endereço IP do cliente para rate limiting (Conformidade 6.7 / Lição K27):
 * - IPv4 mapeado em IPv6 (`::ffff:1.2.3.4`) vira IPv4 puro (`1.2.3.4`).
 * - IPv6 é agrupado pelo prefixo `/64` (`xxxx:xxxx:xxxx:xxxx::/64`) para evitar bypass
 *   trocando os 64 bits de interface.
 */
export function normalizeClientIp(rawIp: string | undefined | null): string {
  const first = String(rawIp ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (!first) return 'unknown';

  // Remove zona (%eth0) e colchetes ([::1])
  const cleaned = first.replace(/^\[|\]$/g, '').split('%')[0];

  // IPv4-mapped IPv6: ::ffff:a.b.c.d
  const v4Mapped = cleaned.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Mapped) return v4Mapped[1];

  // IPv4 com porta opcional: a.b.c.d:port
  const v4Plain = cleaned.match(/^(\d+\.\d+\.\d+\.\d+)(?::\d+)?$/);
  if (v4Plain) return v4Plain[1];

  // IPv6: expandir "::" para 8 hextetos e pegar os 4 primeiros (/64)
  if (cleaned.includes(':')) {
    const parts = cleaned.split('::');
    if (parts.length <= 2) {
      const left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
      const right = parts[1] ? parts[1].split(':').filter(Boolean) : [];
      const missing = Math.max(0, 8 - (left.length + right.length));
      const full = [...left, ...Array(missing).fill('0'), ...right];
      if (full.length === 8) {
        const prefix = full
          .slice(0, 4)
          .map((h) => h.padStart(4, '0'))
          .join(':');
        return `${prefix}::/64`;
      }
    }
  }

  return cleaned;
}

interface AttemptBucket {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
}

export interface LoginRateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  blockMs?: number;
  maxEntries?: number;
  nowFn?: () => number;
}

/**
 * Limitador de tentativas de login por par (identificador + prefixo IP /64).
 * Impede ataque de negação de serviço que tranca a conta de terceiros apenas sabendo o e-mail,
 * e inclui faxina de entradas expiradas em memória (Conformidade 6.7).
 */
export class LoginRateLimiter {
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockMs: number;
  private readonly maxEntries: number;
  private readonly nowFn: () => number;
  private readonly buckets = new Map<string, AttemptBucket>();

  constructor(options: LoginRateLimiterOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 10;
    this.windowMs = options.windowMs ?? 15 * 60 * 1000;
    this.blockMs = options.blockMs ?? 15 * 60 * 1000;
    this.maxEntries = options.maxEntries ?? 2000;
    this.nowFn = options.nowFn ?? (() => Date.now());
  }

  private makeKey(identifier: string, rawIp: string | undefined | null): string {
    return `${identifier.trim().toLowerCase()}|${normalizeClientIp(rawIp)}`;
  }

  prune(now = this.nowFn()): number {
    let removed = 0;
    for (const [key, bucket] of this.buckets.entries()) {
      const windowExpired = now - bucket.firstFailureAt > this.windowMs;
      const blockExpired = bucket.blockedUntil > 0 && now >= bucket.blockedUntil;
      if ((bucket.blockedUntil === 0 && windowExpired) || blockExpired) {
        this.buckets.delete(key);
        removed += 1;
      }
    }
    if (this.buckets.size > this.maxEntries) {
      const excess = this.buckets.size - this.maxEntries;
      let i = 0;
      for (const key of this.buckets.keys()) {
        if (i >= excess) break;
        this.buckets.delete(key);
        removed += 1;
        i += 1;
      }
    }
    return removed;
  }

  check(
    identifier: string,
    rawIp: string | undefined | null
  ): { allowed: boolean; retryAfterSeconds: number } {
    const now = this.nowFn();
    this.prune(now);
    const key = this.makeKey(identifier, rawIp);
    const bucket = this.buckets.get(key);
    if (!bucket) return { allowed: true, retryAfterSeconds: 0 };
    if (bucket.blockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000)),
      };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  recordFailure(identifier: string, rawIp: string | undefined | null): void {
    const now = this.nowFn();
    this.prune(now);
    const key = this.makeKey(identifier, rawIp);
    const existing = this.buckets.get(key);
    if (!existing || now - existing.firstFailureAt > this.windowMs) {
      this.buckets.set(key, { failures: 1, firstFailureAt: now, blockedUntil: 0 });
      return;
    }
    const failures = existing.failures + 1;
    const blockedUntil = failures >= this.maxAttempts ? now + this.blockMs : 0;
    this.buckets.set(key, {
      failures,
      firstFailureAt: existing.firstFailureAt,
      blockedUntil,
    });
  }

  reset(identifier: string, rawIp: string | undefined | null): void {
    this.buckets.delete(this.makeKey(identifier, rawIp));
  }

  get size(): number {
    return this.buckets.size;
  }
}

function deriveAesKey(masterSecret: string): Buffer {
  return crypto.createHash('sha256').update(masterSecret, 'utf8').digest();
}

/**
 * Cifra um segredo em repouso com AES-256-GCM (Conformidade 6.8).
 * Strings vazias ou já cifradas são preservadas sem dupla cifragem.
 */
export function encryptSecret(plain: string, masterSecret: string): string {
  const trimmed = plain.trim();
  if (!trimmed || trimmed.startsWith(ENCRYPTED_PREFIX)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveAesKey(masterSecret), iv);
  const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decifra um segredo cifrado com `encryptSecret`.
 * Mantém compatibilidade retroativa com segredos antigos em texto claro.
 */
export function decryptSecret(value: string, masterSecret: string): string {
  if (!value || !value.startsWith(ENCRYPTED_PREFIX)) return value;
  const payload = value.slice(ENCRYPTED_PREFIX.length);
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) return '';
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      deriveAesKey(masterSecret),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

function transformGatewaySecrets(
  gateways: SiteCustomization['gateways'] | undefined,
  masterSecret: string,
  fn: (val: string, secret: string) => string
): SiteCustomization['gateways'] | undefined {
  if (!gateways) return gateways;
  const next: NonNullable<SiteCustomization['gateways']> = { ...gateways };
  if (typeof next.escalePayWebhookSecret === 'string' && next.escalePayWebhookSecret.trim().length > 0) {
    next.escalePayWebhookSecret = fn(next.escalePayWebhookSecret, masterSecret);
  }
  for (const providerKey of ['paySuite', 'debitoPay', 'mpesaDirect'] as const) {
    const cfg = next[providerKey];
    if (!cfg) continue;
    const updatedCfg: Record<string, unknown> = { ...cfg };
    for (const secretField of SENSITIVE_GATEWAY_KEYS) {
      const val = updatedCfg[secretField];
      if (typeof val === 'string' && val.trim().length > 0) {
        updatedCfg[secretField] = fn(val, masterSecret);
      }
    }
    (next as Record<string, unknown>)[providerKey] = updatedCfg;
  }
  return next;
}

export function encryptGatewaySecrets(
  gateways: SiteCustomization['gateways'] | undefined,
  masterSecret: string
): SiteCustomization['gateways'] | undefined {
  return transformGatewaySecrets(gateways, masterSecret, encryptSecret);
}

export function decryptGatewaySecrets(
  gateways: SiteCustomization['gateways'] | undefined,
  masterSecret: string
): SiteCustomization['gateways'] | undefined {
  return transformGatewaySecrets(gateways, masterSecret, decryptSecret);
}

/**
 * Remove documentos KYC, comprovativos financeiros e dados bancários das lojas
 * quando o requisitante não é o Super Admin nem o lojista proprietário.
 */
export function sanitizeSellersForUser(
  sellers: readonly SellerStore[],
  user: { id?: string; role?: string; sellerId?: string } | null | undefined
): SellerStore[] {
  if (hasRole(user, ['admin'])) {
    return [...sellers];
  }
  return sellers.map((seller) => {
    const isOwner = Boolean(
      user?.id && (seller.ownerUserId === user.id || (user.sellerId && seller.id === user.sellerId))
    );
    if (isOwner) return seller;
    return {
      ...seller,
      documentId: '',
      kyc: seller.kyc ? { status: seller.kyc.status ?? 'not_submitted' } : undefined,
      activation: seller.activation
        ? {
            profileCompleted: Boolean(seller.activation.profileCompleted),
            kycCompleted: Boolean(seller.activation.kycCompleted),
            feePaid: Boolean(seller.activation.feePaid),
            feeStatus: seller.activation.feeStatus,
          }
        : undefined,
      payoutInfo: {
        bankName: '',
        accountType: '',
        accountNumber: '',
        pixOrWallet: '',
      },
    };
  });
}
