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
import { ASSET_IMAGES, CUTOUT_IMAGES } from '../data/seedData';
import { filterVisibleProducts } from '../utils/marketplace';
import { MotionButton, SPRING_CARD, SPRING_SNAPPY } from './MotionPrimitives';
import { ProductCard } from './ProductCard';

const HERO_SLIDES = [
  {
    kicker: 'LANÇAMENTO CELLBOX',
    title: 'OS MELHORES SMARTPHONES E TECH EM 2026',
    subtitle:
      'As melhores ofertas em iPhone 16 Pro, Galaxy S24 Ultra, MacBooks e acessórios de lojas oficiais verificadas em Moçambique.',
    productId: 'prod-iphone-16-pro',
    cta: 'VER OFERTA',
    image: CUTOUT_IMAGES.iphone16Pro,
    secondaryImage: CUTOUT_IMAGES.sonyHeadphones,
  },
  {
    kicker: 'ESTAÇÃO PRO',
    title: 'LAPTOPS DE ALTA PERFORMANCE M3 & OLED',
    subtitle:
      'MacBook Pro 14" M3 Pro e Dell XPS 15 OLED com garantia oficial e entrega grátis acima de 15.000 MT.',
    productId: 'prod-macbook-pro-m3',
    cta: 'CONFERIR LAPTOPS',
    image: CUTOUT_IMAGES.macbookPro,
    secondaryImage: CUTOUT_IMAGES.dellXps,
  },
  {
    kicker: 'GAMING & ÁUDIO HI-RES',
    title: 'CONSOLES PORTÁTEIS E FONES COM ANC',
    subtitle:
      'Desempenho portátil com ROG Ally X e carregamento rápido GaN 140W com envio imediato.',
    productId: 'prod-rog-ally-x',
    cta: 'EXPLORAR GAMING',
    image: CUTOUT_IMAGES.gamingHandheld,
    secondaryImage: CUTOUT_IMAGES.ganCharger,
  },
];

