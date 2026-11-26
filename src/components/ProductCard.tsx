import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Heart, Scale, ShoppingCart, Star } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Product } from '../types';
import { formatCurrency } from '../utils/marketplace';
import { SPRING_CARD, SPRING_POP, SPRING_SNAPPY } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  tiled?: boolean;
  className?: string;
}

export function ProductCard({ product, tiled = true, className = '' }: ProductCardProps) {
  const {
    sellers,
    wishlist,
    compareIds,
    addToCart,
    toggleWishlist,
    toggleCompare,
    navigate,
  } = useMarketplace();

  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const seller = sellers.find((s) => s.id === product.sellerId);
  const isWished = wishlist.includes(product.id);
  const isCompared = compareIds.includes(product.id);
  const fullStars = Math.round(product.rating);

  const handleAdd = () => {
    if (product.stock <= 0) return;
    addToCart(product.id);
    setJustAdded(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setJustAdded(false), 1150);
  };

  return (
    <motion.article
      whileHover={{
        y: -5,
        boxShadow: '0 14px 32px -6px rgba(10, 55, 104, 0.14)',
      }}
      transition={SPRING_CARD}
      data-testid={`product-card-${product.id}`}
      className={`group relative bg-white flex flex-col items-center text-center p-4 hover:z-20 ${
        tiled
          ? 'border-r border-b border-[#EAEAEA]'
          : 'border border-[#EAEAEA] rounded-xs'
      } ${className}`}
    >
      {/* Subtle Top-Right Action Icons with tactile spring hover & click */}
      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
        <motion.button
          type="button"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.85 }}
          transition={SPRING_SNAPPY}
          onClick={() => toggleWishlist(product.id)}
          aria-label={
            isWished
              ? `Remover ${product.title} da lista de desejos`
              : `Salvar ${product.title} na lista de desejos`
          }
          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
            isWished
              ? 'bg-rose-50 border-rose-200 text-rose-500'
              : 'bg-white/95 border-[#E5E5E5] text-[#888888] opacity-85 group-hover:opacity-100 hover:text-[#0475EE] hover:border-[#0475EE]'
          }`}
        >
          <motion.span
            key={isWished ? 'wished' : 'idle'}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={SPRING_POP}
            className="inline-flex"
          >
            <Heart className={`w-3.5 h-3.5 ${isWished ? 'fill-rose-500 text-rose-500' : ''}`} />
          </motion.span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.85 }}
          transition={SPRING_SNAPPY}
          onClick={() => toggleCompare(product.id)}
          aria-label={
            isCompared
              ? `Remover ${product.title} do comparador`
              : `Comparar ${product.title}`
          }
          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
            isCompared
              ? 'bg-[#0475EE] border-[#0475EE] text-white'
              : 'bg-white/95 border-[#E5E5E5] text-[#888888] opacity-85 group-hover:opacity-100 hover:text-[#0475EE] hover:border-[#0475EE]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Product Studio Image Stage */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={SPRING_SNAPPY}
        onClick={() => navigate({ type: 'product', productId: product.id })}
        aria-label={`Ver detalhes de ${product.title}`}
        className="w-full aspect-[4/3] mb-3.5 overflow-hidden bg-[#FAFAFA] flex items-center justify-center cursor-pointer"
      >
        <ProductImage
          src={product.images[0]}
          alt={product.title}
          category={product.category}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-108"
        />
      </motion.button>

      {/* Product Title */}
      <button
        type="button"
        onClick={() => navigate({ type: 'product', productId: product.id })}
        className="text-[12.5px] font-medium text-[#333333] hover:text-[#0475EE] leading-snug line-clamp-2 min-h-[34px] cursor-pointer transition-colors"
      >
        {product.title}
      </button>

      {/* Stars + Review Count */}
      <div className="mt-1.5 flex items-center justify-center gap-1 min-h-[16px]">
        {product.reviewCount > 0 ? (
          <>
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
              ({product.reviewCount})
            </span>
          </>
        ) : (
          <span className="text-[10.5px] text-[#AAAAAA] whitespace-nowrap">Sem avaliações</span>
        )}
      </div>

      {/* Centered Bold Brand Price in Metical (MT) */}
      <div className="mt-2">
        {product.originalPrice && product.originalPrice > product.price && (
          <p className="text-[11px] text-[#AAAAAA] line-through font-mono tabular-nums whitespace-nowrap">
            {formatCurrency(product.originalPrice)}
          </p>
        )}
        <p className="text-[14.5px] font-bold text-[#0475EE] font-mono tabular-nums whitespace-nowrap">
          {formatCurrency(product.price)}
        </p>
      </div>

      {/* Store Attribution & Quick Add Footer */}
      <div className="mt-auto pt-3 w-full flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => seller && navigate({ type: 'store', sellerId: seller.id })}
          className="text-[10.5px] text-[#888888] hover:text-[#0475EE] truncate max-w-full cursor-pointer transition-colors"
        >
          {seller?.name ?? 'Cellbox'} · {product.condition}
        </button>

        <motion.button
          type="button"
          disabled={product.stock <= 0}
          whileHover={product.stock > 0 ? { scale: 1.03, y: -1 } : undefined}
          whileTap={product.stock > 0 ? { scale: 0.95 } : undefined}
          transition={SPRING_SNAPPY}
          onClick={handleAdd}
          aria-label={`Adicionar ${product.title} ao carrinho`}
          className={`w-full h-8 px-3 rounded-full border text-[11px] font-bold uppercase tracking-wide inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            justAdded
              ? 'bg-[#0A3768] border-[#0A3768] text-white'
              : 'border-[#0475EE] text-[#0475EE] hover:bg-[#0475EE] hover:text-white disabled:border-[#DDDDDD] disabled:text-[#AAAAAA]'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {justAdded ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={SPRING_POP}
                className="inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#1AD6DE]" />
                <span>Adicionado!</span>
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.14 }}
                className="inline-flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{product.stock > 0 ? 'Adicionar' : 'Esgotado'}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.article>
  );
}
