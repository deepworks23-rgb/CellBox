import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  ASSET_IMAGES,
  INITIAL_ADDRESSES,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_USERS,
} from './src/data/seedData.ts';
import type {
  Address,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCondition,
  ProductSpecs,
  SellerPayoutInfo,
  SellerStatus,
  SellerStore,
  User,
  UserRole,
} from './src/types.ts';
import {
  calculateCartTotals,
  groupCartBySeller,
  ORDER_STATUS_FLOW,
  validateProductForm,
  validateRegistration,
} from './src/utils/marketplace.ts';
import {
  createSessionToken,
  hashPassword,
  parseCookieHeader,
  verifyPassword,
  verifySessionToken,
} from './src/server/auth.ts';

interface StoredUser extends User {
  passwordHash: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  orders: Order[];
  addressesByUser: Record<string, Address[]>;
  wishlistsByUser: Record<string, string[]>;
  newsletterEmails: string[];
  contactMessages: Array<{
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  }>;
  commissionRate: number;
}

const PORT = 3000;
const SESSION_COOKIE_NAME = 'cellbox_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'cellbox-mz-session-signing-key-2026-v1';
const DATA_DIR = path.resolve(process.cwd(), '.cellbox-data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function createSeedDatabase(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('cellbox123');
  const users: StoredUser[] = INITIAL_USERS.map((u) => ({
    ...u,
    passwordHash: defaultPasswordHash,
  }));

  return {
    users,
    sellers: structuredClone(INITIAL_SELLERS),
    products: structuredClone(INITIAL_PRODUCTS),
    categories: [...INITIAL_CATEGORIES],
    orders: structuredClone(INITIAL_ORDERS),
    addressesByUser: {
      'user-buyer-1': structuredClone(INITIAL_ADDRESSES),
    },
    wishlistsByUser: {
      'user-buyer-1': ['prod-iphone-16-pro', 'prod-macbook-pro-m3'],
    },
    newsletterEmails: [],
    contactMessages: [],
    commissionRate: 10,
  };
}

function loadDatabase(): DatabaseSchema {
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
    console.warn('[Cellbox DB] Failed reading existing database, regenerating seed:', err);
  }

  const seeded = createSeedDatabase();
  saveDatabase(seeded);
  return seeded;
}

function saveDatabase(data: DatabaseSchema): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

let db: DatabaseSchema = loadDatabase();

function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    sellerId: u.sellerId,
    createdAt: u.createdAt,
  };
}

function getAuthenticatedUser(req: Request): StoredUser | null {
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
  return db.users.find((u) => u.id === verified.userId) ?? null;
}

function setSessionCookie(res: Response, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
}

function clearSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function getScopedOrders(user: StoredUser | null): Order[] {
  if (!user) return [];
  if (user.role === 'admin') return db.orders;
  if (user.role === 'seller') {
    const sellerIds = new Set(
      db.sellers
        .filter((s) => s.id === user.sellerId || s.ownerUserId === user.id)
        .map((s) => s.id)
    );
    return db.orders.filter(
      (o) =>
        o.buyerId === user.id || o.fulfillments.some((f) => sellerIds.has(f.sellerId))
    );
  }
  return db.orders.filter((o) => o.buyerId === user.id);
}

