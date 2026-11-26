import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Address,
  AppView,
  CartItem,
  CatalogFilters,
  Coupon,
  Order,
  OrderStatus,
  PaymentMethod,
  PayoutMethod,
  Product,
  ProductCondition,
  ProductSpecs,
  Review,
  SellerActivationStatus,
  SellerKycInfo,
  SellerPayoutInfo,
  SellerPayoutRequest,
  SellerSocials,
  SellerStatus,
  SellerStore,
  SiteCustomization,
  User,
} from '../types';
import { DEFAULT_SITE_CUSTOMIZATION } from '../data/defaultCustomization';
import {
  getDefaultPanelForRole,
  pathToView,
  resolveAuthorizedView,
  viewToPath,
} from '../utils/rbac';

let inMemoryAuthToken: string | null = null;

function getStoredToken(): string | null {
  return inMemoryAuthToken;
}

function setStoredToken(token: string | null) {
  inMemoryAuthToken = token;
}

interface MarketplaceState {
  users: User[];
  currentUser: User | null;
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  orders: Order[];
  cart: CartItem[];
  wishlist: string[];
  addresses: Address[];
  commissionRate: number;
  siteCustomization: SiteCustomization;
  payouts: SellerPayoutRequest[];
}

interface BootstrapResponse {
  currentUser: User | null;
  users: User[];
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  orders: Order[];
  addresses: Address[];
  wishlist: string[];
  commissionRate: number;
  siteCustomization?: SiteCustomization;
  payouts?: SellerPayoutRequest[];
  token?: string;
  seller?: SellerStore;
}

export interface ToastMessage {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warning';
}

export interface NewProductPayload {
  sellerId: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string;
  condition: ProductCondition;
  price: number;
  originalPrice?: number;
  stock: number;
  description: string;
  imageUrl?: string;
  images?: string[];
  specs?: Record<string, string>;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  province?: string;
  city?: string;
  neighborhood?: string;
  zipCode?: string;
  avatarUrl?: string;
  isSeller: boolean;
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
}

