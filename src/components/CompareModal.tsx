import { AnimatePresence, motion } from 'motion/react';
import { X, ShoppingCart, Scale, Star } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { formatCurrency } from '../utils/marketplace';
import { MotionButton, SPRING_CARD } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

export function CompareModal() {
  const {
    compareIds,
    compareOpen,
    setCompareOpen,
    products,
    sellers,
    toggleCompare,
    clearCompare,
    addToCart,
    navigate,
  } = useMarketplace();

  const comparedProducts = compareIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const specRows: Array<{ label: string; key: keyof (typeof comparedProducts)[0]['specs'] }> = [
    { label: 'Processador', key: 'processor' },
    { label: 'Memória RAM', key: 'ram' },
    { label: 'Armazenamento', key: 'storage' },
    { label: 'Tela', key: 'display' },
    { label: 'Bateria / Energia', key: 'battery' },
    { label: 'Garantia', key: 'warranty' },
  ];

  return (
    <AnimatePresence>
      {compareOpen && comparedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCompareOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={SPRING_CARD}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-5xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-[#F1F2F4] border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-[#0475EE]" />
                <h2
                  id="compare-modal-title"
                  className="font-condensed text-[20px] font-bold uppercase tracking-wide text-[#0A3768]"
                >
                  Comparativo Técnico ({comparedProducts.length}/3)
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearCompare();
                    setCompareOpen(false);
                  }}
                  className="text-xs font-semibold text-[#666666] hover:text-[#333333] whitespace-nowrap cursor-pointer"
                >
                  Limpar lista
                </button>
                <button
                  type="button"
                  onClick={() => setCompareOpen(false)}
                  aria-label="Fechar comparativo"
                  className="p-1.5 rounded-[3px] text-[#666666] hover:text-[#333333] hover:bg-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-auto p-6">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="w-40 pb-4 pr-4 text-xs font-bold uppercase text-[#666666] align-bottom">
                      Especificação
                    </th>
                    {comparedProducts.map((product) => {
                      const seller = sellers.find((s) => s.id === product.sellerId);
                      return (
                        <th key={product.id} className="pb-4 px-3 align-top min-w-[220px]">
                          <div className="relative bg-white rounded-[3px] p-3 border border-[#EAEAEA]">
                            <button
                              type="button"
                              onClick={() => toggleCompare(product.id)}
                              aria-label={`Remover ${product.title} do comparativo`}
                              className="absolute top-2 right-2 p-1 rounded-[2px] bg-white border border-[#E0E0E0] text-[#777777] hover:text-[#333333] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="aspect-[4/3] overflow-hidden bg-[#FAFAFA] mb-3">
                              <ProductImage
                                src={product.images[0]}
                                alt={product.title}
                                category={product.category}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCompareOpen(false);
                                navigate({ type: 'product', productId: product.id });
                              }}
                              className="text-[13px] font-semibold text-[#333333] hover:text-[#0475EE] text-left line-clamp-2 cursor-pointer"
                            >
                              {product.title}
                            </button>
                            <p className="text-[11px] text-[#777777] mt-1">
                              {product.brand} · {seller?.name ?? 'Cellbox'}
                            </p>
                            <p className="text-[16px] font-bold tabular-nums text-[#0475EE] mt-2">
                              {formatCurrency(product.price)}
                            </p>
                            <MotionButton
                              type="button"
                              onClick={() => addToCart(product.id)}
                              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white bg-[#0475EE] hover:bg-[#0A3768] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Adicionar
                            </MotionButton>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] text-[13px]">
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-[#666666]">Condição</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 font-medium text-[#333333]">
                        {p.condition}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-[#666666]">Avaliação</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-3 tabular-nums text-[#333333]">
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                          {p.rating.toFixed(1)} ({p.reviewCount})
                        </span>
                      </td>
                    ))}
                  </tr>
                  {specRows.map((row) => (
                    <tr key={row.key}>
                      <td className="py-3 pr-4 font-semibold text-[#666666]">{row.label}</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="py-3 px-3 text-[#444444]">
                          {p.specs[row.key] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
