import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import type {
  Address,
  Order,
  Product,
  SellerStore,
  User,
} from '../types.ts';

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

export interface DatabaseSchema {
  users: StoredUser[];
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  orders: Order[];
  addressesByUser: Record<string, Address[]>;
  wishlistsByUser: Record<string, string[]>;
  newsletterEmails: string[];
  contactMessages: ContactMessageRecord[];
  commissionRate: number;
}

export interface UploadedAssetRecord {
  key: string;
  bucket: string;
  ownerUserId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.cellbox-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let pgPool: Pool | null = null;
let saveChain: Promise<void> = Promise.resolve();

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getPool(): Pool | null {
  if (!isPostgresConfigured()) return null;
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
    pgPool.on('error', (err) => {
      console.error('[Cellbox PostgreSQL] Unexpected idle client error:', err.message);
    });
  }
  return pgPool;
}

async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(`
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
      images JSONB NOT NULL,
      description TEXT NOT NULL,
      specs JSONB NOT NULL,
      badge TEXT,
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

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
  `);
}

async function loadFromPostgres(pool: Pool): Promise<DatabaseSchema> {
  const [
    usersRes,
    sellersRes,
    categoriesRes,
    productsRes,
    ordersRes,
    addressesRes,
    wishlistsRes,
    newsletterRes,
    contactRes,
    settingsRes,
  ] = await Promise.all([
    pool.query('SELECT * FROM users ORDER BY created_at ASC, id ASC'),
    pool.query('SELECT * FROM sellers ORDER BY sort_order ASC, id ASC'),
    pool.query('SELECT name FROM categories ORDER BY sort_order ASC, name ASC'),
    pool.query('SELECT * FROM products ORDER BY sort_order ASC, id ASC'),
    pool.query('SELECT * FROM orders ORDER BY sort_order ASC, id ASC'),
    pool.query('SELECT * FROM addresses ORDER BY user_id ASC, sort_order ASC, id ASC'),
    pool.query('SELECT user_id, product_id FROM wishlists ORDER BY user_id ASC, sort_order ASC'),
    pool.query('SELECT email FROM newsletter_subscribers ORDER BY created_at ASC'),
    pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC'),
    pool.query("SELECT value FROM platform_settings WHERE key = 'commissionRate'"),
  ]);

  const users: StoredUser[] = usersRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    phone: r.phone ?? undefined,
    sellerId: r.seller_id ?? undefined,
    createdAt: r.created_at,
    passwordHash: r.password_hash,
  }));

  const sellers: SellerStore[] = sellersRes.rows.map((r) => ({
    id: r.id,
    ownerUserId: r.owner_user_id,
    name: r.name,
    slug: r.slug,
    documentId: r.document_id,
    mainCategory: r.main_category,
    description: r.description,
    logoText: r.logo_text,
    accentColor: r.accent_color,
    bannerImage: r.banner_image,
    status: r.status,
    verified: Boolean(r.verified),
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    joinedDate: r.joined_date,
    tenureLabel: r.tenure_label,
    location: r.location,
    payoutInfo: r.payout_info,
  }));

  const categories: string[] = categoriesRes.rows.map((r) => r.name);

  const products: Product[] = productsRes.rows.map((r) => ({
    id: r.id,
    sellerId: r.seller_id,
    title: r.title,
    brand: r.brand,
    category: r.category,
    condition: r.condition,
    price: Number(r.price),
    originalPrice: r.original_price !== null && r.original_price !== undefined ? Number(r.original_price) : undefined,
    stock: Number(r.stock),
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    soldCount: Number(r.sold_count),
    images: Array.isArray(r.images) ? r.images : [],
    description: r.description,
    specs: r.specs ?? {},
    createdAt: r.created_at,
  }));

  const orders: Order[] = ordersRes.rows.map((r) => ({
    id: r.id,
    buyerId: r.buyer_id,
    buyerName: r.buyer_name,
    buyerEmail: r.buyer_email,
    createdAt: r.created_at,
    shippingAddress: r.shipping_address,
    paymentMethod: r.payment_method,
    commissionRateSnapshot: Number(r.commission_rate_snapshot),
    subtotal: Number(r.subtotal),
    discountTotal: r.discount_total !== null && r.discount_total !== undefined ? Number(r.discount_total) : undefined,
    couponCode: r.coupon_code ?? undefined,
    shippingTotal: Number(r.shipping_total),
    total: Number(r.total),
    fulfillments: Array.isArray(r.fulfillments) ? r.fulfillments : [],
  }));

  const addressesByUser: Record<string, Address[]> = {};
  for (const r of addressesRes.rows) {
    const uid = String(r.user_id);
    if (!addressesByUser[uid]) addressesByUser[uid] = [];
    addressesByUser[uid].push({
      id: r.id,
      label: r.label,
      recipient: r.recipient,
      street: r.street,
      city: r.city,
      state: r.state,
      zipCode: r.zip_code,
      isDefault: Boolean(r.is_default),
    });
  }

  const wishlistsByUser: Record<string, string[]> = {};
  for (const r of wishlistsRes.rows) {
    const uid = String(r.user_id);
    if (!wishlistsByUser[uid]) wishlistsByUser[uid] = [];
    wishlistsByUser[uid].push(String(r.product_id));
  }

  const newsletterEmails: string[] = newsletterRes.rows.map((r) => String(r.email));
  const contactMessages: ContactMessageRecord[] = contactRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    createdAt: r.created_at,
  }));

  const rawRate = settingsRes.rows[0]?.value;
  const commissionRate =
    typeof rawRate === 'number' && Number.isFinite(rawRate) ? rawRate : 10;

  return {
    users,
    sellers,
    products,
    categories,
    orders,
    addressesByUser,
    wishlistsByUser,
    newsletterEmails,
    contactMessages,
    commissionRate,
  };
}

