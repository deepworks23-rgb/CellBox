import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  LogIn,
  Mail,
  Menu,
  Package,
  Phone,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { calculateCartTotals, formatCurrency, groupCartBySeller } from '../utils/marketplace';
import { ProductImage } from './ProductImage';

export function Navbar() {
  const {
    view,
    navigate,
    currentUser,
    sellers,
    products,
    categories,
    cart,
    cartCount,
    compareIds,
    setCompareOpen,
    filters,
    setFilters,
    switchDemoRole,
  } = useMarketplace();

  const [searchFocused, setSearchFocused] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const activeSellerIds = useMemo(
    () => new Set(sellers.filter((s) => s.status === 'active').map((s) => s.id)),
    [sellers]
  );

  const cartTotal = useMemo(() => {
    const groups = groupCartBySeller(cart, products, sellers);
    return calculateCartTotals(groups).subtotal;
  }, [cart, products, sellers]);

  const suggestions = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          activeSellerIds.has(p.sellerId) &&
          (filters.category === 'Todas' || p.category === filters.category) &&
          (p.title.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [filters.search, filters.category, products, activeSellerIds]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    if (view.type !== 'home') {
      navigate({ type: 'home' });
    }
    window.setTimeout(() => {
      document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleCategorySelect = (cat: string) => {
    setFilters((prev) => ({ ...prev, category: cat }));
    setCatDropdownOpen(false);
    if (view.type !== 'home') {
      navigate({ type: 'home' });
    }
    window.setTimeout(() => {
      document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const roleLabel =
    currentUser.role === 'admin'
      ? 'Super Admin'
      : currentUser.role === 'seller'
        ? 'Vendedor'
        : 'Comprador';

  return (
    <header className="w-full bg-white z-40">
      {/* 1. Top Slim Utility Bar (#EFEFEF) — Exact Reference Match */}
      <div className="bg-[#EFEFEF] border-b border-[#E3E3E3] text-[11px] text-[#666666]">
        <div className="max-w-[1170px] mx-auto px-4 h-9 flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#E67E22]" />
              <span>E-mail: suporte@cellbox.com</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#E67E22]" />
              <span>Atendimento: +55 (11) 4004-2026</span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
            {/* Compare quick pill if active */}
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                aria-label={`Abrir comparador com ${compareIds.length} itens`}
                className="h-6 px-2.5 bg-white border border-[#DCDCDC] rounded-xs text-[11px] font-medium text-[#43AA5B] hover:border-[#43AA5B] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Scale className="w-3 h-3" />
                <span>Comparar ({compareIds.length})</span>
              </button>
            )}

            {/* Account & RBAC Switcher Dropdown */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((o) => !o)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                aria-label="Menu de conta e perfis de acesso"
                className="h-6 px-2.5 bg-white border border-[#DCDCDC] rounded-xs text-[11px] font-medium text-[#444444] hover:border-[#43AA5B] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <User className="w-3 h-3 text-[#43AA5B]" />
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
                <span className="text-[#888888]">· {roleLabel}</span>
                <ChevronDown className="w-3 h-3 text-[#888888]" />
              </button>

              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1.5 w-72 bg-white text-[#333333] rounded-md border border-[#E0E0E0] shadow-xl py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-[#EFEFEF]">
                    <p className="text-xs font-bold text-[#222222] truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-[#777777] truncate">
                      {currentUser.email} · {roleLabel}
                    </p>
                  </div>

                  <div className="py-1 border-b border-[#EFEFEF]">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate({ type: 'profile', tab: 'orders' });
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F5F9F6] hover:text-[#43AA5B] text-left cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-[#888888]" />
                      Minha Conta e Pedidos
                    </button>
                    {currentUser.role === 'seller' && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate({ type: 'seller_dashboard', tab: 'overview' });
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#2F8E47] hover:bg-[#F0FAF2] text-left cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5 text-[#43AA5B]" />
                        Abrir Painel do Vendedor
                      </button>
                    )}
                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate({ type: 'admin_dashboard', tab: 'overview' });
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#2F8E47] hover:bg-[#F0FAF2] text-left cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#43AA5B]" />
                        Abrir Painel Super Admin
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate({ type: 'auth', mode: 'login' });
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F5F9F6] hover:text-[#43AA5B] text-left cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#888888]" />
                      Login / Cadastrar Nova Conta
                    </button>
                  </div>

                  {/* Quick RBAC Role Switcher */}
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-1.5">
                      Alternar Perfil (RBAC)
                    </p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          switchDemoRole('buyer');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                          currentUser.role === 'buyer'
                            ? 'bg-[#EAF7ED] text-[#2F8E47] font-semibold'
                            : 'text-[#555555] hover:bg-[#F7F7F7]'
                        }`}
                      >
                        <span>Comprador (Cliente)</span>
                        <span className="text-[10px] text-[#888888]">Vitrine</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          switchDemoRole('seller');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                          currentUser.role === 'seller'
                            ? 'bg-[#EAF7ED] text-[#2F8E47] font-semibold'
                            : 'text-[#555555] hover:bg-[#F7F7F7]'
                        }`}
                      >
                        <span>Vendedor (TechZone Store)</span>
                        <span className="text-[10px] text-[#888888]">Painel Loja</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          switchDemoRole('admin');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer ${
                          currentUser.role === 'admin'
                            ? 'bg-[#EAF7ED] text-[#2F8E47] font-semibold'
                            : 'text-[#555555] hover:bg-[#F7F7F7]'
                        }`}
                      >
                        <span>Super Admin (Cellbox)</span>
                        <span className="text-[10px] text-[#888888]">Gestão Master</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <span className="hidden md:inline-flex items-center justify-center h-6 px-2 bg-white border border-[#DCDCDC] rounded-xs text-[10px] font-semibold text-[#555555]">
              BRL
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main White Header Row (Logo · Clean Uppercase Nav · Shopping Cart) */}
      <div className="bg-white">
        <div className="max-w-[1170px] mx-auto px-4 h-[74px] flex items-center justify-between gap-4">
          {/* Geometric Green Cube Logo + CELLBOX Wordmark (Exact Digimart Aesthetic) */}
          <button
            type="button"
            onClick={() => {
              setFilters((prev) => ({ ...prev, category: 'Todas', search: '' }));
              navigate({ type: 'home' });
            }}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <path
                d="M18 2L32 10V26L18 34L4 26V10L18 2Z"
                stroke="#43AA5B"
                strokeWidth="3"
                fill="none"
              />
              <path d="M18 2L32 10L18 18L4 10L18 2Z" fill="#58B96F" fillOpacity="0.28" />
              <path d="M18 18V34M18 18L32 10M18 18L4 10" stroke="#2F8E47" strokeWidth="2.4" />
              <polygon points="18,11 24,14.5 18,18 12,14.5" fill="#43AA5B" />
            </svg>
            <span className="text-[26px] font-extrabold tracking-tight leading-none font-condensed uppercase">
              <span className="text-[#2F8E47]">CELL</span>
              <span className="text-[#58B96F] font-semibold">BOX</span>
            </span>
          </button>

          {/* Center Clean Uppercase Navigation Links */}
          <nav
            aria-label="Navegação principal"
            className="hidden lg:flex items-center gap-7 text-[12px] font-semibold uppercase tracking-wide text-[#555555]"
          >
            <button
              type="button"
              onClick={() => {
                setFilters((prev) => ({ ...prev, category: 'Todas' }));
                navigate({ type: 'home' });
              }}
              className={`hover:text-[#43AA5B] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'home' ? 'text-[#43AA5B]' : ''
              }`}
            >
              Início
            </button>
            <button
              type="button"
              onClick={() => {
                navigate({ type: 'home' });
                window.setTimeout(() => {
                  document.getElementById('lojas-oficiais')?.scrollIntoView({ behavior: 'smooth' });
                }, 60);
              }}
              className="hover:text-[#43AA5B] transition-colors whitespace-nowrap cursor-pointer"
            >
              Lojas Oficiais
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters((prev) => ({ ...prev, sortBy: 'price_asc' }));
                navigate({ type: 'home' });
                window.setTimeout(() => {
                  document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                }, 60);
              }}
              className="hover:text-[#43AA5B] transition-colors whitespace-nowrap cursor-pointer"
            >
              Ofertas
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole('seller')}
              className={`hover:text-[#43AA5B] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'seller_dashboard' ? 'text-[#43AA5B]' : ''
              }`}
            >
              Painel Vendedor
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole('admin')}
              className={`hover:text-[#43AA5B] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'admin_dashboard' ? 'text-[#43AA5B]' : ''
              }`}
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'auth', mode: 'register' })}
              className={`hover:text-[#43AA5B] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'auth' ? 'text-[#43AA5B]' : ''
              }`}
            >
              Venda Aqui
            </button>
          </nav>

          {/* Right: Shopping Cart Summary (Exact Digimart Icon + Badge + Total) */}
          <button
            type="button"
            onClick={() => navigate({ type: 'cart' })}
            aria-label={`Abrir carrinho (${cartCount} itens)`}
            className="flex items-center gap-2.5 group cursor-pointer shrink-0"
          >
            <div className="relative">
              <ShoppingBag className="w-7 h-7 text-[#444444] group-hover:text-[#43AA5B] transition-colors stroke-[1.6]" />
              <span
                data-testid="cart-count-badge"
                className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#43AA5B] text-white text-[10px] font-bold font-mono tabular-nums inline-flex items-center justify-center"
              >
                {cartCount}
              </span>
            </div>
            <div className="text-left leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#555555]">
                Meu Carrinho
              </p>
              <p className="text-[13px] font-bold font-mono tabular-nums text-[#43AA5B]">
                {formatCurrency(cartTotal)}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Full-Width Signature Green Bar (#43AA5B) with Shop by Category + Integrated White Search */}
      <div className="bg-[#43AA5B] sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1170px] mx-auto px-4 min-h-[48px] py-1.5 sm:py-0 flex items-center gap-3 sm:gap-4">
          {/* Dark Green Shop By Category Dropdown */}
          <div ref={catRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setCatDropdownOpen((v) => !v)}
              aria-expanded={catDropdownOpen}
              aria-haspopup="menu"
              className="h-[48px] -my-1.5 sm:my-0 px-3 sm:px-5 sm:w-[240px] bg-[#2F8E47] hover:bg-[#277A3C] text-white text-[12px] font-bold uppercase tracking-wide inline-flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-2.5">
                <Menu className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Categorias</span>
                <span className="sm:hidden">Menu</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>

            {catDropdownOpen && (
              <div
                role="menu"
                className="absolute left-0 top-[48px] w-60 bg-white border border-[#E0E0E0] shadow-xl py-1.5 z-50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleCategorySelect('Todas')}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    filters.category === 'Todas'
                      ? 'bg-[#EAF7ED] text-[#2F8E47] font-bold'
                      : 'text-[#444444] hover:bg-[#F5F9F6] hover:text-[#43AA5B]'
                  }`}
                >
                  Todos os Produtos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="menuitem"
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      filters.category === cat
                        ? 'bg-[#EAF7ED] text-[#2F8E47] font-bold'
                        : 'text-[#444444] hover:bg-[#F5F9F6] hover:text-[#43AA5B]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <div className="border-t border-[#EFEFEF] mt-1 pt-1 lg:hidden">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCatDropdownOpen(false);
                      switchDemoRole('seller');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#2F8E47] hover:bg-[#F5F9F6]"
                  >
                    Painel do Vendedor
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCatDropdownOpen(false);
                      switchDemoRole('admin');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#2F8E47] hover:bg-[#F5F9F6]"
                  >
                    Painel Super Admin
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Crisp White Search Bar with Category Selector + Green Search Button */}
          <div ref={searchRef} className="relative flex-1 min-w-0">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center h-[36px] bg-white rounded-xs overflow-hidden shadow-2xs"
            >
              <label htmlFor="header-cat-select" className="sr-only">
                Categoria da busca
              </label>
              <select
                id="header-cat-select"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="hidden md:block h-full pl-3 pr-2 text-[11px] font-medium text-[#666666] bg-[#FAFAFA] border-r border-[#E6E6E6] focus:outline-none cursor-pointer"
              >
                <option value="Todas">Todas Categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <label htmlFor="cellbox-global-search" className="sr-only">
                Buscar smartphones, laptops, acessórios ou lojas
              </label>
              <input
                id="cellbox-global-search"
                type="search"
                value={filters.search}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value }));
                  setSearchFocused(true);
                }}
                placeholder="Buscar iPhone 16, MacBook M3, Galaxy S24, carregador GaN..."
                className="flex-1 min-w-0 h-full px-3 text-xs text-[#333333] placeholder:text-[#999999] focus:outline-none"
              />

              {filters.search && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="px-2 text-[#999999] hover:text-[#333333] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                aria-label="Pesquisar produtos"
                className="w-11 h-full bg-[#58B96F] hover:bg-[#2F8E47] text-white inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {searchFocused && filters.search.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-[40px] bg-white text-[#333333] border border-[#E0E0E0] shadow-xl overflow-hidden z-50">
                {suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#777777]">
                    Nenhum produto encontrado para "{filters.search}".
                  </div>
                ) : (
                  <ul className="divide-y divide-[#F0F0F0]">
                    {suggestions.map((product) => {
                      const seller = sellers.find((s) => s.id === product.sellerId);
                      return (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              navigate({ type: 'product', productId: product.id });
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5F9F6] text-left transition-colors cursor-pointer"
                          >
                            <div className="w-10 h-8 bg-[#F8F8F8] overflow-hidden shrink-0">
                              <ProductImage
                                src={product.images[0]}
                                alt={product.title}
                                category={product.category}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#333333] truncate">
                                {product.title}
                              </p>
                              <p className="text-[11px] text-[#888888] truncate">
                                {product.category} · {seller?.name}
                              </p>
                            </div>
                            <span className="text-xs font-bold font-mono tabular-nums text-[#43AA5B] whitespace-nowrap">
                              {formatCurrency(product.price)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
