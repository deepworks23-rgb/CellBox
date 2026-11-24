import crypto from 'node:crypto';
import dotenv from 'dotenv';
import express from 'express';
import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';

if (!process.env.VERCEL) {
  dotenv.config({ quiet: true });
}
import { DEFAULT_SITE_CUSTOMIZATION } from '../data/defaultCustomization.ts';
import {
  ACTIVE_COUPONS,
  ASSET_IMAGES,
  INITIAL_ADDRESSES,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_USERS,
} from '../data/seedData.ts';
import type {
  Address,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCondition,
  ProductSpecs,
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
import {
  calculateCartTotals,
  calculateCouponDiscount,
  groupCartBySeller,
  ORDER_STATUS_FLOW,
  validateProductForm,
  validateRegistration,
} from '../utils/marketplace.ts';
import {
  createSessionToken,
  hashPassword,
  parseCookieHeader,
  verifyPassword,
  verifySessionToken,
} from './auth.ts';
import * as db from '../lib/db.ts';
import type { SeedPayload, StoredUser } from '../lib/db.ts';
import {
  buildUploadKey,
  getObjectPresignedUrl,
  getS3Bucket,
  isS3Configured,
  sanitizeStorageKey,
  uploadObjectToS3,
  validateImageUploadPayload,
} from './storage.ts';
import { isEmailServiceConfigured, sendPasswordResetEmail } from './mailer.ts';

const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE_NAME = 'cellbox_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'cellbox-mz-session-signing-key-2026-v1';

export function createInitialSeed(): SeedPayload {
  const adminPassHash = hashPassword('Joswil@8464');
  const sellerPassHash = hashPassword('Joswil@8464');
  const buyerPassHash = hashPassword('Joswil@8464');

  const users: StoredUser[] = [
    {
      id: 'user-admin-joswil',
      name: 'Joswil Admin',
      email: 'admin@cellbox.co.mz',
      role: 'admin',
      phone: '869391382',
      passwordHash: adminPassHash,
      createdAt: '2026-11-20T00:00:00.000Z',
    },
    {
      id: 'user-seller-joswil',
      name: 'Joswil Vendedor',
      email: 'vendedor@cellbox.co.mz',
      role: 'seller',
      phone: '869391381',
      sellerId: 'seller-1795423493110',
      passwordHash: sellerPassHash,
      createdAt: '2026-11-20T00:00:00.000Z',
    },
    {
      id: 'user-buyer-joswil',
      name: 'Joswil Comprador',
      email: 'comprador@cellbox.co.mz',
      role: 'buyer',
      phone: '849362797',
      passwordHash: buyerPassHash,
      createdAt: '2026-11-20T00:00:00.000Z',
    },
  ];

  const sellers: SellerStore[] = [
    {
      id: 'seller-1795423493110',
      ownerUserId: 'user-seller-joswil',
      name: 'CellBox Store',
      slug: 'cellbox-store',
      documentId: '1100223344A',
      mainCategory: 'Smartphones',
      description: 'Loja oficial CellBox com dispositivos certificados, procedência garantida e entrega rápida em Moçambique.',
      logoText: 'CB',
      logoUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop',
      accentColor: '#1D4ED8',
      bannerImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop',
      status: 'active',
      verified: true,
      rating: 5.0,
      reviewCount: 0,
      joinedDate: '2026-11-20',
      tenureLabel: 'Loja Oficial Verificada',
      location: 'Maputo, Moçambique',
      payoutInfo: {
        method: 'mpesa',
        accountName: 'Joswil Vendedor',
        accountNumber: '869391381',
      },
      socials: {},
      kyc: {
        status: 'verified',
        submittedAt: '2026-11-20T10:00:00Z',
        verifiedAt: '2026-11-20T10:30:00Z',
      },
      activation: {
        profileCompleted: true,
        kycCompleted: true,
        feePaid: true,
        feeStatus: 'confirmed',
      },
    },
  ];

  const products: Product[] = [
    {
      id: 'prod-iphone-16-pro',
      sellerId: 'seller-1795423493110',
      title: 'iPhone 16 Pro Max 256GB Titânio Natural',
      brand: 'Apple',
      category: 'Smartphones',
      condition: 'Novo',
      price: 98500,
      originalPrice: 108900,
      stock: 14,
      rating: 4.9,
      reviewCount: 142,
      soldCount: 286,
      isFlashDeal: true,
      isBestSeller: true,
      images: [ASSET_IMAGES.iphone16Pro, ASSET_IMAGES.hero],
      description: 'Construído em titânio grau 5 com chip A18 Pro, sistema de câmera Fusion de 48 MP com teleobjetiva 5x e tela Super Retina XDR de 6,9" com ProMotion 120Hz.',
      specs: {
        ram: '8 GB',
        storage: '256 GB NVMe',
        processor: 'Apple A18 Pro (3nm)',
        display: '6,9" OLED ProMotion 120Hz',
        battery: '4.685 mAh · USB-C',
        warranty: '12 meses Garantia Oficial',
      },
      createdAt: '2026-10-02',
    },
    {
      id: 'prod-galaxy-s24-ultra',
      sellerId: 'seller-1795423493110',
      title: 'Samsung Galaxy S24 Ultra 512GB Titânio Cinza + S Pen',
      brand: 'Samsung',
      category: 'Smartphones',
      condition: 'Novo',
      price: 82500,
      originalPrice: 93000,
      stock: 19,
      rating: 4.8,
      reviewCount: 118,
      soldCount: 231,
      isFlashDeal: true,
      isBestSeller: true,
      images: [ASSET_IMAGES.galaxyS24Ultra, ASSET_IMAGES.hero],
      description: 'Estrutura em titânio com S Pen integrada, câmera quádrupla de 200 MP com zoom óptico 5x, tela plana antirreflexo Gorilla Armor e Snapdragon 8 Gen 3 for Galaxy.',
      specs: {
        ram: '12 GB LPDDR5X',
        storage: '512 GB UFS 4.0',
        processor: 'Snapdragon 8 Gen 3 for Galaxy',
        display: '6,8" Dynamic AMOLED 2X QHD+ 120Hz',
        battery: '5.000 mAh · Carga 45W',
        warranty: '12 meses Samsung Oficial',
      },
      createdAt: '2026-09-28',
    },
    {
      id: 'prod-macbook-pro-m3',
      sellerId: 'seller-1795423493110',
      title: 'MacBook Pro 14" M3 Pro 18GB 512GB Preto-Espacial',
      brand: 'Apple',
      category: 'Laptops',
      condition: 'Novo',
      price: 159900,
      originalPrice: 174500,
      stock: 7,
      rating: 4.9,
      reviewCount: 94,
      soldCount: 164,
      isFlashDeal: true,
      isBestSeller: true,
      images: [ASSET_IMAGES.macbookPro, ASSET_IMAGES.hero],
      description: 'Desempenho extremo para engenharia, edição 4K e IA local com chip M3 Pro de 11 núcleos, tela Liquid Retina XDR mini-LED de 1600 nits e até 18 horas de bateria.',
      specs: {
        ram: '18 GB Memória Unificada',
        storage: '512 GB SSD PCIe',
        processor: 'Apple M3 Pro (11-core CPU / 14-core GPU)',
        display: '14,2" Liquid Retina XDR 120Hz',
        battery: '70 Wh · MagSafe 3',
        warranty: '12 meses oficial',
      },
      createdAt: '2026-09-20',
    },
    {
      id: 'prod-dell-xps-15',
      sellerId: 'seller-1795423493110',
      title: 'Dell XPS 15 OLED Intel Core Ultra 7 32GB 1TB SSD',
      brand: 'Dell',
      category: 'Laptops',
      condition: 'Novo',
      price: 129900,
      originalPrice: 142000,
      stock: 6,
      rating: 4.8,
      reviewCount: 53,
      soldCount: 98,
      isBestSeller: true,
      images: [ASSET_IMAGES.dellXps, ASSET_IMAGES.hero],
      description: 'Ultrabook construído em alumínio CNC e fibra de carbono com tela InfinityEdge 3.5K OLED touch, placa RTX 4060 e acabamento de nível workstation.',
      specs: {
        ram: '32 GB DDR5 5600MHz',
        storage: '1 TB SSD NVMe Gen4',
        processor: 'Intel Core Ultra 7 155H + RTX 4060',
        display: '15,6" 3.5K OLED InfinityEdge',
        battery: '86 Wh · Carga 130W USB-C',
        warranty: '12 meses Dell ProSupport',
      },
      createdAt: '2026-10-08',
    },
    {
      id: 'prod-ipad-pro-m4',
      sellerId: 'seller-1795423493110',
      title: 'iPad Pro 13" M4 Tandem OLED 256GB Wi-Fi',
      brand: 'Apple',
      category: 'Tablets',
      condition: 'Novo',
      price: 105000,
      stock: 9,
      rating: 4.9,
      reviewCount: 41,
      soldCount: 77,
      images: [ASSET_IMAGES.ipadPro, ASSET_IMAGES.hero],
      description: 'O tablet mais fino já produzido pela Apple, equipado com tela Ultra Retina XDR Tandem OLED, chip M4 e compatibilidade com Apple Pencil Pro.',
      specs: {
        ram: '8 GB',
        storage: '256 GB',
        processor: 'Apple M4 (9-core CPU / 10-core GPU)',
        display: '13" Tandem OLED 120Hz',
        battery: 'Até 10 horas · Thunderbolt 4',
        warranty: '12 meses Garantia Oficial',
      },
      createdAt: '2026-10-12',
    },
    {
      id: 'prod-rog-ally-x',
      sellerId: 'seller-1795423493110',
      title: 'ASUS ROG Ally X 1TB 24GB RAM Console Portátil PC',
      brand: 'ASUS',
      category: 'Gaming',
      condition: 'Novo',
      price: 64900,
      originalPrice: 71500,
      stock: 8,
      rating: 4.8,
      reviewCount: 64,
      soldCount: 112,
      isFlashDeal: true,
      images: [ASSET_IMAGES.gamingHandheld, ASSET_IMAGES.hero],
      description: 'PC gamer portátil com processador AMD Ryzen Z1 Extreme, bateria expandida de 80Wh, 24GB de memória LPDDR5X rápida e tela Full HD 120Hz com FreeSync Premium.',
      specs: {
        ram: '24 GB LPDDR5X-7500',
        storage: '1 TB SSD NVMe M.2 2280',
        processor: 'AMD Ryzen Z1 Extreme (8-core / RDNA 3)',
        display: '7" IPS Full HD 120Hz VRR',
        battery: '80 Wh · Dual USB-C',
        warranty: '12 meses ASUS Oficial',
      },
      createdAt: '2026-10-15',
    },
    {
      id: 'prod-studio-anc-pro',
      sellerId: 'seller-1795423493110',
      title: 'Headphone Wireless Studio ANC Pro Bluetooth 5.4',
      brand: 'Sony',
      category: 'Áudio',
      condition: 'Novo',
      price: 21500,
      stock: 15,
      rating: 4.8,
      reviewCount: 73,
      soldCount: 138,
      images: [ASSET_IMAGES.sonyHeadphones],
      description: 'Cancelamento ativo de ruído adaptativo com 8 microfones, codec LDAC de alta resolução, conexão multiponto e até 35 horas de reprodução contínua.',
      specs: {
        processor: 'Chip Integrado V2 + QN1',
        battery: '35h com ANC · Carga rápida USB-C',
        warranty: '12 meses oficial',
      },
      createdAt: '2026-11-01',
    },
    {
      id: 'prod-ssd-nvme-2tb',
      sellerId: 'seller-1795423493110',
      title: 'SSD NVMe M.2 Gen4 2TB 7450MB/s + Dissipador Alumínio',
      brand: 'Samsung',
      category: 'Peças',
      condition: 'Novo',
      price: 13200,
      originalPrice: 15400,
      stock: 23,
      rating: 4.9,
      reviewCount: 89,
      soldCount: 175,
      images: [ASSET_IMAGES.ganCharger],
      description: 'Módulo de upgrade NVMe PCIe 4.0 x4 com velocidades sequenciais de leitura de até 7.450 MB/s, ideal para laptops, desktops workstation e consoles.',
      specs: {
        storage: '2 TB NVMe PCIe Gen 4.0 x4',
        processor: 'Controlador Pascal + Cache DRAM 2GB',
        warranty: '60 meses fabricante',
      },
      createdAt: '2026-11-03',
    },
  ];

  return {
    users,
    sellers,
    products,
    categories: [...INITIAL_CATEGORIES],
    orders: [],
    addressesByUser: {
      'user-buyer-joswil': [
        {
          id: 'addr-buyer-1',
          label: 'Residência',
          recipient: 'Joswil Comprador',
          street: 'Av. 24 de Julho, 1020 — Polana',
          city: 'Maputo',
          state: 'Maputo',
          zipCode: '1100',
          isDefault: true,
        },
      ],
    },
    wishlistsByUser: {},
    commissionRate: 10,
  };
}

let dbInitPromise: Promise<void> | null = null;

export function ensureDatabaseReady(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = db.initDatabase(createInitialSeed).catch((err) => {
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}

function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    sellerId: u.sellerId,
    avatarUrl: u.avatarUrl,
    province: u.province,
    city: u.city,
    neighborhood: u.neighborhood,
    zipCode: u.zipCode,
    createdAt: u.createdAt,
  };
}

function resolveAppBaseUrl(req: Request): string {
  const configured = (process.env.APP_URL ?? '').trim();
  if (configured && /^https?:\/\//i.test(configured) && !configured.includes('MY_APP_URL')) {
    return configured.replace(/\/+$/, '');
  }
  const originHeader = req.headers.origin;
  if (typeof originHeader === 'string' && /^https?:\/\//i.test(originHeader)) {
    return originHeader.replace(/\/+$/, '');
  }
  const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)
    ?.split(',')[0]
    ?.trim();
  const proto = forwardedProto || req.protocol || 'http';
  const host =
    (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim() ||
    req.get('host') ||
    `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, Math.max(2, local.length - 2)))}@${domain}`;
}

async function getAuthenticatedUser(req: Request): Promise<StoredUser | null> {
  const authHeader = req.headers.authorization;
  let token = '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token) {
    const cookies = parseCookieHeader(req.headers.cookie);
    token = cookies[SESSION_COOKIE_NAME] || '';
  }
  if (!token) return null;

  const verified = verifySessionToken(token, SESSION_SECRET);
  if (!verified) return null;
  return db.findUserById(verified.userId);
}

