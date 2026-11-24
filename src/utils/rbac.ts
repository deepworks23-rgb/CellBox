import type { AppView, User, UserRole } from '../types.ts';

export function viewToPath(view: AppView): string {
  switch (view.type) {
    case 'home':
      return '/';
    case 'about':
      return '/sobre';
    case 'stores':
      return '/lojas';
    case 'offers':
      return '/ofertas';
    case 'contact':
      return '/contacto';
    case 'product':
      return `/produto/${encodeURIComponent(view.productId)}`;
    case 'store':
      return `/loja/${encodeURIComponent(view.sellerId)}`;
    case 'cart':
      return '/carrinho';
    case 'auth':
      return view.mode === 'register' ? '/cadastro' : '/login';
    case 'forgot_password':
      return '/esqueci-senha';
    case 'reset_password':
      return view.token
        ? `/redefinir-senha?token=${encodeURIComponent(view.token)}`
        : '/redefinir-senha';
    case 'profile': {
      if (view.tab === 'wishlist') return '/minha-conta/desejos';
      if (view.tab === 'addresses') return '/minha-conta/enderecos';
      if (view.tab === 'settings') return '/minha-conta/configuracoes';
      return '/minha-conta';
    }
    case 'seller_dashboard': {
      if (view.tab === 'products') return '/vendedor/produtos';
      if (view.tab === 'orders') return '/vendedor/pedidos';
      if (view.tab === 'settings') return '/vendedor/configuracoes';
      return '/vendedor';
    }
    case 'admin_dashboard': {
      if (view.tab === 'sellers') return '/admin/vendedores';
      if (view.tab === 'catalog') return '/admin/catalogo';
      if (view.tab === 'finance') return '/admin/financeiro';
      return '/admin';
    }
  }
}

export function pathToView(pathname: string, search = ''): AppView {
  let rawPath = pathname;
  let rawSearch = search;
  const queryIdx = pathname.indexOf('?');
  if (queryIdx !== -1) {
    rawPath = pathname.slice(0, queryIdx);
    if (!rawSearch) rawSearch = pathname.slice(queryIdx);
  }

  const clean = rawPath.replace(/\/+$/, '') || '/';

  if (clean === '/') return { type: 'home' };
  if (clean === '/sobre') return { type: 'about' };
  if (clean === '/lojas') return { type: 'stores' };
  if (clean === '/ofertas') return { type: 'offers' };
  if (clean === '/contacto' || clean === '/contato') return { type: 'contact' };
  if (clean === '/carrinho') return { type: 'cart' };
  if (clean === '/login' || clean === '/entrar') return { type: 'auth', mode: 'login' };
  if (clean === '/cadastro' || clean === '/registrar') return { type: 'auth', mode: 'register' };
  if (clean === '/esqueci-senha') return { type: 'forgot_password' };
  if (clean === '/redefinir-senha') {
    const params = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch);
    const token = params.get('token')?.trim() || undefined;
    return { type: 'reset_password', token };
  }

  if (clean.startsWith('/produto/')) {
    const productId = decodeURIComponent(clean.slice('/produto/'.length));
    if (productId) return { type: 'product', productId };
  }

  if (clean.startsWith('/loja/')) {
    const sellerId = decodeURIComponent(clean.slice('/loja/'.length));
    if (sellerId) return { type: 'store', sellerId };
  }

  if (clean === '/minha-conta' || clean.startsWith('/minha-conta/')) {
    const sub = clean.slice('/minha-conta'.length).replace(/^\//, '');
    if (sub === 'desejos') return { type: 'profile', tab: 'wishlist' };
    if (sub === 'enderecos') return { type: 'profile', tab: 'addresses' };
    if (sub === 'configuracoes') return { type: 'profile', tab: 'settings' };
    return { type: 'profile', tab: 'orders' };
  }

  if (clean === '/vendedor' || clean.startsWith('/vendedor/')) {
    const sub = clean.slice('/vendedor'.length).replace(/^\//, '');
    if (sub === 'produtos') return { type: 'seller_dashboard', tab: 'products' };
    if (sub === 'pedidos') return { type: 'seller_dashboard', tab: 'orders' };
    if (sub === 'configuracoes') return { type: 'seller_dashboard', tab: 'settings' };
    return { type: 'seller_dashboard', tab: 'overview' };
  }

  if (clean === '/admin' || clean.startsWith('/admin/')) {
    const sub = clean.slice('/admin'.length).replace(/^\//, '');
    if (sub === 'vendedores') return { type: 'admin_dashboard', tab: 'sellers' };
    if (sub === 'catalogo') return { type: 'admin_dashboard', tab: 'catalog' };
    if (sub === 'financeiro') return { type: 'admin_dashboard', tab: 'finance' };
    return { type: 'admin_dashboard', tab: 'overview' };
  }

  return { type: 'home' };
}

export function getDefaultPanelForRole(role: UserRole | null): AppView {
  if (role === 'admin') return { type: 'admin_dashboard', tab: 'overview' };
  if (role === 'seller') return { type: 'seller_dashboard', tab: 'overview' };
  if (role === 'buyer') return { type: 'profile', tab: 'orders' };
  return { type: 'home' };
}

export function canAccessView(view: AppView, user: Pick<User, 'role'> | null): boolean {
  const role = user?.role ?? null;

  switch (view.type) {
    case 'profile':
      return role === 'buyer';
    case 'seller_dashboard':
      return role === 'seller';
    case 'admin_dashboard':
      return role === 'admin';
    case 'cart':
      return role === null || role === 'buyer';
    case 'auth':
    case 'forgot_password':
      return role === null;
    case 'reset_password':
    case 'home':
    case 'about':
    case 'stores':
    case 'offers':
    case 'contact':
    case 'product':
    case 'store':
      return true;
  }
}

export interface RouteGuardResult {
  view: AppView;
  denied: boolean;
  reason?: string;
}

export function resolveAuthorizedView(
  requested: AppView,
  user: Pick<User, 'role'> | null
): RouteGuardResult {
  if (canAccessView(requested, user)) {
    return { view: requested, denied: false };
  }

  // Authenticated user trying to visit /login, /cadastro, or /esqueci-senha goes quietly to their own panel
  if ((requested.type === 'auth' || requested.type === 'forgot_password') && user) {
    return {
      view: getDefaultPanelForRole(user.role),
      denied: false,
    };
  }

  // Unauthenticated visitor trying to access any protected dashboard/profile
  if (!user) {
    return {
      view: { type: 'auth', mode: 'login' },
      denied: true,
      reason: 'Faça login para acessar esta área.',
    };
  }

  // Strict cross-role isolation
  if (user.role === 'buyer') {
    return {
      view: { type: 'profile', tab: 'orders' },
      denied: true,
      reason: 'Acesso negado. Esta área não está disponível para contas de Comprador.',
    };
  }

  if (user.role === 'seller') {
    return {
      view: { type: 'seller_dashboard', tab: 'overview' },
      denied: true,
      reason: 'Acesso negado. Esta área não está disponível para contas de Vendedor.',
    };
  }

  return {
    view: { type: 'admin_dashboard', tab: 'overview' },
    denied: true,
    reason: 'Acesso negado. Área restrita ao Painel Administrativo.',
  };
}
