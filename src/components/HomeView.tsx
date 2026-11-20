import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ASSET_IMAGES } from '../data/seedData';
import { filterVisibleProducts } from '../utils/marketplace';
import { ProductCard } from './ProductCard';

const HERO_SLIDES = [
  {
    kicker: 'LANÇAMENTO CELLBOX',
    title: 'OS MELHORES SMARTPHONES E TECH EM 2026',
    subtitle:
      'As melhores ofertas em iPhone 16 Pro, Galaxy S24 Ultra, MacBooks e acessórios de lojas oficiais verificadas.',
    productId: 'prod-iphone-16-pro',
    cta: 'VER OFERTA',
    image: ASSET_IMAGES.iphone16Pro,
    secondaryImage: ASSET_IMAGES.sonyHeadphones,
  },
  {
    kicker: 'ESTAÇÃO PRO',
    title: 'LAPTOPS DE ALTA PERFORMANCE M3 & OLED',
    subtitle:
      'MacBook Pro 14" M3 Pro e Dell XPS 15 OLED com garantia oficial e frete grátis em todo o país.',
    productId: 'prod-macbook-pro-m3',
    cta: 'CONFERIR LAPTOPS',
    image: ASSET_IMAGES.macbookPro,
    secondaryImage: ASSET_IMAGES.dellXps,
  },
  {
    kicker: 'GAMING & ÁUDIO HI-RES',
    title: 'CONSOLES PORTÁTEIS E FONES COM ANC',
    subtitle:
      'Desempenho portátil com ROG Ally X e imersão total com headphones de cancelamento ativo de ruído.',
    productId: 'prod-rog-ally-x',
    cta: 'EXPLORAR GAMING',
    image: ASSET_IMAGES.gamingHandheld,
    secondaryImage: ASSET_IMAGES.ganCharger,
  },
];

const PARTNER_BRANDS = [
  { name: 'Apple', color: '#333333', accent: '#43AA5B', sub: 'Authorized' },
  { name: 'Samsung', color: '#0070B8', accent: '#0098D8', sub: 'Galaxy Pro' },
  { name: 'Dell', color: '#007DB8', accent: '#43AA5B', sub: 'Workstation' },
  { name: 'Sony', color: '#222222', accent: '#E67E22', sub: 'Hi-Res Audio' },
  { name: 'ASUS', color: '#2F8E47', accent: '#43AA5B', sub: 'ROG Gaming' },
  { name: 'Anker', color: '#0098D8', accent: '#2F8E47', sub: 'GaN Power' },
];

