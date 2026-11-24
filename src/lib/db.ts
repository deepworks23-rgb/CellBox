import crypto from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';
import type { Pool as PoolType, PoolClient, QueryResult, QueryResultRow } from 'pg';
import type {
  Address,
  Order,
  OrderStatus,
  Product,
  Review,
  SellerActivationStatus,
  SellerKycInfo,
  SellerPayoutInfo,
  SellerSocials,
  SellerStatus,
  SellerStore,
  SiteCustomization,
  User,
} from '../types.ts';
import { DEFAULT_SITE_CUSTOMIZATION } from '../data/defaultCustomization.ts';

if (!process.env.VERCEL) {
  dotenv.config({ quiet: true });
}

const { Pool } = pg;

export interface StoredUser extends User {
  passwordHash: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface UploadedAssetRecord {
  key: string;
  bucket: string;
  ownerUserId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}

export interface SeedPayload {
  users: StoredUser[];
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  orders: Order[];
  addressesByUser: Record<string, Address[]>;
  wishlistsByUser: Record<string, string[]>;
  commissionRate: number;
}

export interface DatabaseEnvDiagnostics {
  configured: boolean;
  source: string | null;
  host: string | null;
  isServerless: boolean;
}

const DB_ENV_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'NEON_DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
] as const;

function sanitizeEnvValue(raw?: string): string {
  if (!raw) return '';
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function resolveDatabaseConnection(): {
  source: string | null;
  connectionString: string | null;
  host: string | null;
  useSsl: boolean;
} {
  for (const key of DB_ENV_KEYS) {
    const raw = sanitizeEnvValue(process.env[key]);
    if (!raw) continue;

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error(
        `A variável de ambiente ${key} contém uma URL PostgreSQL inválida. Verifique o valor configurado na Vercel ou no arquivo .env.`
      );
    }

    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
      throw new Error(
        `A variável de ambiente ${key} deve iniciar com "postgresql://" ou "postgres://".`
      );
    }

    const hostname = parsed.hostname.toLowerCase();
    const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase();
    const isLocalHost =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const useSsl = sslMode !== 'disable' && (!isLocalHost || sslMode === 'require');

    // Remove sslmode/channel_binding query overrides when passing explicit ssl config to node-postgres
    // so Neon TLS works consistently across Node & Vercel serverless runtimes without warnings or negotiation failures.
    if (useSsl) {
      parsed.searchParams.delete('sslmode');
      parsed.searchParams.delete('channel_binding');
    }

    return {
      source: key,
      connectionString: parsed.toString(),
      host: parsed.hostname || null,
      useSsl,
    };
  }

  return {
    source: null,
    connectionString: null,
    host: null,
    useSsl: true,
  };
}

export function getDatabaseEnvDiagnostics(): DatabaseEnvDiagnostics {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  try {
    const resolved = resolveDatabaseConnection();
    return {
      configured: Boolean(resolved.connectionString),
      source: resolved.source,
      host: resolved.host,
      isServerless,
    };
  } catch {
    return {
      configured: false,
      source: null,
      host: null,
      isServerless,
    };
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __cellboxPgPool?: PoolType | null;
};

function createPool(): PoolType {
  const resolved = resolveDatabaseConnection();
  if (!resolved.connectionString) {
    throw new Error(
      'DATABASE_URL não configurada no runtime. Defina DATABASE_URL (ou POSTGRES_URL) em Vercel → Project Settings → Environment Variables e faça Redeploy.'
    );
  }

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  const instance = new Pool({
    connectionString: resolved.connectionString,
    ssl: resolved.useSsl ? { rejectUnauthorized: false } : false,
    max: isServerless ? 3 : 10,
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: 20_000,
    allowExitOnIdle: isServerless,
  });

  instance.on('error', (err) => {
    console.error('[Cellbox PostgreSQL] Unexpected idle client error:', err.message);
    if (globalForDb.__cellboxPgPool === instance) {
      globalForDb.__cellboxPgPool = null;
    }
  });

  return instance;
}

export function getPool(): PoolType {
  if (!globalForDb.__cellboxPgPool) {
    globalForDb.__cellboxPgPool = createPool();
  }
  return globalForDb.__cellboxPgPool;
}

function isTransientConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const code = (err as { code?: string }).code ?? '';
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    code === '57P01' ||
    code === '57P02' ||
    code === '57P03' ||
    msg.includes('connection terminated unexpectedly') ||
    msg.includes('client has encountered a connection error') ||
    msg.includes('timeout exceeded when trying to connect')
  );
}