const PARTNER_BRANDS = [
  { name: 'Apple', color: '#0A3768', accent: '#18A3DE', sub: 'Authorized' },
  { name: 'Samsung', color: '#0475EE', accent: '#18A3DE', sub: 'Galaxy Pro' },
  { name: 'Dell', color: '#0A3768', accent: '#0475EE', sub: 'Workstation' },
  { name: 'Sony', color: '#222222', accent: '#18A3DE', sub: 'Hi-Res Audio' },
  { name: 'ASUS', color: '#0A3768', accent: '#1AD6DE', sub: 'ROG Gaming' },
  { name: 'Anker', color: '#0475EE', accent: '#0A3768', sub: 'GaN Power' },
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
  const [heroDirection, setHeroDirection] = useState<1 | -1>(1);
  const [heroPaused, setHeroPaused] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [storesSlideIdx, setStoresSlideIdx] = useState(0);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  // Auto-advance hero carousel every 5.5s (pauses on hover/focus)
  useEffect(() => {
    if (heroPaused) return;
    const id = window.setInterval(() => {
      setHeroDirection(1);
      setHeroIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [heroPaused]);

  const goHeroSlide = (nextIdx: number, dir?: 1 | -1) => {
    const wrapped = (nextIdx + HERO_SLIDES.length) % HERO_SLIDES.length;
    setHeroDirection(dir ?? (wrapped >= heroIdx ? 1 : -1));
    setHeroIdx(wrapped);
  };

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

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePageIdx = Math.min(pageIdx, totalPages - 1);
  const visiblePageProducts = filteredProducts.slice(
    safePageIdx * ITEMS_PER_PAGE,
    safePageIdx * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // Build Official Stores & Partner Highlight cards for interactive multi-slide showcase
  const storeShowcaseCards = useMemo(() => {
    const storeCards = activeSellers.map((store, idx) => {
      const storeProductCount = products.filter((p) => p.sellerId === store.id).length;
      const coverImg =
        idx % 3 === 0
          ? ASSET_IMAGES.hero
          : idx % 3 === 1
            ? ASSET_IMAGES.iphone16Pro
            : ASSET_IMAGES.sonyHeadphones;

      return {
        id: store.id,
        title: `${store.name} — ${store.mainCategory}`,
        meta: `${store.location} · ${storeProductCount} produtos`,
        rating: store.rating,
        description: store.description,
        image: coverImg,
        ctaLabel: 'VISITAR LOJA',
        primary: idx === 0,
        onAction: () => navigate({ type: 'store', sellerId: store.id }),
      };
    });

    const partnerProgramCards = [
      {
        id: 'partner-sell',
        title: 'Venda na Cellbox — Programa Parceiro Oficial',
        meta: 'Cadastro rápido · Painel completo · Repasse via M-Pesa / Banco',
        rating: null as number | null,
        description:
          'Cadastre sua loja de eletrônicos, gerencie estoque e pedidos em tempo real e alcance milhares de compradores em Moçambique.',
        image: ASSET_IMAGES.gamingHandheld,
        ctaLabel: 'QUERO VENDER',
        primary: false,
        onAction: () => navigate({ type: 'auth', mode: 'register' }),
      },
      {
        id: 'partner-refurb',
        title: 'Laboratório Certificado Cellbox A+ — Garantia 12 Meses',
        meta: 'Inspeção de 40 pontos · Bateria acima de 92% · Maputo & Beira',
        rating: 4.9,
        description:
          'Smartphones e laptops recondicionados com laudo técnico, peças originais e devolução facilitada em até 30 dias.',
        image: ASSET_IMAGES.macbookPro,
        ctaLabel: 'VER SEMINOVOS A+',
        primary: true,
        onAction: () => {
          setFilters((prev) => ({ ...prev, category: 'Todas', condition: 'Recondicionado' }));
          setPageIdx(0);
          document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
        },
      },
      {
        id: 'partner-express',
        title: 'Entrega Expressa Moçambique — Frete Grátis > 15.000 MT',
        meta: 'Maputo · Matola · Beira · Nampula · Rastreio em tempo real',
        rating: 4.9,
        description:
          'Receba eletrônicos lacrados com código de rastreamento em todas as províncias e pagamento protegido via M-Pesa, e-Mola ou Cartão.',
        image: ASSET_IMAGES.dellXps,
        ctaLabel: 'VER MAIS VENDIDOS',
        primary: false,
        onAction: () => {
          setFilters((prev) => ({ ...prev, sortBy: 'best_selling', category: 'Todas' }));
          setPageIdx(0);
          document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
        },
      },
    ];

    return [...storeCards, ...partnerProgramCards];
  }, [activeSellers, products, navigate, setFilters]);

  const STORES_PER_SLIDE = 3;
  const totalStoreSlides = Math.max(1, Math.ceil(storeShowcaseCards.length / STORES_PER_SLIDE));
  const safeStoresSlideIdx = Math.min(storesSlideIdx, totalStoreSlides - 1);
  const visibleStoreCards = storeShowcaseCards.slice(
    safeStoresSlideIdx * STORES_PER_SLIDE,
    safeStoresSlideIdx * STORES_PER_SLIDE + STORES_PER_SLIDE
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
        {/* 1. HERO BANNER — Animated Multi-Slide Carousel + Floating Transparent Cutout Products */}
        <section
          aria-label="Destaques principais Cellbox"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onFocusCapture={() => setHeroPaused(true)}
          onBlurCapture={() => setHeroPaused(false)}
          className="relative cellbox-hero-gradient overflow-hidden min-h-[300px] sm:min-h-[360px] flex flex-col justify-between group"
        >
          {/* Left / Right Slide Arrow Controls */}
          <motion.button
            type="button"
            aria-label="Slide anterior"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING_SNAPPY}
            onClick={() => goHeroSlide(heroIdx - 1, -1)}
            className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0A3768]/45 hover:bg-[#0A3768]/80 text-white inline-flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="button"
            aria-label="Próximo slide"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING_SNAPPY}
            onClick={() => goHeroSlide(heroIdx + 1, 1)}
            className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0A3768]/45 hover:bg-[#0A3768]/80 text-white inline-flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <div className="relative flex-1 flex items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activeSlide.title}
                initial={{ opacity: 0, x: heroDirection * 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: heroDirection * -32 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="w-full grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-11 sm:px-14 py-8 sm:py-9"
              >
              {/* Left Copy */}
              <div className="md:col-span-7 text-white z-10 min-w-0">
                <p className="font-condensed text-sm sm:text-base tracking-widest uppercase text-[#B7EBF2] font-semibold">
                  {activeSlide.kicker}
                </p>
                <h1 className="font-condensed text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-[1.05] text-white mt-1.5">
                  {activeSlide.title}
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-white/90 max-w-md leading-relaxed">
                  {activeSlide.subtitle}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <MotionButton
                    type="button"
                    onClick={() => navigate({ type: 'product', productId: activeSlide.productId })}
                    className="h-9 px-5 rounded-full bg-white text-[#0A3768] hover:bg-[#EAF6FC] text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer shadow-sm"
                  >
                    {activeSlide.cta}
                  </MotionButton>
                  <MotionButton
                    type="button"
                    onClick={() => {
                      document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="h-9 px-4 rounded-full border border-white/75 text-white hover:bg-white/15 text-xs font-semibold uppercase tracking-wide transition-colors cursor-pointer"
                  >
                    Explorar Catálogo
                  </MotionButton>
                </div>
              </div>

              {/* Right Visual Showcase: Pure Transparent Background Cutouts Floating Over Gradient */}
              <div className="md:col-span-5 flex items-center justify-center md:justify-end z-10 min-w-0">
                <div className="relative flex items-end justify-center gap-2 sm:gap-4 h-[210px] sm:h-[260px]">
                  <motion.img
                    src={activeSlide.secondaryImage}
                    alt="Acessório destaque Cellbox"
                    initial={{ opacity: 0, y: 14, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...SPRING_CARD, delay: 0.08 }}
                    className="hidden sm:block max-h-[175px] w-auto object-contain -mr-5 mb-2 drop-shadow-[0_18px_24px_rgba(10,55,104,0.42)] select-none pointer-events-none"
                  />
                  <motion.img
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    initial={{ opacity: 0, y: 18, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={SPRING_CARD}
                    className="max-h-[210px] sm:max-h-[255px] w-auto object-contain drop-shadow-[0_22px_30px_rgba(10,55,104,0.48)] select-none pointer-events-none"
                  />
                </div>
              </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Centered Slider Indicator Dots */}
          <div className="pb-4 flex items-center justify-center gap-2 z-10">
            {HERO_SLIDES.map((s, idx) => (
              <motion.button
                key={s.title}
                type="button"
                aria-label={`Slide ${idx + 1}: ${s.kicker}`}
                aria-pressed={heroIdx === idx}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => goHeroSlide(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  heroIdx === idx
                    ? 'w-7 bg-white shadow-xs'
                    : 'w-2.5 bg-white/45 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </section>

        {/* 2. DUAL SUB-BANNER ROW — Transparent Cutouts Directly on #F1F2F4 */}
        <section
          aria-label="Promoções por categoria"
          className="!mt-3 grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          {/* Left 1/3 Banner: NOVOS TABLETS! */}
          <motion.div
            whileHover={{ y: -3, boxShadow: '0 10px 24px -8px rgba(10,55,104,0.14)' }}
            transition={SPRING_CARD}
            className="md:col-span-4 bg-[#F1F2F4] border border-[#E7E9EC] px-5 py-5 flex items-center justify-between gap-2 overflow-hidden min-h-[146px] group"
          >
            <div className="min-w-0 z-10">
              <h2 className="font-condensed text-xl font-bold uppercase text-[#18A3DE] leading-tight">
                NOVOS TABLETS!
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">Até 20% OFF em iPad Pro</p>
              <MotionButton
                type="button"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, category: 'Tablets' }));
                  setPageIdx(0);
                  document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-3.5 h-7 px-4 rounded-full bg-[#18A3DE] hover:bg-[#0A3768] text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
              >
                VER AGORA
              </MotionButton>
            </div>
            <img
              src={CUTOUT_IMAGES.ipadPro}
              alt="iPad Pro M4 em oferta"
              className="h-24 sm:h-28 w-auto max-w-[140px] object-contain shrink-0 drop-shadow-[0_10px_16px_rgba(10,55,104,0.22)] select-none pointer-events-none transition-transform duration-300 group-hover:scale-106 group-hover:-translate-y-1"
            />
          </motion.div>

          {/* Right 2/3 Banner: OFERTA LAPTOPS */}
          <motion.div
            whileHover={{ y: -3, boxShadow: '0 10px 24px -8px rgba(10,55,104,0.14)' }}
            transition={SPRING_CARD}
            className="md:col-span-8 bg-[#F1F2F4] border border-[#E7E9EC] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden min-h-[146px] group"
          >
            <div className="min-w-0 max-w-xs z-10">
              <h2 className="font-condensed text-2xl font-bold uppercase text-[#0A3768] leading-tight">
                OFERTA LAPTOPS
              </h2>
              <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                Workstations MacBook Pro M3 e Dell XPS OLED com garantia oficial e entrega grátis.
              </p>
              <MotionButton
                type="button"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, category: 'Laptops' }));
                  setPageIdx(0);
                  document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-3.5 h-8 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                COMPRAR AGORA
              </MotionButton>
            </div>

            <div className="flex items-end justify-end gap-1 shrink-0 self-end sm:self-center">
              <img
                src={CUTOUT_IMAGES.dellXps}
                alt="Dell XPS 15 OLED"
                className="hidden sm:block h-24 md:h-28 w-auto object-contain -mr-5 drop-shadow-[0_10px_16px_rgba(10,55,104,0.2)] select-none pointer-events-none transition-transform duration-300 group-hover:-translate-x-1"
              />
              <img
                src={CUTOUT_IMAGES.macbookPro}
                alt="MacBook Pro M3"
                className="h-28 md:h-32 w-auto object-contain drop-shadow-[0_12px_20px_rgba(10,55,104,0.28)] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1"
              />
            </div>
          </motion.div>
        </section>

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
                className="mb-4 p-4 bg-[#F7F9FB] border border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
              >
                <div>
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

                <div>
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

                <div>
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

                <div>
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

                <div>
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

                <div className="flex items-center gap-2">
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
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-[#EAEAEA]"
            >
              {visiblePageProducts.map((product) => (
                <ProductCard key={product.id} product={product} tiled />
              ))}
            </div>
          )}
        </section>

        {/* 4. WIDE MID-PAGE PROMO BANNER — Floating Cutout Products Directly on #F1F2F4 */}
        <motion.section
          aria-label="Oferta especial de economia"
          whileHover={{ boxShadow: '0 12px 28px -10px rgba(10,55,104,0.14)' }}
          transition={SPRING_CARD}
          className="bg-[#F1F2F4] border border-[#E7E9EC] px-6 sm:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden group"
        >
          <div className="max-w-md z-10">
            <h2 className="font-condensed text-2xl sm:text-[28px] font-bold uppercase text-[#0A3768] leading-tight">
              ECONOMIZE ATÉ 16.500 MT!
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#18A3DE] mt-0.5">
              EM SMARTPHONES RECONDICIONADOS A+ E NOTEBOOKS PRO
            </p>
            <p className="text-xs text-[#666666] mt-2 leading-relaxed">
              Aparelhos revisados em laboratório com garantia oficial Cellbox de 12 meses e envio imediato em todo o país.
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
              VER SEMINOVOS A+
            </MotionButton>
          </div>

          <div className="flex items-end justify-center gap-2 sm:gap-4 self-center md:self-auto">
            <img
              src={CUTOUT_IMAGES.dellXps}
              alt="Dell XPS 15 OLED"
              className="h-24 sm:h-32 w-auto object-contain drop-shadow-[0_12px_18px_rgba(10,55,104,0.2)] select-none pointer-events-none transition-transform duration-300 group-hover:-translate-x-1"
            />
            <img
              src={CUTOUT_IMAGES.macbookPro}
              alt="MacBook Pro M3"
              className="h-28 sm:h-36 w-auto object-contain -ml-4 drop-shadow-[0_14px_22px_rgba(10,55,104,0.24)] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1"
            />
            <img
              src={CUTOUT_IMAGES.galaxyS24Ultra}
              alt="Galaxy S24 Ultra"
              className="hidden lg:block h-24 w-auto object-contain -ml-2 drop-shadow-[0_10px_16px_rgba(10,55,104,0.2)] select-none pointer-events-none transition-transform duration-300 group-hover:translate-x-1"
            />
          </div>
        </motion.section>

        {/* 5. LOJAS OFICIAIS VERIFICADAS — Interactive Multi-Slide Carousel */}
        <section id="lojas-oficiais" aria-labelledby="heading-verified-stores" className="pt-2">
          <div className="flex items-center justify-between gap-4 pb-4">
            <h2
              id="heading-verified-stores"
              className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#0A3768]"
            >
              LOJAS OFICIAIS VERIFICADAS
            </h2>
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
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
              {visibleStoreCards.map((card) => (
                <motion.article
                  key={card.id}
                  whileHover={{ y: -4 }}
                  transition={SPRING_CARD}
                  className="flex flex-col"
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

                  <div className="mt-4">
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

        {/* 6. PARTNER BRANDS LOGO STRIP */}
        <section
          aria-label="Marcas parceiras"
          className="pt-6 pb-4 border-t border-[#EFEFEF] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center"
        >
          {PARTNER_BRANDS.map((b) => (
            <motion.button
              key={b.name}
              type="button"
              whileHover={{ scale: 1.07, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_SNAPPY}
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
            </motion.button>
          ))}
        </section>
      </div>
    </main>
  );
}
