import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ASSET_IMAGES,
  INITIAL_ADDRESSES,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_USERS,
} from '../data/seedData';
import type {
  Address,
  AppView,
  CartItem,
  CatalogFilters,
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
} from '../types';
import { groupCartBySeller, calculateCartTotals } from '../utils/marketplace';

const STORAGE_KEY = 'cellbox_marketplace_state_v2_mzn';

interface PersistedState {
  users: User[];
  currentUserId: string;
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  orders: Order[];
  cart: CartItem[];
  wishlist: string[];
  addresses: Address[];
  commissionRate: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warning';
}

interface NewProductPayload {
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
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  isSeller: boolean;
  storeName?: string;
  documentId?: string;
  mainCategory?: string;
}

interface MarketplaceContextValue {
  view: AppView;
  navigate: (next: AppView) => void;
  users: User[];
  currentUser: User;
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  orders: Order[];
  cart: CartItem[];
  cartCount: number;
  wishlist: string[];
  compareIds: string[];
  compareOpen: boolean;
  setCompareOpen: (open: boolean) => void;
  addresses: Address[];
  commissionRate: number;
  filters: CatalogFilters;
  setFilters: React.Dispatch<React.SetStateAction<CatalogFilters>>;
  resetFilters: () => void;
  toast: ToastMessage | null;
  showToast: (message: string, tone?: ToastMessage['tone']) => void;
  // Auth & RBAC
  switchDemoRole: (role: UserRole) => void;
  loginWithEmail: (email: string) => { ok: boolean; error?: string };
  registerUser: (payload: RegisterPayload) => { ok: boolean; error?: string };
  updateProfile: (updates: { name: string; phone: string }) => void;
  // Cart, Wishlist, Compare
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  // Addresses & Orders
  addAddress: (addr: Omit<Address, 'id'>) => Address;
  removeAddress: (id: string) => void;
  placeOrder: (address: Address, paymentMethod: PaymentMethod) => Order | null;
  updateOrderFulfillmentStatus: (orderId: string, sellerId: string, nextStatus: OrderStatus) => void;
  // Seller actions
  createProduct: (payload: NewProductPayload) => Product;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  updateSellerSettings: (
    sellerId: string,
    updates: {
      name: string;
      description: string;
      logoText: string;
      accentColor: string;
      location: string;
      bannerImage: string;
      payoutInfo: SellerPayoutInfo;
    }
  ) => void;
  // Admin actions
  setSellerStatus: (sellerId: string, status: SellerStatus) => void;
  addCategory: (name: string) => boolean;
  removeCategory: (name: string) => void;
  setCommissionRate: (rate: number) => void;
  resetDemoData: () => void;
}

const DEFAULT_FILTERS: CatalogFilters = {
  search: '',
  category: 'Todas',
  condition: 'all',
  brand: 'Todas',
  minPrice: null,
  maxPrice: null,
  sortBy: 'featured',
};