export async function getDatabaseHealthStats(): Promise<{
  users: number;
  sellers: number;
  products: number;
  categories: number;
}> {
  const res = await query<{
    users: number;
    sellers: number;
    products: number;
    categories: number;
  }>(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM sellers) AS sellers,
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM categories) AS categories
  `);
  return res.rows[0] ?? { users: 0, sellers: 0, products: 0, categories: 0 };
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  try {
    return await getPool().query<T>(text, params);
  } catch (err) {
    if (isTransientConnectionError(err)) {
      globalForDb.__cellboxPgPool = null;
      return getPool().query<T>(text, params);
    }
    throw err;
  }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (globalForDb.__cellboxPgPool) {
    const current = globalForDb.__cellboxPgPool;
    globalForDb.__cellboxPgPool = null;
    await current.end();
  }
}

// ── Row Mappers ──────────────────────────────────────────────────────────────

function mapUserRow(r: QueryResultRow): StoredUser {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    role: r.role,
    phone: r.phone ? String(r.phone) : undefined,
    sellerId: r.seller_id ? String(r.seller_id) : undefined,
    avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
    province: r.province ? String(r.province) : undefined,
    city: r.city ? String(r.city) : undefined,
    neighborhood: r.neighborhood ? String(r.neighborhood) : undefined,
    zipCode: r.zip_code ? String(r.zip_code) : undefined,
    createdAt: String(r.created_at),
    passwordHash: String(r.password_hash),
  };
}

function mapSellerRow(r: QueryResultRow): SellerStore {
  return {
    id: String(r.id),
    ownerUserId: String(r.owner_user_id),
    name: String(r.name),
    slug: String(r.slug),
    documentId: String(r.document_id),
    mainCategory: String(r.main_category),
    description: String(r.description),
    logoText: String(r.logo_text),
    logoUrl: r.logo_url ? String(r.logo_url) : undefined,
    accentColor: String(r.accent_color),
    bannerImage: String(r.banner_image),
    status: r.status,
    verified: Boolean(r.verified),
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    joinedDate: String(r.joined_date),
    tenureLabel: String(r.tenure_label),
    location: String(r.location),
    socials: (r.socials as SellerSocials) ?? {},
    kyc: (r.kyc as SellerKycInfo) ?? { status: 'not_submitted' },
    activation: (r.activation as SellerActivationStatus) ?? {
      profileCompleted: true,
      kycCompleted: Boolean(r.verified),
      feePaid: r.status === 'active',
    },
    payoutInfo: r.payout_info as SellerPayoutInfo,
  };
}

function mapProductRow(r: QueryResultRow): Product {
  return {
    id: String(r.id),
    sellerId: String(r.seller_id),
    title: String(r.title),
    brand: String(r.brand),
    category: String(r.category),
    condition: r.condition,
    price: Number(r.price),
    originalPrice:
      r.original_price !== null && r.original_price !== undefined
        ? Number(r.original_price)
        : undefined,
    stock: Number(r.stock),
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    soldCount: Number(r.sold_count),
    isFlashDeal: Boolean(r.is_flash_deal),
    isBestSeller: Boolean(r.is_best_seller),
    images: Array.isArray(r.images) ? r.images : [],
    description: String(r.description),
    specs: r.specs ?? {},
    createdAt: String(r.created_at),
  };
}

function mapOrderRow(r: QueryResultRow): Order {
  return {
    id: String(r.id),
    buyerId: String(r.buyer_id),
    buyerName: String(r.buyer_name),
    buyerEmail: String(r.buyer_email),
    createdAt: String(r.created_at),
    shippingAddress: r.shipping_address as Address,
    paymentMethod: r.payment_method,
    commissionRateSnapshot: Number(r.commission_rate_snapshot),
    subtotal: Number(r.subtotal),
    discountTotal:
      r.discount_total !== null && r.discount_total !== undefined
        ? Number(r.discount_total)
        : undefined,
    couponCode: r.coupon_code ? String(r.coupon_code) : undefined,
    shippingTotal: Number(r.shipping_total),
    total: Number(r.total),
    fulfillments: Array.isArray(r.fulfillments) ? r.fulfillments : [],
  };
}

function mapAddressRow(r: QueryResultRow): Address {
  return {
    id: String(r.id),
    label: String(r.label),
    recipient: String(r.recipient),
    street: String(r.street),
    city: String(r.city),
    state: String(r.state),
    zipCode: String(r.zip_code),
    isDefault: Boolean(r.is_default),
  };
}

// ── Schema Initialization & Idempotent Seeding ───────────────────────────────

export async function ensureDatabaseSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      phone TEXT,
      seller_id TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sellers (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      document_id TEXT NOT NULL,
      main_category TEXT NOT NULL,
      description TEXT NOT NULL,
      logo_text TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      banner_image TEXT NOT NULL,
      status TEXT NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      joined_date TEXT NOT NULL,
      tenure_label TEXT NOT NULL,
      location TEXT NOT NULL,
      payout_info JSONB NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL,
      title TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      condition TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      original_price DOUBLE PRECISION,
      stock INTEGER NOT NULL DEFAULT 0,
      rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      sold_count INTEGER NOT NULL DEFAULT 0,
      is_flash_deal BOOLEAN NOT NULL DEFAULT FALSE,
      is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
      images JSONB NOT NULL,
      description TEXT NOT NULL,
      specs JSONB NOT NULL,
      badge TEXT,
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flash_deal BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT FALSE;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS province TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code TEXT;
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

    ALTER TABLE sellers ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE sellers ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE sellers ADD COLUMN IF NOT EXISTS kyc JSONB DEFAULT '{"status":"not_submitted"}'::jsonb;
    ALTER TABLE sellers ADD COLUMN IF NOT EXISTS activation JSONB DEFAULT '{"profileCompleted":true,"kycCompleted":false,"feePaid":false}'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      shipping_address JSONB NOT NULL,
      payment_method TEXT NOT NULL,
      commission_rate_snapshot DOUBLE PRECISION NOT NULL,
      subtotal DOUBLE PRECISION NOT NULL,
      discount_total DOUBLE PRECISION,
      coupon_code TEXT,
      shipping_total DOUBLE PRECISION NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      fulfillments JSONB NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      recipient TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS uploaded_assets (
      key TEXT PRIMARY KEY,
      bucket TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      rating DOUBLE PRECISION NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
      ON password_reset_tokens (user_id);
  `);
}

