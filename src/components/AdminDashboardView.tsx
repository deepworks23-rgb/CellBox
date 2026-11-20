import React, { useMemo, useState } from 'react';
import {
  Ban,
  BarChart3,
  CheckCircle2,
  Eye,
  Layers,
  Percent,
  Plus,
  RotateCcw,
  ShieldCheck,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import type { SellerStatus, SellerStore } from '../types';
import {
  calculatePlatformAnalytics,
  calculateSellerAnalytics,
  formatCurrency,
} from '../utils/marketplace';
import { ProductImage } from './ProductImage';

interface AdminDashboardViewProps {
  initialTab?: 'overview' | 'sellers' | 'catalog' | 'finance';
}

export function AdminDashboardView({ initialTab = 'overview' }: AdminDashboardViewProps) {
  const {
    users,
    sellers,
    products,
    categories,
    orders,
    commissionRate,
    setSellerStatus,
    addCategory,
    removeCategory,
    deleteProduct,
    setCommissionRate,
    resetDemoData,
    navigate,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'catalog' | 'finance'>(
    initialTab
  );
  const [sellerFilter, setSellerFilter] = useState<'all' | SellerStatus>('all');
  const [inspectedSeller, setInspectedSeller] = useState<SellerStore | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [draftCommission, setDraftCommission] = useState<string>(String(commissionRate));

  const analytics = useMemo(
    () => calculatePlatformAnalytics(orders, sellers, commissionRate),
    [orders, sellers, commissionRate]
  );

  const filteredSellers = useMemo(() => {
    if (sellerFilter === 'all') return sellers;
    return sellers.filter((s) => s.status === sellerFilter);
  }, [sellers, sellerFilter]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (addCategory(newCategoryName)) {
      setNewCategoryName('');
    }
  };

  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(draftCommission);
    if (Number.isFinite(num) && num >= 1 && num <= 35) {
      setCommissionRate(num);
    }
  };

  const navItems = [
    { id: 'overview' as const, label: 'Dashboard Global', icon: BarChart3 },
    {
      id: 'sellers' as const,
      label: 'Vendedores',
      icon: Store,
      badge: analytics.pendingSellersCount > 0 ? analytics.pendingSellersCount : undefined,
    },
    { id: 'catalog' as const, label: 'Catálogo e Categorias', icon: Layers },
    { id: 'finance' as const, label: 'Financeiro e Comissões', icon: Percent },
  ];

  const statusLabel = (s: SellerStatus) =>
    s === 'active' ? 'Ativo' : s === 'pending' ? 'Pendente' : 'Suspenso';

  const statusColor = (s: SellerStatus) =>
    s === 'active'
      ? 'text-emerald-700'
      : s === 'pending'
        ? 'text-amber-700'
        : 'text-rose-700';

  return (
    <div className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar (Official Cellbox Deep Navy #0A3768) */}
        <aside className="lg:col-span-3 bg-[#0A3768] text-white rounded-[3px] p-4 space-y-5">
          <div className="flex items-center gap-3 px-2 pt-1 pb-4 border-b border-white/15">
            <div className="w-10 h-10 rounded-[3px] bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#1AD6DE]" />
            </div>
            <div>
              <p className="font-condensed text-[16px] font-bold uppercase tracking-wide text-white leading-tight">
                Super Admin
              </p>
              <p className="text-[11px] text-white/80">Gestão Master Cellbox</p>
            </div>
          </div>

          <nav aria-label="Navegação do Super Admin" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[3px] text-[13px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-[#0A3768]'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="text-xs font-mono tabular-nums font-extrabold px-1.5 py-0.5 rounded-[2px] bg-[#F5A623] text-[#1F2937]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/15 space-y-2">
            <button
              type="button"
              onClick={() => navigate({ type: 'home' })}
              className="w-full h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold uppercase text-white cursor-pointer"
            >
              Ver Vitrine Pública
            </button>
            <button
              type="button"
              onClick={resetDemoData}
              className="w-full h-8 px-3 rounded-full text-xs font-medium text-white/80 hover:text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Dados Demo
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Cellbox Master / {navItems.find((i) => i.id === activeTab)?.label}
              </p>
              <h1 className="font-condensed text-[28px] font-bold uppercase text-[#0A3768] mt-0.5">
                {navItems.find((i) => i.id === activeTab)?.label}
              </h1>
            </div>
            {analytics.pendingSellersCount > 0 && activeTab !== 'sellers' && (
              <button
                type="button"
                onClick={() => {
                  setSellerFilter('pending');
                  setActiveTab('sellers');
                }}
                className="h-9 px-4 rounded-full bg-[#F5A623] hover:bg-[#E09516] text-[#1F2937] text-xs font-bold uppercase whitespace-nowrap cursor-pointer"
              >
                {analytics.pendingSellersCount}{' '}
                {analytics.pendingSellersCount === 1
                  ? 'loja aguardando aprovação'
                  : 'lojas aguardando aprovação'}
              </button>
            )}
          </div>

          {/* TAB 1: DASHBOARD GLOBAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">GMV Global</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2">
                    {formatCurrency(analytics.gmv)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {analytics.totalOrdersCount} pedidos processados
                  </p>
                </div>

                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">Receita de Comissões</p>
                  <p
                    data-testid="admin-commission-revenue"
                    className="text-2xl font-extrabold font-mono tabular-nums text-[#0475EE] mt-2"
                  >
                    {formatCurrency(analytics.commissionRevenue)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    Taxa ativa: {commissionRate}% por venda
                  </p>
                </div>

                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">Vendedores Ativos</p>
                  <p
                    data-testid="admin-active-sellers-count"
                    className="text-2xl font-extrabold font-mono tabular-nums text-[#18A3DE] mt-2"
                  >
                    {analytics.activeSellersCount}
                  </p>
                  <p className="text-xs text-amber-700 font-semibold mt-1 tabular-nums">
                    {analytics.pendingSellersCount} pendentes · {analytics.suspendedSellersCount} suspensos
                  </p>
                </div>

                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">Total de Usuários</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2">
                    {users.length}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {products.length} produtos cadastrados
                  </p>
                </div>
              </div>

              {/* Revenue Breakdown by Seller */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between">
                  <h2 className="font-condensed text-[17px] font-bold uppercase text-[#333333]">
                    Desempenho por Loja Parceira
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sellers')}
                    className="text-xs font-bold text-[#0475EE] hover:text-[#0A3768] cursor-pointer"
                  >
                    Gerenciar vendedores
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                      <tr>
                        <th className="py-3 px-5 font-bold">Loja</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Produtos</th>
                        <th className="py-3 px-4 font-bold text-right">GMV Loja</th>
                        <th className="py-3 px-5 font-bold text-right">
                          Comissão ({commissionRate}%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {sellers.map((s) => {
                        const sStats = calculateSellerAnalytics(s.id, orders, commissionRate);
                        const prodCount = products.filter((p) => p.sellerId === s.id).length;
                        return (
                          <tr key={s.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-5 font-semibold text-[#333333]">{s.name}</td>
                            <td className={`py-3 px-4 text-xs font-bold ${statusColor(s.status)}`}>
                              {statusLabel(s.status)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-[#555555]">
                              {prodCount}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#333333]">
                              {formatCurrency(sStats.monthlySales)}
                            </td>
                            <td className="py-3 px-5 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                              {formatCurrency(sStats.commissionDeducted)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GERENCIAMENTO DE VENDEDORES */}
          {activeTab === 'sellers' && (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: `Todos (${sellers.length})` },
                    { id: 'active', label: `Ativos (${analytics.activeSellersCount})` },
                    { id: 'pending', label: `Pendentes (${analytics.pendingSellersCount})` },
                    { id: 'suspended', label: `Suspensos (${analytics.suspendedSellersCount})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSellerFilter(f.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                      sellerFilter === f.id
                        ? 'bg-[#0475EE] text-white'
                        : 'bg-[#F2F3F5] text-[#555555] hover:bg-[#E6E8EC]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                {filteredSellers.length === 0 ? (
                  <p className="p-10 text-center text-sm text-[#777777]">
                    Nenhum vendedor encontrado nesta categoria de status.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                        <tr>
                          <th className="py-3 px-5 font-bold">Lojista</th>
                          <th className="py-3 px-4 font-bold">NUIT / NIF</th>
                          <th className="py-3 px-4 font-bold">Categoria</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-5 font-bold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {filteredSellers.map((s) => {
                          const prodCount = products.filter((p) => p.sellerId === s.id).length;
                          return (
                            <tr key={s.id} className="hover:bg-[#F9FAFB]">
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-9 h-9 rounded-[3px] flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                                    style={{ backgroundColor: s.accentColor }}
                                  >
                                    {s.logoText}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#333333]">{s.name}</p>
                                    <p className="text-xs text-[#777777]">
                                      {prodCount} anúncios · {s.location}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs text-[#666666]">
                                {s.documentId}
                              </td>
                              <td className="py-3.5 px-4 text-[#444444]">{s.mainCategory}</td>
                              <td className={`py-3.5 px-4 text-xs font-bold ${statusColor(s.status)}`}>
                                {statusLabel(s.status)}
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="flex items-center justify-end gap-2">
                                  {s.status !== 'active' && (
                                    <button
                                      type="button"
                                      onClick={() => setSellerStatus(s.id, 'active')}
                                      className="h-8 px-3.5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[11px] font-bold uppercase inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Aprovar Cadastro
                                    </button>
                                  )}
                                  {s.status === 'active' && (
                                    <button
                                      type="button"
                                      onClick={() => setSellerStatus(s.id, 'suspended')}
                                      className="h-8 px-3.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold uppercase inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      Suspender Loja
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setInspectedSeller(s)}
                                    aria-label={`Ver detalhes de ${s.name}`}
                                    className="h-8 px-3 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] hover:text-[#0475EE] text-[#555555] text-[11px] font-bold uppercase inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Detalhes
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MODERAÇÃO DE CATÁLOGO E CATEGORIAS */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Categories Management */}
              <section className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4">
                <h2 className="font-condensed text-[19px] font-bold uppercase text-[#0A3768]">
                  Categorias de Eletrônicos
                </h2>
                <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
                  <label htmlFor="admin-new-cat" className="sr-only">
                    Nova categoria
                  </label>
                  <input
                    id="admin-new-cat"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Wearables, Monitores..."
                    className="flex-1 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                  />
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-[3px] border border-[#EAEAEA] bg-[#FAFAFA] text-sm"
                      >
                        <div>
                          <span className="font-semibold text-[#333333]">{cat}</span>
                          <span className="text-xs text-[#777777] ml-2 tabular-nums">
                            ({count})
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover categoria ${cat}`}
                          onClick={() => removeCategory(cat)}
                          className="p-1 text-[#999999] hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Product Moderation */}
              <section className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB]">
                  <h2 className="font-condensed text-[17px] font-bold uppercase text-[#333333]">
                    Moderação Global de Produtos ({products.length})
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Remova anúncios que violem políticas de autenticidade ou especificação técnica.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                      <tr>
                        <th className="py-3 px-5 font-bold">Anúncio</th>
                        <th className="py-3 px-4 font-bold">Loja</th>
                        <th className="py-3 px-4 font-bold text-right">Preço</th>
                        <th className="py-3 px-5 font-bold text-right">Moderação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {products.map((p) => {
                        const s = sellers.find((seller) => seller.id === p.sellerId);
                        return (
                          <tr key={p.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-9 rounded-[2px] overflow-hidden bg-white border border-[#EAEAEA] shrink-0">
                                  <ProductImage
                                    src={p.images[0]}
                                    alt={p.title}
                                    category={p.category}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#333333] truncate max-w-[280px]">
                                    {p.title}
                                  </p>
                                  <p className="text-xs text-[#777777]">
                                    {p.category} · {p.condition}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#555555]">
                              {s?.name ?? '—'}{' '}
                              {s && s.status !== 'active' && (
                                <span className="text-xs text-amber-700">({statusLabel(s.status)})</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                              {formatCurrency(p.price)}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => deleteProduct(p.id)}
                                className="h-8 px-3 rounded-full border border-rose-200 hover:bg-rose-50 text-rose-700 text-[11px] font-bold uppercase inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remover
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: CONFIGURAÇÕES FINANCEIRAS */}
          {activeTab === 'finance' && (
            <form
              onSubmit={handleSaveCommission}
              className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 max-w-xl space-y-5"
            >
              <div>
                <h2 className="font-condensed text-[20px] font-bold uppercase text-[#0A3768]">
                  Taxa de Comissão Padrão da Plataforma
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Define a porcentagem retida pela Cellbox sobre o valor bruto de cada venda realizada pelos lojistas parceiros.
                </p>
              </div>

              <div>
                <label
                  htmlFor="admin-commission-input"
                  className="block text-xs font-bold text-[#444444] mb-1.5"
                >
                  Comissão Padrão (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="admin-commission-input"
                    type="number"
                    min={1}
                    max={35}
                    step={0.5}
                    value={draftCommission}
                    onChange={(e) => setDraftCommission(e.target.value)}
                    className="w-32 h-11 px-3.5 rounded-[2px] border border-[#DCDCDC] text-lg font-bold font-mono tabular-nums focus:outline-none focus:border-[#0475EE]"
                  />
                  <span className="text-xs text-[#666666]">% sobre cada venda</span>
                </div>
              </div>

              <div className="bg-[#F1F2F4] border border-[#E5E7EB] rounded-[3px] p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#555555]">GMV Base Atual</span>
                  <span className="font-mono tabular-nums font-bold text-[#333333]">
                    {formatCurrency(analytics.gmv)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#555555]">
                    Receita Estimada com {Number(draftCommission) || commissionRate}%
                  </span>
                  <span className="font-mono tabular-nums font-extrabold text-[#0475EE]">
                    {formatCurrency(
                      analytics.gmv * ((Number(draftCommission) || commissionRate) / 100)
                    )}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Aplicar Nova Taxa de Comissão
              </button>
            </form>
          )}
        </main>
      </div>

      {/* Seller Details & Revenue Modal */}
      {inspectedSeller && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-detail-modal-title"
        >
          <div className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-[3px] flex items-center justify-center text-white font-extrabold"
                  style={{ backgroundColor: inspectedSeller.accentColor }}
                >
                  {inspectedSeller.logoText}
                </div>
                <div>
                  <h2
                    id="seller-detail-modal-title"
                    className="font-condensed text-[20px] font-bold uppercase text-[#333333]"
                  >
                    {inspectedSeller.name}
                  </h2>
                  <p className="text-xs text-[#777777]">
                    NUIT / NIF: {inspectedSeller.documentId} · {inspectedSeller.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedSeller(null)}
                aria-label="Fechar detalhes da loja"
                className="p-1.5 rounded-[2px] text-[#666666] hover:bg-[#F1F2F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const sStats = calculateSellerAnalytics(inspectedSeller.id, orders, commissionRate);
              const sProds = products.filter((p) => p.sellerId === inspectedSeller.id);
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F7F8FA] border border-[#EAEAEA] rounded-[3px] p-3.5">
                      <p className="text-xs text-[#777777]">Faturamento Bruto</p>
                      <p className="text-lg font-extrabold font-mono tabular-nums text-[#333333] mt-1">
                        {formatCurrency(sStats.monthlySales)}
                      </p>
                    </div>
                    <div className="bg-[#F7F8FA] border border-[#EAEAEA] rounded-[3px] p-3.5">
                      <p className="text-xs text-[#777777]">Comissão Cellbox ({commissionRate}%)</p>
                      <p className="text-lg font-extrabold font-mono tabular-nums text-[#0475EE] mt-1">
                        {formatCurrency(sStats.commissionDeducted)}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-[#555555] space-y-1.5 border-t border-[#EAEAEA] pt-4">
                    <p>
                      <strong>Status:</strong> {statusLabel(inspectedSeller.status)}
                    </p>
                    <p>
                      <strong>Categoria principal:</strong> {inspectedSeller.mainCategory}
                    </p>
                    <p>
                      <strong>Produtos cadastrados:</strong> {sProds.length}
                    </p>
                    <p>
                      <strong>Dados de repasse:</strong> {inspectedSeller.payoutInfo.bankName} ·{' '}
                      {inspectedSeller.payoutInfo.pixOrWallet}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {inspectedSeller.status !== 'active' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSellerStatus(inspectedSeller.id, 'active');
                          setInspectedSeller(null);
                        }}
                        className="h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase cursor-pointer"
                      >
                        Aprovar Loja
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setInspectedSeller(null)}
                      className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
