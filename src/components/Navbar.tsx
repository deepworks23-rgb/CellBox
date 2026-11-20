import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  ChevronDown,
  Heart,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { calculateCartTotals, formatCurrency, groupCartBySeller } from '../utils/marketplace';
import { MotionButton, SPRING_POP, SPRING_SNAPPY } from './MotionPrimitives';
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
    wishlist,
    compareIds,
    setCompareOpen,
    filters,
    setFilters,
    logout,
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

  const goStoresPage = () => {
    setCatDropdownOpen(false);
    navigate({ type: 'stores' });
  };

  const goOffersPage = () => {
    setCatDropdownOpen(false);
    navigate({ type: 'offers' });
  };

  const roleLabel = !currentUser
    ? ''
    : currentUser.role === 'admin'
      ? 'Admin'
      : currentUser.role === 'seller'
        ? 'Vendedor'
        : 'Comprador';

  const canUseCart = !currentUser || currentUser.role === 'buyer';

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-[0_2px_12px_rgba(10,55,104,0.09)]">
      {/* 1. Top Slim Utility Bar (#EFEFEF) */}
      <div className="bg-[#EFEFEF] border-b border-[#E3E3E3] text-[11px] text-[#666666]">
        <div className="max-w-[1170px] mx-auto px-4 h-8 flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#18A3DE]" />
              <span>E-mail: suporte@cellbox.co.mz</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#18A3DE]" />
              <span>Atendimento: +258 84 400 2026</span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
            {/* Compare quick pill if active */}
            {canUseCart && compareIds.length > 0 && (
              <MotionButton
                type="button"
                hoverScale={1.04}
                hoverY={0}
                onClick={() => setCompareOpen(true)}
                aria-label={`Abrir comparador com ${compareIds.length} itens`}
                className="h-6 px-2.5 bg-white border border-[#DCDCDC] rounded-xs text-[11px] font-medium text-[#0475EE] hover:border-[#0475EE] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Scale className="w-3 h-3" />
                <span>Comparar ({compareIds.length})</span>
              </MotionButton>
            )}

            {/* Strictly Role-Isolated Account Control (Zero Demo Role Switchers) */}
            <div ref={menuRef} className="relative">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menu da minha conta"
                  data-testid="account-menu-trigger"
                  className="h-6 px-2.5 bg-white border border-[#DCDCDC] rounded-xs text-[11px] font-medium text-[#444444] hover:border-[#0475EE] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <User className="w-3 h-3 text-[#0475EE]" />
                  <span className="max-w-[125px] truncate">{currentUser.name}</span>
                  <span className="text-[#888888]">· {roleLabel}</span>
                  <ChevronDown className="w-3 h-3 text-[#888888]" />
                </button>
              ) : (
                <MotionButton
                  type="button"
                  hoverScale={1.03}
                  hoverY={0}
                  data-testid="guest-login-btn"
                  onClick={() => navigate({ type: 'auth', mode: 'login' })}
                  className="h-6 px-3 bg-[#0475EE] hover:bg-[#0A3768] text-white rounded-xs text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Entrar / Cadastrar</span>
                </MotionButton>
              )}

              <AnimatePresence>
                {accountMenuOpen && currentUser && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-1.5 w-64 bg-white text-[#333333] rounded-md border border-[#E0E0E0] shadow-xl py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-[#EFEFEF]">
                      <p className="text-xs font-bold text-[#0A3768] truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-[#777777] truncate">
                        {currentUser.email} · {roleLabel}
                      </p>
                    </div>

                    {/* BUYER ONLY MENU */}
                    {currentUser.role === 'buyer' && (
                      <div className="py-1 border-b border-[#EFEFEF]">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'profile', tab: 'orders' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5 text-[#888888]" />
                          Meus Pedidos
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'profile', tab: 'wishlist' });
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Heart className="w-3.5 h-3.5 text-[#888888]" />
                            Lista de Desejos
                          </span>
                          <span className="text-[10px] font-mono text-[#888888]">
                            {wishlist.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'profile', tab: 'addresses' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#888888]" />
                          Endereços Salvos
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'profile', tab: 'settings' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#888888]" />
                          Configurações e Senha
                        </button>
                      </div>
                    )}

                    {/* SELLER ONLY MENU */}
                    {currentUser.role === 'seller' && (
                      <div className="py-1 border-b border-[#EFEFEF]">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'seller_dashboard', tab: 'overview' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#0A3768] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-[#0475EE]" />
                          Painel do Vendedor
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'seller_dashboard', tab: 'products' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <Store className="w-3.5 h-3.5 text-[#888888]" />
                          Meus Produtos
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'seller_dashboard', tab: 'orders' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5 text-[#888888]" />
                          Pedidos da Loja
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'seller_dashboard', tab: 'settings' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE] text-left cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#888888]" />
                          Configurações da Loja
                        </button>
                      </div>
                    )}

                    {/* ADMIN ONLY MENU */}
                    {currentUser.role === 'admin' && (
                      <div className="py-1 border-b border-[#EFEFEF]">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            navigate({ type: 'admin_dashboard', tab: 'overview' });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#0A3768] hover:bg-[#EAF6FC] text-left cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0475EE]" />
                          Painel Administrativo
                        </button>
                      </div>
                    )}

                    <div className="pt-1 px-2">
                      <button
                        type="button"
                        role="menuitem"
                        data-testid="logout-menu-btn"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          void logout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair da Conta
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span
              title="Metical de Moçambique"
              className="hidden md:inline-flex items-center justify-center gap-1 h-6 px-2 bg-white border border-[#DCDCDC] rounded-xs text-[10px] font-bold text-[#0A3768]"
            >
              <span>MZ</span>
              <span className="text-[#CCCCCC]">|</span>
              <span className="text-[#0475EE]">MZN (MT)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main White Header Row (Logo · Strictly 5 Public Nav Links · Role-Appropriate Right Action) */}
      <div className="bg-white">
        <div className="max-w-[1170px] mx-auto px-4 h-[68px] flex items-center justify-between gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING_SNAPPY}
            onClick={() => {
              setFilters((prev) => ({ ...prev, category: 'Todas', search: '' }));
              navigate({ type: 'home' });
            }}
            aria-label="Cellbox — Voltar ao início"
            className="flex items-center shrink-0 cursor-pointer group"
          >
            <img
              src="/assets/aistudio/CellBox_9c0f59ac.png"
              alt="Cellbox"
              className="h-9 sm:h-11 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </motion.button>

          {/* Main Public Navigation — EXCLUSIVELY: Início, Sobre, Lojas, Ofertas, Contacto */}
          <nav
            aria-label="Navegação principal"
            data-testid="main-public-nav"
            className="hidden lg:flex items-center gap-8 text-[12px] font-semibold uppercase tracking-wide text-[#0A3768]/80"
          >
            <button
              type="button"
              onClick={() => {
                setFilters((prev) => ({ ...prev, category: 'Todas' }));
                navigate({ type: 'home' });
              }}
              className={`hover:text-[#0475EE] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'home' ? 'text-[#0475EE] font-bold' : ''
              }`}
            >
              Início
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'about' })}
              className={`hover:text-[#0475EE] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'about' ? 'text-[#0475EE] font-bold' : ''
              }`}
            >
              Sobre
            </button>
            <button
              type="button"
              onClick={goStoresPage}
              className={`hover:text-[#0475EE] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'stores' || view.type === 'store' ? 'text-[#0475EE] font-bold' : ''
              }`}
            >
              Lojas
            </button>
            <button
              type="button"
              onClick={goOffersPage}
              className={`hover:text-[#0475EE] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'offers' ? 'text-[#0475EE] font-bold' : ''
              }`}
            >
              Ofertas
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'contact' })}
              className={`hover:text-[#0475EE] transition-colors whitespace-nowrap cursor-pointer ${
                view.type === 'contact' ? 'text-[#0475EE] font-bold' : ''
              }`}
            >
              Contacto
            </button>
          </nav>

          {/* Right Action: Shopping Cart for Guests/Buyers, Seller Panel Button ONLY for Seller */}
          {canUseCart ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_SNAPPY}
              onClick={() => navigate({ type: 'cart' })}
              aria-label={`Abrir carrinho (${cartCount} itens)`}
              className="flex items-center gap-2.5 group cursor-pointer shrink-0"
            >
              <div className="relative">
                <ShoppingBag className="w-7 h-7 text-[#0A3768] group-hover:text-[#0475EE] transition-colors stroke-[1.6]" />
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.65 }}
                  animate={{ scale: 1 }}
                  transition={SPRING_POP}
                  data-testid="cart-count-badge"
                  className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0475EE] text-white text-[10px] font-bold font-mono tabular-nums inline-flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#555555]">
                  Meu Carrinho
                </p>
                <p className="text-[13px] font-bold font-mono tabular-nums text-[#0475EE]">
                  {formatCurrency(cartTotal)}
                </p>
              </div>
            </motion.button>
          ) : currentUser?.role === 'seller' ? (
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'seller_dashboard', tab: 'overview' })}
              className="h-9 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Store className="w-3.5 h-3.5" />
              Minha Loja
            </MotionButton>
          ) : (
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'admin_dashboard', tab: 'overview' })}
              className="h-9 px-4 rounded-full bg-[#0A3768] hover:bg-[#0475EE] text-white text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel Admin
            </MotionButton>
          )}
        </div>
      </div>

      {/* 3. Full-Width Official Cellbox Cyan-Blue Bar (#18A3DE) */}
      <div className="bg-[#18A3DE]">
        <div className="max-w-[1170px] mx-auto px-4 min-h-[46px] py-1.5 sm:py-0 flex items-center gap-3 sm:gap-4">
          <div ref={catRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setCatDropdownOpen((v) => !v)}
              aria-expanded={catDropdownOpen}
              aria-haspopup="menu"
              className="h-[46px] -my-1.5 sm:my-0 px-3 sm:px-5 sm:w-[240px] bg-[#0A3768] hover:bg-[#082C54] text-white text-[12px] font-bold uppercase tracking-wide inline-flex items-center justify-between gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-2.5">
                <Menu className="w-4 h-4 shrink-0 text-[#1AD6DE]" />
                <span className="hidden sm:inline">Categorias</span>
                <span className="sm:hidden">Menu</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>

            <AnimatePresence>
              {catDropdownOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14 }}
                  className="absolute left-0 top-[46px] w-60 bg-white border border-[#E0E0E0] shadow-xl py-1.5 z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleCategorySelect('Todas')}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      filters.category === 'Todas'
                        ? 'bg-[#EAF6FC] text-[#0A3768] font-bold'
                        : 'text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE]'
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
                          ? 'bg-[#EAF6FC] text-[#0A3768] font-bold'
                          : 'text-[#444444] hover:bg-[#F0F9FD] hover:text-[#0475EE]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {/* Mobile Public Navigation Links (strictly the 5 public links) */}
                  <div className="border-t border-[#EFEFEF] mt-1 pt-1 lg:hidden">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setCatDropdownOpen(false);
                        navigate({ type: 'home' });
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0A3768] hover:bg-[#F0F9FD]"
                    >
                      Início
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setCatDropdownOpen(false);
                        navigate({ type: 'about' });
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0A3768] hover:bg-[#F0F9FD]"
                    >
                      Sobre
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={goStoresPage}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0A3768] hover:bg-[#F0F9FD]"
                    >
                      Lojas
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={goOffersPage}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0A3768] hover:bg-[#F0F9FD]"
                    >
                      Ofertas
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setCatDropdownOpen(false);
                        navigate({ type: 'contact' });
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#0A3768] hover:bg-[#F0F9FD]"
                    >
                      Contacto
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Crisp White Search Bar */}
          <div ref={searchRef} className="relative flex-1 min-w-0">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center h-[35px] bg-white rounded-xs overflow-hidden shadow-2xs"
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

              <motion.button
                type="submit"
                whileTap={{ scale: 0.92 }}
                aria-label="Pesquisar produtos"
                className="w-11 h-full bg-[#0475EE] hover:bg-[#0A3768] text-white inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Instant Search Suggestions Dropdown */}
            <AnimatePresence>
              {searchFocused && filters.search.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="absolute left-0 right-0 top-[39px] bg-white text-[#333333] border border-[#E0E0E0] shadow-xl overflow-hidden z-50"
                >
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
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0F9FD] text-left transition-colors cursor-pointer"
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
                              <span className="text-xs font-bold font-mono tabular-nums text-[#0475EE] whitespace-nowrap">
                                {formatCurrency(product.price)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