async function insertSeedInClient(client: PoolClient, seed: SeedPayload): Promise<void> {
  for (const u of seed.users) {
    await client.query(
      `INSERT INTO users (id, name, email, role, phone, seller_id, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.name, u.email, u.role, u.phone ?? null, u.sellerId ?? null, u.passwordHash, u.createdAt]
    );
  }

  for (let i = 0; i < seed.sellers.length; i++) {
    const s = seed.sellers[i];
    await client.query(
      `INSERT INTO sellers (
        id, owner_user_id, name, slug, document_id, main_category, description,
        logo_text, logo_url, accent_color, banner_image, status, verified, rating,
        review_count, joined_date, tenure_label, location, payout_info,
        socials, kyc, activation, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19::jsonb,
        $20::jsonb, $21::jsonb, $22::jsonb, $23
      ) ON CONFLICT (id) DO NOTHING`,
      [
        s.id,
        s.ownerUserId,
        s.name,
        s.slug,
        s.documentId,
        s.mainCategory,
        s.description,
        s.logoText,
        s.logoUrl ?? null,
        s.accentColor,
        s.bannerImage,
        s.status,
        true,
        s.rating,
        s.reviewCount,
        s.joinedDate,
        s.tenureLabel,
        s.location,
        JSON.stringify(s.payoutInfo),
        JSON.stringify(s.socials ?? {}),
        JSON.stringify({ status: 'verified' }),
        JSON.stringify({ profileCompleted: true, kycCompleted: true, feePaid: true }),
        i,
      ]
    );
  }

  for (let i = 0; i < seed.categories.length; i++) {
    await client.query(
      'INSERT INTO categories (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [seed.categories[i], i]
    );
  }

  for (let i = 0; i < seed.products.length; i++) {
    const p = seed.products[i];
    await client.query(
      `INSERT INTO products (
        id, seller_id, title, brand, category, condition, price, original_price,
        stock, rating, review_count, sold_count, is_flash_deal, is_best_seller,
        images, description, specs, created_at, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15::jsonb, $16, $17::jsonb, $18, $19
      )`,
      [
        p.id,
        p.sellerId,
        p.title,
        p.brand,
        p.category,
        p.condition,
        p.price,
        p.originalPrice ?? null,
        p.stock,
        p.rating,
        p.reviewCount,
        p.soldCount,
        Boolean(p.isFlashDeal),
        Boolean(p.isBestSeller),
        JSON.stringify(p.images),
        p.description,
        JSON.stringify(p.specs ?? {}),
        p.createdAt,
        i,
      ]
    );
  }

  for (let i = 0; i < seed.orders.length; i++) {
    const o = seed.orders[i];
    await client.query(
      `INSERT INTO orders (
        id, buyer_id, buyer_name, buyer_email, created_at, shipping_address,
        payment_method, commission_rate_snapshot, subtotal, discount_total,
        coupon_code, shipping_total, total, fulfillments, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb,
        $7, $8, $9, $10,
        $11, $12, $13, $14::jsonb, $15
      )`,
      [
        o.id,
        o.buyerId,
        o.buyerName,
        o.buyerEmail,
        o.createdAt,
        JSON.stringify(o.shippingAddress),
        o.paymentMethod,
        o.commissionRateSnapshot,
        o.subtotal,
        o.discountTotal ?? null,
        o.couponCode ?? null,
        o.shippingTotal,
        o.total,
        JSON.stringify(o.fulfillments),
        i,
      ]
    );
  }

  for (const [userId, addresses] of Object.entries(seed.addressesByUser)) {
    for (let i = 0; i < addresses.length; i++) {
      const a = addresses[i];
      await client.query(
        `INSERT INTO addresses (
          id, user_id, label, recipient, street, city, state, zip_code, is_default, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [a.id, userId, a.label, a.recipient, a.street, a.city, a.state, a.zipCode, a.isDefault, i]
      );
    }
  }

  for (const [userId, productIds] of Object.entries(seed.wishlistsByUser)) {
    for (let i = 0; i < productIds.length; i++) {
      await client.query(
        `INSERT INTO wishlists (user_id, product_id, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [userId, productIds[i], i]
      );
    }
  }

  await client.query(
    `INSERT INTO platform_settings (key, value, updated_at)
     VALUES ('commissionRate', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(seed.commissionRate)]
  );
}

export async function initDatabase(createSeed: () => SeedPayload): Promise<void> {
  await withTransaction(async (client) => {
    // Serialize concurrent cold-start schema/seed initialization across serverless instances
    await client.query('SELECT pg_advisory_xact_lock(728391042)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        phone TEXT,
        seller_id TEXT,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sellers (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        document_id TEXT NOT NULL,
        main_category TEXT NOT NULL,
        description TEXT NOT NULL,
        logo_text TEXT NOT NULL,
        accent_color TEXT NOT NULL,
        banner_image TEXT NOT NULL,
        status TEXT NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
        review_count INTEGER NOT NULL DEFAULT 0,
        joined_date TEXT NOT NULL,
        tenure_label TEXT NOT NULL,
        location TEXT NOT NULL,
        payout_info JSONB NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS categories (
        name TEXT PRIMARY KEY,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        title TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        condition TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        original_price DOUBLE PRECISION,
        stock INTEGER NOT NULL DEFAULT 0,
        rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
        review_count INTEGER NOT NULL DEFAULT 0,
        sold_count INTEGER NOT NULL DEFAULT 0,
        is_flash_deal BOOLEAN NOT NULL DEFAULT FALSE,
        is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
        images JSONB NOT NULL,
        description TEXT NOT NULL,
        specs JSONB NOT NULL,
        badge TEXT,
        created_at TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flash_deal BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS province TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code TEXT;
      ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS logo_url TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS socials JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS kyc JSONB DEFAULT '{"status":"not_submitted"}'::jsonb;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS activation JSONB DEFAULT '{"profileCompleted":true,"kycCompleted":false,"feePaid":false}'::jsonb;

      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        buyer_id TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        buyer_email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        shipping_address JSONB NOT NULL,
        payment_method TEXT NOT NULL,
        commission_rate_snapshot DOUBLE PRECISION NOT NULL,
        subtotal DOUBLE PRECISION NOT NULL,
        discount_total DOUBLE PRECISION,
        coupon_code TEXT,
        shipping_total DOUBLE PRECISION NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        fulfillments JSONB NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        label TEXT NOT NULL,
        recipient TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS wishlists (
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        email TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS platform_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS uploaded_assets (
        key TEXT PRIMARY KEY,
        bucket TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        original_name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        rating DOUBLE PRECISION NOT NULL,
        comment TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
        ON password_reset_tokens (user_id);
    `);

    // Ensure categories and settings exist
    const seed = createSeed();
    for (let i = 0; i < seed.categories.length; i++) {
      await client.query(
        'INSERT INTO categories (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [seed.categories[i], i]
      );
    }
    await client.query(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ('commissionRate', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(seed.commissionRate)]
    );

    const stats = await client.query<{ users: number; products: number; sellers: number }>(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM sellers) AS sellers
    `);
    const row = stats.rows[0];
    console.log(
      `[Cellbox PostgreSQL] Connected to Neon (${row.users} users, ${row.sellers} sellers, ${row.products} products).`
    );
  });
}

export async function resetDatabaseToSeed(seed: SeedPayload): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      'TRUNCATE TABLE password_reset_tokens, users, sellers, categories, products, orders, addresses, wishlists, newsletter_subscribers, contact_messages CASCADE'
    );
    await insertSeedInClient(client, seed);
  });
}

// ── Users & Authentication CRUD ──────────────────────────────────────────────

export async function findUserById(id: string): Promise<StoredUser | null> {
  const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return res.rows[0] ? mapUserRow(res.rows[0]) : null;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [
    email.trim(),
  ]);
  return res.rows[0] ? mapUserRow(res.rows[0]) : null;
}

export function normalizePhone(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('258') && digits.length >= 11) {
    return digits.slice(3);
  }
  return digits;
}

export async function findUserByPhone(phone: string): Promise<StoredUser | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const res = await query(
    `SELECT * FROM users
     WHERE regexp_replace(COALESCE(phone, ''), '\\D', 'g') = $1
        OR regexp_replace(COALESCE(phone, ''), '\\D', 'g') = $2
     LIMIT 1`,
    [normalized, `258${normalized}`]
  );
  return res.rows[0] ? mapUserRow(res.rows[0]) : null;
}

export async function findUserByIdentifier(identifier: string): Promise<StoredUser | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  // 1. Se contém dígitos suficientes, busca primeiro pelo telefone
  const phoneDigits = normalizePhone(trimmed);
  if (phoneDigits.length >= 7) {
    const user = await findUserByPhone(phoneDigits);
    if (user) return user;
  }

  // 2. Tenta por e-mail cadastrado
  const byEmail = await findUserByEmail(trimmed);
  if (byEmail) return byEmail;

  // 3. Tenta por nome completo ou nome de usuário (ex: 'CellBox')
  const byName = await query(
    'SELECT * FROM users WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [trimmed]
  );
  if (byName.rows[0]) return mapUserRow(byName.rows[0]);

  return null;
}

export async function listUsers(): Promise<StoredUser[]> {
  const res = await query('SELECT * FROM users ORDER BY created_at ASC, id ASC');
  return res.rows.map(mapUserRow);
}

