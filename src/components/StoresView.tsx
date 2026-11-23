import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Star,
  Store,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ASSET_IMAGES } from '../data/seedData';
import type { SellerStore } from '../types';
import { formatCurrency, isStorePubliclyActive } from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

function getStoreCoverImage(store: SellerStore, index: number): string {
  const cat = store.mainCategory.toLowerCase();
  if (cat.includes('laptop')) return ASSET_IMAGES.macbookPro;
  if (cat.includes('smartphone')) return ASSET_IMAGES.iphone16Pro;
  if (cat.includes('áudio') || cat.includes('audio')) return ASSET_IMAGES.sonyHeadphones;
  if (cat.includes('gaming')) return ASSET_IMAGES.gamingHandheld;
  if (cat.includes('tablet')) return ASSET_IMAGES.ipadPro;
  if (store.bannerImage) return store.bannerImage;
  return index % 2 === 0 ? ASSET_IMAGES.hero : ASSET_IMAGES.dellXps;
}

export function StoresView() {
  const { sellers, products, navigate } = useMarketplace();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const activeStores = useMemo(
    () => sellers.filter(isStorePubliclyActive),
    [sellers]
  );

  const storeCategories = useMemo(() => {
    const unique = Array.from(new Set(activeStores.map((s) => s.mainCategory))).sort();
    return ['Todas', ...unique];
  }, [activeStores]);

  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeStores.filter((store) => {
      if (selectedCategory !== 'Todas' && store.mainCategory !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        store.name.toLowerCase().includes(q) ||
        store.mainCategory.toLowerCase().includes(q) ||
        store.location.toLowerCase().includes(q) ||
        store.description.toLowerCase().includes(q)
      );
    });
  }, [activeStores, search, selectedCategory]);

  const totalActiveProducts = useMemo(() => {
    const activeIds = new Set(activeStores.map((s) => s.id));
    return products.filter((p) => activeIds.has(p.sellerId)).length;
  }, [activeStores, products]);

  return (
    <main className="bg-white pb-16" data-testid="stores-page">
      <div className="max-w-[1170px] mx-auto px-4 pt-6 space-y-7">
        {/* Static Header Banner (zero hover animations) */}
        <section className="cellbox-hero-gradient text-white rounded-[3px] px-6 sm:px-10 py-9">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-condensed text-xs sm:text-sm uppercase tracking-widest text-[#B7EBF2] font-semibold">
                DIRETÓRIO DE PARCEIROS OFICIAIS
              </p>
              <h1 className="font-condensed text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-tight mt-1.5">
                LOJAS DISPONÍVEIS NA CELLBOX
              </h1>
              <p className="text-sm text-white/90 mt-2.5 max-w-2xl leading-relaxed">
                Explore todas as lojas oficiais e parceiros verificados disponíveis na plataforma.
                Cada lojista passa por auditoria documental e oferece garantia nacional em Meticais
                (MT).
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-white/12 border border-white/20 rounded-[3px] px-4 py-2.5 text-center">
                <p className="font-condensed text-2xl font-bold text-white tabular-nums">
                  {activeStores.length}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/85">
                  {activeStores.length === 1 ? 'Loja Ativa' : 'Lojas Ativas'}
                </p>
              </div>
              <div className="bg-white/12 border border-white/20 rounded-[3px] px-4 py-2.5 text-center">
                <p className="font-condensed text-2xl font-bold text-white tabular-nums">
                  {totalActiveProducts}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/85">
                  Produtos Oficiais
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Category Filter Bar */}
        <section
          aria-label="Filtrar lojas"
          className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <label htmlFor="stores-search-input" className="sr-only">
              Pesquisar lojas
            </label>
            <input
              id="stores-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar loja por nome, categoria ou cidade..."
              className="w-full h-9 pl-9 pr-8 bg-white border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333] focus:outline-none focus:border-[#0475EE]"
            />
            {search && (
              <button
                type="button"
                aria-label="Limpar busca de lojas"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#333333] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {storeCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <MotionButton
                  key={cat}
                  type="button"
                  hoverScale={1.03}
                  hoverY={0}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 px-3.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0475EE] text-white'
                      : 'bg-white border border-[#DCDCDC] text-[#555555] hover:border-[#0475EE] hover:text-[#0475EE]'
                  }`}
                >
                  {cat}
                </MotionButton>
              );
            })}
          </div>
        </section>

        {/* Directory Listing */}
        {filteredStores.length === 0 ? (
          <div className="border border-[#EAEAEA] rounded-[3px] py-14 px-6 text-center bg-[#FAFAFA]">
            <Store className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#0A3768]">
              Nenhuma loja encontrada para os filtros aplicados.
            </p>
            <MotionButton
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('Todas');
              }}
              className="mt-4 h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wide cursor-pointer"
            >
              Ver Todas as Lojas
            </MotionButton>
          </div>
        ) : (
          <section
            aria-label="Lista de lojas disponíveis"
            data-testid="stores-directory-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredStores.map((store, idx) => {
              const storeProducts = products.filter((p) => p.sellerId === store.id);
              const previewProducts = storeProducts.slice(0, 3);
              const coverImg = getStoreCoverImage(store, idx);

              return (
                <article
                  key={store.id}
                  data-testid={`store-directory-card-${store.id}`}
                  className="bg-white border border-[#E5E7EB] rounded-[3px] overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(10,55,104,0.04)]"
                >
                  {/* Static Store Visual Cover + Logo Badge */}
                  <div className="relative h-40 bg-[#0A3768] overflow-hidden">
                    <img
                      src={coverImg}
                      alt={`Vitrine ${store.name}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A3768]/90 via-[#0A3768]/35 to-transparent" />

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-[2px] bg-white/95 text-[#0A3768] text-[10px] font-bold uppercase tracking-wider">
                        {store.mainCategory}
                      </span>
                    </div>

                    <div className="absolute bottom-3.5 left-4 right-4 flex items-end gap-3.5">
                      <div
                        className="w-14 h-14 rounded-[4px] flex items-center justify-center text-white text-xl font-extrabold shrink-0 border-2 border-white shadow-md"
                        style={{ backgroundColor: store.accentColor }}
                        aria-hidden="true"
                      >
                        {store.logoText}
                      </div>
                      <div className="min-w-0 text-white">
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-condensed text-2xl font-bold uppercase tracking-wide truncate">
                            {store.name}
                          </h2>
                          {store.verified && (
                            <CheckCircle2
                              className="w-4 h-4 text-[#1AD6DE] shrink-0"
                              aria-label="Loja Verificada"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-white/90 mt-0.5">
                          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                            {store.rating.toFixed(1)} ({store.reviewCount})
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#1AD6DE]" />
                            {store.location}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{store.tenureLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Store Details & Product Preview */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <p className="text-xs text-[#555555] leading-relaxed">{store.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#666666] pt-1">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#0A3768]">
                        <Package className="w-3.5 h-3.5 text-[#0475EE]" />
                        {storeProducts.length}{' '}
                        {storeProducts.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#18A3DE]" />
                        Garantia Oficial Cellbox
                      </span>
                    </div>

                    {previewProducts.length > 0 && (
                      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#F0F0F0]">
                        {previewProducts.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => navigate({ type: 'product', productId: prod.id })}
                            className="text-left group cursor-pointer"
                          >
                            <div className="aspect-[4/3] bg-[#F8FAFC] border border-[#EAEAEA] rounded-[2px] overflow-hidden mb-1">
                              <ProductImage
                                src={prod.images[0]}
                                alt={prod.title}
                                category={prod.category}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[11px] font-medium text-[#333333] group-hover:text-[#0475EE] truncate">
                              {prod.title}
                            </p>
                            <p className="text-[11px] font-bold font-mono tabular-nums text-[#0475EE]">
                              {formatCurrency(prod.price)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-[#EFEFEF] flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#777777]">
                        Especialidade:{' '}
                        <strong className="text-[#0A3768]">{store.mainCategory}</strong>
                      </span>
                      <MotionButton
                        type="button"
                        data-testid={`visit-store-${store.id}`}
                        onClick={() => navigate({ type: 'store', sellerId: store.id })}
                        className="h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Visitar Loja</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </MotionButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
