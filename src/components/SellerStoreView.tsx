import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, Star } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MotionButton } from './MotionPrimitives';
import { ProductCard } from './ProductCard';

interface SellerStoreViewProps {
  sellerId: string;
}

export function SellerStoreView({ sellerId }: SellerStoreViewProps) {
  const { sellers, products, navigate } = useMarketplace();
  const seller = sellers.find((s) => s.id === sellerId);

  if (!seller) {
    return (
      <main className="max-w-[1170px] mx-auto px-4 py-16 text-center">
        <h1 className="font-condensed text-2xl font-bold uppercase text-[#333333]">
          Loja não encontrada
        </h1>
        <MotionButton
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="mt-4 h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
        >
          Voltar à vitrine
        </MotionButton>
      </main>
    );
  }

  const storeProducts = products.filter((p) => p.sellerId === seller.id);

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-6 pb-16 space-y-6">
      {/* Store Banner matching Digimart green gradient aesthetic */}
      <section className="cellbox-hero-gradient text-white rounded-[3px] p-6 sm:p-8">
        <button
          type="button"
          onClick={() => navigate({ type: 'stores' })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85 hover:text-white mb-5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para todas as lojas
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-[4px] flex items-center justify-center text-white text-2xl font-extrabold shrink-0 border-2 border-white/40 shadow-sm"
              style={{ backgroundColor: seller.accentColor }}
            >
              {seller.logoText}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-condensed text-3xl font-bold uppercase tracking-wide text-white">
                  {seller.name}
                </h1>
                {seller.verified && (
                  <CheckCircle2
                    className="w-5 h-5 text-white shrink-0"
                    aria-label="Loja Oficial Verificada"
                  />
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-white/90 max-w-2xl leading-relaxed">
                {seller.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/85">
                <span className="inline-flex items-center gap-1 text-white tabular-nums font-bold">
                  <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                  {seller.rating.toFixed(1)} ({seller.reviewCount} avaliações)
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {seller.location}
                </span>
                <span aria-hidden="true">·</span>
                <span>{seller.tenureLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Garantia Cellbox
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAEAEA] mb-4">
          <h2 className="font-condensed text-[22px] font-bold uppercase tracking-wide text-[#0A3768]">
            PRODUTOS DE {seller.name} ({storeProducts.length})
          </h2>
          <span className="text-xs text-[#777777]">
            Categoria principal: <strong className="text-[#333333]">{seller.mainCategory}</strong>
          </span>
        </div>

        {storeProducts.length === 0 ? (
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-12 text-center text-sm text-[#777777]">
            Esta loja ainda não publicou produtos no catálogo.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-[#EAEAEA] bg-white">
            {storeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
