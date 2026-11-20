import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const derivedBuf = crypto.scryptSync(password, salt, KEY_LENGTH);
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    if (derivedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, expectedBuf);
  } catch {
    return false;
  }
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64').toString('utf8');
}

export function createSessionToken(
  userId: string,
  secret: string,
  ttlMs = DEFAULT_TTL_MS,
  nowMs = Date.now()
): string {
  const payload = base64UrlEncode(
    JSON.stringify({
      uid: userId,
      exp: nowMs + ttlMs,
    })
  );
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${payload}.${sig}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  nowMs = Date.now()
): { userId: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, providedSig] = parts;
  if (!payload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as { uid?: unknown; exp?: unknown };
    if (typeof parsed.uid !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }
    if (parsed.exp <= nowMs) {
      return null;
    }
    return { userId: parsed.uid };
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}