function isSecureRequest(req: Request): boolean {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
  return req.secure || proto === 'https';
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const secureFlag = isSecureRequest(req) ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${60 * 60 * 24 * 7}`
  );
}

function clearSessionCookie(req: Request, res: Response): void {
  const secureFlag = isSecureRequest(req) ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=0`
  );
}

async function buildBootstrapPayload(user: StoredUser | null) {
  const [
    sellers,
    products,
    categories,
    orders,
    commissionRate,
    addresses,
    wishlist,
    allUsers,
    siteCustomization,
  ] = await Promise.all([
    db.listSellers().catch(() => []),
    db.listProducts().catch(() => []),
    db.listCategories().catch(() => []),
    db.listScopedOrders(user).catch(() => []),
    db.getCommissionRate().catch(() => 10),
    user ? db.listAddressesByUser(user.id).catch(() => []) : Promise.resolve([]),
    user ? db.listWishlistByUser(user.id).catch(() => []) : Promise.resolve([]),
    user?.role === 'admin' ? db.listUsers().catch(() => []) : Promise.resolve([]),
    db.getSiteCustomization().catch(() => DEFAULT_SITE_CUSTOMIZATION),
  ]);

  return {
    currentUser: user ? toPublicUser(user) : null,
    users:
      user?.role === 'admin'
        ? allUsers.map(toPublicUser)
        : user
          ? [toPublicUser(user)]
          : [],
    sellers,
    products,
    categories,
    orders,
    addresses,
    wishlist,
    commissionRate,
    siteCustomization,
  };
}