function buildBootstrapPayload(user: StoredUser | null) {
  return {
    currentUser: user ? toPublicUser(user) : null,
    users:
      user?.role === 'admin'
        ? db.users.map(toPublicUser)
        : user
          ? [toPublicUser(user)]
          : [],
    sellers: db.sellers,
    products: db.products,
    categories: db.categories,
    orders: getScopedOrders(user),
    addresses: user ? db.addressesByUser[user.id] ?? [] : [],
    wishlist: user ? db.wishlistsByUser[user.id] ?? [] : [],
    commissionRate: db.commissionRate,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // ── Bootstrap & Session ──────────────────────────────────────────────────
  app.get('/api/bootstrap', (req, res) => {
    const user = getAuthenticatedUser(req);
    res.json(buildBootstrapPayload(user));
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthenticatedUser(req);
    res.json({ user: user ? toPublicUser(user) : null });
  });

  // ── Real Authentication Endpoints ────────────────────────────────────────
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const rawPassword = password ?? '';

    if (!normalizedEmail || !rawPassword) {
      res.status(400).json({ error: 'Preencha e-mail e senha para continuar.' });
      return;
    }

    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || !verifyPassword(rawPassword, user.passwordHash)) {
      res.status(401).json({
        error: 'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.',
      });
      return;
    }

    const token = createSessionToken(user.id, SESSION_SECRET);
    setSessionCookie(res, token);
    res.json({
      token,
      ...buildBootstrapPayload(user),
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const body = req.body as {
      name?: string;
      email?: string;
      password?: string;
      isSeller?: boolean;
      storeName?: string;
      documentId?: string;
      mainCategory?: string;
    };

    const errors = validateRegistration({
      name: body.name ?? '',
      email: body.email ?? '',
      password: body.password ?? '',
      isSeller: Boolean(body.isSeller),
      storeName: body.storeName,
      documentId: body.documentId,
      mainCategory: body.mainCategory,
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: Object.values(errors)[0], errors });
      return;
    }

    const emailNorm = body.email!.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === emailNorm)) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado na Cellbox.' });
      return;
    }

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
        email: emailNorm,
        role: 'seller',
        sellerId,
        createdAt: today,
        passwordHash,
      };

      createdSeller = {
        id: sellerId,
        ownerUserId: userId,
        name: storeName,
        slug: storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        documentId: body.documentId!.trim(),
        mainCategory: body.mainCategory!,
        description: `Loja parceira Cellbox especializada em ${body.mainCategory}.`,
        logoText: initials,
        accentColor: '#0475EE',
        bannerImage: ASSET_IMAGES.hero,
        status: 'pending',
        verified: false,
        rating: 5.0,
        reviewCount: 0,
        joinedDate: today,
        tenureLabel: 'Aguardando aprovação',
        location: 'Maputo, Moçambique',
        payoutInfo: {
          bankName: 'Pendente de configuração',
          accountType: 'Conta Empresarial',
          accountNumber: '—',
          pixOrWallet: body.documentId!.trim(),
        },
      };

      db.users.push(createdUser);
      db.sellers.unshift(createdSeller);
    } else {
      createdUser = {
        id: userId,
        name: body.name!.trim(),
        email: emailNorm,
        role: 'buyer',
        createdAt: today,
        passwordHash,
      };
      db.users.push(createdUser);
    }

    db.addressesByUser[userId] = [];
    db.wishlistsByUser[userId] = [];
    saveDatabase(db);

    const token = createSessionToken(createdUser.id, SESSION_SECRET);
    setSessionCookie(res, token);
    res.status(201).json({
      token,
      seller: createdSeller,
      ...buildBootstrapPayload(createdUser),
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({
      ok: true,
      ...buildBootstrapPayload(null),
    });
  });

  app.patch('/api/profile', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Faça login para atualizar seus dados.' });
      return;
    }
    const { name, phone } = req.body as { name?: string; phone?: string };
    if (typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
    }
    if (typeof phone === 'string') {
      user.phone = phone.trim();
    }
    saveDatabase(db);
    res.json({ user: toPublicUser(user) });
  });

  app.post('/api/auth/change-password', (req, res) => {
    const user = getAuthenticatedUser(req);
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
    user.passwordHash = hashPassword(newPassword);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // ── Addresses (Buyer Only) ───────────────────────────────────────────────
  app.post('/api/addresses', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Faça login para salvar endereços.' });
      return;
    }
    if (user.role !== 'buyer') {
      res.status(403).json({ error: 'Apenas contas de Comprador podem gerir endereços de entrega.' });
      return;
    }
    const body = req.body as Omit<Address, 'id'>;
    if (!body.label?.trim() || !body.street?.trim() || !body.city?.trim() || !body.zipCode?.trim()) {
      res.status(400).json({ error: 'Preencha todos os campos obrigatórios do endereço.' });
      return;
    }

    const existing = db.addressesByUser[user.id] ?? [];
    const shouldBeDefault = Boolean(body.isDefault) || existing.length === 0;
    const created: Address = {
      id: `addr-${Date.now()}`,
      label: body.label.trim(),
      recipient: (body.recipient ?? user.name).trim() || user.name,
      street: body.street.trim(),
      city: body.city.trim(),
      state: (body.state ?? 'Maputo').trim() || 'Maputo',
      zipCode: body.zipCode.trim(),
      isDefault: shouldBeDefault,
    };

    const nextList = shouldBeDefault
      ? [created, ...existing.map((a) => ({ ...a, isDefault: false }))]
      : [...existing, created];

    db.addressesByUser[user.id] = nextList;
    saveDatabase(db);
    res.status(201).json({ address: created, addresses: nextList });
  });

  app.patch('/api/addresses/:id/default', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }
    const existing = db.addressesByUser[user.id] ?? [];
    const targetId = req.params.id;
    if (!existing.some((a) => a.id === targetId)) {
      res.status(404).json({ error: 'Endereço não encontrado.' });
      return;
    }
    const nextList = existing.map((a) => ({ ...a, isDefault: a.id === targetId }));
    db.addressesByUser[user.id] = nextList;
    saveDatabase(db);
    res.json({ addresses: nextList });
  });

  app.delete('/api/addresses/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }
    const existing = db.addressesByUser[user.id] ?? [];
    const filtered = existing.filter((a) => a.id !== req.params.id);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0] = { ...filtered[0], isDefault: true };
    }
    db.addressesByUser[user.id] = filtered;
    saveDatabase(db);
    res.json({ addresses: filtered });
  });

  // ── Wishlist (Buyer Only) ────────────────────────────────────────────────
  app.post('/api/wishlist/toggle', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Faça login para salvar na lista de desejos.' });
      return;
    }
    if (user.role !== 'buyer') {
      res.status(403).json({ error: 'Apenas contas de Comprador podem usar a lista de desejos.' });
      return;
    }
    const { productId } = req.body as { productId?: string };
    if (!productId) {
      res.status(400).json({ error: 'Produto inválido.' });
      return;
    }
    const current = db.wishlistsByUser[user.id] ?? [];
    const exists = current.includes(productId);
    const next = exists ? current.filter((id) => id !== productId) : [productId, ...current];
    db.wishlistsByUser[user.id] = next;
    saveDatabase(db);
    res.json({ wishlist: next, added: !exists });
  });

  // ── Orders (Buyer Only) ──────────────────────────────────────────────────
  app.post('/api/orders', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Faça login para concluir seu pedido.' });
      return;
    }
    if (user.role !== 'buyer') {
      res.status(403).json({ error: 'Apenas contas de Comprador podem realizar pedidos.' });
      return;
    }

    const { cart, address, paymentMethod } = req.body as {
      cart?: CartItem[];
      address?: Address;
      paymentMethod?: PaymentMethod;
    };

    if (!Array.isArray(cart) || cart.length === 0 || !address || !paymentMethod) {
      res.status(400).json({ error: 'Dados do pedido incompletos.' });
      return;
    }

    const groups = groupCartBySeller(cart, db.products, db.sellers, address.zipCode);
    if (groups.length === 0) {
      res.status(400).json({ error: 'Carrinho vazio ou produtos indisponíveis.' });
      return;
    }

    const totals = calculateCartTotals(groups);
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
      commissionRateSnapshot: db.commissionRate,
      subtotal: totals.subtotal,
      shippingTotal: totals.shippingTotal,
      total: totals.grandTotal,
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

    db.products = db.products.map((p) => {
      const bought = qtyByProduct.get(p.id);
      if (!bought) return p;
      return {
        ...p,
        stock: Math.max(0, p.stock - bought),
        soldCount: p.soldCount + bought,
      };
    });

    db.orders.unshift(newOrder);
    saveDatabase(db);

    res.status(201).json({
      order: newOrder,
      products: db.products,
      orders: getScopedOrders(user),
    });
  });

  app.patch('/api/orders/:orderId/fulfillment', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'seller') {
      res.status(403).json({ error: 'Apenas o Vendedor responsável pode atualizar o envio.' });
      return;
    }

    const { sellerId, nextStatus } = req.body as {
      sellerId?: string;
      nextStatus?: OrderStatus;
    };
    const ownsStore = db.sellers.some(
      (s) => s.id === sellerId && (s.id === user.sellerId || s.ownerUserId === user.id)
    );
    if (!sellerId || !ownsStore) {
      res.status(403).json({ error: 'Sem permissão para alterar pedidos de outra loja.' });
      return;
    }
    if (!nextStatus || !ORDER_STATUS_FLOW.includes(nextStatus)) {
      res.status(400).json({ error: 'Status de envio inválido.' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    db.orders = db.orders.map((order) => {
      if (order.id !== req.params.orderId) return order;
      return {
        ...order,
        fulfillments: order.fulfillments.map((f) =>
          f.sellerId === sellerId ? { ...f, status: nextStatus, updatedAt: today } : f
        ),
      };
    });
    saveDatabase(db);
    res.json({ orders: getScopedOrders(user) });
  });

  // ── Products (Seller Owned + Admin Moderation) ───────────────────────────
  app.post('/api/products', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'seller') {
      res.status(403).json({ error: 'Apenas lojistas autenticados podem cadastrar produtos.' });
      return;
    }

    const ownedSeller = db.sellers.find(
      (s) => s.id === user.sellerId || s.ownerUserId === user.id
    );
    if (!ownedSeller) {
      res.status(403).json({ error: 'Loja do vendedor não encontrada.' });
      return;
    }

    const payload = req.body as {
      sellerId: string;
      title: string;
      brand: string;
      category: string;
      condition: ProductCondition;
      price: number;
      originalPrice?: number;
      stock: number;
      description: string;
      imageUrl: string;
      specs: ProductSpecs;
    };

    const errors = validateProductForm({
      title: payload.title ?? '',
      brand: payload.brand ?? '',
      category: payload.category ?? '',
      condition: payload.condition ?? 'Novo',
      price: Number(payload.price),
      stock: Number(payload.stock),
      description: payload.description ?? '',
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: Object.values(errors)[0], errors });
      return;
    }

    const created: Product = {
      id: `prod-${Date.now()}`,
      sellerId: ownedSeller.id,
      title: payload.title.trim(),
      brand: payload.brand.trim(),
      category: payload.category,
      condition: payload.condition,
      price: Number(payload.price),
      originalPrice: payload.originalPrice ? Number(payload.originalPrice) : undefined,
      stock: Number(payload.stock),
      rating: 5.0,
      reviewCount: 0,
      soldCount: 0,
      images: [payload.imageUrl?.trim() || ASSET_IMAGES.iphone16Pro],
      description: payload.description.trim(),
      specs: payload.specs ?? { warranty: '12 meses' },
      createdAt: new Date().toISOString().slice(0, 10),
    };

    db.products.unshift(created);
    saveDatabase(db);
    res.status(201).json({ product: created, products: db.products });
  });

  app.patch('/api/products/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'seller') {
      res.status(403).json({ error: 'Apenas o Vendedor responsável pode editar o produto.' });
      return;
    }
    const target = db.products.find((p) => p.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    const ownsStore = db.sellers.some(
      (s) => s.id === target.sellerId && (s.id === user.sellerId || s.ownerUserId === user.id)
    );
    if (!ownsStore) {
      res.status(403).json({ error: 'Sem permissão para editar produtos de outra loja.' });
      return;
    }
    const updates = req.body as Partial<Product>;
    db.products = db.products.map((p) =>
      p.id === req.params.id ? { ...p, ...updates, id: p.id, sellerId: p.sellerId } : p
    );
    saveDatabase(db);
    res.json({ products: db.products });
  });

  app.delete('/api/products/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      res.status(403).json({ error: 'Sem permissão para remover produto.' });
      return;
    }
    const target = db.products.find((p) => p.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    if (user.role === 'seller') {
      const ownsStore = db.sellers.some(
        (s) => s.id === target.sellerId && (s.id === user.sellerId || s.ownerUserId === user.id)
      );
      if (!ownsStore) {
        res.status(403).json({ error: 'Sem permissão para remover produtos de outra loja.' });
        return;
      }
    }
    db.products = db.products.filter((p) => p.id !== req.params.id);
    for (const uid of Object.keys(db.wishlistsByUser)) {
      db.wishlistsByUser[uid] = db.wishlistsByUser[uid].filter((id) => id !== req.params.id);
    }
    saveDatabase(db);
    res.json({ products: db.products });
  });

  // ── Sellers & Admin ──────────────────────────────────────────────────────
  app.patch('/api/sellers/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'seller') {
      res.status(403).json({ error: 'Apenas o Vendedor proprietário pode atualizar a loja.' });
      return;
    }
    const ownsStore = db.sellers.some(
      (s) => s.id === req.params.id && (s.id === user.sellerId || s.ownerUserId === user.id)
    );
    if (!ownsStore) {
      res.status(403).json({ error: 'Sem permissão para alterar outra loja.' });
      return;
    }
    const updates = req.body as {
      name: string;
      description: string;
      logoText: string;
      accentColor: string;
      location: string;
      bannerImage: string;
      payoutInfo: SellerPayoutInfo;
    };
    db.sellers = db.sellers.map((s) => (s.id === req.params.id ? { ...s, ...updates } : s));
    saveDatabase(db);
    res.json({ sellers: db.sellers });
  });

  app.patch('/api/sellers/:id/status', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Apenas Super Admin pode alterar status de vendedores.' });
      return;
    }
    const { status } = req.body as { status?: SellerStatus };
    if (!status || !['active', 'pending', 'suspended'].includes(status)) {
      res.status(400).json({ error: 'Status inválido.' });
      return;
    }

    db.sellers = db.sellers.map((s) =>
      s.id === req.params.id
        ? {
            ...s,
            status,
            verified: status === 'active' ? true : s.verified,
            tenureLabel:
              status === 'active' && s.tenureLabel === 'Aguardando aprovação'
                ? 'Nova loja verificada'
                : s.tenureLabel,
          }
        : s
    );
    saveDatabase(db);
    res.json({ sellers: db.sellers });
  });

  app.post('/api/categories', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Apenas Super Admin pode criar categorias.' });
      return;
    }
    const trimmed = ((req.body as { name?: string }).name ?? '').trim();
    if (!trimmed) {
      res.status(400).json({ error: 'Informe o nome da categoria.' });
      return;
    }
    if (db.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      res.status(409).json({ error: 'Esta categoria já existe.' });
      return;
    }
    db.categories.push(trimmed);
    saveDatabase(db);
    res.status(201).json({ categories: db.categories });
  });

  app.delete('/api/categories/:name', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Apenas Super Admin pode remover categorias.' });
      return;
    }
    const target = decodeURIComponent(req.params.name);
    db.categories = db.categories.filter((c) => c !== target);
    saveDatabase(db);
    res.json({ categories: db.categories });
  });

  app.patch('/api/commission', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Apenas Super Admin pode alterar comissão.' });
      return;
    }
    const rate = Number((req.body as { rate?: number }).rate);
    if (!Number.isFinite(rate)) {
      res.status(400).json({ error: 'Taxa inválida.' });
      return;
    }
    db.commissionRate = Math.max(1, Math.min(35, Number(rate.toFixed(1))));
    saveDatabase(db);
    res.json({ commissionRate: db.commissionRate });
  });

  app.post('/api/newsletter', (req, res) => {
    const email = ((req.body as { email?: string }).email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Digite um e-mail válido.' });
      return;
    }
    if (!db.newsletterEmails.includes(email)) {
      db.newsletterEmails.push(email);
      saveDatabase(db);
    }
    res.status(201).json({ ok: true, email });
  });

  app.post('/api/contact', (req, res) => {
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
    db.contactMessages.unshift(entry);
    saveDatabase(db);
    res.status(201).json({ ok: true, id: entry.id });
  });

  app.post('/api/reset-demo', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Apenas Admin pode restaurar os dados da plataforma.' });
      return;
    }
    db = createSeedDatabase();
    saveDatabase(db);
    const admin = db.users.find((u) => u.role === 'admin')!;
    const token = createSessionToken(admin.id, SESSION_SECRET);
    setSessionCookie(res, token);
    res.json({
      token,
      ...buildBootstrapPayload(admin),
    });
  });

  // ── Vite Dev Middleware / Production Static Serving ──────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cellbox server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
