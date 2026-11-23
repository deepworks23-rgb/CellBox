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
      {/* Store Banner with custom banner image or official gradient */}
      <section
        className="relative text-white rounded-[3px] p-6 sm:p-8 overflow-hidden cellbox-hero-gradient shadow-sm"
        style={
          seller.bannerImage
            ? {
                backgroundImage: `linear-gradient(to right, rgba(10,55,104,0.92) 0%, rgba(10,55,104,0.7) 100%), url(${seller.bannerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <button
          type="button"
          onClick={() => navigate({ type: 'stores' })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85 hover:text-white mb-5 cursor-pointer relative z-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para todas as lojas
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[4px] overflow-hidden shrink-0 border-2 border-white/60 shadow-md bg-white flex items-center justify-center">
              {seller.logoUrl ? (
                <img
                  src={seller.logoUrl}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-2xl font-extrabold"
                  style={{ backgroundColor: seller.accentColor }}
                >
                  {seller.logoText}
                </div>
              )}
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

              {/* Social Media Links if provided */}
              {seller.socials && Object.values(seller.socials).some(Boolean) && (
                <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-white/70 font-semibold text-[11px] uppercase tracking-wider">Redes da Loja:</span>
                  {seller.socials.instagram && (
                    <a
                      href={seller.socials.instagram.startsWith('http') ? seller.socials.instagram : `https://instagram.com/${seller.socials.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {seller.socials.facebook && (
                    <a
                      href={seller.socials.facebook.startsWith('http') ? seller.socials.facebook : `https://facebook.com/${seller.socials.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {seller.socials.tiktok && (
                    <a
                      href={seller.socials.tiktok.startsWith('http') ? seller.socials.tiktok : `https://tiktok.com/@${seller.socials.tiktok.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-colors"
                    >
                      TikTok
                    </a>
                  )}
                  {seller.socials.youtube && (
                    <a
                      href={seller.socials.youtube.startsWith('http') ? seller.socials.youtube : `https://youtube.com/${seller.socials.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-colors"
                    >
                      YouTube
                    </a>
                  )}
                </div>
              )}
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
