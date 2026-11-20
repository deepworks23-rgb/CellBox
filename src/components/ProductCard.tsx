import { Heart, Scale, ShoppingCart, Star } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Product } from '../types';
import { formatCurrency } from '../utils/marketplace';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  tiled?: boolean;
}

export function ProductCard({ product, tiled = true }: ProductCardProps) {
  const {
    sellers,
    wishlist,
    compareIds,
    addToCart,
    toggleWishlist,
    toggleCompare,
    navigate,
  } = useMarketplace();

  const seller = sellers.find((s) => s.id === product.sellerId);
  const isWished = wishlist.includes(product.id);
  const isCompared = compareIds.includes(product.id);
  const fullStars = Math.round(product.rating);

  return (
    <article
      className={`group relative bg-white flex flex-col items-center text-center p-4 transition-all duration-200 hover:z-10 hover:shadow-[0_6px_22px_rgba(0,0,0,0.08)] ${
        tiled
          ? 'border-r border-b border-[#EAEAEA]'
          : 'border border-[#EAEAEA] rounded-xs'
      }`}
    >
      {/* Subtle Top-Right Action Icons (Visible on hover or when active) */}
      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10">
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={
            isWished
              ? `Remover ${product.title} da lista de desejos`
              : `Salvar ${product.title} na lista de desejos`
          }
          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
            isWished
              ? 'bg-rose-50 border-rose-200 text-rose-500'
              : 'bg-white/95 border-[#E5E5E5] text-[#888888] opacity-80 group-hover:opacity-100 hover:text-[#43AA5B] hover:border-[#43AA5B]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWished ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => toggleCompare(product.id)}
          aria-label={
            isCompared
              ? `Remover ${product.title} do comparador`
              : `Comparar ${product.title}`
          }
          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
            isCompared
              ? 'bg-[#43AA5B] border-[#43AA5B] text-white'
              : 'bg-white/95 border-[#E5E5E5] text-[#888888] opacity-80 group-hover:opacity-100 hover:text-[#43AA5B] hover:border-[#43AA5B]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product Studio Image Stage (Clean centered frame matching reference) */}
      <button
        type="button"
        onClick={() => navigate({ type: 'product', productId: product.id })}
        aria-label={`Ver detalhes de ${product.title}`}
        className="w-full aspect-[4/3] mb-3.5 overflow-hidden bg-[#FAFAFA] flex items-center justify-center cursor-pointer"
      >
        <ProductImage
          src={product.images[0]}
          alt={product.title}
          category={product.category}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      {/* Product Title */}
      <button
        type="button"
        onClick={() => navigate({ type: 'product', productId: product.id })}
        className="text-[12.5px] font-medium text-[#444444] hover:text-[#43AA5B] leading-snug line-clamp-2 min-h-[34px] cursor-pointer transition-colors"
      >
        {product.title}
      </button>

      {/* 5 Golden Stars + Review Count (Exact Reference Style) */}
      <div className="mt-1.5 flex items-center justify-center gap-1">
        <div className="flex items-center gap-0.5" aria-label={`Avaliação ${product.rating} de 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`w-3 h-3 ${
                n <= fullStars
                  ? 'fill-[#F5A623] text-[#F5A623]'
                  : 'fill-[#E0E0E0] text-[#E0E0E0]'
              }`}
            />
          ))}
        </div>
        <span className="text-[10.5px] text-[#999999] tabular-nums">
          ({product.reviewCount} aval.)
        </span>
      </div>

      {/* Centered Bold Green Price */}
      <div className="mt-2">
        {product.originalPrice && product.originalPrice > product.price && (
          <p className="text-[11px] text-[#AAAAAA] line-through font-mono tabular-nums">
            {formatCurrency(product.originalPrice)}
          </p>
        )}
        <p className="text-[15px] font-bold text-[#43AA5B] font-mono tabular-nums">
          {formatCurrency(product.price)}
        </p>
      </div>

      {/* Store Attribution & Quick Add Footer */}
      <div className="mt-auto pt-3 w-full flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => seller && navigate({ type: 'store', sellerId: seller.id })}
          className="text-[10.5px] text-[#888888] hover:text-[#43AA5B] truncate max-w-full cursor-pointer"
        >
          {seller?.name ?? 'Cellbox'} · {product.condition}
        </button>

        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => addToCart(product.id)}
          aria-label={`Adicionar ${product.title} ao carrinho`}
          className="w-full h-8 px-3 rounded-full border border-[#43AA5B] text-[#43AA5B] hover:bg-[#43AA5B] hover:text-white disabled:border-[#DDDDDD] disabled:text-[#AAAAAA] text-[11px] font-bold uppercase tracking-wide inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{product.stock > 0 ? 'Adicionar' : 'Esgotado'}</span>
        </button>
      </div>
    </article>
  );
}
