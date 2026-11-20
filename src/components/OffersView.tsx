import { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Percent,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  Zap,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { formatCurrency, getProductDiscountPercent } from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';
import { ProductCard } from './ProductCard';

type OfferFilterMode = 'all' | 'flash' | string;
type OfferSortMode = 'discount_desc' | 'savings_desc' | 'price_asc';

export function OffersView() {
  const {
    products,
    sellers,
    coupons,
    appliedCouponCode,
    applyCoupon,
    currentUser,
    navigate,
    showToast,
  } = useMarketplace();

  const [filterMode, setFilterMode] = useState<OfferFilterMode>('all');
  const [sortMode, setSortMode] = useState<OfferSortMode>('discount_desc');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeSellerIds = useMemo(
    () => new Set(sellers.filter((s) => s.status === 'active').map((s) => s.id)),
    [sellers]
  );

  // Strictly discounted products or active flash deals from active stores
  const allOfferProducts = useMemo(() => {
    return products.filter((p) => {
      if (!activeSellerIds.has(p.sellerId)) return false;
      const hasDiscount = Boolean(p.originalPrice && p.originalPrice > p.price);
      return hasDiscount || Boolean(p.isFlashDeal);
    });
  }, [products, activeSellerIds]);

  const flashDealsCount = useMemo(
    () => allOfferProducts.filter((p) => p.isFlashDeal).length,
    [allOfferProducts]
  );

  const maxDiscountPercent = useMemo(() => {
    return allOfferProducts.reduce(
      (max, p) => Math.max(max, getProductDiscountPercent(p)),
      0
    );
  }, [allOfferProducts]);

  const offerCategories = useMemo(() => {
    return Array.from(new Set(allOfferProducts.map((p) => p.category))).sort();
  }, [allOfferProducts]);

  const activeCoupons = useMemo(
    () => coupons.filter((c) => c.active),
    [coupons]
  );

  const visibleOffers = useMemo(() => {
    const filtered = allOfferProducts.filter((p) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'flash') return Boolean(p.isFlashDeal);
      return p.category === filterMode;
    });

    const sorted = [...filtered];
    if (sortMode === 'discount_desc') {
      sorted.sort((a, b) => getProductDiscountPercent(b) - getProductDiscountPercent(a));
    } else if (sortMode === 'savings_desc') {
      sorted.sort((a, b) => {
        const savA = (a.originalPrice ?? a.price) - a.price;
        const savB = (b.originalPrice ?? b.price) - b.price;
        return savB - savA;
      });
    } else {
      sorted.sort((a, b) => a.price - b.price);
    }
    return sorted;
  }, [allOfferProducts, filterMode, sortMode]);

  const canApplyToCart = !currentUser || currentUser.role === 'buyer';

  const handleUseCoupon = async (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
    } catch {
      // Ignore clipboard restrictions inside iframe
    }
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2200);

    if (canApplyToCart) {
      applyCoupon(code);
    } else {
      showToast(`Código ${code} copiado com sucesso.`, 'info');
    }
  };

  return (
    <main className="bg-white pb-16" data-testid="offers-page">
      <div className="max-w-[1170px] mx-auto px-4 pt-6 space-y-8">
        {/* Static Promotional Header Banner (zero hover animations) */}
        <section className="cellbox-hero-gradient text-white rounded-[3px] px-6 sm:px-10 py-9">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-condensed text-xs sm:text-sm uppercase tracking-widest text-[#B7EBF2] font-semibold inline-flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#1AD6DE]" />
                PROMOÇÕES VERIFICADAS CELLBOX
              </p>
              <h1 className="font-condensed text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-tight mt-1.5">
                OFERTAS, DESCONTOS & CUPONS ATIVOS
              </h1>
              <p className="text-sm text-white/90 mt-2.5 max-w-2xl leading-relaxed">
                Aproveite preços promocionais em smartphones, laptops, gaming e acessórios com até{' '}
                <strong>{maxDiscountPercent}% OFF</strong> e cupons aplicáveis diretamente no
                carrinho.
              </p>
            </div>

            <div className="flex items-center gap-3.5 shrink-0">
              <div className="bg-white/12 border border-white/20 rounded-[3px] px-4 py-2.5 text-center">
                <p className="font-condensed text-2xl font-bold text-white tabular-nums">
                  {allOfferProducts.length}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/85">
                  Em Promoção
                </p>
              </div>
              <div className="bg-white/12 border border-white/20 rounded-[3px] px-4 py-2.5 text-center">
                <p className="font-condensed text-2xl font-bold text-white tabular-nums">
                  {activeCoupons.length}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/85">
                  Cupons Ativos
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Active Coupons Section */}
        <section
          aria-labelledby="heading-active-coupons"
          data-testid="active-coupons-section"
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEAEA] pb-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#0475EE]" />
              <h2
                id="heading-active-coupons"
                className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#0A3768]"
              >
                Cupons de Desconto Ativos
              </h2>
            </div>
            {appliedCouponCode && canApplyToCart && (
              <MotionButton
                type="button"
                onClick={() => navigate({ type: 'cart' })}
                className="h-8 px-4 rounded-full bg-[#0A3768] hover:bg-[#0475EE] text-white text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#1AD6DE]" />
                Cupom {appliedCouponCode} ativo · Ir ao Carrinho
              </MotionButton>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeCoupons.map((coupon) => {
              const isApplied = appliedCouponCode === coupon.code;
              const isCopied = copiedCode === coupon.code;
              const badgeValue =
                coupon.discountType === 'percent'
                  ? `${coupon.discountValue}% OFF`
                  : `${formatCurrency(coupon.discountValue).replace(',00', '')} OFF`;

              return (
                <article
                  key={coupon.code}
                  data-testid={`coupon-card-${coupon.code}`}
                  className={`bg-[#F8FAFC] border rounded-[3px] p-4 flex flex-col justify-between gap-3 ${
                    isApplied ? 'border-[#0475EE] bg-[#EAF6FC]/50' : 'border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#0475EE] text-white text-[10px] font-extrabold uppercase tracking-wider">
                        <Percent className="w-3 h-3" />
                        {badgeValue}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#777777]">
                        <Clock className="w-3 h-3" />
                        Até {coupon.validUntil}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#0A3768] leading-snug">
                      {coupon.title}
                    </h3>
                    <p className="text-[11px] text-[#666666] leading-relaxed">
                      {coupon.description}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-dashed border-[#CBD5E1]">
                    <div className="flex items-center justify-between text-[11px] text-[#666666]">
                      <span>Mínimo:</span>
                      <span className="font-mono font-bold text-[#0A3768] tabular-nums">
                        {formatCurrency(coupon.minOrderValue)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="flex-1 h-8 px-2.5 rounded-[2px] bg-white border border-[#CBD5E1] text-xs font-mono font-bold text-[#0A3768] inline-flex items-center justify-center tracking-wider">
                        {coupon.code}
                      </code>
                      <MotionButton
                        type="button"
                        data-testid={`apply-coupon-${coupon.code}`}
                        hoverScale={1.03}
                        hoverY={0}
                        onClick={() => void handleUseCoupon(coupon.code)}
                        className={`h-8 px-3 rounded-[2px] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                          isApplied
                            ? 'bg-[#0A3768] text-white'
                            : 'bg-[#0475EE] hover:bg-[#0A3768] text-white'
                        }`}
                      >
                        {isApplied || isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-[#1AD6DE]" />
                            {isApplied ? 'Aplicado' : 'Copiado'}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            {canApplyToCart ? 'Usar' : 'Copiar'}
                          </>
                        )}
                      </MotionButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Discounted Products & Flash Deals Section */}
        <section aria-labelledby="heading-discounted-products" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEAEA] pb-3.5">
            <div className="flex items-baseline gap-3">
              <h2
                id="heading-discounted-products"
                className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#0A3768] inline-flex items-center gap-2"
              >
                <Tag className="w-5 h-5 text-[#18A3DE]" />
                Produtos em Promoção
              </h2>
              <span className="text-xs text-[#888888] tabular-nums">
                {visibleOffers.length}{' '}
                {visibleOffers.length === 1 ? 'oferta ativa' : 'ofertas ativas'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <MotionButton
                  type="button"
                  hoverScale={1.03}
                  hoverY={0}
                  onClick={() => setFilterMode('all')}
                  className={`h-7 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-[#0475EE] text-white'
                      : 'bg-[#F2F3F5] text-[#666666] hover:bg-[#EAF6FC] hover:text-[#0A3768]'
                  }`}
                >
                  Todas ({allOfferProducts.length})
                </MotionButton>

                <MotionButton
                  type="button"
                  hoverScale={1.03}
                  hoverY={0}
                  onClick={() => setFilterMode('flash')}
                  className={`h-7 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    filterMode === 'flash'
                      ? 'bg-[#0A3768] text-white'
                      : 'bg-[#F2F3F5] text-[#666666] hover:bg-[#EAF6FC] hover:text-[#0A3768]'
                  }`}
                >
                  <Zap className="w-3 h-3 text-[#1AD6DE]" />
                  Relâmpago ({flashDealsCount})
                </MotionButton>

                {offerCategories.map((cat) => (
                  <MotionButton
                    key={cat}
                    type="button"
                    hoverScale={1.03}
                    hoverY={0}
                    onClick={() => setFilterMode(cat)}
                    className={`h-7 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                      filterMode === cat
                        ? 'bg-[#0475EE] text-white'
                        : 'bg-[#F2F3F5] text-[#666666] hover:bg-[#EAF6FC] hover:text-[#0A3768]'
                    }`}
                  >
                    {cat}
                  </MotionButton>
                ))}
              </div>

              <label htmlFor="offers-sort-select" className="sr-only">
                Ordenar ofertas
              </label>
              <select
                id="offers-sort-select"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as OfferSortMode)}
                className="h-7 px-2.5 bg-white border border-[#DCDCDC] rounded-[2px] text-[11px] font-semibold text-[#444444] focus:outline-none focus:border-[#0475EE] cursor-pointer"
              >
                <option value="discount_desc">Maior Desconto (%)</option>
                <option value="savings_desc">Maior Economia (MT)</option>
                <option value="price_asc">Menor Preço</option>
              </select>
            </div>
          </div>

          {visibleOffers.length === 0 ? (
            <div className="border border-[#EAEAEA] rounded-[3px] py-14 px-6 text-center bg-[#FAFAFA]">
              <Sparkles className="w-9 h-9 text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#0A3768]">
                Nenhuma promoção encontrada nesta categoria.
              </p>
              <MotionButton
                type="button"
                onClick={() => setFilterMode('all')}
                className="mt-4 h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
              >
                Ver Todas as Ofertas
              </MotionButton>
            </div>
          ) : (
            <div
              data-testid="offers-product-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-t border-l border-[#EAEAEA]"
            >
              {visibleOffers.map((product) => {
                const discountPct = getProductDiscountPercent(product);
                const savings =
                  product.originalPrice && product.originalPrice > product.price
                    ? product.originalPrice - product.price
                    : 0;

                return (
                  <div key={product.id} className="relative flex flex-col">
                    {/* Crisp Discount & Flash Deal Badges */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-start gap-1 pointer-events-none">
                      {discountPct > 0 && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#0475EE] text-white text-[10px] font-extrabold font-mono tabular-nums shadow-xs">
                          -{discountPct}%
                        </span>
                      )}
                      {product.isFlashDeal && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#0A3768] text-[#1AD6DE] text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          Relâmpago
                        </span>
                      )}
                    </div>

                    <ProductCard product={product} tiled />

                    {savings > 0 && (
                      <div className="bg-[#EAF6FC] border-r border-b border-[#EAEAEA] px-3 py-1.5 text-center text-[10.5px] font-bold text-[#0A3768] font-mono tabular-nums">
                        Economize {formatCurrency(savings)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