export async function createUserAccount(
  user: StoredUser,
  seller?: SellerStore
): Promise<{ user: StoredUser; seller?: SellerStore }> {
  return withTransaction(async (client) => {
    await client.query(
      `INSERT INTO users (
        id, name, email, role, phone, seller_id, password_hash, created_at,
        avatar_url, province, city, neighborhood, zip_code
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        user.id,
        user.name,
        user.email,
        user.role,
        user.phone ?? null,
        user.sellerId ?? null,
        user.passwordHash,
        user.createdAt,
        user.avatarUrl ?? null,
        user.province ?? null,
        user.city ?? null,
        user.neighborhood ?? null,
        user.zipCode ?? null,
      ]
    );

    // If user provided address during registration, save as primary address
    if (user.city || user.province) {
      const addrId = `addr-${Date.now()}`;
      await client.query(
        `INSERT INTO addresses (id, user_id, label, recipient, street, city, state, zip_code, is_default, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          addrId,
          user.id,
          'Endereço Principal',
          user.name,
          user.neighborhood || 'Bairro Central',
          user.city || 'Maputo',
          user.province || 'Maputo Cidade',
          user.zipCode || '1100',
          true,
          0,
        ]
      );
    }

    if (seller) {
      const minOrderRes = await client.query<{ min_order: number | null }>(
        'SELECT MIN(sort_order) AS min_order FROM sellers'
      );
      const nextSortOrder = (minOrderRes.rows[0]?.min_order ?? 0) - 1;

      await client.query(
        `INSERT INTO sellers (
          id, owner_user_id, name, slug, document_id, main_category, description,
          logo_text, logo_url, accent_color, banner_image, status, verified, rating,
          review_count, joined_date, tenure_label, location, payout_info,
          socials, kyc, activation, sort_order
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19::jsonb,
          $20::jsonb, $21::jsonb, $22::jsonb, $23
        )`,
        [
          seller.id,
          seller.ownerUserId,
          seller.name,
          seller.slug,
          seller.documentId,
          seller.mainCategory,
          seller.description,
          seller.logoText,
          seller.logoUrl ?? null,
          seller.accentColor,
          seller.bannerImage,
          seller.status,
          seller.verified,
          seller.rating,
          seller.reviewCount,
          seller.joinedDate,
          seller.tenureLabel,
          seller.location,
          JSON.stringify(seller.payoutInfo),
          JSON.stringify(seller.socials ?? {}),
          JSON.stringify(seller.kyc ?? { status: 'not_submitted' }),
          JSON.stringify(seller.activation ?? { profileCompleted: true, kycCompleted: false, feePaid: false }),
          nextSortOrder,
        ]
      );
    }

    return { user, seller };
  });
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    province?: string;
    city?: string;
    neighborhood?: string;
    zipCode?: string;
  }
): Promise<StoredUser | null> {
  const existing = await findUserById(userId);
  if (!existing) return null;
  const nextName =
    typeof updates.name === 'string' && updates.name.trim().length >= 2
      ? updates.name.trim()
      : existing.name;
  const nextPhone =
    typeof updates.phone === 'string' ? updates.phone.trim() : existing.phone ?? null;
  const nextAvatar =
    typeof updates.avatarUrl === 'string' ? updates.avatarUrl.trim() : existing.avatarUrl ?? null;
  const nextProvince =
    typeof updates.province === 'string' ? updates.province.trim() : existing.province ?? null;
  const nextCity =
    typeof updates.city === 'string' ? updates.city.trim() : existing.city ?? null;
  const nextNeighborhood =
    typeof updates.neighborhood === 'string' ? updates.neighborhood.trim() : existing.neighborhood ?? null;
  const nextZipCode =
    typeof updates.zipCode === 'string' ? updates.zipCode.trim() : existing.zipCode ?? null;

  const res = await query(
    `UPDATE users 
     SET name = $2, phone = $3, avatar_url = $4, province = $5, city = $6, neighborhood = $7, zip_code = $8 
     WHERE id = $1 RETURNING *`,
    [userId, nextName, nextPhone, nextAvatar, nextProvince, nextCity, nextNeighborhood, nextZipCode]
  );
  return res.rows[0] ? mapUserRow(res.rows[0]) : null;
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
}

// ── Password Reset Tokens (SHA-256 hashed, single-use, expiring) ─────────────