export function HomeView() {
  const {
    products,
    sellers,
    categories,
    filters,
    setFilters,
    resetFilters,
    navigate,
  } = useMarketplace();

  const [heroIdx, setHeroIdx] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  const activeSellers = useMemo(
    () => sellers.filter((s) => s.status === 'active'),
    [sellers]
  );

  const filteredProducts = useMemo(
    () => filterVisibleProducts(products, sellers, filters),
    [products, sellers, filters]
  );

  const availableBrands = useMemo(() => {
    const activeIds = new Set(activeSellers.map((s) => s.id));
    const set = new Set(products.filter((p) => activeIds.has(p.sellerId)).map((p) => p.brand));
    return ['Todas', ...Array.from(set).sort()];
  }, [products, activeSellers]);

  const ITEMS_PER_PAGE = 10; // Exact 5 columns x 2 rows grid like the reference!
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePageIdx = Math.min(pageIdx, totalPages - 1);
  const visiblePageProducts = filteredProducts.slice(
    safePageIdx * ITEMS_PER_PAGE,
    safePageIdx * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const activeSlide = HERO_SLIDES[heroIdx] ?? HERO_SLIDES[0];

  const pillCategories = ['Todas', ...categories.slice(0, 5)];

  const hasExtraFilters =
    filters.search.trim().length > 0 ||
    filters.condition !== 'all' ||
    filters.brand !== 'Todas' ||
    filters.minPrice !== null ||
    filters.maxPrice !== null;

  return (
    <main className="bg-white pb-12">
      <div className="max-w-[1170px] mx-auto px-4 pt-3 space-y-8">
        {/* 1. HERO BANNER — Exact Green-to-Lime Gradient Slider */}
        <section
          aria-label="Destaques principais Cellbox"
          className="relative cellbox-hero-gradient overflow-hidden min-h-[300px] sm:min-h-[360px] flex flex-col justify-between"
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 items-center gap-6 px-6 sm:px-12 py-8 sm:py-10">
            {/* Left Copy */}
            <div className="md:col-span-7 text-white z-10 min-w-0">
              <p className="font-condensed text-sm sm:text-base tracking-widest uppercase text-white/90 font-semibold">
                {activeSlide.kicker}
              </p>
              <h1 className="font-condensed text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-[1.05] text-white mt-1.5">
                {activeSlide.title}
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-white/90 max-w-md leading-relaxed">
                {activeSlide.subtitle}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate({ type: 'product', productId: activeSlide.productId })}
                  className="h-9 px-5 rounded-full bg-white text-[#2F8E47] hover:bg-[#F2FAF4] text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer"
                >
                  {activeSlide.cta}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="h-9 px-4 rounded-full border border-white/70 text-white hover:bg-white/15 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer"
                >
                  Explorar Catálogo
                </button>
              </div>
            </div>

            {/* Right Visual Showcase Composition */}
            <div className="md:col-span-5 flex items-center justify-center md:justify-end gap-3 z-10 min-w-0">
              <div className="relative flex items-end gap-3">
                <div className="w-32 sm:w-40 aspect-[4/3] bg-white p-2 rounded-md shadow-xl -rotate-2 hidden sm:block">
                  <img
                    src={activeSlide.secondaryImage}
                    alt="Acessório destaque Cellbox"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xs"
                  />
                </div>
                <div className="w-48 sm:w-56 aspect-[4/3] bg-white p-2.5 rounded-md shadow-2xl rotate-1">
                  <img
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Centered Slider Indicator Dots (Exact Reference Bottom Dots) */}
          <div className="pb-4 flex items-center justify-center gap-2 z-10">
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.title}
                type="button"
                aria-label={`Slide ${idx + 1}: ${s.kicker}`}
                onClick={() => setHeroIdx(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  heroIdx === idx
                    ? 'bg-white ring-2 ring-white/50 scale-110'
                    : 'bg-white/45 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </section>

        {/* 2. DUAL SUB-BANNER ROW — Exact 1/3 Cyan Tablets + 2/3 Green Laptop Sale */}
        <section
          aria-label="Promoções por categoria"
          className="!mt-3 grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          {/* Left 1/3 Banner: NOVOS TABLETS! (Cyan #0098D8) */}
          <div className="md:col-span-4 bg-[#F1F2F4] border border-[#E7E9EC] px-5 py-5 flex items-center justify-between gap-3 overflow-hidden">
            <div className="min-w-0">
              <h2 className="font-condensed text-xl font-bold uppercase text-[#0098D8] leading-tight">
                NOVOS TABLETS!
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">Até 20% OFF em iPad Pro</p>
              <button
                type="button"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, category: 'Tablets' }));
                  setPageIdx(0);
                  document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-3.5 h-7 px-4 rounded-full bg-[#0098D8] hover:bg-[#007EB5] text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
              >
                VER AGORA
              </button>
            </div>
            <div className="w-28 sm:w-32 aspect-[4/3] shrink-0 overflow-hidden rounded-xs bg-white p-1 shadow-xs">
              <img
                src={ASSET_IMAGES.ipadPro}
                alt="iPad Pro M4 em oferta"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right 2/3 Banner: OFERTA LAPTOPS (Green #43AA5B) */}
          <div className="md:col-span-8 bg-[#F1F2F4] border border-[#E7E9EC] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
            <div className="min-w-0 max-w-xs">
              <h2 className="font-condensed text-2xl font-bold uppercase text-[#333333] leading-tight">
                OFERTA LAPTOPS
              </h2>
              <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                Workstations MacBook Pro M3 e Dell XPS OLED com garantia nacional e frete grátis.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, category: 'Laptops' }));
                  setPageIdx(0);
                  document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-3.5 h-8 px-4 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                COMPRAR AGORA
              </button>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <div className="w-36 sm:w-44 aspect-[4/3] bg-white p-1 rounded-xs shadow-xs overflow-hidden">
                <img
                  src={ASSET_IMAGES.macbookPro}
                  alt="MacBook Pro M3"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block w-32 aspect-[4/3] bg-white p-1 rounded-xs shadow-xs overflow-hidden">
                <img
                  src={ASSET_IMAGES.dellXps}
                  alt="Dell XPS 15 OLED"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. NOVIDADES & CATÁLOGO PRINCIPAL — Exact 5-Column Digimart Grid + Pill Category Tabs */}
        <section id="catalogo-principal" aria-labelledby="heading-catalog" className="pt-2">
          {/* Header Row: Green Title Left + Pill Category Filter Tabs & Circular Arrows Right */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5">
            <div className="flex items-baseline gap-3">
              <h2
                id="heading-catalog"
                className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#43AA5B]"
              >
                {filters.search.trim()
                  ? `BUSCA: "${filters.search.trim()}"`
                  : 'NOVIDADES & DESTAQUES'}
              </h2>
              <p className="text-xs text-[#888888] tabular-nums">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {pillCategories.map((cat) => {
                const active = filters.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, category: cat }));
                      setPageIdx(0);
                    }}
                    className={`h-7 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#43AA5B] text-white'
                        : 'bg-[#F2F3F5] text-[#666666] hover:bg-[#E4E7EB] hover:text-[#222222]'
                    }`}
                  >
                    {cat === 'Todas' ? 'Todos' : cat}
                  </button>
                );
              })}

              {/* Retractable Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setFiltersPanelOpen((v) => !v)}
                aria-expanded={filtersPanelOpen}
                className={`h-7 px-3 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  filtersPanelOpen || hasExtraFilters
                    ? 'bg-[#2F8E47] text-white'
                    : 'bg-[#F2F3F5] text-[#555555] hover:bg-[#E4E7EB]'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Filtros</span>
              </button>

              {/* Circular Prev/Next Pager Buttons matching exact reference */}
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  aria-label="Página anterior de produtos"
                  disabled={safePageIdx <= 0}
                  onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                  className="w-7 h-7 rounded-full bg-[#B5C8D4] hover:bg-[#43AA5B] disabled:opacity-45 text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Próxima página de produtos"
                  disabled={safePageIdx >= totalPages - 1}
                  onClick={() => setPageIdx((p) => Math.min(totalPages - 1, p + 1))}
                  className="w-7 h-7 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] disabled:opacity-45 text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Retractable Filter Bar (Condition, Brand, Price Range, Sort) */}
          {filtersPanelOpen && (
            <div className="mb-4 p-4 bg-[#F7F8FA] border border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label htmlFor="flt-cond" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                  Condição
                </label>
                <select
                  id="flt-cond"
                  value={filters.condition}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      condition: e.target.value as typeof filters.condition,
                    }))
                  }
                  className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs text-[#333333]"
                >
                  <option value="all">Todas</option>
                  <option value="Novo">Novo</option>
                  <option value="Recondicionado">Recondicionado</option>
                </select>
              </div>

              <div>
                <label htmlFor="flt-brand" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                  Marca
                </label>
                <select
                  id="flt-brand"
                  value={filters.brand}
                  onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs text-[#333333]"
                >
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flt-min" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                  Preço Mínimo (R$)
                </label>
                <input
                  id="flt-min"
                  type="number"
                  min={0}
                  value={filters.minPrice ?? ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="0"
                  className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs font-mono tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="flt-sort" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                  Ordenar por
                </label>
                <select
                  id="flt-sort"
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as typeof filters.sortBy,
                    }))
                  }
                  className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs text-[#333333]"
                >
                  <option value="featured">Destaques</option>
                  <option value="best_selling">Mais Vendidos</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                  <option value="rating">Melhor Avaliação</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setPageIdx(0);
                  }}
                  className="flex-1 h-9 px-3 bg-white border border-[#CCCCCC] hover:border-[#43AA5B] text-xs font-semibold text-[#555555] cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersPanelOpen(false)}
                  aria-label="Fechar barra de filtros"
                  className="h-9 w-9 bg-white border border-[#CCCCCC] inline-flex items-center justify-center text-[#666666] hover:text-[#222222] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 5-Column Crisp Bordered Grid */}
          {visiblePageProducts.length === 0 ? (
            <div className="border border-[#EAEAEA] py-14 px-6 text-center bg-[#FAFAFA]">
              <p className="text-sm font-bold text-[#333333]">
                Nenhum produto encontrado para os filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setPageIdx(0);
                }}
                className="mt-4 h-9 px-5 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div
              data-testid="catalog-product-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-[#EAEAEA]"
            >
              {visiblePageProducts.map((product) => (
                <ProductCard key={product.id} product={product} tiled />
              ))}
            </div>
          )}
        </section>

        {/* 4. WIDE MID-PAGE PROMO BANNER — Exact Reference "SAVE! UP TO $300" Light Gray Banner */}
        <section
          aria-label="Oferta especial de economia"
          className="bg-[#F1F2F4] border border-[#E7E9EC] px-6 sm:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="max-w-md">
            <h2 className="font-condensed text-2xl sm:text-[28px] font-bold uppercase text-[#0070B8] leading-tight">
              ECONOMIZE ATÉ R$ 1.500!
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#555555] mt-0.5">
              EM SMARTPHONES RECONDICIONADOS A+ E NOTEBOOKS PRO
            </p>
            <p className="text-xs text-[#777777] mt-2 leading-relaxed">
              Aparelhos revisados em laboratório com garantia oficial Cellbox de 12 meses e envio imediato com frete grátis.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  category: 'Todas',
                  condition: 'Recondicionado',
                }));
                setPageIdx(0);
                document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-4 h-8 px-5 rounded-full bg-[#0070B8] hover:bg-[#005A94] text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              VER SEMINOVOS A+
            </button>
          </div>

          <div className="flex items-center gap-3 self-center md:self-auto">
            <div className="w-36 sm:w-44 aspect-[4/3] bg-white p-1.5 rounded-xs shadow-sm overflow-hidden">
              <img
                src={ASSET_IMAGES.dellXps}
                alt="Dell XPS 15 OLED"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-36 sm:w-44 aspect-[4/3] bg-white p-1.5 rounded-xs shadow-sm overflow-hidden">
              <img
                src={ASSET_IMAGES.macbookPro}
                alt="MacBook Pro M3"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden lg:block w-36 aspect-[4/3] bg-white p-1.5 rounded-xs shadow-sm overflow-hidden">
              <img
                src={ASSET_IMAGES.galaxyS24Ultra}
                alt="Galaxy S24 Ultra"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* 5. LOJAS OFICIAIS & DESTAQUES — Exact 3-Column Card Section matching "FROM OUR BLOG" */}
        <section id="lojas-oficiais" aria-labelledby="heading-verified-stores" className="pt-2">
          <div className="flex items-center justify-between gap-4 pb-4">
            <h2
              id="heading-verified-stores"
              className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#43AA5B]"
            >
              LOJAS OFICIAIS VERIFICADAS
            </h2>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
              <span className="w-2 h-2 rounded-full bg-[#DDDDDD]" />
              <span className="w-2 h-2 rounded-full bg-[#DDDDDD]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeSellers.map((store, idx) => {
              const storeProductCount = products.filter((p) => p.sellerId === store.id).length;
              const coverImg =
                idx === 0
                  ? ASSET_IMAGES.hero
                  : idx === 1
                    ? ASSET_IMAGES.iphone16Pro
                    : ASSET_IMAGES.sonyHeadphones;
              const isPrimary = idx === 0;

              return (
                <article key={store.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => navigate({ type: 'store', sellerId: store.id })}
                    className="w-full aspect-[16/9] overflow-hidden bg-[#111111] mb-3.5 block cursor-pointer group"
                  >
                    <img
                      src={coverImg}
                      alt={`Vitrine ${store.name}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>

                  <h3 className="text-[14px] font-bold text-[#333333] leading-snug">
                    {store.name} — {store.mainCategory}
                  </h3>
                  <p className="text-[11px] text-[#999999] mt-1 flex items-center gap-1.5 tabular-nums">
                    <span className="inline-flex items-center gap-0.5 text-[#F5A623] font-semibold">
                      <Star className="w-3 h-3 fill-[#F5A623]" />
                      {store.rating.toFixed(1)}
                    </span>
                    <span>·</span>
                    <span>{store.location}</span>
                    <span>·</span>
                    <span>{storeProductCount} produtos</span>
                  </p>
                  <p className="text-xs text-[#777777] mt-2 leading-relaxed line-clamp-2">
                    {store.description}
                  </p>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'store', sellerId: store.id })}
                      className={`h-8 px-5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isPrimary
                          ? 'bg-[#43AA5B] hover:bg-[#2F8E47] text-white'
                          : 'bg-white border border-[#DCDCDC] text-[#666666] hover:bg-[#43AA5B] hover:text-white hover:border-[#43AA5B]'
                      }`}
                    >
                      VISITAR LOJA
                    </button>
                  </div>
                </article>
              );
            })}

            {/* If only 2 stores are active initially (GadgetHub pending), fill 3rd card with Seller Onboarding CTA so the 3-column symmetry matches the reference 100%! */}
            {activeSellers.length === 2 && (
              <article className="flex flex-col">
                <button
                  type="button"
                  onClick={() => navigate({ type: 'auth', mode: 'register' })}
                  className="w-full aspect-[16/9] overflow-hidden bg-[#1E293B] mb-3.5 block cursor-pointer group"
                >
                  <img
                    src={ASSET_IMAGES.gamingHandheld}
                    alt="Abra sua loja parceira na Cellbox"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>

                <h3 className="text-[14px] font-bold text-[#333333] leading-snug">
                  Venda na Cellbox — Programa Parceiro Oficial
                </h3>
                <p className="text-[11px] text-[#999999] mt-1">
                  Cadastro rápido · Painel completo · Repasse automatizado
                </p>
                <p className="text-xs text-[#777777] mt-2 leading-relaxed line-clamp-2">
                  Cadastre sua loja de eletrônicos, gerencie estoque e pedidos em tempo real e alcance milhares de compradores qualificados.
                </p>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate({ type: 'auth', mode: 'register' })}
                    className="h-8 px-5 rounded-full bg-white border border-[#DCDCDC] text-[#666666] hover:bg-[#43AA5B] hover:text-white hover:border-[#43AA5B] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    QUERO VENDER
                  </button>
                </div>
              </article>
            )}
          </div>
        </section>

        {/* 6. PARTNER BRANDS LOGO STRIP (Exact 6-Logo Row Above Green Newsletter Bar) */}
        <section
          aria-label="Marcas parceiras"
          className="pt-6 pb-4 border-t border-[#EFEFEF] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center"
        >
          {PARTNER_BRANDS.map((b) => (
            <button
              key={b.name}
              type="button"
              onClick={() => {
                setFilters((prev) => ({ ...prev, brand: b.name, category: 'Todas' }));
                setPageIdx(0);
                document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-2 px-3 flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <span
                className="font-condensed text-xl font-bold uppercase tracking-wider"
                style={{ color: b.color }}
              >
                {b.name}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: b.accent }}
              >
                {b.sub}
              </span>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