export function createApiApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));

  // Garante que o schema e todas as colunas do banco estejam inicializados
  let dbInitDone = false;
  app.use(async (req, _res, next) => {
    if (req.path.startsWith('/api') && req.path !== '/api/health' && !dbInitDone) {
      try {
        await ensureDatabaseReady();
        dbInitDone = true;
      } catch (err) {
        console.warn('[Cellbox DB] Aviso na inicialização de schema:', err);
      }
    }
    next();
  });

  // ── Healthcheck (PostgreSQL connectivity & runtime env diagnostics) ──────
  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      const env = db.getDatabaseEnvDiagnostics();
      try {
        await ensureDatabaseReady();
        const stats = await db.getDatabaseHealthStats();
        res.json({ ok: true, database: 'postgresql', env, ...stats });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Falha ao conectar ao banco PostgreSQL.';
        res.status(503).json({
          ok: false,
          database: 'postgresql',
          env,
          error: message,
        });
      }
    })
  );

  app.all(
    '/api/seed',
    asyncHandler(async (req, res) => {
      const stats = await db.getDatabaseHealthStats();
      const shouldReset = req.query.reset === '1';
      if (stats.users === 0 || shouldReset) {
        const seed = createInitialSeed();
        await db.resetDatabaseToSeed(seed);
        const postStats = await db.getDatabaseHealthStats();
        res.json({ ok: true, message: 'Seed inicial populado com sucesso.', stats: postStats });
        return;
      }
      // Garante que a loja oficial esteja ativa para os produtos serem exibidos na vitrine
      await db.setSellerStatus('seller-1795423493110', 'active');
      const refreshedStats = await db.getDatabaseHealthStats();
      res.json({ ok: true, message: 'Status dos utilizadores e lojas sincronizado.', stats: refreshedStats });
    })
  );

  // Lazily ensure Neon PostgreSQL schema & initial seed are ready on cold starts (Vercel Serverless & Node)
  app.use(
    '/api',
    asyncHandler(async (_req, _res, next) => {
      await ensureDatabaseReady();
      next();
    })
  );

  // ── Bootstrap & Session (Live PostgreSQL Queries) ────────────────────────
  app.get(
    '/api/bootstrap',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      res.json(await buildBootstrapPayload(user));
    })
  );

  app.get(
    '/api/auth/me',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      res.json({ user: user ? toPublicUser(user) : null });
    })
  );

  // ── Real Authentication Endpoints (PostgreSQL) ───────────────────────────
  app.post(
    '/api/auth/login',
    asyncHandler(async (req, res) => {
      const { email, phone, identifier, password } = req.body as {
        email?: string;
        phone?: string;
        identifier?: string;
        password?: string;
      };
      const userIdentifier = (identifier ?? phone ?? email ?? '').trim();
      const rawPassword = password ?? '';

      if (!userIdentifier || !rawPassword) {
        res.status(400).json({ error: 'Informe o número de telefone e a senha para continuar.' });
        return;
      }

      const user = await db.findUserByIdentifier(userIdentifier);
      const trimmedPass = rawPassword.trim();
      const isPasswordValid =
        user &&
        (verifyPassword(rawPassword, user.passwordHash) ||
          verifyPassword(trimmedPass, user.passwordHash) ||
          (trimmedPass.length > 0 &&
            (verifyPassword(
              trimmedPass.charAt(0).toUpperCase() + trimmedPass.slice(1),
              user.passwordHash
            ) ||
              verifyPassword(
                trimmedPass.charAt(0).toLowerCase() + trimmedPass.slice(1),
                user.passwordHash
              ))));

      if (!user || !isPasswordValid) {
        res.status(401).json({
          error:
            'Número de telefone ou senha incorretos. Verifique suas credenciais e tente novamente.',
        });
        return;
      }

      const token = createSessionToken(user.id, SESSION_SECRET);
      setSessionCookie(req, res, token);
      res.json({
        token,
        ...(await buildBootstrapPayload(user)),
      });
    })
  );

  app.post(
    '/api/auth/register',
    asyncHandler(async (req, res) => {
      const body = req.body as {
        name?: string;
        phone?: string;
        email?: string;
        password?: string;
        province?: string;
        city?: string;
        neighborhood?: string;
        zipCode?: string;
        avatarUrl?: string;
        isSeller?: boolean;
        storeName?: string;
        mainCategory?: string;
        description?: string;
        storeLocation?: string;
        logoUrl?: string;
        bannerImage?: string;
        socials?: {
          facebook?: string;
          instagram?: string;
          tiktok?: string;
          youtube?: string;
        };
      };

      const errors = validateRegistration({
        name: body.name ?? '',
        phone: body.phone ?? '',
        email: body.email,
        password: body.password ?? '',
        province: body.province,
        city: body.city,
        neighborhood: body.neighborhood,
        zipCode: body.zipCode,
        isSeller: Boolean(body.isSeller),
        storeName: body.storeName,
        mainCategory: body.mainCategory,
        description: body.description,
        storeLocation: body.storeLocation,
        logoUrl: body.logoUrl,
        bannerImage: body.bannerImage,
        avatarUrl: body.avatarUrl,
        socials: body.socials,
      });

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ error: Object.values(errors)[0], errors });
        return;
      }

      const phoneClean = body.phone?.trim();
      if (phoneClean) {
        const existingPhone = await db.findUserByPhone(phoneClean);
        if (existingPhone) {
          res.status(409).json({ error: 'Este número de telefone já está cadastrado na CellBox.' });
          return;
        }
      }

      const emailTrimmed = body.email?.trim().toLowerCase();
      if (emailTrimmed) {
        const existingEmail = await db.findUserByEmail(emailTrimmed);
        if (existingEmail) {
          res.status(409).json({ error: 'Este e-mail já está cadastrado na CellBox.' });
          return;
        }
      }

      const emailFinal = emailTrimmed || `${body.phone?.replace(/\D/g, '') || Date.now()}@cellbox.mz`;
      const userId = `user-${Date.now()}`;
      const today = new Date().toISOString().slice(0, 10);
      const passwordHash = hashPassword(body.password!);

      let createdUser: StoredUser;
      let createdSeller: SellerStore | undefined;

      if (body.isSeller) {
        const sellerId = `seller-${Date.now()}`;
        const storeName = body.storeName!.trim();
        const initials =
          storeName
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? '')
            .join('')
            .slice(0, 2) || 'CB';

        createdUser = {
          id: userId,
          name: body.name!.trim(),
          email: emailFinal,
          role: 'seller',
          phone: phoneClean,
          sellerId,
          avatarUrl: body.avatarUrl?.trim() || undefined,
          province: body.province?.trim() || 'Maputo Cidade',
          city: body.city?.trim() || 'Maputo',
          neighborhood: body.neighborhood?.trim() || 'Central',
          zipCode: body.zipCode?.trim() || '1100',
          createdAt: today,
          passwordHash,
        };

        createdSeller = {
          id: sellerId,
          ownerUserId: userId,
          name: storeName,
          slug: storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          documentId: 'Pendente de KYC',
          mainCategory: body.mainCategory!,
          description:
            body.description?.trim() ||
            `Loja parceira CellBox especializada em ${body.mainCategory}.`,
          logoText: initials,
          logoUrl: body.logoUrl?.trim() || undefined,
          accentColor: '#0475EE',
          bannerImage: body.bannerImage?.trim() || ASSET_IMAGES.hero,
          status: 'pending',
          verified: false,
          rating: 5.0,
          reviewCount: 0,
          joinedDate: today,
          tenureLabel: 'Pendente de Ativação',
          location:
            body.storeLocation?.trim() ||
            `${body.city || 'Maputo'}, ${body.province || 'Moçambique'}`,
          socials: body.socials ?? {},
          kyc: {
            status: 'not_submitted',
          },
          activation: {
            profileCompleted: true,
            kycCompleted: false,
            feePaid: false,
          },
          payoutInfo: {
            bankName: 'Pendente de configuração',
            accountType: 'Conta Empresarial',
            accountNumber: '—',
            pixOrWallet: phoneClean || 'M-Pesa',
          },
        };
      } else {
        createdUser = {
          id: userId,
          name: body.name!.trim(),
          email: emailFinal,
          role: 'buyer',
          phone: phoneClean,
          avatarUrl: body.avatarUrl?.trim() || undefined,
          province: body.province?.trim() || 'Maputo Cidade',
          city: body.city?.trim() || 'Maputo',
          neighborhood: body.neighborhood?.trim() || 'Central',
          zipCode: body.zipCode?.trim() || '1100',
          createdAt: today,
          passwordHash,
        };
      }

      await db.createUserAccount(createdUser, createdSeller);

      const token = createSessionToken(createdUser.id, SESSION_SECRET);
      setSessionCookie(req, res, token);
      res.status(201).json({
        token,
        seller: createdSeller,
        ...(await buildBootstrapPayload(createdUser)),
      });
    })
  );

  // ── Seller Activation: KYC Verification ──────────────────────────────────
  app.post(
    '/api/seller/kyc',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        res.status(401).json({ error: 'Apenas vendedores podem submeter verificação KYC.' });
        return;
      }
      const seller = await db.findSellerOwnedBy(user.id, user.sellerId);
      if (!seller) {
        res.status(404).json({ error: 'Loja não encontrada.' });
        return;
      }
      const { fullName, documentType, documentNumber, documentFrontUrl, documentBackUrl } = req.body as {
        fullName?: string;
        documentType?: 'BI' | 'NUIT' | 'Passaporte' | 'Alvara';
        documentNumber?: string;
        documentFrontUrl?: string;
        documentBackUrl?: string;
      };
      if (!fullName?.trim()) {
        res.status(400).json({ error: 'Informe o nome completo do titular do documento.' });
        return;
      }
      if (!documentNumber?.trim()) {
        res.status(400).json({ error: 'Informe o número do documento de identificação.' });
        return;
      }
      const kycData: SellerKycInfo = {
        status: 'pending',
        fullName: fullName.trim(),
        documentType: documentType || 'BI',
        documentNumber: documentNumber.trim(),
        documentFrontUrl: documentFrontUrl?.trim() || undefined,
        documentBackUrl: documentBackUrl?.trim() || undefined,
        submittedAt: new Date().toISOString(),
      };
      const updated = await db.updateSellerKyc(seller.id, kycData);
      res.json({
        ok: true,
        message: 'Documentos KYC submetidos para análise da equipa CellBox.',
        seller: updated,
        ...(await buildBootstrapPayload(user)),
      });
    })
  );

  // ── Seller Activation: 100 MZN Registration Fee Payment ───────────────────
  app.post(
    '/api/seller/activate-fee',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        res.status(401).json({ error: 'Acesso restrito ao vendedor.' });
        return;
      }
      const seller = await db.findSellerOwnedBy(user.id, user.sellerId);
      if (!seller) {
        res.status(404).json({ error: 'Loja não encontrada.' });
        return;
      }
      const { method, phone, transactionId, proofUrl } = req.body as {
        method?: 'mpesa' | 'emola';
        phone?: string;
        transactionId?: string;
        proofUrl?: string;
      };
      if (!method || (method !== 'mpesa' && method !== 'emola')) {
        res.status(400).json({ error: 'Selecione a carteira móvel (M-Pesa ou e-Mola).' });
        return;
      }
      if (!phone?.trim() || phone.replace(/\D/g, '').length < 9) {
        res.status(400).json({ error: 'Informe um número de celular válido de Moçambique com 9 dígitos.' });
        return;
      }
      if (!transactionId?.trim() || transactionId.trim().length < 4) {
        res.status(400).json({
          error: 'Informe o Código / ID da Transação recebido por SMS do M-Pesa / e-Mola para validação real.',
        });
        return;
      }
      const updated = await db.submitSellerActivationFee(seller.id, {
        method,
        phone: phone.trim(),
        transactionId: transactionId.trim().toUpperCase(),
        proofUrl: proofUrl?.trim() || undefined,
      });
      res.json({
        ok: true,
        message: 'Transação de 100 MT submetida com sucesso! A equipa CellBox fará a validação financeira.',
        seller: updated,
        ...(await buildBootstrapPayload(user)),
      });
    })
  );

  // ── EscalePay Webhook Listener (Instant Payment Notification - IPN) ────────
  app.all(
    '/api/webhooks/escalepay',
    asyncHandler(async (req, res) => {
      if (req.method === 'GET') {
        res.json({
          ok: true,
          service: 'CellBox EscalePay Webhook Listener',
          status: 'online',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const payload = (req.body || {}) as Record<string, any>;
      const data = payload.data || payload;
      const customer = data.customer || payload.customer || {};

      const transactionId = String(
        data.transaction_id ||
        data.transactionId ||
        data.id ||
        data.payment_id ||
        payload.id ||
        `TX-${Date.now()}`
      );

      const status = String(data.status || payload.status || payload.event || '').toLowerCase();

      // Check if event/status signifies approved payment
      const isSuccess =
        !status ||
        status.includes('paid') ||
        status.includes('approved') ||
        status.includes('success') ||
        status.includes('completed') ||
        status.includes('sale.approved');

      // Extract seller reference from metadata / reference / params
      const reference = String(
        data.sellerId ||
        data.seller_id ||
        data.metadata?.sellerId ||
        data.custom_fields?.sellerId ||
        data.reference ||
        data.external_reference ||
        payload.sellerId ||
        payload.reference ||
        ''
      );

      const phone = String(customer.phone || data.phone || payload.phone || '');
      const email = String(customer.email || data.email || payload.email || '');

      const seller = await db.findSellerByAnyIdentifier({
        sellerId: reference,
        reference,
        phone,
        email,
      });

      if (!seller) {
        console.warn('[EscalePay Webhook] No matching seller found for payload:', {
          reference,
          phone,
          email,
          transactionId,
        });
        res.status(200).json({
          ok: true,
          warning: 'Webhook recebido com sucesso pela CellBox, mas o lojista não foi localizado.',
          receivedReference: reference,
          receivedPhone: phone,
          receivedEmail: email,
        });
        return;
      }

      if (isSuccess) {
        await db.confirmSellerFeePayment(seller.id, {
          method: 'escalepay',
          transactionId,
          phone,
          receipt: `ESCALEPAY-${transactionId}`,
        });
        console.log(`[EscalePay Webhook] Taxa de 100 MT confirmada para: ${seller.name} (${seller.id})`);
      }

      res.status(200).json({
        ok: true,
        message: 'Notificação EscalePay processada com sucesso.',
        sellerId: seller.id,
        storeName: seller.name,
        paid: isSuccess,
      });
    })
  );

  app.post(
    '/api/auth/logout',
    asyncHandler(async (req, res) => {
      clearSessionCookie(req, res);
      res.json({
        ok: true,
        ...(await buildBootstrapPayload(null)),
      });
    })
  );

  app.patch(
    '/api/profile',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Faça login para atualizar seus dados.' });
        return;
      }
      const { name, phone, avatarUrl, province, city, neighborhood, zipCode } = req.body as {
        name?: string;
        phone?: string;
        avatarUrl?: string;
        province?: string;
        city?: string;
        neighborhood?: string;
        zipCode?: string;
      };
      const updated = await db.updateUserProfile(user.id, {
        name,
        phone,
        avatarUrl,
        province,
        city,
        neighborhood,
        zipCode,
      });
      res.json({ user: toPublicUser(updated ?? user) });
    })
  );

  app.post(
    '/api/auth/change-password',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Autenticação necessária.' });
        return;
      }
      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };
      if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
        res.status(400).json({ error: 'A senha atual informada está incorreta.' });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
        return;
      }
      await db.updateUserPassword(user.id, hashPassword(newPassword));
      res.json({ ok: true });
    })
  );

  // ── Real Password Recovery (PostgreSQL tokens + Real Email Delivery) ─────
  app.post(
    '/api/auth/forgot-password',
    asyncHandler(async (req, res) => {
      const { email } = req.body as { email?: string };
      const normalizedEmail = (email ?? '').trim().toLowerCase();

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
        return;
      }

      const user = await db.findUserByEmail(normalizedEmail);
      if (!user) {
        res.status(404).json({
          error: 'Não encontramos nenhuma conta registada com este e-mail.',
        });
        return;
      }

      if (!isEmailServiceConfigured()) {
        res.status(503).json({
          error:
            'O serviço de envio de e-mail não está configurado no servidor. Configure SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) ou RESEND_API_KEY nas variáveis de ambiente.',
        });
        return;
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiresMinutes = 30;
      const { tokenHash } = await db.createPasswordResetToken(user.id, rawToken, expiresMinutes);
      const resetUrl = `${resolveAppBaseUrl(req)}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendPasswordResetEmail({
          to: user.email,
          userName: user.name,
          resetUrl,
          expiresMinutes,
        });
      } catch (err) {
        await db.deletePasswordResetTokenByHash(tokenHash);
        console.error('[Cellbox Mailer] Failed sending password reset email:', err);
        res.status(502).json({
          error:
            'Não foi possível enviar o e-mail de recuperação neste momento. Verifique as credenciais SMTP/Resend e tente novamente.',
        });
        return;
      }

      res.json({
        ok: true,
        message:
          'Enviámos um link de redefinição de senha para o seu e-mail. Verifique a caixa de entrada e a pasta de spam.',
      });
    })
  );

  app.get(
    '/api/auth/reset-password/verify',
    asyncHandler(async (req, res) => {
      const rawToken = typeof req.query.token === 'string' ? req.query.token : '';
      const record = await db.verifyPasswordResetToken(rawToken);
      if (!record) {
        res.status(400).json({
          valid: false,
          error: 'Este link de recuperação é inválido, expirou ou já foi utilizado.',
        });
        return;
      }
      res.json({
        valid: true,
        emailMasked: maskEmail(record.email),
        expiresAt: record.expiresAt,
      });
    })
  );

  app.post(
    '/api/auth/reset-password',
    asyncHandler(async (req, res) => {
      const { token, newPassword, confirmPassword } = req.body as {
        token?: string;
        newPassword?: string;
        confirmPassword?: string;
      };

      if (!token || token.trim().length < 32) {
        res.status(400).json({ error: 'Token de recuperação inválido.' });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'A nova senha deve conter no mínimo 6 caracteres.' });
        return;
      }
      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        res.status(400).json({ error: 'As senhas não coincidem.' });
        return;
      }

      const consumed = await db.consumePasswordResetToken(token, hashPassword(newPassword));
      if (!consumed) {
        res.status(400).json({
          error: 'Este link de recuperação é inválido, expirou ou já foi utilizado.',
        });
        return;
      }

      res.json({
        ok: true,
        message: 'Senha redefinida com sucesso! Já pode iniciar sessão com a sua nova senha.',
      });
    })
  );

  // ── Products CRUD (Direct PostgreSQL) ────────────────────────────────────
  app.get(
    '/api/products',
    asyncHandler(async (req, res) => {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const sellerId = typeof req.query.sellerId === 'string' ? req.query.sellerId : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const products = await db.listProducts({ category, sellerId, search });
      res.json({ products });
    })
  );

  app.get(
    '/api/products/:id',
    asyncHandler(async (req, res) => {
      const product = await db.findProductById(req.params.id);
      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado.' });
        return;
      }
      res.json({ product });
    })
  );

  app.post(
    '/api/products',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        res.status(403).json({ error: 'Apenas lojistas autenticados podem cadastrar produtos.' });
        return;
      }

      const ownedSeller = await db.findSellerOwnedBy(user.id, user.sellerId);
      if (!ownedSeller) {
        res.status(403).json({ error: 'Loja do vendedor não encontrada.' });
        return;
      }

      const payload = req.body as {
        sellerId?: string;
        title: string;
        brand?: string;
        category: string;
        subcategory?: string;
        condition?: ProductCondition;
        price: number;
        originalPrice?: number;
        stock: number;
        description: string;
        imageUrl?: string;
        images?: string[];
        specs?: Record<string, string>;
      };

      if (!payload.title?.trim() || !payload.category?.trim() || Number(payload.price) <= 0 || !payload.description?.trim()) {
        res.status(400).json({ error: 'Preencha todos os campos obrigatórios: Nome, Categoria, Preço e Descrição.' });
        return;
      }

      const imgList = Array.isArray(payload.images) && payload.images.length > 0
        ? payload.images.filter(Boolean)
        : payload.imageUrl?.trim()
          ? [payload.imageUrl.trim()]
          : ['/api/assets/uploads/products/placeholder.png'];

      const created = await db.createProduct({
        id: `prod-${Date.now()}`,
        sellerId: ownedSeller.id,
        title: payload.title.trim(),
        brand: payload.brand?.trim() || '',
        category: payload.category.trim(),
        condition: payload.condition || 'Novo',
        price: Number(payload.price),
        originalPrice: payload.originalPrice ? Number(payload.originalPrice) : undefined,
        stock: Number(payload.stock) || 0,
        rating: 5.0,
        reviewCount: 0,
        soldCount: 0,
        images: imgList,
        description: payload.description.trim(),
        specs: payload.specs ?? {},
        createdAt: new Date().toISOString().slice(0, 10),
      });

      const products = await db.listProducts();
      res.status(201).json({ product: created, products });
    })
  );

  app.post(
    '/api/products/bulk',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        res.status(403).json({ error: 'Apenas lojistas autenticados podem importar produtos.' });
        return;
      }
      const ownedSeller = await db.findSellerOwnedBy(user.id, user.sellerId);
      if (!ownedSeller) {
        res.status(403).json({ error: 'Loja do vendedor não encontrada.' });
        return;
      }
      const { items } = req.body as { items: any[] };
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Nenhum produto fornecido para importação.' });
        return;
      }
      if (items.length > 300) {
        res.status(400).json({ error: 'O limite máximo para importação é de 300 produtos por arquivo CSV.' });
        return;
      }

      const validItems = items.filter(
        (it) => it && it.title?.trim() && it.category?.trim() && Number(it.price) > 0
      );

      if (validItems.length === 0) {
        res.status(400).json({ error: 'Nenhum produto válido encontrado. Verifique o preenchimento das colunas obrigatórias.' });
        return;
      }

      const created = await db.createBulkProducts(ownedSeller.id, validItems);
      const products = await db.listProducts();
      res.status(201).json({ count: created.length, products });
    })
  );

  app.patch(
    '/api/products/:id',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        res.status(403).json({ error: 'Apenas o Vendedor responsável pode editar o produto.' });
        return;
      }
      const target = await db.findProductById(req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Produto não encontrado.' });
        return;
      }
      const ownsStore = await db.doesUserOwnSeller(target.sellerId, user.id, user.sellerId);
      if (!ownsStore) {
        res.status(403).json({ error: 'Sem permissão para editar produtos de outra loja.' });
        return;
      }
      const updates = req.body as Partial<Product>;
      await db.updateProduct(req.params.id, updates);
      const products = await db.listProducts();
      res.json({ products });
    })
  );

  app.delete(
    '/api/products/:id',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
        res.status(403).json({ error: 'Sem permissão para remover produto.' });
        return;
      }
      const target = await db.findProductById(req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Produto não encontrado.' });
        return;
      }
      if (user.role === 'seller') {
        const ownsStore = await db.doesUserOwnSeller(target.sellerId, user.id, user.sellerId);
        if (!ownsStore) {
          res.status(403).json({ error: 'Sem permissão para remover produtos de outra loja.' });
          return;
        }
      }
      await db.deleteProduct(req.params.id);
      const products = await db.listProducts();
      res.json({ products });
    })
  );

  // ── Addresses (Buyer Only) ───────────────────────────────────────────────
  app.post(
    '/api/addresses',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Faça login para salvar endereços.' });
        return;
      }
      if (user.role !== 'buyer') {
        res.status(403).json({
          error: 'Apenas contas de Comprador podem gerir endereços de entrega.',
        });
        return;
      }
      const body = req.body as Omit<Address, 'id'>;
      if (
        !body.label?.trim() ||
        !body.street?.trim() ||
        !body.city?.trim() ||
        !body.zipCode?.trim()
      ) {
        res.status(400).json({ error: 'Preencha todos os campos obrigatórios do endereço.' });
        return;
      }

      const address: Address = {
        id: `addr-${Date.now()}`,
        label: body.label.trim(),
        recipient: (body.recipient ?? user.name).trim() || user.name,
        street: body.street.trim(),
        city: body.city.trim(),
        state: (body.state ?? 'Maputo').trim() || 'Maputo',
        zipCode: body.zipCode.trim(),
        isDefault: Boolean(body.isDefault),
      };

      const result = await db.createAddress(user.id, address);
      res.status(201).json({ address: result.created, addresses: result.addresses });
    })
  );

  app.patch(
    '/api/addresses/:id/default',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Autenticação necessária.' });
        return;
      }
      const addresses = await db.setDefaultAddress(user.id, req.params.id);
      if (!addresses) {
        res.status(404).json({ error: 'Endereço não encontrado.' });
        return;
      }
      res.json({ addresses });
    })
  );

  app.delete(
    '/api/addresses/:id',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Autenticação necessária.' });
        return;
      }
      const addresses = await db.deleteAddress(user.id, req.params.id);
      res.json({ addresses });
    })
  );

  // ── Wishlist (Buyer Only) ────────────────────────────────────────────────
  app.post(
    '/api/wishlist/toggle',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Faça login para salvar na lista de desejos.' });
        return;
      }
      if (user.role !== 'buyer') {
        res.status(403).json({
          error: 'Apenas contas de Comprador podem usar a lista de desejos.',
        });
        return;
      }
      const { productId } = req.body as { productId?: string };
      if (!productId) {
        res.status(400).json({ error: 'Produto inválido.' });
        return;
      }
      const result = await db.toggleWishlistItem(user.id, productId);
      res.json(result);
    })
  );

  // ── Orders (Buyer Only + Seller Fulfillment) ─────────────────────────────
  app.post(
    '/api/orders',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Faça login para concluir seu pedido.' });
        return;
      }
      if (user.role !== 'buyer') {
        res.status(403).json({ error: 'Apenas contas de Comprador podem realizar pedidos.' });
        return;
      }

      const { cart, address, paymentMethod, couponCode } = req.body as {
        cart?: CartItem[];
        address?: Address;
        paymentMethod?: PaymentMethod;
        couponCode?: string;
      };

      if (!Array.isArray(cart) || cart.length === 0 || !address || !paymentMethod) {
        res.status(400).json({ error: 'Dados do pedido incompletos.' });
        return;
      }

      const [allProducts, allSellers, commissionRate] = await Promise.all([
        db.listProducts(),
        db.listSellers(),
        db.getCommissionRate(),
      ]);

      const groups = groupCartBySeller(cart, allProducts, allSellers, address.zipCode);
      if (groups.length === 0) {
        res.status(400).json({ error: 'Carrinho vazio ou produtos indisponíveis.' });
        return;
      }

      const totals = calculateCartTotals(groups);
      const couponResult = calculateCouponDiscount(couponCode, ACTIVE_COUPONS, totals.subtotal);
      const discountTotal = couponResult.discount;
      const finalTotal = Math.max(0, totals.subtotal - discountTotal + totals.shippingTotal);
      const nowDate = new Date().toISOString().slice(0, 10);
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const orderId = `CBX-2026-${randomCode}`;

      const newOrder: Order = {
        id: orderId,
        buyerId: user.id,
        buyerName: user.name,
        buyerEmail: user.email,
        createdAt: nowDate,
        shippingAddress: address,
        paymentMethod,
        commissionRateSnapshot: commissionRate,
        subtotal: totals.subtotal,
        discountTotal: discountTotal > 0 ? discountTotal : undefined,
        couponCode: discountTotal > 0 && couponResult.coupon ? couponResult.coupon.code : undefined,
        shippingTotal: totals.shippingTotal,
        total: finalTotal,
        fulfillments: groups.map((g, idx) => ({
          sellerId: g.seller.id,
          sellerName: g.seller.name,
          items: g.items.map((entry) => ({
            productId: entry.product.id,
            sellerId: g.seller.id,
            title: entry.product.title,
            image: entry.product.images[0] ?? ASSET_IMAGES.iphone16Pro,
            price: entry.product.price,
            quantity: entry.quantity,
            condition: entry.product.condition,
          })),
          subtotal: g.subtotal,
          shipping: g.shipping,
          status: 'Pago',
          trackingCode: `CBXMZ${randomCode}${idx + 1}MP`,
          updatedAt: nowDate,
        })),
      };

      const qtyByProduct = new Map<string, number>();
      for (const item of cart) {
        qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
      }

      await db.createOrderAndUpdateStock(newOrder, qtyByProduct);

      const [updatedProducts, scopedOrders] = await Promise.all([
        db.listProducts(),
        db.listScopedOrders(user),
      ]);

      res.status(201).json({
        order: newOrder,
        products: updatedProducts,
        orders: scopedOrders,
      });
    })
  );

  app.patch(
    '/api/orders/:orderId/fulfillment',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'seller') {
        res.status(403).json({
          error: 'Apenas o Vendedor responsável pode atualizar o envio.',
        });
        return;
      }

      const { sellerId, nextStatus } = req.body as {
        sellerId?: string;
        nextStatus?: OrderStatus;
      };
      if (!sellerId || !(await db.doesUserOwnSeller(sellerId, user.id, user.sellerId))) {
        res.status(403).json({ error: 'Sem permissão para alterar pedidos de outra loja.' });
        return;
      }
      if (!nextStatus || !ORDER_STATUS_FLOW.includes(nextStatus)) {
        res.status(400).json({ error: 'Status de envio inválido.' });
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      await db.updateOrderFulfillmentStatus(req.params.orderId, sellerId, nextStatus, today);
      res.json({ orders: await db.listScopedOrders(user) });
    })
  );

  // ── Sellers & Admin ──────────────────────────────────────────────────────
  app.get(
    '/api/sellers',
    asyncHandler(async (_req, res) => {
      res.json({ sellers: await db.listSellers() });
    })
  );

  app.patch(
    '/api/sellers/:id',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
        res.status(403).json({ error: 'Apenas o Vendedor proprietário ou Administrador pode atualizar a loja.' });
        return;
      }
      const ownsStore = await db.doesUserOwnSeller(req.params.id, user.id, user.sellerId);
      if (user.role !== 'admin' && !ownsStore) {
        res.status(403).json({ error: 'Sem permissão para alterar outra loja.' });
        return;
      }
      const updates = req.body as {
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
      };
      await db.updateSellerSettings(req.params.id, updates);
      res.json({ sellers: await db.listSellers() });
    })
  );

  app.patch(
    '/api/sellers/:id/status',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Super Admin pode alterar status de vendedores.' });
        return;
      }
      const { status } = req.body as { status?: SellerStatus };
      if (!status || !['active', 'pending', 'suspended'].includes(status)) {
        res.status(400).json({ error: 'Status inválido.' });
        return;
      }

      await db.updateSellerStatus(req.params.id, status);
      res.json({ sellers: await db.listSellers() });
    })
  );

  app.patch(
    '/api/sellers/:id/kyc',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Super Admin pode avaliar documentos KYC.' });
        return;
      }
      const { action, reason } = req.body as { action?: 'approve' | 'reject'; reason?: string };
      if (!action || !['approve', 'reject'].includes(action)) {
        res.status(400).json({ error: 'Ação inválida. Use approve ou reject.' });
        return;
      }

      await db.adminReviewSellerKyc(req.params.id, action, reason);
      res.json({ sellers: await db.listSellers() });
    })
  );

  app.patch(
    '/api/sellers/:id/fee',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Super Admin pode avaliar pagamentos de taxas.' });
        return;
      }
      const { action, reason } = req.body as { action?: 'approve' | 'reject'; reason?: string };
      if (!action || !['approve', 'reject'].includes(action)) {
        res.status(400).json({ error: 'Ação inválida. Use approve ou reject.' });
        return;
      }

      await db.adminReviewSellerFee(req.params.id, action, reason);
      res.json({ sellers: await db.listSellers() });
    })
  );

  app.post(
    '/api/categories',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Super Admin pode criar categorias.' });
        return;
      }
      const trimmed = ((req.body as { name?: string }).name ?? '').trim();
      if (!trimmed) {
        res.status(400).json({ error: 'Informe o nome da categoria.' });
        return;
      }
      const inserted = await db.addCategory(trimmed);
      if (!inserted) {
        res.status(409).json({ error: 'Esta categoria já existe.' });
        return;
      }
      res.status(201).json({ categories: await db.listCategories() });
    })
  );

  app.delete(
    '/api/categories/:name',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Super Admin pode remover categorias.' });
        return;
      }
      const target = decodeURIComponent(req.params.name);
      await db.removeCategory(target);
      res.json({ categories: await db.listCategories() });
    })
  );

  app.patch(
    '/api/commission',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Super Admin pode alterar comissão.' });
        return;
      }
      const rate = Number((req.body as { rate?: number }).rate);
      if (!Number.isFinite(rate)) {
        res.status(400).json({ error: 'Taxa inválida.' });
        return;
      }
      const commissionRate = await db.setCommissionRate(rate);
      res.json({ commissionRate });
    })
  );

  app.post(
    '/api/newsletter',
    asyncHandler(async (req, res) => {
      const email = ((req.body as { email?: string }).email ?? '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Digite um e-mail válido.' });
        return;
      }
      await db.addNewsletterSubscriber(email);
      res.status(201).json({ ok: true, email });
    })
  );

  app.post(
    '/api/contact',
    asyncHandler(async (req, res) => {
      const { name, email, subject, message } = req.body as {
        name?: string;
        email?: string;
        subject?: string;
        message?: string;
      };
      if (!name?.trim() || !email?.trim() || !email.includes('@') || !message?.trim()) {
        res.status(400).json({ error: 'Preencha nome, e-mail válido e mensagem.' });
        return;
      }
      const entry = {
        id: `msg-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: (subject ?? 'Atendimento Geral').trim() || 'Atendimento Geral',
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };
      await db.createContactMessage(entry);
      res.status(201).json({ ok: true, id: entry.id });
    })
  );

  // ── Site Customization (Header, Hero, Banners, Contacts, Partner Logos, Footer) ──
  app.get(
    '/api/site-customization',
    asyncHandler(async (_req, res) => {
      const siteCustomization = await db.getSiteCustomization();
      res.json({ siteCustomization });
    })
  );

  app.put(
    '/api/site-customization',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Super Admin pode alterar as configurações da plataforma.' });
        return;
      }
      const updated = await db.setSiteCustomization(req.body as SiteCustomization);
      const bootstrap = await buildBootstrapPayload(user);
      res.json({
        ok: true,
        ...bootstrap,
        siteCustomization: updated,
      });
    })
  );

  // ── Reviews: List and Create ─────────────────────────────────────────────
  app.get(
    '/api/reviews',
    asyncHandler(async (req, res) => {
      const targetType = req.query.targetType === 'seller' ? 'seller' : 'product';
      const targetId = String(req.query.targetId || '');
      if (!targetId) {
        res.status(400).json({ error: 'targetId é obrigatório.' });
        return;
      }
      const reviews = await db.listReviews(targetType, targetId);
      res.json({ reviews });
    })
  );

  app.post(
    '/api/reviews',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ error: 'Faça login para enviar sua avaliação.' });
        return;
      }
      const { targetType, targetId, rating, comment } = req.body as {
        targetType?: 'seller' | 'product';
        targetId?: string;
        rating?: number;
        comment?: string;
      };

      if (!targetType || !['seller', 'product'].includes(targetType)) {
        res.status(400).json({ error: 'Tipo de avaliação inválido (seller ou product).' });
        return;
      }
      if (!targetId) {
        res.status(400).json({ error: 'Identificador do item/loja é obrigatório.' });
        return;
      }
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        res.status(400).json({ error: 'A nota deve ser entre 1 e 5 estrelas.' });
        return;
      }
      if (!comment || comment.trim().length < 3) {
        res.status(400).json({ error: 'Escreva um comentário com pelo menos 3 caracteres.' });
        return;
      }

      const review: Review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        targetType,
        targetId,
        userId: user.id,
        userName: user.name,
        rating: Math.round(numRating),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      await db.createReview(review);
      const reviews = await db.listReviews(targetType, targetId);
      const bootstrap = await buildBootstrapPayload(user);
      res.json({ ok: true, review, reviews, ...bootstrap });
    })
  );

  // ── S3 Object Storage Uploads & Presigned Asset URLs ─────────────────────
  app.post(
    '/api/uploads',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);

      if (!isS3Configured()) {
        res.status(503).json({
          error:
            'Armazenamento S3 não configurado. Defina AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_ENDPOINT_URL_S3 nas variáveis de ambiente.',
        });
        return;
      }

      const { fileName, contentType, base64Data, folder } = req.body as {
        fileName?: string;
        contentType?: string;
        base64Data?: string;
        folder?: string;
      };

      const validated = validateImageUploadPayload({ fileName, contentType, base64Data });
      if (!validated.ok) {
        res.status(400).json({ error: validated.error });
        return;
      }

      try {
        const key = buildUploadKey(folder || 'products', validated.fileName);
        const uploaded = await uploadObjectToS3({
          key,
          body: validated.buffer,
          contentType: validated.contentType,
        });

        await db.recordUploadedAsset({
          key: uploaded.key,
          bucket: uploaded.bucket,
          ownerUserId: user?.id || 'guest',
          originalName: validated.fileName,
          contentType: validated.contentType,
          sizeBytes: validated.buffer.length,
        });

        res.status(201).json({
          key: uploaded.key,
          bucket: uploaded.bucket,
          url: uploaded.proxyUrl,
          signedUrl: uploaded.signedUrl,
        });
      } catch (err) {
        console.error('[Cellbox S3] Failed uploading asset:', err);
        res.status(502).json({
          error: 'Não foi possível enviar a imagem para o armazenamento S3.',
        });
      }
    })
  );

  app.get(
    '/api/uploads/signed-url',
    asyncHandler(async (req, res) => {
      if (!isS3Configured()) {
        res.status(503).json({ error: 'Armazenamento S3 não configurado.' });
        return;
      }
      const rawKey = typeof req.query.key === 'string' ? req.query.key : '';
      const key = sanitizeStorageKey(rawKey);
      if (!key) {
        res.status(400).json({ error: 'Chave do objeto inválida.' });
        return;
      }
      try {
        const url = await getObjectPresignedUrl(key, 3600);
        res.json({ key, bucket: getS3Bucket(), url, expiresIn: 3600 });
      } catch (err) {
        console.error('[Cellbox S3] Failed generating signed URL:', err);
        res.status(502).json({ error: 'Não foi possível gerar o link do arquivo.' });
      }
    })
  );

  app.get(
    '/api/assets/*',
    asyncHandler(async (req, res) => {
      if (!isS3Configured()) {
        res.status(503).json({ error: 'Armazenamento S3 não configurado.' });
        return;
      }
      const rawKey = decodeURIComponent(req.path.replace(/^\/api\/assets\//, ''));
      const key = sanitizeStorageKey(rawKey);
      if (!key) {
        res.status(400).json({ error: 'Arquivo inválido.' });
        return;
      }
      try {
        const signedUrl = await getObjectPresignedUrl(key, 3600);
        res.redirect(302, signedUrl);
      } catch (err) {
        console.error('[Cellbox S3] Failed resolving asset redirect:', err);
        res.status(404).json({ error: 'Arquivo não encontrado.' });
      }
    })
  );

  app.post(
    '/api/reset-demo',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Apenas Admin pode restaurar os dados da plataforma.' });
        return;
      }
      const seed = createInitialSeed();
      await db.resetDatabaseToSeed(seed);
      const admin = (await db.findUserByEmail('admin@cellbox.co.mz')) ?? seed.users[0];
      const token = createSessionToken(admin.id, SESSION_SECRET);
      setSessionCookie(req, res, token);
      res.json({
        token,
        ...(await buildBootstrapPayload(admin)),
      });
    })
  );

  // Express JSON error boundary for API routes
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      const message = err instanceof Error ? err.message : 'Erro interno ao processar operação no banco de dados.';
      console.error(`[Cellbox API Error] ${req.method} ${req.path}:`, err);
      res.status(500).json({ error: message });
      return;
    }
    next(err);
  });

  return app;
}
