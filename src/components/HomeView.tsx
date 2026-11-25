import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { filterVisibleProducts, isStorePubliclyActive } from '../utils/marketplace';
import { MotionButton, SPRING_CARD, SPRING_SNAPPY } from './MotionPrimitives';
import { ProductCard } from './ProductCard';
import { BrandLogo, type PartnerBrandName } from './BrandLogo';

export function HomeView() {
  const {
    products,
    sellers,
    categories,
    filters,
    setFilters,
    resetFilters,
    navigate,
    siteCustomization,
  } = useMarketplace();

  const heroSlides = siteCustomization?.heroSlides ?? [];

  const [heroIdx, setHeroIdx] = useState(0);
  const [heroDirection, setHeroDirection] = useState<1 | -1>(1);
  const [heroPaused, setHeroPaused] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [storesSlideIdx, setStoresSlideIdx] = useState(0);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  // Auto-advance hero carousel every 5.5s (pauses on hover/focus)
  useEffect(() => {
    if (heroPaused || !heroSlides.length) return;
    const id = window.setInterval(() => {
      setHeroDirection(1);
      setHeroIdx((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [heroPaused, heroSlides.length]);

  const goHeroSlide = (nextIdx: number, dir?: 1 | -1) => {
    if (!heroSlides.length) return;
    const wrapped = (nextIdx + heroSlides.length) % heroSlides.length;
    setHeroDirection(dir ?? (wrapped >= heroIdx ? 1 : -1));
    setHeroIdx(wrapped);
  };

  const safeHeroIdx = heroSlides.length > 0 ? heroIdx % heroSlides.length : 0;
  const activeSlide = heroSlides[safeHeroIdx];

  const subBanner1 = siteCustomization?.subBanners?.[0] ?? null;
  const subBanner2 = siteCustomization?.subBanners?.[1] ?? null;
  const wideBanner = siteCustomization?.wideBanner ?? null;
  const partnerBrands = siteCustomization?.partnerBrands ?? [];

  const activeSellers = useMemo(
    () => sellers.filter(isStorePubliclyActive),
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

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePageIdx = Math.min(pageIdx, totalPages - 1);
  const visiblePageProducts = filteredProducts.slice(
    safePageIdx * ITEMS_PER_PAGE,
    safePageIdx * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // Build Official Stores Showcase (apenas lojas ativas reais)
  const storeShowcaseCards = useMemo(() => {
    return activeSellers.map((store, idx) => {
      const storeProductCount = products.filter((p) => p.sellerId === store.id).length;
      const coverImg = store.bannerImage || store.logoUrl || '';

      return {
        id: store.id,
        title: `${store.name} — ${store.mainCategory}`,
        meta: `${store.location} · ${storeProductCount} produtos`,
        rating: store.reviewCount > 0 ? store.rating : null,
        description: store.description,
        image: coverImg,
        ctaLabel: 'VISITAR LOJA',
        primary: idx === 0,
        onAction: () => navigate({ type: 'store', sellerId: store.id }),
      };
    });
  }, [activeSellers, products, navigate]);

  const STORES_PER_SLIDE = 3;
  const totalStoreSlides = Math.max(1, Math.ceil(storeShowcaseCards.length / STORES_PER_SLIDE));
  const safeStoresSlideIdx = Math.min(storesSlideIdx, totalStoreSlides - 1);
  const visibleStoreCards = storeShowcaseCards.slice(
    safeStoresSlideIdx * STORES_PER_SLIDE,
    safeStoresSlideIdx * STORES_PER_SLIDE + STORES_PER_SLIDE
  );

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
        {/* 1. HERO BANNER — Condicional ao CMS / Banco */}
        {heroSlides.length > 0 && activeSlide && (
        <section
          aria-label="Destaques principais Cellbox"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onFocusCapture={() => setHeroPaused(true)}
          onBlurCapture={() => setHeroPaused(false)}
          className="relative cellbox-hero-gradient overflow-hidden rounded-[3px] min-h-[340px] sm:min-h-[380px] flex flex-col justify-between"
        >
          {/* Subtle architectural light geometry for depth */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 82% 18%, rgba(255,255,255,0.45) 0%, transparent 38%), radial-gradient(circle at 12% 90%, rgba(26,214,222,0.35) 0%, transparent 42%)',
            }}
          />

          {/* Left / Right Slide Arrow Controls positioned cleanly in outer gutters */}
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => goHeroSlide(heroIdx - 1, -1)}
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#072850]/55 hover:bg-[#072850]/85 border border-white/15 text-white inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={() => goHeroSlide(heroIdx + 1, 1)}
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#072850]/55 hover:bg-[#072850]/85 border border-white/15 text-white inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="relative flex-1 flex items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activeSlide.title}
                initial={{ opacity: 0, x: heroDirection * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: heroDirection * -24 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="w-full grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-8 px-14 sm:px-16 lg:px-20 pt-8 pb-6 sm:py-9"
              >
                {/* Left Copy Column — Tightly Aligned Vertical Axis */}
                <div className="md:col-span-6 flex flex-col items-start text-left text-white z-10 min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#B7F2FA]">
                    {activeSlide.kicker}
                  </p>
                  <h1 className="font-condensed text-[34px] sm:text-[46px] lg:text-[52px] font-bold uppercase tracking-tight leading-[1.02] text-white mt-2 max-w-[440px] [text-wrap:balance]">
                    {activeSlide.title}
                  </h1>
                  <p className="mt-3 text-[13px] sm:text-[15px] text-white/90 max-w-[420px] leading-relaxed">
                    {activeSlide.subtitle}
                  </p>
                  <p className="mt-2.5 text-xs font-medium text-[#C8F5FC] tabular-nums">
                    {activeSlide.highlight}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <MotionButton
                      type="button"
                      onClick={() => {
                        if (activeSlide.productId) {
                          navigate({ type: 'product', productId: activeSlide.productId });
                        } else {
                          document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="h-10 px-6 rounded-full bg-white text-[#0A3768] hover:bg-[#EAF6FC] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
                    >
                      {(activeSlide as any).ctaText || (activeSlide as any).cta || 'VER OFERTAS'}
                    </MotionButton>
                    <MotionButton
                      type="button"
                      onClick={() => {
                        document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="h-10 px-5 rounded-full border border-white/75 text-white hover:bg-white/15 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Ver Catálogo
                    </MotionButton>
                  </div>
                </div>

                {/* Right Product Stage — Single Clean Balanced Transparent Cutout */}
                <div className="md:col-span-6 flex items-center justify-center z-10 min-w-0">
                  <div className="w-full h-[210px] sm:h-[260px] lg:h-[290px] flex items-center justify-center px-2">
                    {((activeSlide as any).imageUrl || (activeSlide as any).image) && (
                      <img
                        src={(activeSlide as any).imageUrl || (activeSlide as any).image}
                        alt={(activeSlide as any).imageAlt || activeSlide.title}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full w-auto h-auto object-contain drop-shadow-[0_22px_28px_rgba(7,40,80,0.45)] select-none pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Centered Slider Indicator Dots */}
          <div className="pb-4 flex items-center justify-center gap-2 z-10">
            {heroSlides.map((s, idx) => (
              <button
                key={`${s.title}-${idx}`}
                type="button"
                aria-label={`Slide ${idx + 1}: ${s.kicker}`}
                aria-pressed={safeHeroIdx === idx}
                onClick={() => goHeroSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  safeHeroIdx === idx
                    ? 'w-7 bg-white shadow-xs'
                    : 'w-2 bg-white/45 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </section>
        )}

        {/* 2. DUAL SUB-BANNER ROW — Dynamic Banners */}
        {(subBanner1 || subBanner2) && (
          <section
            aria-label="Promoções por categoria"
            className="!mt-3 flex flex-col md:flex-row items-stretch gap-3"
          >
            {/* Left 1/3 Banner */}
            {subBanner1 && (
              <div className={`${subBanner2 ? 'md:flex-1' : 'w-full'} bg-[#F1F2F4] border border-[#E7E9EC] px-5 py-5 flex items-center justify-between gap-2 overflow-hidden min-h-[146px]`}>
                <div className="min-w-0 z-10">
                  <h2 className="font-condensed text-xl font-bold uppercase text-[#18A3DE] leading-tight">
                    {subBanner1.title}
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">{subBanner1.subtitle}</p>
                  <MotionButton
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, category: (subBanner1 as any).category || 'Tablets' }));
                      setPageIdx(0);
                      document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-3.5 h-7 px-4 rounded-full bg-[#18A3DE] hover:bg-[#0A3768] text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {(subBanner1 as any).ctaText || (subBanner1 as any).cta || 'VER AGORA'}
                  </MotionButton>
                </div>
                {((subBanner1 as any).imageUrl || (subBanner1 as any).image) && (
                  <img
                    src={(subBanner1 as any).imageUrl || (subBanner1 as any).image}
                    alt={(subBanner1 as any).imageAlt || subBanner1.title}
                    className="h-24 sm:h-28 w-auto max-w-[140px] object-contain shrink-0 drop-shadow-[0_10px_16px_rgba(10,55,104,0.22)] select-none pointer-events-none"
                  />
                )}
              </div>
            )}

            {/* Right 2/3 Banner */}
            {subBanner2 && (
              <div className={`${subBanner1 ? 'md:flex-[2]' : 'w-full'} bg-[#F1F2F4] border border-[#E7E9EC] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden min-h-[146px]`}>
                <div className="min-w-0 max-w-xs z-10">
                  <h2 className="font-condensed text-2xl font-bold uppercase text-[#0A3768] leading-tight">
                    {subBanner2.title}
                  </h2>
                  <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                    {subBanner2.subtitle}
                  </p>
                  <MotionButton
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, category: (subBanner2 as any).category || 'Laptops' }));
                      setPageIdx(0);
                      document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-3.5 h-8 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {(subBanner2 as any).ctaText || (subBanner2 as any).cta || 'COMPRAR AGORA'}
                  </MotionButton>
                </div>

                <div className="flex items-end justify-end gap-1 shrink-0 self-end sm:self-center">
                  {((subBanner2 as any).imageUrl || (subBanner2 as any).image) && (
                    <img
                      src={(subBanner2 as any).imageUrl || (subBanner2 as any).image}
                      alt={(subBanner2 as any).imageAlt || subBanner2.title}
                      className="h-28 md:h-32 w-auto object-contain drop-shadow-[0_12px_20px_rgba(10,55,104,0.28)] select-none pointer-events-none"
                    />
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 3. NOVIDADES & CATÁLOGO PRINCIPAL — 5-Column Grid + Animated Pill Category Tabs */}
        <section id="catalogo-principal" aria-labelledby="heading-catalog" className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5">
            <div className="flex items-baseline gap-3">
              <h2
                id="heading-catalog"
                className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#0A3768]"
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
                  <MotionButton
                    key={cat}
                    type="button"
                    hoverScale={1.04}
                    hoverY={-1}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, category: cat }));
                      setPageIdx(0);
                    }}
                    className={`h-7 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#0475EE] text-white shadow-xs'
                        : 'bg-[#F2F3F5] text-[#666666] hover:bg-[#EAF6FC] hover:text-[#0A3768]'
                    }`}
                  >
                    {cat === 'Todas' ? 'Todos' : cat}
                  </MotionButton>
                );
              })}

              <MotionButton
                type="button"
                hoverScale={1.04}
                hoverY={-1}
                onClick={() => setFiltersPanelOpen((v) => !v)}
                aria-expanded={filtersPanelOpen}
                className={`h-7 px-3 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  filtersPanelOpen || hasExtraFilters
                    ? 'bg-[#0A3768] text-white'
                    : 'bg-[#F2F3F5] text-[#555555] hover:bg-[#EAF6FC] hover:text-[#0A3768]'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Filtros</span>
              </MotionButton>

              <div className="flex items-center gap-1 ml-1">
                <MotionButton
                  type="button"
                  hoverScale={1.08}
                  hoverY={0}
                  aria-label="Página anterior de produtos"
                  disabled={safePageIdx <= 0}
                  onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                  className="w-7 h-7 rounded-full bg-[#B5C8D4] hover:bg-[#0475EE] disabled:opacity-45 text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </MotionButton>
                <MotionButton
                  type="button"
                  hoverScale={1.08}
                  hoverY={0}
                  aria-label="Próxima página de produtos"
                  disabled={safePageIdx >= totalPages - 1}
                  onClick={() => setPageIdx((p) => Math.min(totalPages - 1, p + 1))}
                  className="w-7 h-7 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-45 text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </MotionButton>
              </div>
            </div>
          </div>

          {/* Retractable Filter Bar (Condition, Brand, Min/Max Price in MT, Sort) */}
          <AnimatePresence>
            {filtersPanelOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mb-4 p-4 bg-[#F7F9FB] border border-[#E5E7EB] flex flex-wrap items-end gap-3"
              >
                <div className="flex-1 min-w-[140px]">
                  <label htmlFor="flt-cond" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                    Condição
                  </label>
                  <select
                    id="flt-cond"
                    value={filters.condition}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        condition: e.target.value as typeof filters.condition,
                      }));
                      setPageIdx(0);
                    }}
                    className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs text-[#333333]"
                  >
                    <option value="all">Todas</option>
                    <option value="Novo">Novo</option>
                    <option value="Recondicionado">Recondicionado</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label htmlFor="flt-brand" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                    Marca
                  </label>
                  <select
                    id="flt-brand"
                    value={filters.brand}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, brand: e.target.value }));
                      setPageIdx(0);
                    }}
                    className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs text-[#333333]"
                  >
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label htmlFor="flt-min" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                    Preço Mín. (MT)
                  </label>
                  <input
                    id="flt-min"
                    type="number"
                    min={0}
                    value={filters.minPrice ?? ''}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value ? Number(e.target.value) : null,
                      }));
                      setPageIdx(0);
                    }}
                    placeholder="0"
                    className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs font-mono tabular-nums"
                  />
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label htmlFor="flt-max" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                    Preço Máx. (MT)
                  </label>
                  <input
                    id="flt-max"
                    type="number"
                    min={0}
                    value={filters.maxPrice ?? ''}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value ? Number(e.target.value) : null,
                      }));
                      setPageIdx(0);
                    }}
                    placeholder="200000"
                    className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs font-mono tabular-nums"
                  />
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label htmlFor="flt-sort" className="block text-[11px] font-bold uppercase text-[#666666] mb-1">
                    Ordenar por
                  </label>
                  <select
                    id="flt-sort"
                    value={filters.sortBy}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: e.target.value as typeof filters.sortBy,
                      }));
                      setPageIdx(0);
                    }}
                    className="w-full h-9 px-2.5 bg-white border border-[#DCDCDC] text-xs text-[#333333]"
                  >
                    <option value="featured">Destaques</option>
                    <option value="best_selling">Mais Vendidos</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="rating">Melhor Avaliação</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <MotionButton
                    type="button"
                    onClick={() => {
                      resetFilters();
                      setPageIdx(0);
                    }}
                    className="flex-1 h-9 px-3 bg-white border border-[#CCCCCC] hover:border-[#0475EE] text-xs font-semibold text-[#555555] cursor-pointer"
                  >
                    Limpar
                  </MotionButton>
                  <button
                    type="button"
                    onClick={() => setFiltersPanelOpen(false)}
                    aria-label="Fechar barra de filtros"
                    className="h-9 w-9 bg-white border border-[#CCCCCC] inline-flex items-center justify-center text-[#666666] hover:text-[#222222] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5-Column Crisp Bordered Grid */}
          {visiblePageProducts.length === 0 ? (
            <div className="border border-[#EAEAEA] py-14 px-6 text-center bg-[#FAFAFA]">
              <p className="text-sm font-bold text-[#333333]">
                Nenhum produto encontrado para os filtros aplicados.
              </p>
              <MotionButton
                type="button"
                onClick={() => {
                  resetFilters();
                  setPageIdx(0);
                }}
                className="mt-4 h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
              >
                Limpar Filtros
              </MotionButton>
            </div>
          ) : (
            <div
              data-testid="catalog-product-grid"
              className="flex flex-wrap items-stretch border-t border-l border-[#EAEAEA]"
            >
              {visiblePageProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  tiled
                  className="w-1/2 sm:w-1/3 lg:w-1/5"
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. WIDE MID-PAGE PROMO BANNER — Dynamic Banner */}
        {Boolean(wideBanner && wideBanner.title) && (
        <section
          aria-label="Oferta especial de economia"
          className="bg-[#F1F2F4] border border-[#E7E9EC] px-6 sm:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden"
        >
          <div className="max-w-md z-10">
            <h2 className="font-condensed text-2xl sm:text-[28px] font-bold uppercase text-[#0A3768] leading-tight">
              {wideBanner.title}
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#18A3DE] mt-0.5">
              {wideBanner.kicker}
            </p>
            <p className="text-xs text-[#666666] mt-2 leading-relaxed">
              {wideBanner.description}
            </p>
            <MotionButton
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
              className="mt-4 h-8 px-5 rounded-full bg-[#0A3768] hover:bg-[#0475EE] text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {(wideBanner as any).ctaText || (wideBanner as any).cta || 'VER SEMINOVOS CERTIFICADOS'}
            </MotionButton>
          </div>

          <div className="flex items-end justify-center gap-2 sm:gap-4 self-center md:self-auto">
            {((wideBanner as any).imageUrl || (wideBanner as any).image1) && (
              <img
                src={(wideBanner as any).imageUrl || (wideBanner as any).image1}
                alt="Destaque 1"
                className="h-24 sm:h-32 w-auto object-contain drop-shadow-[0_12px_18px_rgba(10,55,104,0.2)] select-none pointer-events-none"
              />
            )}
            {(wideBanner as any).image2 && (
              <img
                src={(wideBanner as any).image2}
                alt="Destaque 2"
                className="h-28 sm:h-36 w-auto object-contain -ml-4 drop-shadow-[0_14px_22px_rgba(10,55,104,0.24)] select-none pointer-events-none"
              />
            )}
          </div>
        </section>
        )}

        {/* 5. LOJAS OFICIAIS VERIFICADAS — Interactive Multi-Slide Carousel */}
        {storeShowcaseCards.length > 0 && (
        <section id="lojas-oficiais" aria-labelledby="heading-verified-stores" className="pt-2">
          <div className="flex items-center justify-between gap-4 pb-4">
            <div className="flex items-baseline gap-4">
              <h2
                id="heading-verified-stores"
                className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#0A3768]"
              >
                LOJAS OFICIAIS VERIFICADAS
              </h2>
              <button
                type="button"
                onClick={() => navigate({ type: 'stores' })}
                className="text-xs font-bold text-[#0475EE] hover:text-[#0A3768] transition-colors cursor-pointer"
              >
                Ver todas as lojas →
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalStoreSlides }).map((_, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    aria-label={`Slide de lojas ${idx + 1}`}
                    aria-pressed={safeStoresSlideIdx === idx}
                    whileHover={{ scale: 1.25 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setStoresSlideIdx(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      safeStoresSlideIdx === idx
                        ? 'w-5 bg-[#0475EE]'
                        : 'w-2 bg-[#CBD5E1] hover:bg-[#18A3DE]'
                    }`}
                  />
                ))}
              </div>
              {totalStoreSlides > 1 && (
                <div className="flex items-center gap-1 ml-1">
                  <MotionButton
                    type="button"
                    hoverScale={1.08}
                    hoverY={0}
                    aria-label="Lojas anteriores"
                    onClick={() =>
                      setStoresSlideIdx((p) => (p - 1 + totalStoreSlides) % totalStoreSlides)
                    }
                    className="w-6 h-6 rounded-full bg-[#EAF0F6] hover:bg-[#0475EE] text-[#0A3768] hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </MotionButton>
                  <MotionButton
                    type="button"
                    hoverScale={1.08}
                    hoverY={0}
                    aria-label="Próximas lojas"
                    onClick={() => setStoresSlideIdx((p) => (p + 1) % totalStoreSlides)}
                    className="w-6 h-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </MotionButton>
                </div>
              )}
            </div>
          </div>

          <motion.div
            key={`stores-slide-${safeStoresSlideIdx}`}
            initial={{ opacity: 0.25, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-stretch gap-6"
          >
              {visibleStoreCards.map((card) => (
                <motion.article
                  key={card.id}
                  whileHover={{ y: -4 }}
                  transition={SPRING_CARD}
                  className="w-full md:w-[calc(33.333%-16px)] flex flex-col"
                >
                  <button
                    type="button"
                    onClick={card.onAction}
                    className="w-full aspect-[16/9] overflow-hidden bg-[#0A3768] mb-3.5 block cursor-pointer group rounded-[2px]"
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-106"
                    />
                  </button>

                  <h3 className="text-[14px] font-bold text-[#0A3768] leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-[#999999] mt-1 flex items-center gap-1.5 tabular-nums">
                    {card.rating !== null && (
                      <>
                        <span className="inline-flex items-center gap-0.5 text-[#F5A623] font-semibold">
                          <Star className="w-3 h-3 fill-[#F5A623]" />
                          {card.rating.toFixed(1)}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span>{card.meta}</span>
                  </p>
                  <p className="text-xs text-[#777777] mt-2 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>

                  <div className="mt-auto pt-4">
                    <MotionButton
                      type="button"
                      onClick={card.onAction}
                      className={`h-8 px-5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        card.primary
                          ? 'bg-[#0475EE] hover:bg-[#0A3768] text-white'
                          : 'bg-white border border-[#DCDCDC] text-[#666666] hover:bg-[#0475EE] hover:text-white hover:border-[#0475EE]'
                      }`}
                    >
                      {card.ctaLabel}
                    </MotionButton>
                  </div>
                </motion.article>
              ))}
            </motion.div>
        </section>
        )}

        {/* 6. PARTNER BRANDS OFFICIAL LOGO STRIP */}
        {partnerBrands.length > 0 && (
        <section
          aria-label="Marcas parceiras"
          data-testid="partner-brands-strip"
          className="pt-8 pb-4 border-t border-[#EFEFEF] flex flex-wrap items-center justify-center sm:justify-between gap-4 sm:gap-6"
        >
          {partnerBrands.map((b) => (
            <motion.button
              key={b.name}
              type="button"
              aria-label={('ariaLabel' in b && b.ariaLabel) ? b.ariaLabel : `Filtrar produtos ${b.name}`}
              title={`Ver produtos ${b.name}`}
              whileHover={{ scale: 1.07, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_SNAPPY}
              onClick={() => {
                setFilters((prev) => ({ ...prev, brand: b.name, category: 'Todas' }));
                setPageIdx(0);
                document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-12 px-3 flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity cursor-pointer"
            >
              {['Apple', 'Samsung', 'Dell', 'Sony', 'ASUS', 'Anker'].includes(b.name) && !('logoUrl' in b && b.logoUrl) ? (
                <BrandLogo brand={b.name as PartnerBrandName} />
              ) : ('logoUrl' in b && b.logoUrl) ? (
                <img
                  src={b.logoUrl}
                  alt={b.name}
                  className="max-h-8 max-w-[120px] object-contain select-none"
                />
              ) : (
                <span className="font-condensed font-bold text-lg uppercase tracking-wider text-[#0A3768]">
                  {b.name}
                </span>
              )}
            </motion.button>
          ))}
        </section>
        )}
      </div>
    </main>
  );
}
