import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  MapPin,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Review } from '../types';
import { calculateShipping, formatCurrency } from '../utils/marketplace';
import { MotionButton, SPRING_CARD, SPRING_SNAPPY } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

interface ProductDetailViewProps {
  productId: string;
}

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  const {
    products,
    sellers,
    wishlist,
    compareIds,
    addToCart,
    toggleWishlist,
    toggleCompare,
    navigate,
    applyCoupon,
    appliedCouponCode,
    removeCoupon,
    currentUser,
    submitReview,
    fetchReviews,
    showToast,
  } = useMarketplace();

  const product = products.find((p) => p.id === productId);
  const seller = product ? sellers.find((s) => s.id === product.sellerId) : undefined;

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState('1100');
  const [shippingCalculated, setShippingCalculated] = useState(true);
  const [couponInput, setCouponInput] = useState('');

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    if (productId) {
      setLoadingReviews(true);
      fetchReviews('product', productId)
        .then((data) => setReviews(data))
        .finally(() => setLoadingReviews(false));
    }
  }, [productId, fetchReviews]);

  if (!product) {
    return (
      <main className="max-w-[1170px] mx-auto px-4 py-16 text-center">
        <h1 className="font-condensed text-2xl font-bold uppercase text-[#333333]">
          Produto não encontrado
        </h1>
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="mt-4 h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
        >
          Voltar à vitrine
        </button>
      </main>
    );
  }

  const isWished = wishlist.includes(product.id);
  const isCompared = compareIds.includes(product.id);
  const shippingQuote = calculateShipping(cep, product.price * quantity);

  // Dynamic specs table
  const specItems = useMemo(() => {
    const list: Array<{ label: string; value: string }> = [
      { label: 'Condição', value: product.condition },
      { label: 'Marca', value: product.brand },
      { label: 'Categoria', value: product.category },
    ];
    if (product.specs && typeof product.specs === 'object') {
      for (const [k, v] of Object.entries(product.specs)) {
        if (v && typeof v === 'string') {
          const formattedLabel = k
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^./, (str) => str.toUpperCase());
          list.push({ label: formattedLabel, value: v });
        }
      }
    }
    return list;
  }, [product]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      showToast('Digite o código do cupom.', 'warning');
      return;
    }
    const ok = applyCoupon(code);
    if (!ok) {
      showToast('Cupom inválido ou expirado.', 'warning');
    } else {
      setCouponInput('');
    }
  };

  const handleOpenReviewModal = () => {
    if (!currentUser) {
      navigate({ type: 'auth', mode: 'login' });
      return;
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewComment.trim()) return;
    setSubmittingReview(true);
    const ok = await submitReview('product', product.id, reviewRating, reviewComment.trim());
    setSubmittingReview(false);
    if (ok) {
      setReviewModalOpen(false);
      setReviewComment('');
      fetchReviews('product', product.id).then((data) => setReviews(data));
    }
  };

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-6 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#777777] mb-5 pb-3 border-b border-[#EAEAEA]">
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="inline-flex items-center gap-1.5 font-semibold text-[#333333] hover:text-[#0475EE] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar à vitrine
        </button>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span className="text-[#0475EE] font-semibold truncate">{product.brand}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Gallery & Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
            <div className="aspect-[4/3] bg-[#FAFAFA] flex items-center justify-center p-6">
              <ProductImage
                src={product.images[selectedImageIdx] ?? product.images[0]}
                alt={product.title}
                category={product.category}
                className="max-h-[380px] w-auto max-w-full object-contain"
              />
            </div>

            {product.images.length > 1 && (
              <div className="p-3 bg-[#FAFAFA] border-t border-[#EAEAEA] flex items-center gap-2.5 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`Ver imagem ${idx + 1}`}
                    className={`w-20 h-16 rounded-[2px] overflow-hidden border-2 transition-colors shrink-0 cursor-pointer ${
                      selectedImageIdx === idx
                        ? 'border-[#0475EE]'
                        : 'border-[#E0E0E0] hover:border-[#0475EE]/60'
                    }`}
                  >
                    <ProductImage
                      src={img}
                      alt={`${product.title} — miniatura ${idx + 1}`}
                      category={product.category}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Technical Specs Table */}
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-6">
            <div>
              <h2 className="font-condensed text-[20px] font-bold uppercase tracking-wide text-[#0A3768]">
                Sobre o Produto
              </h2>
              <p className="mt-2 text-[13px] text-[#555555] leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="pt-5 border-t border-[#EAEAEA]">
              <h2 className="font-condensed text-[20px] font-bold uppercase tracking-wide text-[#0A3768] mb-3">
                Especificações Técnicas
              </h2>
              <dl className="divide-y divide-[#EAEAEA] border border-[#EAEAEA] rounded-[2px] overflow-hidden">
                {specItems.map((spec) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-1 sm:grid-cols-3 px-4 py-2.5 text-[13px] bg-white even:bg-[#F7F8FA]"
                  >
                    <dt className="font-semibold text-[#666666]">{spec.label}</dt>
                    <dd className="sm:col-span-2 font-medium text-[#333333] mt-0.5 sm:mt-0">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Seção de Avaliações Reais do Produto */}
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <div>
                <h3 className="font-condensed text-lg font-bold uppercase text-[#0A3768] tracking-wide">
                  Avaliações dos Clientes ({reviews.length})
                </h3>
                <p className="text-xs text-[#777777]">
                  Comentários de quem já comprou e testou este produto na Cellbox.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenReviewModal}
                className="h-8 px-4 rounded-[2px] bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold cursor-pointer"
              >
                + Avaliar Produto
              </button>
            </div>

            {loadingReviews ? (
              <p className="text-xs text-[#777777] py-4">Carregando avaliações...</p>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#888888]">
                Ainda não há avaliações registradas para este item. Compre e deixe o primeiro laudo!
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0] space-y-3 pt-2">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#333333]">{rev.userName}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? 'fill-[#F5A623] text-[#F5A623]'
                                  : 'fill-[#E0E0E0] text-[#E0E0E0]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#999999]">
                        {new Date(rev.createdAt).toLocaleDateString('pt-MZ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#555555] leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sticky Purchase Module + Seller Box */}
        <div className="lg:col-span-5 lg:sticky lg:top-[174px] space-y-5">
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-5 shadow-xs">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#888888]">
                {product.brand} · {product.category}
              </p>
              <h1 className="mt-1.5 font-condensed text-[24px] font-bold uppercase text-[#222222] leading-tight">
                {product.title}
              </h1>

              {/* Avaliação Real */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                {product.reviewCount > 0 ? (
                  <>
                    <div className="inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(product.rating)
                              ? 'fill-[#F5A623] text-[#F5A623]'
                              : 'fill-[#E0E0E0] text-[#E0E0E0]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold tabular-nums text-[#333333]">
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-[#CCCCCC]">|</span>
                    <span className="text-[#777777] tabular-nums">
                      ({product.reviewCount} {product.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[#888888]">Novo no catálogo · Sem avaliações ainda</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAEAEA]">
              {product.originalPrice && product.originalPrice > product.price && (
                <p className="text-xs text-[#999999] line-through tabular-nums">
                  {formatCurrency(product.originalPrice)}
                </p>
              )}
              <p className="text-[28px] font-extrabold tabular-nums text-[#0475EE] leading-tight">
                {formatCurrency(product.price)}
              </p>
              <p className="text-xs text-[#0A3768] font-semibold mt-1">
                Pagamento seguro via M-Pesa, e-Mola ou Cartão na Cellbox
              </p>
            </div>

            {/* Stock & Quantity */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-[#555555]">
                {product.stock > 0 ? (
                  <span className="text-[#0A3768] font-bold tabular-nums">
                    Em estoque ({product.stock} un.)
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold">Indisponível</span>
                )}
              </span>

              <div className="flex items-center border border-[#DCDCDC] rounded-[2px] overflow-hidden">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 text-[#333333] hover:bg-[#F1F2F4] font-bold cursor-pointer"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                  className="w-9 h-9 text-[#333333] hover:bg-[#F1F2F4] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="space-y-2.5 pt-1">
              <MotionButton
                type="button"
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart(product.id, quantity);
                  navigate({ type: 'cart' });
                }}
                className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:bg-[#CCCCCC] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Comprar Agora
              </MotionButton>
              <MotionButton
                type="button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product.id, quantity)}
                className="w-full h-10 rounded-full bg-[#18A3DE] hover:bg-[#0A3768] disabled:bg-[#CCCCCC] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar ao Carrinho
              </MotionButton>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => void toggleWishlist(product.id)}
                  className={`h-9 rounded-full border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isWished
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-[#DCDCDC] text-[#555555] hover:border-[#0475EE] hover:text-[#0475EE]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWished ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {isWished ? 'Salvo nos Desejos' : 'Lista de Desejos'}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => toggleCompare(product.id)}
                  className={`h-9 rounded-full border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isCompared
                      ? 'border-[#0475EE] bg-[#0475EE]/10 text-[#0A3768]'
                      : 'border-[#DCDCDC] text-[#555555] hover:border-[#0475EE] hover:text-[#0475EE]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  {isCompared ? 'No Comparador' : 'Comparar'}
                </motion.button>
              </div>
            </div>

            {/* ── Cupom de Desconto ── */}
            <div className="pt-4 border-t border-[#EAEAEA] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#333333]">
                <Tag className="w-4 h-4 text-[#0475EE]" />
                <span>Possui um Cupom de Desconto?</span>
              </div>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Inserir código"
                  className="flex-1 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs uppercase focus:outline-none focus:border-[#0475EE]"
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-[2px] bg-[#0A3768] hover:bg-[#0475EE] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </form>
              {appliedCouponCode && (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-[2px]">
                  <span>Cupom <strong>{appliedCouponCode}</strong> ativado!</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* Freight Calculator */}
            <div className="pt-4 border-t border-[#EAEAEA] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#333333]">
                <Truck className="w-4 h-4 text-[#0475EE]" />
                <span>Calcular frete e prazo</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShippingCalculated(true);
                }}
                className="flex gap-2"
              >
                <label htmlFor="pdp-cep-input" className="sr-only">
                  Código Postal de entrega
                </label>
                <input
                  id="pdp-cep-input"
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="1100"
                  className="flex-1 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs tabular-nums focus:outline-none focus:border-[#0475EE]"
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-[2px] border border-[#DCDCDC] hover:border-[#0475EE] hover:text-[#0475EE] text-xs font-bold uppercase text-[#444444] whitespace-nowrap cursor-pointer"
                >
                  Calcular
                </button>
              </form>

              {shippingCalculated && (
                <div className="bg-[#F1F2F4] rounded-[2px] p-3 text-xs space-y-1.5 border border-[#E5E7EB]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#444444] font-medium">
                      Entrega Padrão ({shippingQuote.standardDays})
                    </span>
                    <span className="tabular-nums font-bold text-[#0A3768]">
                      {shippingQuote.isFreeStandard
                        ? 'Grátis'
                        : formatCurrency(shippingQuote.standardCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#666666]">
                      Entrega Expressa ({shippingQuote.expressDays})
                    </span>
                    <span className="tabular-nums font-semibold text-[#333333]">
                      {formatCurrency(shippingQuote.expressCost)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#666666] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#0475EE] shrink-0" />
              <span>Compra Garantida Cellbox · Devolução facilitada</span>
            </div>
          </div>

          {/* Box do Vendedor */}
          {seller && (
            <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#777777] mb-3">
                Vendido e entregue por
              </p>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-[3px] flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                    style={{ backgroundColor: seller.accentColor || '#0475EE' }}
                  >
                    {seller.logoText}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[15px] font-bold text-[#333333]">{seller.name}</h3>
                      {seller.verified && (
                        <CheckCircle2
                          className="w-4 h-4 text-[#0475EE]"
                          aria-label="Lojista oficial verificado"
                        />
                      )}
                    </div>
                    <p className="text-xs text-[#777777] mt-0.5">
                      {seller.tenureLabel} · {seller.location}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs tabular-nums">
                  {seller.reviewCount > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 font-bold text-[#333333]">
                        <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                        {seller.rating.toFixed(1)}
                      </span>
                      <p className="text-[#999999]">{seller.reviewCount} aval.</p>
                    </>
                  ) : (
                    <span className="text-[10px] text-[#999999]">Nova loja</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#666666]">
                  <MapPin className="w-3.5 h-3.5 text-[#0475EE]" />
                  Envio seguro em Moçambique
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'store', sellerId: seller.id })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0475EE] hover:text-[#0A3768] cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  Visitar loja
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Avaliar Produto ── */}
      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#EAEAEA] flex items-center justify-between">
              <h3 className="font-condensed text-lg font-bold uppercase text-[#0A3768]">
                Avaliar Produto
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded text-[#777777] hover:bg-[#EAEAEA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-[#333333] mb-1">{product.title}</p>
                <label className="block text-xs font-medium text-[#666666] mb-1.5">
                  Classificação Geral
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= reviewRating
                            ? 'fill-[#F5A623] text-[#F5A623]'
                            : 'fill-[#E0E0E0] text-[#D0D0D0]'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-[#0A3768] ml-2">
                    {reviewRating} de 5
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-review-comment"
                  className="block text-xs font-bold text-[#444444] mb-1"
                >
                  Seu Comentário ou Avaliação *
                </label>
                <textarea
                  id="product-review-comment"
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Descreva o que achou da qualidade, acabamento, funcionamento e se recomenda o item..."
                  className="w-full p-3 rounded-[2px] border border-[#DCDCDC] text-xs focus:outline-none focus:border-[#0475EE]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="h-9 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? 'Enviando...' : 'Publicar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