async function persistToPostgres(pool: Pool, data: DatabaseSchema): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'TRUNCATE TABLE users, sellers, categories, products, orders, addresses, wishlists, newsletter_subscribers, contact_messages'
    );

    for (const u of data.users) {
      await client.query(
        `INSERT INTO users (id, name, email, role, phone, seller_id, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          u.id,
          u.name,
          u.email,
          u.role,
          u.phone ?? null,
          u.sellerId ?? null,
          u.passwordHash,
          u.createdAt,
        ]
      );
    }

    for (let i = 0; i < data.sellers.length; i++) {
      const s = data.sellers[i];
      await client.query(
        `INSERT INTO sellers (
          id, owner_user_id, name, slug, document_id, main_category, description,
          logo_text, accent_color, banner_image, status, verified, rating,
          review_count, joined_date, tenure_label, location, payout_info, sort_order
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18::jsonb, $19
        )`,
        [
          s.id,
          s.ownerUserId,
          s.name,
          s.slug,
          s.documentId,
          s.mainCategory,
          s.description,
          s.logoText,
          s.accentColor,
          s.bannerImage,
          s.status,
          s.verified,
          s.rating,
          s.reviewCount,
          s.joinedDate,
          s.tenureLabel,
          s.location,
          JSON.stringify(s.payoutInfo),
          i,
        ]
      );
    }

    for (let i = 0; i < data.categories.length; i++) {
      await client.query(
        'INSERT INTO categories (name, sort_order) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [data.categories[i], i]
      );
    }

    for (let i = 0; i < data.products.length; i++) {
      const p = data.products[i];
      await client.query(
        `INSERT INTO products (
          id, seller_id, title, brand, category, condition, price, original_price,
          stock, rating, review_count, sold_count, images, description, specs,
          badge, created_at, sort_order
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13::jsonb, $14, $15::jsonb,
          $16, $17, $18
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
          JSON.stringify(p.images),
          p.description,
          JSON.stringify(p.specs ?? {}),
          null,
          p.createdAt,
          i,
        ]
      );
    }

    for (let i = 0; i < data.orders.length; i++) {
      const o = data.orders[i];
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

    for (const [userId, addresses] of Object.entries(data.addressesByUser)) {
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

    for (const [userId, productIds] of Object.entries(data.wishlistsByUser)) {
      for (let i = 0; i < productIds.length; i++) {
        await client.query(
          `INSERT INTO wishlists (user_id, product_id, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) DO NOTHING`,
          [userId, productIds[i], i]
        );
      }
    }

    for (const email of data.newsletterEmails) {
      await client.query(
        'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [email]
      );
    }

    for (const msg of data.contactMessages) {
      await client.query(
        `INSERT INTO contact_messages (id, name, email, subject, message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [msg.id, msg.name, msg.email, msg.subject, msg.message, msg.createdAt]
      );
    }

    await client.query(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ('commissionRate', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(data.commissionRate)]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function loadLocalFileDatabase(createSeed: () => DatabaseSchema): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (
        Array.isArray(parsed.users) &&
        Array.isArray(parsed.sellers) &&
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.orders)
      ) {
        return {
          users: parsed.users,
          sellers: parsed.sellers,
          products: parsed.products,
          categories: parsed.categories,
          orders: parsed.orders,
          addressesByUser: parsed.addressesByUser ?? {},
          wishlistsByUser: parsed.wishlistsByUser ?? {},
          newsletterEmails: parsed.newsletterEmails ?? [],
          contactMessages: parsed.contactMessages ?? [],
          commissionRate: typeof parsed.commissionRate === 'number' ? parsed.commissionRate : 10,
        };
      }
    }
  } catch (err) {
    console.warn('[Cellbox DB] Failed reading local fallback file, regenerating seed:', err);
  }

  const seeded = createSeed();
  saveLocalFileDatabase(seeded);
  return seeded;
}

function saveLocalFileDatabase(data: DatabaseSchema): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export async function initAndLoadDatabase(
  createSeed: () => DatabaseSchema
): Promise<DatabaseSchema> {
  const pool = getPool();
  if (!pool) {
    console.log('[Cellbox DB] DATABASE_URL not set; using local file persistence.');
    return loadLocalFileDatabase(createSeed);
  }

  await ensureSchema(pool);
  const countRes = await pool.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM users');
  if ((countRes.rows[0]?.count ?? 0) === 0) {
    const seeded = createSeed();
    await persistToPostgres(pool, seeded);
    console.log('[Cellbox DB] Initialized PostgreSQL schema and seeded initial marketplace data.');
    return seeded;
  }

  const loaded = await loadFromPostgres(pool);
  console.log(
    `[Cellbox DB] Connected to PostgreSQL (${loaded.users.length} users, ${loaded.sellers.length} sellers, ${loaded.products.length} products).`
  );
  return loaded;
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  const pool = getPool();
  if (!pool) {
    saveLocalFileDatabase(data);
    return;
  }

  const snapshot = structuredClone(data);
  const nextWrite = saveChain
    .catch(() => undefined)
    .then(() => persistToPostgres(pool, snapshot));
  saveChain = nextWrite;
  await nextWrite;
}

export async function recordUploadedAsset(asset: UploadedAssetRecord): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
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

export async function closeDatabasePool(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}
