import { useState } from 'react';
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
  Truck,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { calculateShipping, formatCurrency } from '../utils/marketplace';
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
  } = useMarketplace();

  const product = products.find((p) => p.id === productId);
  const seller = product ? sellers.find((s) => s.id === product.sellerId) : undefined;

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState('01310-100');
  const [shippingCalculated, setShippingCalculated] = useState(true);

  if (!product) {
    return (
      <main className="max-w-[1170px] mx-auto px-4 py-16 text-center">
        <h1 className="font-condensed text-2xl font-bold uppercase text-[#333333]">
          Produto não encontrado
        </h1>
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="mt-4 h-10 px-6 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
        >
          Voltar à vitrine
        </button>
      </main>
    );
  }

  const isWished = wishlist.includes(product.id);
  const isCompared = compareIds.includes(product.id);
  const shippingQuote = calculateShipping(cep, product.price * quantity);

  const specItems = [
    { label: 'Condição', value: product.condition },
    { label: 'Processador', value: product.specs.processor },
    { label: 'Memória RAM', value: product.specs.ram },
    { label: 'Armazenamento', value: product.specs.storage },
    { label: 'Tela', value: product.specs.display },
    { label: 'Bateria / Energia', value: product.specs.battery },
    { label: 'Garantia', value: product.specs.warranty },
  ].filter((item) => Boolean(item.value));

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#777777] mb-5 pb-3 border-b border-[#EAEAEA]">
        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="inline-flex items-center gap-1.5 font-semibold text-[#333333] hover:text-[#43AA5B] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar à vitrine
        </button>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span className="text-[#43AA5B] font-semibold truncate">{product.brand}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Gallery & Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
            <div className="aspect-[4/3] bg-white p-4 flex items-center justify-center">
              <ProductImage
                src={product.images[selectedImageIdx] ?? product.images[0]}
                alt={product.title}
                category={product.category}
                className="w-full h-full object-cover rounded-[2px]"
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
                        ? 'border-[#43AA5B]'
                        : 'border-[#E0E0E0] hover:border-[#43AA5B]/60'
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
              <h2 className="font-condensed text-[20px] font-bold uppercase tracking-wide text-[#43AA5B]">
                Sobre o Produto
              </h2>
              <p className="mt-2 text-[13px] text-[#555555] leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="pt-5 border-t border-[#EAEAEA]">
              <h2 className="font-condensed text-[20px] font-bold uppercase tracking-wide text-[#43AA5B] mb-3">
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
        </div>

        {/* Right: Sticky Contiguous Purchase Module + Seller Box */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-5">
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#777777]">
                {product.brand} · {product.condition} · {product.soldCount} vendidos
              </p>
              <h1 className="mt-1.5 font-condensed text-[26px] font-bold uppercase text-[#222222] leading-tight">
                {product.title}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-xs">
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
                  ({product.reviewCount} avaliações)
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAEAEA]">
              {product.originalPrice && product.originalPrice > product.price && (
                <p className="text-xs text-[#999999] line-through tabular-nums">
                  {formatCurrency(product.originalPrice)}
                </p>
              )}
              <p className="text-[28px] font-extrabold tabular-nums text-[#43AA5B] leading-tight">
                {formatCurrency(product.price)}
              </p>
              <p className="text-xs text-[#2F8E47] font-semibold mt-1">
                10% OFF no PIX ou até 12x de {formatCurrency(product.price / 12)} sem juros
              </p>
            </div>

            {/* Stock & Quantity */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-[#555555]">
                {product.stock > 0 ? (
                  <span className="text-[#2F8E47] font-bold tabular-nums">
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
                <span className="w-10 text-center text-sm font-mono tabular-nums font-bold">
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
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart(product.id, quantity);
                  navigate({ type: 'cart' });
                }}
                className="w-full h-11 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] disabled:bg-[#CCCCCC] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Comprar Agora
              </button>
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product.id, quantity)}
                className="w-full h-10 rounded-full bg-[#0070B8] hover:bg-[#005B96] disabled:bg-[#CCCCCC] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar ao Carrinho
              </button>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`h-9 rounded-full border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isWished
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-[#DCDCDC] text-[#555555] hover:border-[#43AA5B] hover:text-[#43AA5B]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWished ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {isWished ? 'Salvo nos Desejos' : 'Lista de Desejos'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompare(product.id)}
                  className={`h-9 rounded-full border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isCompared
                      ? 'border-[#43AA5B] bg-[#43AA5B]/10 text-[#2F8E47]'
                      : 'border-[#DCDCDC] text-[#555555] hover:border-[#43AA5B] hover:text-[#43AA5B]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  {isCompared ? 'No Comparador' : 'Comparar'}
                </button>
              </div>
            </div>

            {/* Freight Calculator */}
            <div className="pt-4 border-t border-[#EAEAEA] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#333333]">
                <Truck className="w-4 h-4 text-[#43AA5B]" />
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
                  CEP de entrega
                </label>
                <input
                  id="pdp-cep-input"
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="flex-1 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs font-mono tabular-nums focus:outline-none focus:border-[#43AA5B]"
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-[2px] border border-[#DCDCDC] hover:border-[#43AA5B] hover:text-[#43AA5B] text-xs font-bold uppercase text-[#444444] whitespace-nowrap cursor-pointer"
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
                    <span className="font-mono tabular-nums font-bold text-[#2F8E47]">
                      {shippingQuote.isFreeStandard
                        ? 'Grátis'
                        : formatCurrency(shippingQuote.standardCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#666666]">
                      Entrega Expressa ({shippingQuote.expressDays})
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#333333]">
                      {formatCurrency(shippingQuote.expressCost)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#666666] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#43AA5B] shrink-0" />
              <span>Compra Garantida Cellbox · Devolução grátis em até 30 dias</span>
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
                    style={{ backgroundColor: seller.accentColor }}
                  >
                    {seller.logoText}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[15px] font-bold text-[#333333]">{seller.name}</h3>
                      {seller.verified && (
                        <CheckCircle2
                          className="w-4 h-4 text-[#43AA5B]"
                          aria-label="Lojista oficial verificado"
                        />
                      )}
                    </div>
                    <p className="text-xs text-[#777777] mt-0.5">
                      {seller.tenureLabel} · {seller.location}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1 font-bold text-[#333333]">
                    <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                    {seller.rating.toFixed(1)}
                  </span>
                  <p className="text-[#999999]">{seller.reviewCount} aval.</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#666666]">
                  <MapPin className="w-3.5 h-3.5 text-[#43AA5B]" />
                  Envio rápido com NF-e
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'store', sellerId: seller.id })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#43AA5B] hover:text-[#2F8E47] cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  Visitar loja do vendedor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