function loadInitialState(): PersistedState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        if (
          Array.isArray(parsed.products) &&
          Array.isArray(parsed.sellers) &&
          Array.isArray(parsed.users) &&
          parsed.currentUserId
        ) {
          return {
            users: parsed.users,
            currentUserId: parsed.currentUserId,
            sellers: parsed.sellers,
            products: parsed.products,
            categories: parsed.categories ?? INITIAL_CATEGORIES,
            orders: parsed.orders ?? INITIAL_ORDERS,
            cart: parsed.cart ?? [],
            wishlist: parsed.wishlist ?? ['prod-iphone-16-pro', 'prod-macbook-pro-m3'],
            addresses: parsed.addresses ?? INITIAL_ADDRESSES,
            commissionRate: typeof parsed.commissionRate === 'number' ? parsed.commissionRate : 10,
          };
        }
      }
    } catch {
      // Fallback to seed data on corrupt storage
    }
  }

  return {
    users: INITIAL_USERS,
    currentUserId: 'user-buyer-1',
    sellers: INITIAL_SELLERS,
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    orders: INITIAL_ORDERS,
    cart: [],
    wishlist: ['prod-iphone-16-pro', 'prod-macbook-pro-m3'],
    addresses: INITIAL_ADDRESSES,
    commissionRate: 10,
  };
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [view, setView] = useState<AppView>({ type: 'home' });
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const showToast = (message: string, tone: ToastMessage['tone'] = 'success') => {
    const id = Date.now();
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  };

  const navigate = (next: AppView) => {
    setView(next);
    window.scrollTo(0, 0);
  };

  const currentUser = useMemo(() => {
    return state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];
  }, [state.users, state.currentUserId]);

  const cartCount = useMemo(() => {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [state.cart]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const switchDemoRole = (role: UserRole) => {
    let targetUser: User | undefined;
    if (role === 'buyer') {
      targetUser = state.users.find((u) => u.id === 'user-buyer-1') ?? state.users.find((u) => u.role === 'buyer');
    } else if (role === 'seller') {
      targetUser =
        state.users.find((u) => u.id === 'user-seller-techzone') ?? state.users.find((u) => u.role === 'seller');
    } else {
      targetUser = state.users.find((u) => u.role === 'admin');
    }

    if (!targetUser) return;

    setState((prev) => ({ ...prev, currentUserId: targetUser!.id }));

    if (role === 'buyer') {
      navigate({ type: 'home' });
      showToast(`Modo Comprador ativo (${targetUser.name})`, 'info');
    } else if (role === 'seller') {
      navigate({ type: 'seller_dashboard', tab: 'overview' });
      showToast(`Painel do Vendedor ativo (TechZone Store)`, 'info');
    } else {
      navigate({ type: 'admin_dashboard', tab: 'overview' });
      showToast(`Painel Super Admin Cellbox ativo`, 'info');
    }
  };

  const loginWithEmail = (email: string): { ok: boolean; error?: string } => {
    const normalized = email.trim().toLowerCase();
    const user = state.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
      return {
        ok: false,
        error: 'E-mail não encontrado. Utilize uma conta cadastrada ou um perfil de acesso rápido abaixo.',
      };
    }
    setState((prev) => ({ ...prev, currentUserId: user.id }));
    if (user.role === 'admin') {
      navigate({ type: 'admin_dashboard', tab: 'overview' });
    } else if (user.role === 'seller') {
      navigate({ type: 'seller_dashboard', tab: 'overview' });
    } else {
      navigate({ type: 'home' });
    }
    showToast(`Bem-vindo(a), ${user.name}!`);
    return { ok: true };
  };

  const registerUser = (payload: RegisterPayload): { ok: boolean; error?: string } => {
    const emailNorm = payload.email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === emailNorm)) {
      return { ok: false, error: 'Este e-mail já está cadastrado na Cellbox.' };
    }

    const userId = `user-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    if (payload.isSeller) {
      const sellerId = `seller-${Date.now()}`;
      const storeName = payload.storeName!.trim();
      const initials = storeName
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2) || 'CB';

      const newUser: User = {
        id: userId,
        name: payload.name.trim(),
        email: emailNorm,
        role: 'seller',
        sellerId,
        createdAt: today,
      };

      const newSeller: SellerStore = {
        id: sellerId,
        ownerUserId: userId,
        name: storeName,
        slug: storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        documentId: payload.documentId!.trim(),
        mainCategory: payload.mainCategory!,
        description: `Loja parceira Cellbox especializada em ${payload.mainCategory}.`,
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
          pixOrWallet: payload.documentId!.trim(),
        },
      };

      setState((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        sellers: [newSeller, ...prev.sellers],
        currentUserId: userId,
      }));
      navigate({ type: 'seller_dashboard', tab: 'overview' });
      showToast(`Loja "${storeName}" cadastrada com status Pendente de Aprovação.`, 'warning');
      return { ok: true };
    }

    const newBuyer: User = {
      id: userId,
      name: payload.name.trim(),
      email: emailNorm,
      role: 'buyer',
      createdAt: today,
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newBuyer],
      currentUserId: userId,
    }));
    navigate({ type: 'home' });
    showToast(`Conta criada com sucesso! Boas compras, ${newBuyer.name}.`);
    return { ok: true };
  };

  const updateProfile = (updates: { name: string; phone: string }) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === prev.currentUserId
          ? { ...u, name: updates.name.trim() || u.name, phone: updates.phone.trim() }
          : u
      ),
    }));
    showToast('Dados da conta atualizados.');
  };

  const addToCart = (productId: string, quantity = 1) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;

    setState((prev) => {
      const existing = prev.cart.find((item) => item.productId === productId);
      const nextCart = existing
        ? prev.cart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
              : item
          )
        : [...prev.cart, { productId, quantity: Math.min(product.stock, quantity) }];
      return { ...prev, cart: nextCart };
    });
    showToast(`"${product.title}" adicionado ao carrinho.`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    setState((prev) => ({
      ...prev,
      cart:
        quantity <= 0
          ? prev.cart.filter((i) => i.productId !== productId)
          : prev.cart.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(product.stock, quantity) }
                : i
            ),
    }));
  };

  const removeFromCart = (productId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((i) => i.productId !== productId),
    }));
  };

  const clearCart = () => setState((prev) => ({ ...prev, cart: [] }));

  const toggleWishlist = (productId: string) => {
    const exists = state.wishlist.includes(productId);
    setState((prev) => ({
      ...prev,
      wishlist: exists
        ? prev.wishlist.filter((id) => id !== productId)
        : [productId, ...prev.wishlist],
    }));
    showToast(exists ? 'Removido da lista de desejos.' : 'Salvo na lista de desejos.', 'info');
  };

  const toggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        showToast('Você pode comparar até 3 produtos simultaneamente.', 'warning');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const clearCompare = () => setCompareIds([]);

  const addAddress = (addr: Omit<Address, 'id'>): Address => {
    const created: Address = { ...addr, id: `addr-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      addresses: addr.isDefault
        ? [created, ...prev.addresses.map((a) => ({ ...a, isDefault: false }))]
        : [...prev.addresses, created],
    }));
    showToast('Endereço salvo com sucesso.');
    return created;
  };

  const removeAddress = (id: string) => {
    setState((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((a) => a.id !== id),
    }));
    showToast('Endereço removido.', 'info');
  };

  const placeOrder = (address: Address, paymentMethod: PaymentMethod): Order | null => {
    const groups = groupCartBySeller(state.cart, state.products, state.sellers, address.zipCode);
    if (groups.length === 0) return null;

    const totals = calculateCartTotals(groups);
    const nowDate = new Date().toISOString().slice(0, 10);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `CBX-2026-${randomCode}`;

    const newOrder: Order = {
      id: orderId,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      buyerEmail: currentUser.email,
      createdAt: nowDate,
      shippingAddress: address,
      paymentMethod,
      commissionRateSnapshot: state.commissionRate,
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

    // Decrement stock and increment soldCount
    const qtyByProduct = new Map<string, number>();
    for (const item of state.cart) {
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
    }

    setState((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      cart: [],
      products: prev.products.map((p) => {
        const bought = qtyByProduct.get(p.id);
        if (!bought) return p;
        return {
          ...p,
          stock: Math.max(0, p.stock - bought),
          soldCount: p.soldCount + bought,
        };
      }),
    }));

    showToast(`Pedido ${orderId} confirmado com sucesso!`);
    return newOrder;
  };

  const updateOrderFulfillmentStatus = (
    orderId: string,
    sellerId: string,
    nextStatus: OrderStatus
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          fulfillments: order.fulfillments.map((f) =>
            f.sellerId === sellerId ? { ...f, status: nextStatus, updatedAt: today } : f
          ),
        };
      }),
    }));
    showToast(`Status do pedido ${orderId} atualizado para "${nextStatus}".`);
  };

  const createProduct = (payload: NewProductPayload): Product => {
    const created: Product = {
      id: `prod-${Date.now()}`,
      sellerId: payload.sellerId,
      title: payload.title.trim(),
      brand: payload.brand.trim(),
      category: payload.category,
      condition: payload.condition,
      price: payload.price,
      originalPrice: payload.originalPrice,
      stock: payload.stock,
      rating: 5.0,
      reviewCount: 0,
      soldCount: 0,
      images: [payload.imageUrl.trim() || ASSET_IMAGES.iphone16Pro],
      description: payload.description.trim(),
      specs: payload.specs,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setState((prev) => ({
      ...prev,
      products: [created, ...prev.products],
    }));
    showToast(`Produto "${created.title}" publicado no catálogo!`);
    return created;
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
    }));
    showToast('Produto atualizado.');
  };

  const deleteProduct = (productId: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
      cart: prev.cart.filter((i) => i.productId !== productId),
      wishlist: prev.wishlist.filter((id) => id !== productId),
    }));
    showToast('Produto removido do catálogo.', 'info');
  };

  const updateSellerSettings: MarketplaceContextValue['updateSellerSettings'] = (
    sellerId,
    updates
  ) => {
    setState((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) => (s.id === sellerId ? { ...s, ...updates } : s)),
    }));
    showToast('Configurações da loja salvas com sucesso.');
  };

  const setSellerStatus = (sellerId: string, status: SellerStatus) => {
    const seller = state.sellers.find((s) => s.id === sellerId);
    setState((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) =>
        s.id === sellerId
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
      ),
    }));
    if (seller) {
      const msg =
        status === 'active'
          ? `Loja "${seller.name}" aprovada! Seus produtos já estão visíveis na vitrine.`
          : status === 'suspended'
            ? `Loja "${seller.name}" suspensa. Seus anúncios foram ocultados da vitrine.`
            : `Status de "${seller.name}" alterado para Pendente.`;
      showToast(msg, status === 'active' ? 'success' : 'warning');
    }
  };

  const addCategory = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (state.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, trimmed],
    }));
    showToast(`Categoria "${trimmed}" adicionada.`);
    return true;
  };

  const removeCategory = (name: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== name),
    }));
    showToast(`Categoria "${name}" removida.`, 'info');
  };

  const setCommissionRate = (rate: number) => {
    const clamped = Math.max(1, Math.min(35, Number(rate.toFixed(1))));
    setState((prev) => ({ ...prev, commissionRate: clamped }));
    showToast(`Taxa de comissão padrão atualizada para ${clamped}%.`);
  };

  const resetDemoData = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState({
      users: INITIAL_USERS,
      currentUserId: 'user-buyer-1',
      sellers: INITIAL_SELLERS,
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      orders: INITIAL_ORDERS,
      cart: [],
      wishlist: ['prod-iphone-16-pro', 'prod-macbook-pro-m3'],
      addresses: INITIAL_ADDRESSES,
      commissionRate: 10,
    });
    setFilters(DEFAULT_FILTERS);
    setCompareIds([]);
    navigate({ type: 'home' });
    showToast('Dados de demonstração restaurados.', 'info');
  };

  return (
    <MarketplaceContext.Provider
      value={{
        view,
        navigate,
        users: state.users,
        currentUser,
        sellers: state.sellers,
        products: state.products,
        categories: state.categories,
        orders: state.orders,
        cart: state.cart,
        cartCount,
        wishlist: state.wishlist,
        compareIds,
        compareOpen,
        setCompareOpen,
        addresses: state.addresses,
        commissionRate: state.commissionRate,
        filters,
        setFilters,
        resetFilters,
        toast,
        showToast,
        switchDemoRole,
        loginWithEmail,
        registerUser,
        updateProfile,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        toggleCompare,
        clearCompare,
        addAddress,
        removeAddress,
        placeOrder,
        updateOrderFulfillmentStatus,
        createProduct,
        updateProduct,
        deleteProduct,
        updateSellerSettings,
        setSellerStatus,
        addCategory,
        removeCategory,
        setCommissionRate,
        resetDemoData,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) {
    throw new Error('useMarketplace must be used inside MarketplaceProvider');
  }
  return ctx;
}
