import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Store,
  Tag,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Review } from '../types';
import { MotionButton } from './MotionPrimitives';
import { ProductCard } from './ProductCard';

interface SellerStoreViewProps {
  sellerId: string;
}

export function SellerStoreView({ sellerId }: SellerStoreViewProps) {
  const { sellers, products, navigate, currentUser, submitReview, fetchReviews } =
    useMarketplace();
  const seller = sellers.find((s) => s.id === sellerId);

  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    setLoadingReviews(true);
    fetchReviews('seller', sellerId)
      .then((data) => setReviews(data))
      .finally(() => setLoadingReviews(false));
  }, [sellerId, fetchReviews]);

  const storeProducts = useMemo(
    () => products.filter((p) => p.sellerId === sellerId),
    [products, sellerId]
  );

  const storeCategories = useMemo(() => {
    const cats = new Set(storeProducts.map((p) => p.category));
    return ['Todas', ...Array.from(cats).sort()];
  }, [storeProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todas') return storeProducts;
    return storeProducts.filter((p) => p.category === selectedCategory);
  }, [storeProducts, selectedCategory]);

  const handleOpenReviewModal = () => {
    if (!currentUser) {
      navigate({ type: 'auth', mode: 'login' });
      return;
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || !reviewComment.trim()) return;
    setSubmittingReview(true);
    const ok = await submitReview('seller', seller.id, reviewRating, reviewComment.trim());
    setSubmittingReview(false);
    if (ok) {
      setReviewModalOpen(false);
      setReviewComment('');
      // Reload reviews
      fetchReviews('seller', seller.id).then((data) => setReviews(data));
    }
  };

  if (!seller) {
    return (
      <main className="max-w-[1170px] mx-auto px-4 py-16 text-center">
        <h1 className="font-condensed text-2xl font-bold uppercase text-[#333333]">
          Loja não encontrada
        </h1>
        <MotionButton
          type="button"
          onClick={() => navigate({ type: 'stores' })}
          className="mt-4 h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
        >
          Voltar às Lojas
        </MotionButton>
      </main>
    );
  }

  const brandAccent = seller.accentColor || '#0475EE';

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-6 pb-20 space-y-6">
      {/* ── Store Banner (Dimensão 1000x300, imagem nítida com overlay apenas na parte inferior) ── */}
      <section
        className="relative text-white rounded-[4px] overflow-hidden shadow-sm w-full h-[260px] sm:h-[300px] flex flex-col justify-between p-5 sm:p-7"
        style={!seller.bannerImage ? { backgroundColor: '#0A3768' } : undefined}
      >
        {seller.bannerImage ? (
          <img
            src={seller.bannerImage}
            alt={`Capa da loja ${seller.name}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 cellbox-hero-gradient" />
        )}

        {/* Overlay escuro posicionado estritamente na base inferior onde ficam os textos */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0A3768]/95 via-[#0A3768]/45 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Bar inside banner */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ type: 'stores' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para todas as lojas
          </button>

          <span
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-xs backdrop-blur-xs"
            style={{ backgroundColor: brandAccent }}
          >
            {seller.mainCategory}
          </span>
        </div>

        {/* Bottom Info inside banner */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[4px] overflow-hidden shrink-0 border-2 border-white shadow-lg bg-white flex items-center justify-center">
              {seller.logoUrl ? (
                <img
                  src={seller.logoUrl}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-2xl font-black"
                  style={{ backgroundColor: brandAccent }}
                >
                  {seller.logoText}
                </div>
              )}
            </div>

            <div className="text-white">
              <div className="flex items-center gap-2">
                <h1 className="font-condensed text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white drop-shadow-sm">
                  {seller.name}
                </h1>
                {seller.verified && (
                  <CheckCircle2
                    className="w-5 h-5 text-[#1AD6DE] shrink-0"
                    aria-label="Loja Oficial Verificada"
                  />
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-white/90 line-clamp-1 max-w-xl mt-0.5">
                {seller.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/90">
                {seller.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-white tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                    {seller.rating.toFixed(1)} ({seller.reviewCount}{' '}
                    {seller.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                ) : (
                  <span className="text-white/80 font-medium">Sem avaliações ainda</span>
                )}
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1AD6DE]" />
                  {seller.location}
                </span>
                <span aria-hidden="true">·</span>
                <span>{seller.tenureLabel}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <MotionButton
              type="button"
              onClick={handleOpenReviewModal}
              className="h-9 px-5 rounded-full bg-white hover:bg-[#EAF6FC] text-[#0A3768] text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
              Avaliar Loja
            </MotionButton>
          </div>
        </div>
      </section>

      {/* ── 2-Column Layout: Sidebar Sticky + Catálogo & Avaliações ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sticky Sidebar acompanhando scroll vertical */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-4">
          {/* Card Sobre a Loja */}
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-4 space-y-3">
            <h3 className="font-condensed text-sm font-bold uppercase text-[#0A3768] tracking-wider flex items-center gap-2 border-b border-[#F0F0F0] pb-2">
              <Store className="w-4 h-4 text-[#0475EE]" />
              Sobre a Loja
            </h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              {seller.description || 'Loja oficial cadastrada na Cellbox.'}
            </p>
            <div className="space-y-2 pt-1 text-xs text-[#666666]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#0475EE] shrink-0" />
                <span>{seller.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-semibold">Garantia Cellbox Protegida</span>
              </div>
            </div>

            {/* Redes Sociais */}
            {seller.socials && Object.values(seller.socials).some(Boolean) && (
              <div className="pt-3 border-t border-[#F0F0F0] space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                  Canais Oficiais
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {seller.socials.instagram && (
                    <a
                      href={
                        seller.socials.instagram.startsWith('http')
                          ? seller.socials.instagram
                          : `https://instagram.com/${seller.socials.instagram.replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0475EE] text-[#0A3768] text-[11px] font-bold"
                    >
                      Instagram
                    </a>
                  )}
                  {seller.socials.facebook && (
                    <a
                      href={
                        seller.socials.facebook.startsWith('http')
                          ? seller.socials.facebook
                          : `https://facebook.com/${seller.socials.facebook}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0475EE] text-[#0A3768] text-[11px] font-bold"
                    >
                      Facebook
                    </a>
                  )}
                  {seller.socials.tiktok && (
                    <a
                      href={
                        seller.socials.tiktok.startsWith('http')
                          ? seller.socials.tiktok
                          : `https://tiktok.com/@${seller.socials.tiktok.replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0475EE] text-[#0A3768] text-[11px] font-bold"
                    >
                      TikTok
                    </a>
                  )}
                  {seller.socials.youtube && (
                    <a
                      href={
                        seller.socials.youtube.startsWith('http')
                          ? seller.socials.youtube
                          : `https://youtube.com/${seller.socials.youtube}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0475EE] text-[#0A3768] text-[11px] font-bold"
                    >
                      YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Categorias dos Produtos da Loja */}
          <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-4 space-y-2">
            <h3 className="font-condensed text-sm font-bold uppercase text-[#0A3768] tracking-wider flex items-center gap-2 border-b border-[#F0F0F0] pb-2">
              <Tag className="w-4 h-4 text-[#0475EE]" />
              Categorias da Loja
            </h3>
            <div className="flex flex-col gap-1">
              {storeCategories.map((cat) => {
                const count =
                  cat === 'Todas'
                    ? storeProducts.length
                    : storeProducts.filter((p) => p.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#0475EE] text-white font-bold'
                        : 'text-[#444444] hover:bg-[#F4F6F8]'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#EAEAEA] text-[#777777]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumo de Reputação & Avaliações */}
          <div className="bg-[#FAFBFD] border border-[#EAEAEA] rounded-[3px] p-4 space-y-3">
            <h3 className="font-condensed text-sm font-bold uppercase text-[#0A3768] tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
              Reputação & Avaliações
            </h3>
            {seller.reviewCount > 0 ? (
              <div className="text-center py-2 bg-white rounded-[2px] border border-[#EEEEEE]">
                <p className="font-condensed text-3xl font-black text-[#0A3768]">
                  {seller.rating.toFixed(1)}
                </p>
                <div className="flex justify-center gap-0.5 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= Math.round(seller.rating)
                          ? 'fill-[#F5A623] text-[#F5A623]'
                          : 'fill-[#E0E0E0] text-[#E0E0E0]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-[#777777]">
                  Baseado em {seller.reviewCount}{' '}
                  {seller.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#777777] italic">
                Nenhum cliente avaliou esta loja ainda. Seja o primeiro a deixar uma opinião!
              </p>
            )}

            <button
              type="button"
              onClick={handleOpenReviewModal}
              className="w-full h-8 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#0475EE] hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              + Escrever Avaliação
            </button>
          </div>
        </aside>

        {/* Coluna Principal: Produtos da Loja e Seção de Avaliações */}
        <div className="flex-1 w-full space-y-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EAEAEA] mb-4">
              <h2 className="font-condensed text-[20px] font-bold uppercase tracking-wide text-[#0A3768]">
                PRODUTOS DE {seller.name} ({filteredProducts.length})
              </h2>
              <span className="text-xs text-[#777777]">
                Filtrado por: <strong className="text-[#333333]">{selectedCategory}</strong>
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-12 text-center text-sm text-[#777777]">
                Nenhum produto encontrado nesta categoria para esta loja.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-t border-l border-[#EAEAEA] bg-white">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* Seção Completa de Avaliações e Comentários dos Clientes */}
          <section className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <div>
                <h3 className="font-condensed text-lg font-bold uppercase text-[#0A3768] tracking-wide">
                  Avaliações dos Compradores ({reviews.length})
                </h3>
                <p className="text-xs text-[#777777]">
                  Opiniões de compradores reais que negociaram com esta loja na Cellbox.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenReviewModal}
                className="h-8 px-4 rounded-[2px] bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold cursor-pointer"
              >
                + Avaliar Loja
              </button>
            </div>

            {loadingReviews ? (
              <p className="text-xs text-[#777777] py-4">Carregando avaliações...</p>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#888888]">
                Esta loja ainda não possui comentários ou avaliações registradas.
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0] space-y-4 pt-2">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
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
          </section>
        </div>
      </div>

      {/* ── Modal de Avaliar Loja ── */}
      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#EAEAEA] flex items-center justify-between">
              <h3 className="font-condensed text-lg font-bold uppercase text-[#0A3768]">
                Avaliar {seller.name}
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
                <label className="block text-xs font-bold text-[#444444] mb-1.5">
                  Sua Nota de Experiência (1 a 5 estrelas)
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
                  htmlFor="seller-review-comment"
                  className="block text-xs font-bold text-[#444444] mb-1"
                >
                  Seu Comentário sobre o Atendimento e Entrega *
                </label>
                <textarea
                  id="seller-review-comment"
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Conte sua experiência com esta loja (agilidade na entrega, suporte, embalagem, garantia)..."
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