export function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function createPasswordResetToken(
  userId: string,
  rawToken: string,
  expiresInMinutes = 30
): Promise<{ tokenHash: string; expiresAt: Date }> {
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await withTransaction(async (client) => {
    // Invalidate any previous unused reset tokens for this user
    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );
    await client.query(
      `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [tokenHash, userId, expiresAt.toISOString()]
    );
  });

  return { tokenHash, expiresAt };
}

export async function deletePasswordResetTokenByHash(tokenHash: string): Promise<void> {
  await query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
}

export async function verifyPasswordResetToken(
  rawToken: string
): Promise<{ userId: string; email: string; name: string; expiresAt: string } | null> {
  const trimmed = rawToken.trim();
  if (!trimmed || trimmed.length < 32) return null;
  const tokenHash = hashResetToken(trimmed);

  const res = await query<{
    user_id: string;
    email: string;
    name: string;
    expires_at: Date | string;
  }>(
    `SELECT t.user_id, u.email, u.name, t.expires_at
     FROM password_reset_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1
       AND t.used_at IS NULL
       AND t.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  const row = res.rows[0];
  if (!row) return null;
  return {
    userId: String(row.user_id),
    email: String(row.email),
    name: String(row.name),
    expiresAt:
      row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at),
  };
}

export async function consumePasswordResetToken(
  rawToken: string,
  newPasswordHash: string
): Promise<boolean> {
  const trimmed = rawToken.trim();
  if (!trimmed || trimmed.length < 32) return false;
  const tokenHash = hashResetToken(trimmed);

  return withTransaction(async (client) => {
    const tokenRes = await client.query<{ user_id: string }>(
      `SELECT user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash]
    );

    const row = tokenRes.rows[0];
    if (!row) return false;

    await client.query('UPDATE users SET password_hash = $2 WHERE id = $1', [
      row.user_id,
      newPasswordHash,
    ]);
    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [row.user_id]
    );

    return true;
  });
}

// ── Products CRUD ────────────────────────────────────────────────────────────

export async function listProducts(filters?: {
  category?: string;
  sellerId?: string;
  search?: string;
}): Promise<Product[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.category && filters.category !== 'Todas') {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }
  if (filters?.sellerId) {
    params.push(filters.sellerId);
    conditions.push(`seller_id = $${params.length}`);
  }
  if (filters?.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR brand ILIKE $${params.length} OR description ILIKE $${params.length})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await query(
    `SELECT * FROM products ${whereClause} ORDER BY sort_order ASC, created_at DESC, id ASC`,
    params
  );
  return res.rows.map(mapProductRow);
}

export async function findProductById(id: string): Promise<Product | null> {
  const res = await query('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
  return res.rows[0] ? mapProductRow(res.rows[0]) : null;
}

export async function createProduct(product: Product): Promise<Product> {
  const minRes = await query<{ min_order: number | null }>(
    'SELECT MIN(sort_order) AS min_order FROM products'
  );
  const sortOrder = (minRes.rows[0]?.min_order ?? 0) - 1;

  const res = await query(
    `INSERT INTO products (
      id, seller_id, title, brand, category, condition, price, original_price,
      stock, rating, review_count, sold_count, is_flash_deal, is_best_seller,
      images, description, specs, created_at, sort_order
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14,
      $15::jsonb, $16, $17::jsonb, $18, $19
    ) RETURNING *`,
    [
      product.id,
      product.sellerId,
      product.title,
      product.brand,
      product.category,
      product.condition,
      product.price,
      product.originalPrice ?? null,
      product.stock,
      product.rating,
      product.reviewCount,
      product.soldCount,
      Boolean(product.isFlashDeal),
      Boolean(product.isBestSeller),
      JSON.stringify(product.images),
      product.description,
      JSON.stringify(product.specs ?? {}),
      product.createdAt,
      sortOrder,
    ]
  );
  return mapProductRow(res.rows[0]);
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const existing = await findProductById(id);
  if (!existing) return null;

  const merged: Product = {
    ...existing,
    ...updates,
    id: existing.id,
    sellerId: existing.sellerId,
  };

  const res = await query(
    `UPDATE products SET
      title = $2,
      brand = $3,
      category = $4,
      condition = $5,
      price = $6,
      original_price = $7,
      stock = $8,
      rating = $9,
      review_count = $10,
      sold_count = $11,
      is_flash_deal = $12,
      is_best_seller = $13,
      images = $14::jsonb,
      description = $15,
      specs = $16::jsonb
     WHERE id = $1
     RETURNING *`,
    [
      merged.id,
      merged.title,
      merged.brand,
      merged.category,
      merged.condition,
      merged.price,
      merged.originalPrice ?? null,
      merged.stock,
      merged.rating,
      merged.reviewCount,
      merged.soldCount,
      Boolean(merged.isFlashDeal),
      Boolean(merged.isBestSeller),
      JSON.stringify(merged.images),
      merged.description,
      JSON.stringify(merged.specs ?? {}),
    ]
  );
  return res.rows[0] ? mapProductRow(res.rows[0]) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  return withTransaction(async (client) => {
    await client.query('DELETE FROM wishlists WHERE product_id = $1', [id]);
    const res = await client.query('DELETE FROM products WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  });
}

// ── Sellers CRUD ─────────────────────────────────────────────────────────────

export async function listSellers(): Promise<SellerStore[]> {
  const res = await query('SELECT * FROM sellers ORDER BY sort_order ASC, id ASC');
  return res.rows.map(mapSellerRow);
}

export async function findSellerById(sellerId: string): Promise<SellerStore | null> {
  const res = await query('SELECT * FROM sellers WHERE id = $1 LIMIT 1', [sellerId]);
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

export async function findSellerOwnedBy(
  userId: string,
  sellerId?: string
): Promise<SellerStore | null> {
  const res = await query(
    'SELECT * FROM sellers WHERE id = $1 OR owner_user_id = $2 LIMIT 1',
    [sellerId ?? '', userId]
  );
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

export async function updateSellerKyc(
  sellerId: string,
  kyc: SellerKycInfo
): Promise<SellerStore | null> {
  const seller = await findSellerById(sellerId);
  if (!seller) return null;

  const currentActivation = seller.activation ?? {
    profileCompleted: true,
    kycCompleted: false,
    feePaid: false,
  };

  const updatedActivation: SellerActivationStatus = {
    ...currentActivation,
    kycCompleted: false, // Must be approved by admin
  };

  const newKyc: SellerKycInfo = {
    ...kyc,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  const docId = kyc.documentNumber?.trim() || seller.documentId;

  const res = await query(
    `UPDATE sellers
     SET kyc = $2::jsonb,
         activation = $3::jsonb,
         document_id = $4,
         verified = FALSE
     WHERE id = $1
     RETURNING *`,
    [
      sellerId,
      JSON.stringify(newKyc),
      JSON.stringify(updatedActivation),
      docId,
    ]
  );
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

export async function submitSellerActivationFee(
  sellerId: string,
  data: { method: 'mpesa' | 'emola'; phone: string; transactionId: string; proofUrl?: string }
): Promise<SellerStore | null> {
  const seller = await findSellerById(sellerId);
  if (!seller) return null;

  const currentActivation = seller.activation ?? {
    profileCompleted: true,
    kycCompleted: false,
    feePaid: false,
  };

  const updatedActivation: SellerActivationStatus = {
    ...currentActivation,
    feePaid: false, // Real validation required: not marked paid automatically!
    feeStatus: 'pending',
    feePaymentMethod: data.method,
    feePhone: data.phone,
    feeTransactionId: data.transactionId,
    feeProofUrl: data.proofUrl,
    feeSubmittedAt: new Date().toISOString(),
  };

  const res = await query(
    `UPDATE sellers
     SET activation = $2::jsonb
     WHERE id = $1
     RETURNING *`,
    [
      sellerId,
      JSON.stringify(updatedActivation),
    ]
  );
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

export async function adminReviewSellerKyc(
  sellerId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<SellerStore | null> {
  const seller = await findSellerById(sellerId);
  if (!seller) return null;

  const currentKyc = seller.kyc ?? {};
  const currentActivation = seller.activation ?? {
    profileCompleted: true,
    kycCompleted: false,
    feePaid: false,
  };

  const isApproved = action === 'approve';
  const updatedKyc: SellerKycInfo = {
    ...currentKyc,
    status: isApproved ? 'verified' : 'rejected',
    reviewedAt: new Date().toISOString(),
    rejectionReason: isApproved ? undefined : (reason || 'Documento ilegível ou divergente dos dados cadastrais.'),
  };

  const updatedActivation: SellerActivationStatus = {
    ...currentActivation,
    kycCompleted: isApproved,
  };

  const shouldBeActive = isApproved && updatedActivation.feePaid;

  const res = await query(
    `UPDATE sellers
     SET kyc = $2::jsonb,
         activation = $3::jsonb,
         verified = CASE WHEN $4 = TRUE THEN TRUE ELSE verified END,
         status = CASE WHEN $4 = TRUE THEN 'active' ELSE status END,
         tenure_label = CASE WHEN $4 = TRUE THEN 'Loja Oficial Verificada' ELSE tenure_label END
     WHERE id = $1
     RETURNING *`,
    [
      sellerId,
      JSON.stringify(updatedKyc),
      JSON.stringify(updatedActivation),
      shouldBeActive,
    ]
  );
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

export async function adminReviewSellerFee(
  sellerId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<SellerStore | null> {
  const seller = await findSellerById(sellerId);
  if (!seller) return null;

  const currentActivation = seller.activation ?? {
    profileCompleted: true,
    kycCompleted: false,
    feePaid: false,
  };

  const isApproved = action === 'approve';
  const updatedActivation: SellerActivationStatus = {
    ...currentActivation,
    feePaid: isApproved,
    feeStatus: isApproved ? 'verified' : 'rejected',
    feePaidAt: isApproved ? new Date().toISOString() : undefined,
    feeReceipt: isApproved ? (currentActivation.feeTransactionId || `CBX-FEE-${Date.now().toString().slice(-6)}`) : undefined,
    feeRejectionReason: isApproved ? undefined : (reason || 'Transação M-Pesa / e-Mola não localizada no extrato bancário.'),
  };

  const shouldBeActive = isApproved && updatedActivation.kycCompleted;

  const res = await query(
    `UPDATE sellers
     SET activation = $2::jsonb,
         verified = CASE WHEN $3 = TRUE THEN TRUE ELSE verified END,
         status = CASE WHEN $3 = TRUE THEN 'active' ELSE status END,
         tenure_label = CASE WHEN $3 = TRUE THEN 'Loja Oficial Verificada' ELSE tenure_label END
     WHERE id = $1
     RETURNING *`,
    [
      sellerId,
      JSON.stringify(updatedActivation),
      shouldBeActive,
    ]
  );
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

export async function doesUserOwnSeller(
  targetSellerId: string,
  userId: string,
  userSellerId?: string
): Promise<boolean> {
  const res = await query(
    'SELECT 1 FROM sellers WHERE id = $1 AND (id = $2 OR owner_user_id = $3) LIMIT 1',
    [targetSellerId, userSellerId ?? '', userId]
  );
  return res.rowCount !== null && res.rowCount > 0;
}

export async function updateSellerSettings(
  sellerId: string,
  updates: {
    name: string;
    description: string;
    logoText?: string;
    accentColor?: string;
    location: string;
    bannerImage?: string;
    logoUrl?: string;
    mainCategory?: string;
    socials?: SellerSocials;
    payoutInfo: SellerPayoutInfo;
  }
): Promise<SellerStore | null> {
  const current = await findSellerById(sellerId);
  const nextName = updates.name.trim() || current?.name || 'Loja';
  const nextDesc =
    typeof updates.description === 'string'
      ? updates.description.trim()
      : (current?.description ?? '');
  const nextLogoText =
    updates.logoText?.trim().slice(0, 3).toUpperCase() || current?.logoText || 'CB';
  const nextAccent = updates.accentColor || current?.accentColor || '#0475EE';
  const nextLocation =
    typeof updates.location === 'string' ? updates.location.trim() : (current?.location ?? '');
  const nextBanner =
    typeof updates.bannerImage === 'string' ? updates.bannerImage.trim() : (current?.bannerImage ?? '');
  const nextLogoUrl =
    typeof updates.logoUrl === 'string' ? updates.logoUrl.trim() : (current?.logoUrl ?? null);
  const nextCategory = updates.mainCategory?.trim() || current?.mainCategory || 'Geral';
  const nextSocials = updates.socials ?? current?.socials ?? {};
  const nextPayout = updates.payoutInfo ?? current?.payoutInfo;

  const profileCompleted = Boolean(nextName && nextCategory && nextLocation);
  const currentActivation = current?.activation ?? {
    profileCompleted: false,
    kycCompleted: false,
    feePaid: false,
  };
  const nextActivation = {
    ...currentActivation,
    profileCompleted,
  };

  const res = await query(
    `UPDATE sellers SET
      name = $2,
      description = $3,
      logo_text = $4,
      accent_color = $5,
      location = $6,
      banner_image = $7,
      logo_url = $8,
      main_category = $9,
      socials = $10::jsonb,
      payout_info = $11::jsonb,
      activation = $12::jsonb
     WHERE id = $1
     RETURNING *`,
    [
      sellerId,
      nextName,
      nextDesc,
      nextLogoText,
      nextAccent,
      nextLocation,
      nextBanner,
      nextLogoUrl,
      nextCategory,
      JSON.stringify(nextSocials),
      JSON.stringify(nextPayout),
      JSON.stringify(nextActivation),
    ]
  );
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

export async function createBulkProducts(
  sellerId: string,
  items: Array<Omit<Product, 'id' | 'sellerId' | 'rating' | 'reviewCount' | 'soldCount' | 'createdAt'>>
): Promise<Product[]> {
  const created: Product[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const p: Product = {
      id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      sellerId,
      title: it.title,
      brand: it.brand || '',
      category: it.category,
      condition: it.condition || 'Novo',
      price: Number(it.price),
      originalPrice: it.originalPrice ? Number(it.originalPrice) : undefined,
      stock: Number(it.stock) || 0,
      rating: 5.0,
      reviewCount: 0,
      soldCount: 0,
      isFlashDeal: false,
      isBestSeller: false,
      images: Array.isArray(it.images) && it.images.length > 0 ? it.images : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop'],
      description: it.description || '',
      specs: it.specs ?? {},
      createdAt: new Date().toISOString(),
    };
    const saved = await createProduct(p);
    created.push(saved);
  }
  return created;
}

export async function updateSellerStatus(
  sellerId: string,
  status: SellerStatus
): Promise<SellerStore | null> {
  const res = await query(
    `UPDATE sellers SET
      status = $2,
      verified = CASE WHEN $2 = 'active' THEN TRUE ELSE verified END,
      kyc = CASE WHEN $2 = 'active' THEN jsonb_set(COALESCE(kyc, '{}'::jsonb), '{status}', '"verified"') ELSE kyc END,
      activation = CASE WHEN $2 = 'active' THEN jsonb_set(COALESCE(activation, '{}'::jsonb), '{kycCompleted}', 'true') ELSE activation END,
      tenure_label = CASE
        WHEN $2 = 'active' THEN 'Loja Oficial Verificada'
        ELSE tenure_label
      END
     WHERE id = $1
     RETURNING *`,
    [sellerId, status]
  );
  return res.rows[0] ? mapSellerRow(res.rows[0]) : null;
}

// ── Reviews CRUD & Aggregations ──────────────────────────────────────────

export async function listReviews(targetType: 'seller' | 'product', targetId: string): Promise<Review[]> {
  const res = await query(
    `SELECT * FROM reviews WHERE target_type = $1 AND target_id = $2 ORDER BY created_at DESC`,
    [targetType, targetId]
  );
  return res.rows.map((r: any) => ({
    id: String(r.id),
    targetType: r.target_type as 'seller' | 'product',
    targetId: String(r.target_id),
    userId: String(r.user_id),
    userName: String(r.user_name),
    rating: Number(r.rating),
    comment: String(r.comment),
    createdAt: String(r.created_at),
  }));
}

export async function createReview(review: Review): Promise<Review> {
  await query(
    `INSERT INTO reviews (id, target_type, target_id, user_id, user_name, rating, comment, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      review.id,
      review.targetType,
      review.targetId,
      review.userId,
      review.userName,
      review.rating,
      review.comment,
      review.createdAt,
    ]
  );

  const aggRes = await query<{ avg_rating: string | number; cnt: string | number }>(
    `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*)::int AS cnt
     FROM reviews WHERE target_type = $1 AND target_id = $2`,
    [review.targetType, review.targetId]
  );
  const avgRating = Number(Number(aggRes.rows[0]?.avg_rating ?? 0).toFixed(1));
  const reviewCount = Number(aggRes.rows[0]?.cnt ?? 0);

  if (review.targetType === 'seller') {
    await query(
      `UPDATE sellers SET rating = $2, review_count = $3 WHERE id = $1`,
      [review.targetId, avgRating, reviewCount]
    );
  } else if (review.targetType === 'product') {
    await query(
      `UPDATE products SET rating = $2, review_count = $3 WHERE id = $1`,
      [review.targetId, avgRating, reviewCount]
    );
  }

  return review;
}

// ── Categories CRUD ──────────────────────────────────────────────────────────

export async function listCategories(): Promise<string[]> {
  const res = await query<{ name: string }>(
    'SELECT name FROM categories ORDER BY sort_order ASC, name ASC'
  );
  return res.rows.map((r) => r.name);
}

export async function addCategory(name: string): Promise<boolean> {
  const existing = await query('SELECT 1 FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1', [
    name,
  ]);
  if (existing.rowCount && existing.rowCount > 0) return false;

  const maxRes = await query<{ max_order: number | null }>(
    'SELECT MAX(sort_order) AS max_order FROM categories'
  );
  const nextOrder = (maxRes.rows[0]?.max_order ?? -1) + 1;
  await query('INSERT INTO categories (name, sort_order) VALUES ($1, $2)', [name, nextOrder]);
  return true;
}

export async function removeCategory(name: string): Promise<void> {
  await query('DELETE FROM categories WHERE name = $1', [name]);
}

// ── Orders CRUD (Transactional) ──────────────────────────────────────────────

export async function listOrders(): Promise<Order[]> {
  const res = await query('SELECT * FROM orders ORDER BY sort_order ASC, created_at DESC, id DESC');
  return res.rows.map(mapOrderRow);
}

export async function listScopedOrders(user: StoredUser | null): Promise<Order[]> {
  if (!user) return [];
  const allOrders = await listOrders();
  if (user.role === 'admin') return allOrders;
  if (user.role === 'seller') {
    const sellerRows = await query<{ id: string }>(
      'SELECT id FROM sellers WHERE id = $1 OR owner_user_id = $2',
      [user.sellerId ?? '', user.id]
    );
    const sellerIds = new Set(sellerRows.rows.map((r) => r.id));
    return allOrders.filter(
      (o) => o.buyerId === user.id || o.fulfillments.some((f) => sellerIds.has(f.sellerId))
    );
  }
  return allOrders.filter((o) => o.buyerId === user.id);
}

export async function createOrderAndUpdateStock(
  order: Order,
  qtyByProduct: Map<string, number>
): Promise<Order> {
  return withTransaction(async (client) => {
    const minRes = await client.query<{ min_order: number | null }>(
      'SELECT MIN(sort_order) AS min_order FROM orders'
    );
    const sortOrder = (minRes.rows[0]?.min_order ?? 0) - 1;

    await client.query(
      `INSERT INTO orders (
        id, buyer_id, buyer_name, buyer_email, created_at, shipping_address,
        payment_method, commission_rate_snapshot, subtotal, discount_total,
        coupon_code, shipping_total, total, fulfillments, sort_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb,
        $7, $8, $9, $10,
        $11, $12, $13, $14::jsonb, $15
      )`,
      [
        order.id,
        order.buyerId,
        order.buyerName,
        order.buyerEmail,
        order.createdAt,
        JSON.stringify(order.shippingAddress),
        order.paymentMethod,
        order.commissionRateSnapshot,
        order.subtotal,
        order.discountTotal ?? null,
        order.couponCode ?? null,
        order.shippingTotal,
        order.total,
        JSON.stringify(order.fulfillments),
        sortOrder,
      ]
    );

    for (const [productId, bought] of qtyByProduct.entries()) {
      await client.query(
        `UPDATE products
         SET stock = GREATEST(0, stock - $2),
             sold_count = sold_count + $2
         WHERE id = $1`,
        [productId, bought]
      );
    }

    return order;
  });
}

export async function updateOrderFulfillmentStatus(
  orderId: string,
  sellerId: string,
  nextStatus: OrderStatus,
  updatedAt: string
): Promise<Order | null> {
  const res = await query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [orderId]);
  if (!res.rows[0]) return null;
  const order = mapOrderRow(res.rows[0]);
  const updatedFulfillments = order.fulfillments.map((f) =>
    f.sellerId === sellerId ? { ...f, status: nextStatus, updatedAt } : f
  );

  const updated = await query(
    'UPDATE orders SET fulfillments = $2::jsonb WHERE id = $1 RETURNING *',
    [orderId, JSON.stringify(updatedFulfillments)]
  );
  return updated.rows[0] ? mapOrderRow(updated.rows[0]) : null;
}

// ── Addresses CRUD ───────────────────────────────────────────────────────────

export async function listAddressesByUser(userId: string): Promise<Address[]> {
  const res = await query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, sort_order ASC, id ASC',
    [userId]
  );
  return res.rows.map(mapAddressRow);
}

export async function createAddress(
  userId: string,
  address: Address
): Promise<{ created: Address; addresses: Address[] }> {
  await withTransaction(async (client) => {
    const existingRes = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1',
      [userId]
    );
    const shouldBeDefault = address.isDefault || (existingRes.rows[0]?.count ?? 0) === 0;
    address.isDefault = shouldBeDefault;

    if (shouldBeDefault) {
      await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const orderRes = await client.query<{ min_order: number | null; max_order: number | null }>(
      'SELECT MIN(sort_order) AS min_order, MAX(sort_order) AS max_order FROM addresses WHERE user_id = $1',
      [userId]
    );
    const sortOrder = shouldBeDefault
      ? (orderRes.rows[0]?.min_order ?? 0) - 1
      : (orderRes.rows[0]?.max_order ?? -1) + 1;

    await client.query(
      `INSERT INTO addresses (
        id, user_id, label, recipient, street, city, state, zip_code, is_default, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        address.id,
        userId,
        address.label,
        address.recipient,
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.isDefault,
        sortOrder,
      ]
    );
  });

  const addresses = await listAddressesByUser(userId);
  return { created: address, addresses };
}

export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<Address[] | null> {
  const exists = await query('SELECT 1 FROM addresses WHERE id = $1 AND user_id = $2 LIMIT 1', [
    addressId,
    userId,
  ]);
  if (!exists.rowCount) return null;

  await withTransaction(async (client) => {
    await client.query('UPDATE addresses SET is_default = (id = $2) WHERE user_id = $1', [
      userId,
      addressId,
    ]);
  });

  return listAddressesByUser(userId);
}

export async function deleteAddress(userId: string, addressId: string): Promise<Address[]> {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [
      addressId,
      userId,
    ]);
    const remaining = await client.query<{ id: string; is_default: boolean }>(
      'SELECT id, is_default FROM addresses WHERE user_id = $1 ORDER BY sort_order ASC, id ASC',
      [userId]
    );
    if (remaining.rows.length > 0 && !remaining.rows.some((r) => r.is_default)) {
      await client.query('UPDATE addresses SET is_default = TRUE WHERE id = $1', [
        remaining.rows[0].id,
      ]);
    }
  });

  return listAddressesByUser(userId);
}

// ── Wishlist CRUD ────────────────────────────────────────────────────────────

export async function listWishlistByUser(userId: string): Promise<string[]> {
  const res = await query<{ product_id: string }>(
    'SELECT product_id FROM wishlists WHERE user_id = $1 ORDER BY sort_order ASC',
    [userId]
  );
  return res.rows.map((r) => r.product_id);
}

export async function toggleWishlistItem(
  userId: string,
  productId: string
): Promise<{ wishlist: string[]; added: boolean }> {
  const exists = await query(
    'SELECT 1 FROM wishlists WHERE user_id = $1 AND product_id = $2 LIMIT 1',
    [userId, productId]
  );

  let added = false;
  if (exists.rowCount && exists.rowCount > 0) {
    await query('DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2', [
      userId,
      productId,
    ]);
  } else {
    const minRes = await query<{ min_order: number | null }>(
      'SELECT MIN(sort_order) AS min_order FROM wishlists WHERE user_id = $1',
      [userId]
    );
    const sortOrder = (minRes.rows[0]?.min_order ?? 0) - 1;
    await query(
      `INSERT INTO wishlists (user_id, product_id, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId, sortOrder]
    );
    added = true;
  }

  const wishlist = await listWishlistByUser(userId);
  return { wishlist, added };
}

// ── Settings, Newsletter, Contact & Uploaded Assets ──────────────────────────

export async function getCommissionRate(): Promise<number> {
  try {
    const res = await query<{ value: unknown }>(
      "SELECT value FROM platform_settings WHERE key = 'commissionRate' LIMIT 1"
    );
    const raw = res.rows[0]?.value;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : 10;
  } catch (err) {
    console.warn('[Cellbox DB] Failed to read commissionRate, using default 10:', err);
    return 10;
  }
}

export async function setCommissionRate(rate: number): Promise<number> {
  const clamped = Math.max(1, Math.min(35, Number(rate.toFixed(1))));
  await query(
    `INSERT INTO platform_settings (key, value, updated_at)
     VALUES ('commissionRate', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(clamped)]
  );
  return clamped;
}

export async function getSiteCustomization(): Promise<SiteCustomization> {
  try {
    const res = await query<{ value: unknown }>(
      "SELECT value FROM platform_settings WHERE key = 'siteCustomization' LIMIT 1"
    );
    const raw = res.rows[0]?.value as Partial<SiteCustomization> | undefined;
    if (!raw) return DEFAULT_SITE_CUSTOMIZATION;
    return {
      ...DEFAULT_SITE_CUSTOMIZATION,
      ...raw,
      header: { ...DEFAULT_SITE_CUSTOMIZATION.header, ...(raw.header ?? {}) },
      heroSlides:
        Array.isArray(raw.heroSlides) && raw.heroSlides.length > 0
          ? raw.heroSlides
          : DEFAULT_SITE_CUSTOMIZATION.heroSlides,
      subBanners:
        Array.isArray(raw.subBanners) && raw.subBanners.length > 0
          ? raw.subBanners
          : DEFAULT_SITE_CUSTOMIZATION.subBanners,
      wideBanner: { ...DEFAULT_SITE_CUSTOMIZATION.wideBanner, ...(raw.wideBanner ?? {}) },
      partnerBrands:
        Array.isArray(raw.partnerBrands) && raw.partnerBrands.length > 0
          ? raw.partnerBrands
          : DEFAULT_SITE_CUSTOMIZATION.partnerBrands,
      contact: {
        ...DEFAULT_SITE_CUSTOMIZATION.contact,
        ...(raw.contact ?? {}),
        socials: {
          ...DEFAULT_SITE_CUSTOMIZATION.contact.socials,
          ...(raw.contact?.socials ?? {}),
        },
      },
      footer: { ...DEFAULT_SITE_CUSTOMIZATION.footer, ...(raw.footer ?? {}) },
    };
  } catch (err) {
    console.warn('[Cellbox DB] Failed to read siteCustomization, using defaults:', err);
    return DEFAULT_SITE_CUSTOMIZATION;
  }
}

export async function setSiteCustomization(
  settings: SiteCustomization
): Promise<SiteCustomization> {
  await query(
    `INSERT INTO platform_settings (key, value, updated_at)
     VALUES ('siteCustomization', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(settings)]
  );
  return getSiteCustomization();
}

export async function addNewsletterSubscriber(email: string): Promise<void> {
  await query(
    'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
    [email]
  );
}

export async function createContactMessage(entry: ContactMessageRecord): Promise<void> {
  await query(
    `INSERT INTO contact_messages (id, name, email, subject, message, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entry.id, entry.name, entry.email, entry.subject, entry.message, entry.createdAt]
  );
}

export async function recordUploadedAsset(asset: UploadedAssetRecord): Promise<void> {
  await query(
    `INSERT INTO uploaded_assets (key, bucket, owner_user_id, original_name, content_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (key) DO UPDATE SET
       bucket = EXCLUDED.bucket,
       owner_user_id = EXCLUDED.owner_user_id,
       original_name = EXCLUDED.original_name,
       content_type = EXCLUDED.content_type,
       size_bytes = EXCLUDED.size_bytes`,
    [
      asset.key,
      asset.bucket,
      asset.ownerUserId,
      asset.originalName,
      asset.contentType,
      asset.sizeBytes,
    ]
  );
}