interface MarketplaceContextValue {
  view: AppView;
  navigate: (next: AppView) => void;
  authReady: boolean;
  users: User[];
  currentUser: User | null;
  sellers: SellerStore[];
  products: Product[];
  categories: string[];
  coupons: Coupon[];
  appliedCouponCode: string | null;
  applyCoupon: (code: string) => { ok: boolean; error?: string };
  removeCoupon: () => void;
  orders: Order[];
  cart: CartItem[];
  cartCount: number;
  wishlist: string[];
  compareIds: string[];
  compareOpen: boolean;
  setCompareOpen: (open: boolean) => void;
  addresses: Address[];
  commissionRate: number;
  payouts: SellerPayoutRequest[];
  siteCustomization: SiteCustomization;
  updateSiteCustomization: (customization: SiteCustomization) => Promise<boolean>;
  filters: CatalogFilters;
  setFilters: React.Dispatch<React.SetStateAction<CatalogFilters>>;
  resetFilters: () => void;
  toast: ToastMessage | null;
  showToast: (message: string, tone?: ToastMessage['tone']) => void;
  // Real Auth & RBAC
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  registerUser: (payload: RegisterPayload) => Promise<{ ok: boolean; error?: string }>;
  submitSellerKyc: (sellerId: string, kyc: SellerKycInfo) => Promise<boolean>;
  paySellerActivationFee: (
    sellerId: string,
    data: { method: 'mpesa' | 'emola'; phone: string; transactionId: string; proofUrl?: string }
  ) => Promise<boolean>;
  reviewSellerKyc: (sellerId: string, action: 'approve' | 'reject', reason?: string) => Promise<boolean>;
  reviewSellerFee: (sellerId: string, action: 'approve' | 'reject', reason?: string) => Promise<boolean>;
  submitReview: (
    targetType: 'seller' | 'product',
    targetId: string,
    rating: number,
    comment: string
  ) => Promise<boolean>;
  fetchReviews: (
    targetType: 'seller' | 'product',
    targetId: string
  ) => Promise<Review[]>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    name: string;
    phone: string;
    avatarUrl?: string;
    province?: string;
    city?: string;
    neighborhood?: string;
    zipCode?: string;
  }) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  verifyResetToken: (
    token: string
  ) => Promise<{ valid: boolean; emailMasked?: string; error?: string }>;
  confirmPasswordReset: (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  // Cart, Wishlist, Compare
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  // Addresses & Orders
  addAddress: (addr: Omit<Address, 'id'>) => Promise<Address | null>;
  setDefaultAddress: (id: string) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  placeOrder: (
    address: Address,
    paymentMethod: PaymentMethod,
    couponCode?: string | null
  ) => Promise<Order | null>;
  updateOrderFulfillmentStatus: (
    orderId: string,
    sellerId: string,
    nextStatus: OrderStatus
  ) => Promise<void>;
  // Seller actions
  createProduct: (payload: NewProductPayload) => Promise<Product | null>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateSellerSettings: (
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
      theme?: import('../types').SellerStoreTheme;
      payoutInfo: SellerPayoutInfo;
    }
  ) => Promise<void>;
  importProductsFromCsv: (
    items: Array<any>
  ) => Promise<{ ok: boolean; count?: number; error?: string }>;
  uploadImageAsset: (
    file: File,
    folder?: 'products' | 'banners' | 'avatars' | 'logos' | 'kyc' | string
  ) => Promise<{ ok: boolean; url?: string; error?: string }>;
  // Admin actions
  setSellerStatus: (sellerId: string, status: SellerStatus) => Promise<void>;
  addCategory: (name: string) => Promise<boolean>;
  removeCategory: (name: string) => Promise<void>;
  setCommissionRate: (rate: number) => Promise<void>;
  subscribeNewsletter: (email: string) => Promise<{ ok: boolean; error?: string }>;
  sendContactMessage: (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  requestSellerPayout: (payload: {
    amount: number;
    method: PayoutMethod;
    accountHolder: string;
    walletPhone?: string;
    bankName?: string;
    accountType?: string;
    accountNumber?: string;
    sellerNotes?: string;
    savePayoutInfo?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  reviewSellerPayout: (
    payoutId: string,
    payload: {
      action: 'approve' | 'reject';
      transactionRef?: string;
      proofUrl?: string;
      adminNotes?: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
}

const ACTIVE_COUPONS: Coupon[] = [];

const DEFAULT_FILTERS: CatalogFilters = {
  search: '',
  category: 'Todas',
  condition: 'all',
  brand: 'Todas',
  minPrice: null,
  maxPrice: null,
  sortBy: 'featured',
};

function readStoredCart(): CartItem[] {
  return [];
}

function readGuestWishlist(): string[] {
  return [];
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketplaceState>(() => ({
    users: [],
    currentUser: null,
    sellers: [],
    products: [],
    categories: [],
    orders: [],
    cart: typeof window !== 'undefined' ? readStoredCart() : [],
    wishlist: typeof window !== 'undefined' ? readGuestWishlist() : [],
    addresses: [],
    commissionRate: 10,
    siteCustomization: DEFAULT_SITE_CUSTOMIZATION,
    payouts: [],
  }));

  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<AppView>(() =>
    typeof window !== 'undefined'
      ? pathToView(window.location.pathname, window.location.search)
      : { type: 'home' }
  );
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, tone: ToastMessage['tone'] = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  }, []);

  const syncBrowserUrl = useCallback((target: AppView, replace = false) => {
    if (typeof window === 'undefined') return;
    const nextPath = viewToPath(target);
    const currentFull = `${window.location.pathname}${window.location.search}`;
    if (currentFull !== nextPath) {
      if (replace) {
        window.history.replaceState(null, '', nextPath);
      } else {
        window.history.pushState(null, '', nextPath);
      }
    }
  }, []);

  const applyBootstrap = useCallback((payload: BootstrapResponse) => {
    if (payload.token) {
      setStoredToken(payload.token);
    } else if (!payload.currentUser) {
      setStoredToken(null);
    }
    setState((prev) => ({
      ...prev,
      currentUser: payload.currentUser,
      users: Array.isArray(payload.users) && payload.users.length > 0 ? payload.users : prev.users,
      sellers: Array.isArray(payload.sellers) && payload.sellers.length > 0 ? payload.sellers : prev.sellers,
      products: Array.isArray(payload.products) && payload.products.length > 0 ? payload.products : prev.products,
      categories: Array.isArray(payload.categories) && payload.categories.length > 0 ? payload.categories : prev.categories,
      orders: Array.isArray(payload.orders) ? payload.orders : prev.orders,
      addresses: Array.isArray(payload.addresses) ? payload.addresses : prev.addresses,
      wishlist: payload.currentUser?.role === 'buyer' ? payload.wishlist : readGuestWishlist(),
      commissionRate: typeof payload.commissionRate === 'number' ? payload.commissionRate : prev.commissionRate,
      siteCustomization: payload.siteCustomization ?? prev.siteCustomization ?? DEFAULT_SITE_CUSTOMIZATION,
      payouts: !payload.currentUser
        ? []
        : Array.isArray(payload.payouts)
          ? payload.payouts
          : prev.payouts,
    }));
  }, []);

  // Hydrate live marketplace state & real session from Express backend on mount (no demo auto-login)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let res = await apiRequest<BootstrapResponse>('/api/bootstrap');
        if (!res.ok && active) {
          // Single retry handles Neon scale-to-zero cold-start wake-up gracefully
          await new Promise((resolve) => window.setTimeout(resolve, 800));
          res = await apiRequest<BootstrapResponse>('/api/bootstrap');
        }
        if (!active) return;
        if (res.ok && Array.isArray(res.data.products)) {
          applyBootstrap(res.data);
        } else {
          console.error(
            `[Cellbox] /api/bootstrap failed (${res.status}):`,
            res.data.error ?? 'Resposta inválida da API.'
          );
        }
      } catch (err) {
        console.error('[Cellbox] Failed to bootstrap from server:', err);
      } finally {
        if (active) setAuthReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyBootstrap]);

  // Enforce strict RBAC route protection once authReady settles or user role changes
  useEffect(() => {
    if (!authReady) return;
    const resolved = resolveAuthorizedView(view, state.currentUser);
    if (resolved.denied || resolved.view.type !== view.type) {
      setView(resolved.view);
      syncBrowserUrl(resolved.view, true);
      if (resolved.denied && resolved.reason) {
        showToast(resolved.reason, 'warning');
      }
    }
  }, [authReady, state.currentUser, view, syncBrowserUrl, showToast]);

  // Guard browser back/forward navigation against unauthorized URLs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      const requested = pathToView(window.location.pathname, window.location.search);
      const resolved = resolveAuthorizedView(requested, state.currentUser);
      setView(resolved.view);
      if (resolved.denied) {
        syncBrowserUrl(resolved.view, true);
        if (resolved.reason) showToast(resolved.reason, 'warning');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [state.currentUser, syncBrowserUrl, showToast]);

  // In-memory cart during session
  useEffect(() => {
    // Pure in-memory session cart; no localStorage
  }, [state.cart]);

  const navigate = useCallback(
    (next: AppView) => {
      const resolved = resolveAuthorizedView(next, state.currentUser);
      setView(resolved.view);
      syncBrowserUrl(resolved.view, resolved.denied);
      if (resolved.denied && resolved.reason) {
        showToast(resolved.reason, 'warning');
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [state.currentUser, syncBrowserUrl, showToast]
  );

  const cartCount = useMemo(() => {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [state.cart]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  // ── Real Auth & RBAC ──────────────────────────────────────────────────────
  const login = async (
    identifier: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiRequest<BootstrapResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: res.data.error ?? 'Número de telefone ou senha inválidos.',
      };
    }

    applyBootstrap(res.data);
    const user = res.data.currentUser;
    const destination = getDefaultPanelForRole(user?.role ?? null);
    setView(destination);
    syncBrowserUrl(destination, false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    showToast(`Bem-vindo(a), ${user?.name ?? ''}!`);
    return { ok: true };
  };

  const registerUser = async (
    payload: RegisterPayload
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiRequest<BootstrapResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: res.data.error ?? 'Não foi possível concluir o cadastro.',
      };
    }

    applyBootstrap(res.data);
    const destination = getDefaultPanelForRole(res.data.currentUser?.role ?? null);
    setView(destination);
    syncBrowserUrl(destination, false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (payload.isSeller) {
      showToast(
        `Loja "${payload.storeName}" cadastrada com sucesso! Conclua a ativação no seu painel.`,
        'info'
      );
    } else {
      showToast(`Conta criada com sucesso! Boas compras, ${res.data.currentUser?.name}.`);
    }
    return { ok: true };
  };

  const submitSellerKyc = async (
    sellerId: string,
    kyc: SellerKycInfo
  ): Promise<boolean> => {
    const res = await apiRequest<BootstrapResponse>('/api/seller/kyc', {
      method: 'POST',
      body: JSON.stringify(kyc),
    });
    if (res.ok) {
      applyBootstrap(res.data);
      showToast('Documentos KYC submetidos! Aguarde a verificação da equipa CellBox.', 'success');
      return true;
    }
    showToast(res.data.error ?? 'Falha ao enviar documentos KYC.', 'warning');
    return false;
  };

  const paySellerActivationFee = async (
    sellerId: string,
    data: { method: 'mpesa' | 'emola'; phone: string; transactionId: string; proofUrl?: string }
  ): Promise<boolean> => {
    const res = await apiRequest<BootstrapResponse>('/api/seller/activate-fee', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.ok) {
      applyBootstrap(res.data);
      showToast('Transação de 100 MT submetida! Aguarde a conferência financeira da CellBox.', 'success');
      return true;
    }
    showToast(res.data.error ?? 'Falha ao submeter taxa.', 'warning');
    return false;
  };

  const reviewSellerKyc = async (
    sellerId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<boolean> => {
    const res = await apiRequest<{ sellers: SellerStore[] }>(`/api/sellers/${encodeURIComponent(sellerId)}/kyc`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    });
    if (res.ok && Array.isArray(res.data.sellers)) {
      setState((prev) => ({ ...prev, sellers: res.data.sellers }));
      showToast(action === 'approve' ? 'Documento KYC aprovado com sucesso!' : 'Documento KYC rejeitado.', 'success');
      return true;
    }
    showToast(res.data.error ?? 'Falha ao avaliar KYC.', 'warning');
    return false;
  };

  const reviewSellerFee = async (
    sellerId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<boolean> => {
    const res = await apiRequest<{ sellers: SellerStore[] }>(`/api/sellers/${encodeURIComponent(sellerId)}/fee`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    });
    if (res.ok && Array.isArray(res.data.sellers)) {
      setState((prev) => ({ ...prev, sellers: res.data.sellers }));
      showToast(action === 'approve' ? 'Pagamento de 100 MT confirmado com sucesso!' : 'Pagamento rejeitado.', 'success');
      return true;
    }
    showToast(res.data.error ?? 'Falha ao avaliar taxa.', 'warning');
    return false;
  };

  const fetchReviews = useCallback(
    async (targetType: 'seller' | 'product', targetId: string): Promise<Review[]> => {
      try {
        const res = await apiRequest<{ reviews?: Review[] }>(
          `/api/reviews?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
        );
        if (res.ok && Array.isArray(res.data.reviews)) {
          return res.data.reviews;
        }
      } catch (err) {
        console.error('Failed fetching reviews:', err);
      }
      return [];
    },
    []
  );

  const submitReview = useCallback(
    async (
      targetType: 'seller' | 'product',
      targetId: string,
      rating: number,
      comment: string
    ): Promise<boolean> => {
      const res = await apiRequest<BootstrapResponse & { ok?: boolean }>(
        '/api/reviews',
        {
          method: 'POST',
          body: JSON.stringify({ targetType, targetId, rating, comment }),
        }
      );
      if (res.ok) {
        applyBootstrap(res.data);
        showToast('Avaliação enviada com sucesso! Obrigado pelo feedback.', 'success');
        return true;
      }
      showToast(res.data.error ?? 'Falha ao enviar avaliação.', 'warning');
      return false;
    },
    [showToast]
  );

  const updateSiteCustomization = useCallback(
    async (customization: SiteCustomization): Promise<boolean> => {
      const res = await apiRequest<BootstrapResponse & { ok?: boolean }>(
        '/api/site-customization',
        {
          method: 'PUT',
          body: JSON.stringify(customization),
        }
      );
      if (res.ok) {
        applyBootstrap(res.data);
        showToast('Personalização da loja salva com sucesso!', 'success');
        return true;
      }
      showToast(res.data.error ?? 'Falha ao salvar personalização.', 'warning');
      return false;
    },
    [applyBootstrap, showToast]
  );

  const logout = async () => {
    setStoredToken(null);
    const res = await apiRequest<BootstrapResponse>('/api/auth/logout', {
      method: 'POST',
    });
    if (res.ok) {
      applyBootstrap(res.data);
    } else {
      setState((prev) => ({
        ...prev,
        currentUser: null,
        orders: [],
        addresses: [],
        wishlist: readGuestWishlist(),
      }));
    }
    setView({ type: 'home' });
    syncBrowserUrl({ type: 'home' }, false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const updateProfile = async (updates: {
    name: string;
    phone: string;
    avatarUrl?: string;
    province?: string;
    city?: string;
    neighborhood?: string;
    zipCode?: string;
  }): Promise<boolean> => {
    const res = await apiRequest<{ user: User }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      showToast(res.data.error ?? 'Erro ao atualizar perfil.', 'warning');
      return false;
    }
    setState((prev) => ({
      ...prev,
      currentUser: res.data.user,
      users: prev.users.map((u) => (u.id === res.data.user.id ? res.data.user : u)),
    }));
    showToast('Dados da conta atualizados com sucesso.');
    return true;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiRequest<{ ok: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      return { ok: false, error: res.data.error ?? 'Não foi possível alterar a senha.' };
    }
    showToast('Senha alterada com segurança!');
    return { ok: true };
  };

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ ok: boolean; message?: string; error?: string }> => {
      const res = await apiRequest<{ ok: boolean; message?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        return {
          ok: false,
          error: res.data.error ?? 'Não foi possível processar o pedido de recuperação.',
        };
      }
      return { ok: true, message: res.data.message };
    },
    []
  );

  const verifyResetToken = useCallback(
    async (
      token: string
    ): Promise<{ valid: boolean; emailMasked?: string; error?: string }> => {
      const res = await apiRequest<{ valid: boolean; emailMasked?: string }>(
        `/api/auth/reset-password/verify?token=${encodeURIComponent(token)}`
      );
      if (!res.ok || !res.data.valid) {
        return {
          valid: false,
          error: res.data.error ?? 'Este link de recuperação é inválido, expirou ou já foi utilizado.',
        };
      }
      return { valid: true, emailMasked: res.data.emailMasked };
    },
    []
  );

  const confirmPasswordReset = useCallback(
    async (
      token: string,
      newPassword: string,
      confirmPassword: string
    ): Promise<{ ok: boolean; message?: string; error?: string }> => {
      const res = await apiRequest<{ ok: boolean; message?: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      if (!res.ok) {
        return {
          ok: false,
          error: res.data.error ?? 'Não foi possível redefinir a senha.',
        };
      }
      showToast('Senha redefinida com sucesso! Já pode iniciar sessão.');
      return { ok: true, message: res.data.message };
    },
    [showToast]
  );

  // ── Cart, Wishlist, Compare ───────────────────────────────────────────────
  const addToCart = (productId: string, quantity = 1) => {
    if (state.currentUser && state.currentUser.role !== 'buyer') {
      showToast('Apenas contas de Comprador podem adicionar itens ao carrinho.', 'warning');
      return;
    }
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

  const toggleWishlist = async (productId: string) => {
    if (state.currentUser && state.currentUser.role !== 'buyer') {
      showToast('Apenas contas de Comprador podem usar a lista de desejos.', 'warning');
      return;
    }
    if (!state.currentUser) {
      const exists = state.wishlist.includes(productId);
      const next = exists
        ? state.wishlist.filter((id) => id !== productId)
        : [productId, ...state.wishlist];
      setState((prev) => ({ ...prev, wishlist: next }));
      showToast(exists ? 'Removido da lista de desejos.' : 'Salvo na lista de desejos.', 'info');
      return;
    }

    const res = await apiRequest<{ wishlist: string[]; added: boolean }>('/api/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      setState((prev) => ({ ...prev, wishlist: res.data.wishlist }));
      showToast(
        res.data.added ? 'Salvo na lista de desejos.' : 'Removido da lista de desejos.',
        'info'
      );
    }
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

  const applyCoupon = useCallback(
    (code: string): { ok: boolean; error?: string } => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        return { ok: false, error: 'Digite um código de cupom.' };
      }
      const match = ACTIVE_COUPONS.find((c) => c.active && c.code.toUpperCase() === normalized);
      if (!match) {
        showToast('Cupom inválido ou expirado.', 'warning');
        return { ok: false, error: 'Cupom inválido ou expirado.' };
      }
      setAppliedCouponCode(match.code);
      showToast(`Cupom ${match.code} ativado! O desconto será aplicado no carrinho.`);
      return { ok: true };
    },
    [showToast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCouponCode(null);
    showToast('Cupom removido do carrinho.', 'info');
  }, [showToast]);

  // ── Addresses & Orders ────────────────────────────────────────────────────
  const addAddress = async (addr: Omit<Address, 'id'>): Promise<Address | null> => {
    const res = await apiRequest<{ address: Address; addresses: Address[] }>('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(addr),
    });
    if (!res.ok) {
      showToast(res.data.error ?? 'Erro ao salvar endereço.', 'warning');
      return null;
    }
    setState((prev) => ({ ...prev, addresses: res.data.addresses }));
    showToast('Endereço salvo com sucesso.');
    return res.data.address;
  };

  const setDefaultAddress = async (id: string) => {
    const res = await apiRequest<{ addresses: Address[] }>(`/api/addresses/${id}/default`, {
      method: 'PATCH',
    });
    if (res.ok) {
      setState((prev) => ({ ...prev, addresses: res.data.addresses }));
      showToast('Endereço padrão atualizado.');
    }
  };

  const removeAddress = async (id: string) => {
    const res = await apiRequest<{ addresses: Address[] }>(`/api/addresses/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setState((prev) => ({ ...prev, addresses: res.data.addresses }));
      showToast('Endereço removido.', 'info');
    }
  };

  const placeOrder = async (
    address: Address,
    paymentMethod: PaymentMethod,
    couponCode?: string | null
  ): Promise<Order | null> => {
    const codeToSend = couponCode !== undefined ? couponCode : appliedCouponCode;
    const res = await apiRequest<{ order: Order; products: Product[]; orders: Order[] }>(
      '/api/orders',
      {
        method: 'POST',
        body: JSON.stringify({
          cart: state.cart,
          address,
          paymentMethod,
          couponCode: codeToSend ?? undefined,
        }),
      }
    );
    if (!res.ok) {
      showToast(res.data.error ?? 'Não foi possível concluir o pedido.', 'warning');
      return null;
    }
    setAppliedCouponCode(null);
    setState((prev) => ({
      ...prev,
      orders: res.data.orders,
      products: res.data.products,
      cart: [],
    }));
    showToast(`Pedido ${res.data.order.id} confirmado com sucesso!`);
    return res.data.order;
  };

  const updateOrderFulfillmentStatus = async (
    orderId: string,
    sellerId: string,
    nextStatus: OrderStatus
  ) => {
    const res = await apiRequest<{ orders: Order[] }>(
      `/api/orders/${encodeURIComponent(orderId)}/fulfillment`,
      {
        method: 'PATCH',
        body: JSON.stringify({ sellerId, nextStatus }),
      }
    );
    if (res.ok) {
      setState((prev) => ({ ...prev, orders: res.data.orders }));
      showToast(`Status do pedido ${orderId} atualizado para "${nextStatus}".`);
    } else {
      showToast(res.data.error ?? 'Erro ao atualizar pedido.', 'warning');
    }
  };

  // ── Seller & Admin Actions ────────────────────────────────────────────────
  const createProduct = async (payload: NewProductPayload): Promise<Product | null> => {
    const res = await apiRequest<{ product: Product; products: Product[] }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      showToast(res.data.error ?? 'Erro ao publicar produto.', 'warning');
      return null;
    }
    setState((prev) => ({ ...prev, products: res.data.products }));
    showToast(`Produto "${res.data.product.title}" publicado no catálogo!`);
    return res.data.product;
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    const res = await apiRequest<{ products: Product[] }>(
      `/api/products/${encodeURIComponent(productId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    if (res.ok) {
      setState((prev) => ({ ...prev, products: res.data.products }));
      showToast('Produto atualizado.');
    }
  };

  const deleteProduct = async (productId: string) => {
    const res = await apiRequest<{ products: Product[] }>(
      `/api/products/${encodeURIComponent(productId)}`,
      {
        method: 'DELETE',
      }
    );
    if (res.ok) {
      setState((prev) => ({
        ...prev,
        products: res.data.products,
        cart: prev.cart.filter((i) => i.productId !== productId),
        wishlist: prev.wishlist.filter((id) => id !== productId),
      }));
      showToast('Produto removido do catálogo.', 'info');
    }
  };

  const updateSellerSettings: MarketplaceContextValue['updateSellerSettings'] = async (
    sellerId,
    updates
  ) => {
    const res = await apiRequest<{ sellers: SellerStore[] }>(
      `/api/sellers/${encodeURIComponent(sellerId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    if (res.ok) {
      setState((prev) => ({ ...prev, sellers: res.data.sellers }));
      showToast('Configurações da loja salvas com sucesso.');
    }
  };

  const importProductsFromCsv: MarketplaceContextValue['importProductsFromCsv'] = async (
    items
  ) => {
    const res = await apiRequest<{ count: number; products: Product[] }>('/api/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const err = res.data.error || 'Falha ao importar produtos.';
      showToast(err, 'warning');
      return { ok: false, error: err };
    }
    setState((prev) => ({ ...prev, products: res.data.products }));
    showToast(`${res.data.count} produtos importados com sucesso!`, 'success');
    return { ok: true, count: res.data.count };
  };

  const uploadImageAsset = async (
    file: File,
    folder: 'products' | 'banners' | 'avatars' | 'logos' | 'kyc' | string = 'products'
  ): Promise<{ ok: boolean; url?: string; error?: string }> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
      reader.readAsDataURL(file);
    }).catch(() => '');

    if (!base64Data) {
      const error = 'Não foi possível ler o arquivo selecionado.';
      showToast(error, 'warning');
      return { ok: false, error };
    }

    const res = await apiRequest<{ url: string; key: string; signedUrl: string }>('/api/uploads', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        base64Data,
        folder,
      }),
    });

    if (!res.ok) {
      const error = res.data.error ?? 'Erro ao enviar imagem.';
      showToast(error, 'warning');
      return { ok: false, error };
    }

    showToast('Imagem enviada com sucesso!');
    return { ok: true, url: res.data.url };
  };

  const setSellerStatus = async (sellerId: string, status: SellerStatus) => {
    const seller = state.sellers.find((s) => s.id === sellerId);
    const res = await apiRequest<{ sellers: SellerStore[] }>(
      `/api/sellers/${encodeURIComponent(sellerId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    if (res.ok) {
      setState((prev) => ({ ...prev, sellers: res.data.sellers }));
      if (seller) {
        const msg =
          status === 'active'
            ? `Loja "${seller.name}" aprovada! Seus produtos já estão visíveis na vitrine.`
            : status === 'suspended'
              ? `Loja "${seller.name}" suspensa. Seus anúncios foram ocultados da vitrine.`
              : `Status de "${seller.name}" alterado para Pendente.`;
        showToast(msg, status === 'active' ? 'success' : 'warning');
      }
    }
  };

  const addCategory = async (name: string): Promise<boolean> => {
    const res = await apiRequest<{ categories: string[] }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      showToast(res.data.error ?? 'Erro ao adicionar categoria.', 'warning');
      return false;
    }
    setState((prev) => ({ ...prev, categories: res.data.categories }));
    showToast(`Categoria "${name.trim()}" adicionada.`);
    return true;
  };

  const removeCategory = async (name: string) => {
    const res = await apiRequest<{ categories: string[] }>(
      `/api/categories/${encodeURIComponent(name)}`,
      {
        method: 'DELETE',
      }
    );
    if (res.ok) {
      setState((prev) => ({ ...prev, categories: res.data.categories }));
      showToast(`Categoria "${name}" removida.`, 'info');
    }
  };

  const setCommissionRate = async (rate: number) => {
    const res = await apiRequest<{ commissionRate: number }>('/api/commission', {
      method: 'PATCH',
      body: JSON.stringify({ rate }),
    });
    if (res.ok) {
      setState((prev) => ({ ...prev, commissionRate: res.data.commissionRate }));
      showToast(`Taxa de comissão padrão atualizada para ${res.data.commissionRate}%.`);
    }
  };

  const subscribeNewsletter = async (
    email: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiRequest<{ ok: boolean; email: string }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      return { ok: false, error: res.data.error ?? 'Erro ao assinar newsletter.' };
    }
    showToast(`E-mail ${res.data.email} inscrito com sucesso nas ofertas Cellbox!`);
    return { ok: true };
  };

  const sendContactMessage = async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiRequest<{ ok: boolean; id: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: res.data.error ?? 'Erro ao enviar mensagem.' };
    }
    showToast('Mensagem enviada com sucesso! Nossa equipe responderá em breve.');
    return { ok: true };
  };

  const requestSellerPayout = async (payload: {
    amount: number;
    method: PayoutMethod;
    accountHolder: string;
    walletPhone?: string;
    bankName?: string;
    accountType?: string;
    accountNumber?: string;
    sellerNotes?: string;
    savePayoutInfo?: boolean;
  }): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiRequest<BootstrapResponse>('/api/seller/payouts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: res.data.error ?? 'Não foi possível enviar a solicitação de saque.' };
    }
    applyBootstrap(res.data);
    showToast('Solicitação de saque enviada para o financeiro da Cellbox!');
    return { ok: true };
  };

  const reviewSellerPayout = async (
    payoutId: string,
    payload: {
      action: 'approve' | 'reject';
      transactionRef?: string;
      proofUrl?: string;
      adminNotes?: string;
    }
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await apiRequest<BootstrapResponse>(
      `/api/admin/payouts/${encodeURIComponent(payoutId)}/review`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      return { ok: false, error: res.data.error ?? 'Não foi possível processar o repasse.' };
    }
    applyBootstrap(res.data);
    showToast(
      payload.action === 'approve'
        ? 'Repasse confirmado e registrado com sucesso!'
        : 'Solicitação de saque rejeitada; o valor retornou ao saldo do vendedor.',
      payload.action === 'approve' ? 'success' : 'info'
    );
    return { ok: true };
  };

  return (
    <MarketplaceContext.Provider
      value={{
        view,
        navigate,
        authReady,
        users: state.users,
        currentUser: state.currentUser,
        sellers: state.sellers,
        products: state.products,
        categories: state.categories,
        coupons: ACTIVE_COUPONS,
        appliedCouponCode,
        applyCoupon,
        removeCoupon,
        orders: state.orders,
        cart: state.cart,
        cartCount,
        wishlist: state.wishlist,
        compareIds,
        compareOpen,
        setCompareOpen,
        addresses: state.addresses,
        commissionRate: state.commissionRate,
        payouts: state.payouts,
        siteCustomization: state.siteCustomization,
        updateSiteCustomization,
        filters,
        setFilters,
        resetFilters,
        toast,
        showToast,
        login,
        registerUser,
        submitSellerKyc,
        paySellerActivationFee,
        reviewSellerKyc,
        reviewSellerFee,
        submitReview,
        fetchReviews,
        logout,
        updateProfile,
        changePassword,
        requestPasswordReset,
        verifyResetToken,
        confirmPasswordReset,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        toggleCompare,
        clearCompare,
        addAddress,
        setDefaultAddress,
        removeAddress,
        placeOrder,
        updateOrderFulfillmentStatus,
        createProduct,
        updateProduct,
        deleteProduct,
        updateSellerSettings,
        importProductsFromCsv,
        uploadImageAsset,
        setSellerStatus,
        addCategory,
        removeCategory,
        setCommissionRate,
        subscribeNewsletter,
        sendContactMessage,
        requestSellerPayout,
        reviewSellerPayout,
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
