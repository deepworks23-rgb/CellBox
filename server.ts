import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  ACTIVE_COUPONS,
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
} from './src/types.ts';
import {
  calculateCartTotals,
  calculateCouponDiscount,
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
import * as db from './src/lib/db.ts';
import type { SeedPayload, StoredUser } from './src/lib/db.ts';
import {
  buildUploadKey,
  getObjectPresignedUrl,
  getS3Bucket,
  isS3Configured,
  sanitizeStorageKey,
  uploadObjectToS3,
  validateImageUploadPayload,
} from './src/server/storage.ts';

const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE_NAME = 'cellbox_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'cellbox-mz-session-signing-key-2026-v1';

function createInitialSeed(): SeedPayload {
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
    commissionRate: 10,
  };
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
    createdAt: u.createdAt,
  };
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

async function buildBootstrapPayload(user: StoredUser | null) {
  const [sellers, products, categories, orders, commissionRate, addresses, wishlist, allUsers] =
    await Promise.all([
      db.listSellers(),
      db.listProducts(),
      db.listCategories(),
      db.listScopedOrders(user),
      db.getCommissionRate(),
      user ? db.listAddressesByUser(user.id) : Promise.resolve([]),
      user ? db.listWishlistByUser(user.id) : Promise.resolve([]),
      user?.role === 'admin' ? db.listUsers() : Promise.resolve([]),
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
  };
}

async function startServer() {
  await db.initDatabase(createInitialSeed);

  const app = express();
  app.use(express.json({ limit: '10mb' }));

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
      const { email, password } = req.body as { email?: string; password?: string };
      const normalizedEmail = (email ?? '').trim().toLowerCase();
      const rawPassword = password ?? '';

      if (!normalizedEmail || !rawPassword) {
        res.status(400).json({ error: 'Preencha e-mail e senha para continuar.' });
        return;
      }

      const user = await db.findUserByEmail(normalizedEmail);
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
        ...(await buildBootstrapPayload(user)),
      });
    })
  );

  app.post(
    '/api/auth/register',
    asyncHandler(async (req, res) => {
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
      const existing = await db.findUserByEmail(emailNorm);
      if (existing) {
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
      } else {
        createdUser = {
          id: userId,
          name: body.name!.trim(),
          email: emailNorm,
          role: 'buyer',
          createdAt: today,
          passwordHash,
        };
      }

      await db.createUserAccount(createdUser, createdSeller);

      const token = createSessionToken(createdUser.id, SESSION_SECRET);
      setSessionCookie(res, token);
      res.status(201).json({
        token,
        seller: createdSeller,
        ...(await buildBootstrapPayload(createdUser)),
      });
    })
  );

  app.post(
    '/api/auth/logout',
    asyncHandler(async (_req, res) => {
      clearSessionCookie(res);
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
      const { name, phone } = req.body as { name?: string; phone?: string };
      const updated = await db.updateUserProfile(user.id, { name, phone });
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

      const created = await db.createProduct({
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
      });

      const products = await db.listProducts();
      res.status(201).json({ product: created, products });
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
      if (!body.label?.trim() || !body.street?.trim() || !body.city?.trim() || !body.zipCode?.trim()) {
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
      if (!user || user.role !== 'seller') {
        res.status(403).json({ error: 'Apenas o Vendedor proprietário pode atualizar a loja.' });
        return;
      }
      const ownsStore = await db.doesUserOwnSeller(req.params.id, user.id, user.sellerId);
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

  // ── S3 Object Storage Uploads & Presigned Asset URLs ─────────────────────
  app.post(
    '/api/uploads',
    asyncHandler(async (req, res) => {
      const user = await getAuthenticatedUser(req);
      if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
        res.status(403).json({ error: 'Apenas vendedores ou administradores podem enviar imagens.' });
        return;
      }

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
          ownerUserId: user.id,
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
      setSessionCookie(res, token);
      res.json({
        token,
        ...(await buildBootstrapPayload(admin)),
      });
    })
  );

  // Express JSON error boundary for API routes
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error(`[Cellbox API Error] ${req.method} ${req.path}:`, err);
      res.status(500).json({ error: 'Erro interno ao processar operação no banco de dados.' });
      return;
    }
    next(err);
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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cellbox server listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await db.closeDatabasePool();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

startServer().catch((err) => {
  console.error('[Cellbox] Failed to start server:', err);
  process.exit(1);
});
