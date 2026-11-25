import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  Layers,
  Mail,
  MapPin,
  Palette,
  Percent,
  Phone,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import type {
  ActiveCartGateway,
  GatewayEnvironment,
  HeroSlideConfig,
  PartnerBrandConfig,
  PayoutStatus,
  PromoSubBannerConfig,
  SellerPayoutRequest,
  SellerStatus,
  SellerStore,
  SiteCustomization,
  WidePromoBannerConfig,
} from '../types';
import {
  calculatePlatformAnalytics,
  calculateSellerAnalytics,
  formatCurrency,
  formatSellerPayoutSummary,
} from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

interface AdminDashboardViewProps {
  initialTab?: 'overview' | 'sellers' | 'catalog' | 'finance' | 'customization';
}

export function AdminDashboardView({ initialTab = 'overview' }: AdminDashboardViewProps) {
  const {
    currentUser,
    users,
    sellers,
    products,
    categories,
    orders,
    payouts,
    commissionRate,
    setSellerStatus,
    reviewSellerKyc,
    reviewSellerFee,
    reviewSellerPayout,
    addCategory,
    removeCategory,
    deleteProduct,
    setCommissionRate,
    logout,
    siteCustomization,
    updateSiteCustomization,
    uploadImageAsset,
    navigate,
    showToast,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'sellers' | 'catalog' | 'finance' | 'customization'
  >(initialTab);
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [sellerFilter, setSellerFilter] = useState<'all' | SellerStatus>('all');
  const [inspectedSeller, setInspectedSeller] = useState<SellerStore | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [draftCommission, setDraftCommission] = useState<string>(String(commissionRate));

  useEffect(() => {
    setDraftCommission(String(commissionRate));
  }, [commissionRate]);

  const analytics = useMemo(
    () => calculatePlatformAnalytics(orders, sellers, commissionRate, payouts),
    [orders, sellers, commissionRate, payouts]
  );

  // Payouts Review State (Modo A)
  const [payoutFilter, setPayoutFilter] = useState<'all' | PayoutStatus>('pending');
  const [reviewingPayout, setReviewingPayout] = useState<SellerPayoutRequest | null>(null);
  const [payoutActionMode, setPayoutActionMode] = useState<'approve' | 'reject'>('approve');
  const [payoutTxRef, setPayoutTxRef] = useState('');
  const [payoutProofUrl, setPayoutProofUrl] = useState('');
  const [payoutAdminNotes, setPayoutAdminNotes] = useState('');
  const [uploadingPayoutProof, setUploadingPayoutProof] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [payoutReviewError, setPayoutReviewError] = useState('');

  const filteredPayouts = useMemo(() => {
    if (payoutFilter === 'all') return payouts;
    return payouts.filter((p) => p.status === payoutFilter);
  }, [payouts, payoutFilter]);

  const openPayoutReviewModal = (
    payout: SellerPayoutRequest,
    mode: 'approve' | 'reject'
  ) => {
    setReviewingPayout(payout);
    setPayoutActionMode(mode);
    setPayoutTxRef('');
    setPayoutProofUrl('');
    setPayoutAdminNotes('');
    setPayoutReviewError('');
  };

  const handlePayoutProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPayoutProof(true);
    try {
      const res = await uploadImageAsset(file, 'payouts');
      if (res.ok && res.url) {
        setPayoutProofUrl(res.url);
        showToast('Comprovante carregado com sucesso!', 'success');
      } else {
        showToast(res.error || 'Falha no upload do comprovante.', 'warning');
      }
    } finally {
      setUploadingPayoutProof(false);
    }
  };

  const handleConfirmPayoutReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPayout) return;
    setPayoutReviewError('');

    setProcessingPayout(true);
    try {
      const res = await reviewSellerPayout(reviewingPayout.id, {
        action: payoutActionMode,
        transactionRef: payoutActionMode === 'approve' ? payoutTxRef.trim() : undefined,
        proofUrl: payoutActionMode === 'approve' ? payoutProofUrl.trim() || undefined : undefined,
        adminNotes: payoutAdminNotes.trim() || undefined,
      });
      if (res.ok) {
        setReviewingPayout(null);
      } else {
        setPayoutReviewError(res.error ?? 'Erro ao processar repasse.');
      }
    } finally {
      setProcessingPayout(false);
    }
  };

  const filteredSellers = useMemo(() => {
    if (sellerFilter === 'all') return sellers;
    return sellers.filter((s) => s.status === sellerFilter);
  }, [sellers, sellerFilter]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addCategory(newCategoryName)) {
      setNewCategoryName('');
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(draftCommission);
    if (Number.isFinite(num) && num >= 1 && num <= 35) {
      await setCommissionRate(num);
    }
  };

  const [draftCustomization, setDraftCustomization] = useState<SiteCustomization>(siteCustomization);
  const [cmsSubTab, setCmsSubTab] = useState<
    'header' | 'hero' | 'banners' | 'brands' | 'contacts' | 'footer' | 'gateways'
  >('header');
  const [savingCms, setSavingCms] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [showGatewaySecrets, setShowGatewaySecrets] = useState(false);

  useEffect(() => {
    if (siteCustomization) {
      setDraftCustomization(siteCustomization);
    }
  }, [siteCustomization]);

  const handleUploadImage = async (
    fieldKey: string,
    file: File,
    callback: (url: string) => void
  ) => {
    setUploadingField(fieldKey);
    try {
      const res = await uploadImageAsset(file, 'banners');
      if (res.ok && res.url) {
        callback(res.url);
        showToast('Imagem carregada com sucesso!', 'success');
      } else {
        showToast(res.error || 'Falha no upload da imagem.', 'warning');
      }
    } catch {
      showToast('Erro ao enviar imagem.', 'warning');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveCms = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingCms(true);
    try {
      const ok = await updateSiteCustomization(draftCustomization);
      if (ok) {
        showToast('Design e conteúdos atualizados com sucesso!', 'success');
      } else {
        showToast('Erro ao salvar personalizações.', 'warning');
      }
    } catch {
      showToast('Erro de comunicação com o servidor.', 'warning');
    } finally {
      setSavingCms(false);
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
    {
      id: 'finance' as const,
      label: 'Financeiro e Comissões',
      icon: Percent,
      badge:
        analytics.pendingPayoutRequestsCount > 0
          ? analytics.pendingPayoutRequestsCount
          : undefined,
    },
    { id: 'customization' as const, label: 'Design & Conteúdo (CMS)', icon: Palette },
  ];

  const statusLabel = (s: SellerStatus) =>
    s === 'active' ? 'Ativo' : s === 'pending' ? 'Pendente' : 'Suspenso';

  const statusColor = (s: SellerStatus) =>
    s === 'active'
      ? 'text-emerald-700'
      : s === 'pending'
        ? 'text-amber-700'
        : 'text-rose-700';

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar (Official Cellbox Deep Navy #0A3768) */}
        <aside className="w-full lg:w-[270px] shrink-0 bg-[#0A3768] text-white rounded-[3px] p-4 space-y-5">
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
              className="w-full h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold uppercase tracking-wide text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              Ver Loja Pública
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full h-8 px-3 rounded-full text-xs font-medium text-white/80 hover:text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Encerrar Sessão Admin
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Cellbox Master / {navItems.find((i) => i.id === activeTab)?.label}
              </p>
              <h1 className="font-condensed text-[28px] font-bold uppercase text-[#0A3768] mt-0.5">
                {navItems.find((i) => i.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {analytics.pendingPayoutRequestsCount > 0 && activeTab !== 'finance' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('finance')}
                  className="h-9 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase whitespace-nowrap cursor-pointer"
                >
                  {analytics.pendingPayoutRequestsCount}{' '}
                  {analytics.pendingPayoutRequestsCount === 1
                    ? 'saque aguardando repasse'
                    : 'saques aguardando repasse'}
                </button>
              )}
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
          </div>

          {/* TAB 1: DASHBOARD GLOBAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-stretch gap-4">
                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">GMV Global</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2">
                    {formatCurrency(analytics.gmv)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {analytics.totalOrdersCount} pedidos processados
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
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

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
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

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
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
                        const sStats = calculateSellerAnalytics(s.id, orders, commissionRate, payouts);
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
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <span className={`inline-block text-xs font-bold ${statusColor(s.status)}`}>
                                    {statusLabel(s.status)}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    <span
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] ${
                                        s.activation?.kycCompleted || s.kyc?.status === 'verified'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : s.kyc?.status === 'pending'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-neutral-100 text-neutral-600'
                                      }`}
                                    >
                                      {s.activation?.kycCompleted || s.kyc?.status === 'verified'
                                        ? 'KYC OK'
                                        : s.kyc?.status === 'pending'
                                          ? 'KYC Análise'
                                          : 'KYC Pendente'}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] ${
                                        s.activation?.feePaid
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {s.activation?.feePaid ? '100 MT Pago' : 'Taxa Pendente'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="flex items-center justify-end gap-2">
                                  {s.status !== 'active' && (
                                    <MotionButton
                                      type="button"
                                      onClick={() => void setSellerStatus(s.id, 'active')}
                                      className="h-8 px-3.5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[11px] font-bold uppercase inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Aprovar Cadastro
                                    </MotionButton>
                                  )}
                                  {s.status === 'active' && (
                                    <MotionButton
                                      type="button"
                                      onClick={() => void setSellerStatus(s.id, 'suspended')}
                                      className="h-8 px-3.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold uppercase inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      Suspender Loja
                                    </MotionButton>
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

          {/* TAB 4: CENTRAL FINANCEIRA, COMISSÕES & REPASSES (MODO A) */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* 4 KPIs Financeiros Modo A */}
              <div className="flex flex-wrap items-stretch gap-4">
                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Receita Líquida de Comissões</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#0475EE] mt-2">
                    {formatCurrency(analytics.commissionRevenue)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    Retida na fonte ({commissionRate}% padrão)
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Custódia de Pedidos em Trânsito</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-amber-600 mt-2">
                    {formatCurrency(analytics.escrowLiabilityTotal)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1">
                    Aguardando entrega ao comprador
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Saques Aguardando Transferência</p>
                  <p
                    data-testid="admin-pending-payouts-amount"
                    className="text-2xl font-extrabold font-mono tabular-nums text-[#E50914] mt-2"
                  >
                    {formatCurrency(analytics.pendingPayoutRequestsAmount)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {analytics.pendingPayoutRequestsCount}{' '}
                    {analytics.pendingPayoutRequestsCount === 1 ? 'solicitação pendente' : 'solicitações pendentes'}
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Total Já Repassado aos Lojistas</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-emerald-600 mt-2">
                    {formatCurrency(analytics.paidPayoutsTotal)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1">
                    Saldo livre em carteiras: {formatCurrency(analytics.availablePayoutLiabilityTotal)}
                  </p>
                </div>
              </div>

              {/* Solicitações de Saque dos Vendedores */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-4 bg-[#F1F2F4] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-condensed text-[18px] font-bold uppercase text-[#0A3768]">
                      Solicitações de Saque dos Vendedores (Modo A)
                    </h2>
                    <p className="text-xs text-[#666666]">
                      Transfira o valor líquido para a carteira/banco indicado pelo lojista e confirme com a referência da transação.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'pending', label: `Pendentes (${analytics.pendingPayoutRequestsCount})` },
                        { id: 'paid', label: 'Pagos' },
                        { id: 'rejected', label: 'Rejeitados' },
                        { id: 'all', label: `Todos (${payouts.length})` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setPayoutFilter(f.id)}
                        className={`h-8 px-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          payoutFilter === f.id
                            ? 'bg-[#0A3768] text-white'
                            : 'bg-white border border-[#DCDCDC] text-[#555555] hover:border-[#0475EE]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredPayouts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#777777]">
                    Nenhuma solicitação de saque encontrada neste filtro.
                  </div>
                ) : (
                  <div className="divide-y divide-[#EAEAEA]">
                    {filteredPayouts.map((p) => (
                      <div
                        key={p.id}
                        data-testid={`admin-payout-row-${p.id}`}
                        className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAFAFA]"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#0A3768]">{p.sellerName}</span>
                            <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-extrabold uppercase bg-[#EAF6FC] text-[#0475EE] border border-[#BFE3F7]">
                              {p.method === 'mpesa'
                                ? 'M-Pesa'
                                : p.method === 'emola'
                                  ? 'e-Mola'
                                  : 'Banco / NIB'}
                            </span>
                            {p.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Pago
                              </span>
                            ) : p.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Ban className="w-3 h-3" /> Rejeitado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" /> Aguardando Transferência
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-[#777777]">
                              {p.requestedAt.replace('T', ' ').slice(0, 16)}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-[#333333]">
                            <strong>Destino:</strong> {p.destinationSummary}
                          </p>
                          {p.sellerNotes && (
                            <p className="text-xs text-[#666666]">
                              <strong>Obs. Lojista:</strong> {p.sellerNotes}
                            </p>
                          )}
                          {p.status !== 'pending' && (
                            <div className="text-xs text-[#555555] space-y-0.5 pt-1">
                              {p.transactionRef && (
                                <p className="font-mono font-bold text-[#0A3768]">
                                  Ref. Transferência: {p.transactionRef}
                                </p>
                              )}
                              {p.proofUrl && (
                                <a
                                  href={p.proofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[#0475EE] hover:underline font-semibold"
                                >
                                  Abrir Comprovante <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {p.adminNotes && (
                                <p>
                                  <strong>Nota Admin:</strong> {p.adminNotes}
                                </p>
                              )}
                              {p.processedBy && (
                                <p className="text-[11px] text-[#777777]">
                                  Processado por {p.processedBy} em {p.processedAt?.slice(0, 10)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <div className="text-right mr-2">
                            <p className="text-[11px] uppercase font-bold text-[#777777]">Valor Líquido</p>
                            <p className="text-xl font-extrabold font-mono tabular-nums text-[#0A3768]">
                              {formatCurrency(p.amount)}
                            </p>
                          </div>

                          {p.status === 'pending' && (
                            <>
                              <MotionButton
                                type="button"
                                onClick={() => openPayoutReviewModal(p, 'approve')}
                                className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirmar Repasse
                              </MotionButton>
                              <button
                                type="button"
                                onClick={() => openPayoutReviewModal(p, 'reject')}
                                className="h-9 px-4 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saldos & Repasses por Loja Parceira */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB]">
                  <h2 className="font-condensed text-[17px] font-bold uppercase text-[#333333]">
                    Saldos &amp; Repasses por Loja Parceira
                  </h2>
                </div>
                {sellers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#777777]">
                    Nenhuma loja cadastrada na plataforma.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                        <tr>
                          <th className="py-3 px-4 font-bold">Loja</th>
                          <th className="py-3 px-4 font-bold">Destino de Repasse</th>
                          <th className="py-3 px-4 font-bold text-right">Bruto</th>
                          <th className="py-3 px-4 font-bold text-right">Comissão</th>
                          <th className="py-3 px-4 font-bold text-right">Custódia</th>
                          <th className="py-3 px-4 font-bold text-right">Disponível</th>
                          <th className="py-3 px-4 font-bold text-right">Já Repassado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {sellers.map((s) => {
                          const sStats = calculateSellerAnalytics(s.id, orders, commissionRate, payouts);
                          return (
                            <tr key={s.id} className="hover:bg-[#F9FAFB]">
                              <td className="py-3 px-4 font-semibold text-[#333333]">{s.name}</td>
                              <td className="py-3 px-4 text-xs text-[#555555]">
                                {formatSellerPayoutSummary(s.payoutInfo)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-[#444444]">
                                {formatCurrency(sStats.monthlySales)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-[#0475EE]">
                                {formatCurrency(sStats.commissionDeducted)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                                {formatCurrency(sStats.escrowNet)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0A3768]">
                                {formatCurrency(sStats.availableBalance)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                                {formatCurrency(sStats.paidPayoutsTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Taxa de Comissão Padrão */}
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

                <MotionButton
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Aplicar Nova Taxa de Comissão
                </MotionButton>
              </form>
            </div>
          )}

          {/* 5. Customization / Platform CMS Tab */}
          {activeTab === 'customization' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[3px] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEAEA] gap-4">
                <div>
                  <h2 className="font-condensed text-[24px] font-bold uppercase text-[#0A3768] flex items-center gap-2">
                    <Palette className="w-6 h-6 text-[#18A3DE]" />
                    Design & Conteúdo da Plataforma (CMS)
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Personalize o cabeçalho, carrossel hero, banners promocionais, marcas parceiras, contatos e rodapé do site.
                  </p>
                </div>
                <MotionButton
                  type="button"
                  onClick={() => handleSaveCms()}
                  disabled={savingCms}
                  className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Save className="w-4 h-4" />
                  {savingCms ? 'Salvando...' : 'Salvar Alterações'}
                </MotionButton>
              </div>

              {/* Sub-tabs Navigation */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#EAEAEA] pb-2">
                {[
                  { id: 'header' as const, label: 'Header & Top Bar' },
                  { id: 'hero' as const, label: 'Hero Slider' },
                  { id: 'banners' as const, label: 'Banners Promocionais' },
                  { id: 'brands' as const, label: 'Marcas Parceiras' },
                  { id: 'contacts' as const, label: 'Contatos & Redes' },
                  { id: 'footer' as const, label: 'Rodapé (Footer)' },
                  { id: 'gateways' as const, label: 'Gateways de Pagamento (APIs)' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCmsSubTab(st.id)}
                    className={`h-9 px-4 rounded-[2px] text-xs font-bold transition-colors cursor-pointer ${
                      cmsSubTab === st.id
                        ? 'bg-[#0A3768] text-white'
                        : 'bg-[#F1F2F4] text-[#555555] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* SUBTAB 1: HEADER */}
              {cmsSubTab === 'header' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-1">
                      Aviso de Topo (Barra Superior)
                    </label>
                    <input
                      type="text"
                      value={draftCustomization.header.topBarNotice || draftCustomization.header.topNotice || ''}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            topBarNotice: e.target.value,
                            topNotice: e.target.value,
                          },
                        }))
                      }
                      placeholder="Ex: Entregas em todo Moçambique · Suporte oficial Cellbox"
                      className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333] focus:border-[#0475EE] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#444444] mb-1">
                        Telefone de Atendimento do Topo
                      </label>
                      <input
                        type="text"
                        value={draftCustomization.header.phone || draftCustomization.header.supportPhone || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            header: {
                              ...prev.header,
                              phone: e.target.value,
                              supportPhone: e.target.value,
                            },
                          }))
                        }
                        placeholder="+258 84 400 2026"
                        className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333] focus:border-[#0475EE] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#444444] mb-1">
                        E-mail de Suporte do Topo
                      </label>
                      <input
                        type="email"
                        value={draftCustomization.header.email || draftCustomization.header.supportEmail || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            header: {
                              ...prev.header,
                              email: e.target.value,
                              supportEmail: e.target.value,
                            },
                          }))
                        }
                        placeholder="suporte@cellbox.co.mz"
                        className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333] focus:border-[#0475EE] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-1">
                      Moeda Exibida
                    </label>
                    <input
                      type="text"
                      value={draftCustomization.header.currencyLabel || draftCustomization.header.currencyDisplay || ''}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            currencyLabel: e.target.value,
                            currencyDisplay: e.target.value,
                          },
                        }))
                      }
                      placeholder="MZ | MZN (MT)"
                      className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333] focus:border-[#0475EE] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* SUBTAB 2: HERO SLIDER */}
              {cmsSubTab === 'hero' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#666666]">
                      Gerencie os slides de destaque principal do topo da página inicial.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const newSlide: HeroSlideConfig = {
                          id: `slide-${Date.now()}`,
                          kicker: 'Novidade',
                          title: 'Novo Destaque Cellbox',
                          subtitle: 'Descrição do novo produto em oferta especial.',
                          highlight: 'Preço promocional imperdível',
                          ctaText: 'CONFERIR',
                          cta: 'CONFERIR',
                          productId: '',
                          imageUrl: '',
                          image: '',
                          imageAlt: 'Produto em destaque',
                        };
                        setDraftCustomization((prev) => ({
                          ...prev,
                          heroSlides: [...prev.heroSlides, newSlide],
                        }));
                      }}
                      className="h-8 px-3 rounded-[2px] bg-[#18A3DE] hover:bg-[#0A3768] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Slide
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draftCustomization.heroSlides.map((slide, index) => (
                      <div
                        key={index}
                        className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[3px] space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                          <span className="font-bold text-xs text-[#0A3768] uppercase">
                            Slide {index + 1}: {slide.kicker} — {slide.title}
                          </span>
                          {draftCustomization.heroSlides.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDraftCustomization((prev) => ({
                                  ...prev,
                                  heroSlides: prev.heroSlides.filter((_, i) => i !== index),
                                }));
                              }}
                              className="text-xs text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remover
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-[#444444] mb-1">
                              Kicker (Subtítulo de Topo)
                            </label>
                            <input
                              type="text"
                              value={slide.kicker}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.heroSlides];
                                  updated[index] = { ...updated[index], kicker: val };
                                  return { ...prev, heroSlides: updated };
                                });
                              }}
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#444444] mb-1">
                              Título Principal
                            </label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.heroSlides];
                                  updated[index] = { ...updated[index], title: val };
                                  return { ...prev, heroSlides: updated };
                                });
                              }}
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#444444] mb-1">
                              Texto do Botão (CTA)
                            </label>
                            <input
                              type="text"
                              value={slide.ctaText || slide.cta || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.heroSlides];
                                  updated[index] = { ...updated[index], ctaText: val, cta: val };
                                  return { ...prev, heroSlides: updated };
                                });
                              }}
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-[#444444] mb-1">
                              Subtítulo / Descrição
                            </label>
                            <input
                              type="text"
                              value={slide.subtitle}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.heroSlides];
                                  updated[index] = { ...updated[index], subtitle: val };
                                  return { ...prev, heroSlides: updated };
                                });
                              }}
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#444444] mb-1">
                              Destaque / Preço
                            </label>
                            <input
                              type="text"
                              value={slide.highlight}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.heroSlides];
                                  updated[index] = { ...updated[index], highlight: val };
                                  return { ...prev, heroSlides: updated };
                                });
                              }}
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                          </div>
                        </div>

                        {/* Imagem do Slide com Upload */}
                        <div className="pt-2 border-t border-[#E2E8F0]">
                          <label className="block font-bold text-[#444444] text-xs mb-1">
                            Imagem do Slide (URL ou Upload de Arquivo)
                          </label>
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <input
                              type="text"
                              value={slide.imageUrl || slide.image || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.heroSlides];
                                  updated[index] = { ...updated[index], imageUrl: val, image: val };
                                  return { ...prev, heroSlides: updated };
                                });
                              }}
                              placeholder="URL da imagem ou faça upload..."
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-xs text-[#333333]"
                            />
                            <label className="h-9 px-4 rounded-[2px] bg-white border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              {uploadingField === `hero-${index}` ? 'Enviando...' : 'Enviar Imagem'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingField !== null}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadImage(`hero-${index}`, file, (url) => {
                                      setDraftCustomization((prev) => {
                                        const updated = [...prev.heroSlides];
                                        updated[index] = { ...updated[index], imageUrl: url, image: url };
                                        return { ...prev, heroSlides: updated };
                                      });
                                    });
                                  }
                                }}
                              />
                            </label>
                            {(slide.imageUrl || slide.image) && (
                              <div className="w-14 h-10 border border-[#CBD5E1] rounded overflow-hidden shrink-0 bg-white flex items-center justify-center">
                                <img
                                  src={slide.imageUrl || slide.image}
                                  alt="Preview"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: BANNERS PROMOCIONAIS */}
              {cmsSubTab === 'banners' && (
                <div className="space-y-6">
                  {/* Sub-Banners */}
                  <div className="space-y-4">
                    <h3 className="font-condensed text-[18px] font-bold uppercase text-[#0A3768]">
                      Sub-Banners (Abaixo do Carrossel Principal)
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {draftCustomization.subBanners.map((sb, sbIdx) => (
                        <div
                          key={sb.id || sbIdx}
                          className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[3px] space-y-3 text-xs"
                        >
                          <p className="font-bold text-[#0A3768] uppercase border-b border-[#E2E8F0] pb-1">
                            Sub-Banner {sbIdx + 1} ({sbIdx === 0 ? 'Esquerdo - 1/3' : 'Direito - 2/3'})
                          </p>
                          <div>
                            <label className="block font-bold text-[#444444] mb-1">Título</label>
                            <input
                              type="text"
                              value={sb.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.subBanners];
                                  updated[sbIdx] = { ...updated[sbIdx], title: val };
                                  return { ...prev, subBanners: updated };
                                });
                              }}
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-[#444444] mb-1">Subtítulo</label>
                            <input
                              type="text"
                              value={sb.subtitle}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.subBanners];
                                  updated[sbIdx] = { ...updated[sbIdx], subtitle: val };
                                  return { ...prev, subBanners: updated };
                                });
                              }}
                              className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-bold text-[#444444] mb-1">Categoria Vinculada</label>
                              <input
                                type="text"
                                value={sb.category || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftCustomization((prev) => {
                                    const updated = [...prev.subBanners];
                                    updated[sbIdx] = { ...updated[sbIdx], category: val };
                                    return { ...prev, subBanners: updated };
                                  });
                                }}
                                className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-[#444444] mb-1">Texto do Botão</label>
                              <input
                                type="text"
                                value={sb.ctaText || sb.cta || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftCustomization((prev) => {
                                    const updated = [...prev.subBanners];
                                    updated[sbIdx] = { ...updated[sbIdx], ctaText: val, cta: val };
                                    return { ...prev, subBanners: updated };
                                  });
                                }}
                                className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block font-bold text-[#444444] mb-1">Imagem do Banner</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={sb.imageUrl || sb.image || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftCustomization((prev) => {
                                    const updated = [...prev.subBanners];
                                    updated[sbIdx] = { ...updated[sbIdx], imageUrl: val, image: val };
                                    return { ...prev, subBanners: updated };
                                  });
                                }}
                                className="flex-1 h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                              />
                              <label className="h-9 px-3 rounded-[2px] bg-white border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0">
                                <Upload className="w-3 h-3" />
                                {uploadingField === `sb-${sbIdx}` ? '...' : 'Upload'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleUploadImage(`sb-${sbIdx}`, file, (url) => {
                                        setDraftCustomization((prev) => {
                                          const updated = [...prev.subBanners];
                                          updated[sbIdx] = { ...updated[sbIdx], imageUrl: url, image: url };
                                          return { ...prev, subBanners: updated };
                                        });
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wide Horizontal Banner */}
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[3px] space-y-3 text-xs">
                    <h3 className="font-condensed text-[18px] font-bold uppercase text-[#0A3768] border-b border-[#E2E8F0] pb-1">
                      Banner Promocional Largo (Meio da Página)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#444444] mb-1">Kicker / Destaque</label>
                        <input
                          type="text"
                          value={draftCustomization.wideBanner.kicker}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              wideBanner: { ...prev.wideBanner, kicker: e.target.value },
                            }))
                          }
                          className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#444444] mb-1">Título</label>
                        <input
                          type="text"
                          value={draftCustomization.wideBanner.title}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              wideBanner: { ...prev.wideBanner, title: e.target.value },
                            }))
                          }
                          className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-[#444444] mb-1">Descrição</label>
                      <input
                        type="text"
                        value={draftCustomization.wideBanner.description}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            wideBanner: { ...prev.wideBanner, description: e.target.value },
                          }))
                        }
                        className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#444444] mb-1">Texto do Botão (CTA)</label>
                      <input
                        type="text"
                        value={draftCustomization.wideBanner.ctaText || draftCustomization.wideBanner.cta || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            wideBanner: {
                              ...prev.wideBanner,
                              ctaText: e.target.value,
                              cta: e.target.value,
                            },
                          }))
                        }
                        className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block font-bold text-[#444444] mb-1">Imagem 1 (Produto 1)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={draftCustomization.wideBanner.image1 || draftCustomization.wideBanner.imageUrl || ''}
                            onChange={(e) =>
                              setDraftCustomization((prev) => ({
                                ...prev,
                                wideBanner: {
                                  ...prev.wideBanner,
                                  image1: e.target.value,
                                  imageUrl: e.target.value,
                                },
                              }))
                            }
                            className="flex-1 h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                          />
                          <label className="h-9 px-3 rounded-[2px] bg-white border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0">
                            <Upload className="w-3 h-3" />
                            {uploadingField === 'wide-1' ? '...' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingField !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadImage('wide-1', file, (url) => {
                                    setDraftCustomization((prev) => ({
                                      ...prev,
                                      wideBanner: {
                                        ...prev.wideBanner,
                                        image1: url,
                                        imageUrl: url,
                                      },
                                    }));
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-[#444444] mb-1">Imagem 2 (Produto 2)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={draftCustomization.wideBanner.image2 || ''}
                            onChange={(e) =>
                              setDraftCustomization((prev) => ({
                                ...prev,
                                wideBanner: { ...prev.wideBanner, image2: e.target.value },
                              }))
                            }
                            className="flex-1 h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                          />
                          <label className="h-9 px-3 rounded-[2px] bg-white border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0">
                            <Upload className="w-3 h-3" />
                            {uploadingField === 'wide-2' ? '...' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingField !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadImage('wide-2', file, (url) => {
                                    setDraftCustomization((prev) => ({
                                      ...prev,
                                      wideBanner: { ...prev.wideBanner, image2: url },
                                    }));
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 4: MARCAS PARCEIRAS */}
              {cmsSubTab === 'brands' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#666666]">
                      Gerencie as marcas e logotipos exibidos na faixa inferior da página inicial.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const newBrand: PartnerBrandConfig = {
                          id: `brand-${Date.now()}`,
                          name: 'Nova Marca',
                          logoUrl: '',
                          ariaLabel: 'Filtrar produtos da marca',
                        };
                        setDraftCustomization((prev) => ({
                          ...prev,
                          partnerBrands: [...prev.partnerBrands, newBrand],
                        }));
                      }}
                      className="h-8 px-3 rounded-[2px] bg-[#18A3DE] hover:bg-[#0A3768] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Marca
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {draftCustomization.partnerBrands.map((brand, bIdx) => (
                      <div
                        key={bIdx}
                        className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[3px] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0A3768]">Marca #{bIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftCustomization((prev) => ({
                                ...prev,
                                partnerBrands: prev.partnerBrands.filter((_, i) => i !== bIdx),
                              }));
                            }}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                        <div>
                          <label className="block text-[#555555] mb-0.5">Nome da Marca</label>
                          <input
                            type="text"
                            value={brand.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftCustomization((prev) => {
                                const updated = [...prev.partnerBrands];
                                updated[bIdx] = { ...updated[bIdx], name: val };
                                return { ...prev, partnerBrands: updated };
                              });
                            }}
                            className="w-full h-8 px-2 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                          />
                        </div>
                        <div>
                          <label className="block text-[#555555] mb-0.5">Logo URL (ou Upload)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={brand.logoUrl || ''}
                              placeholder="Opcional para oficiais"
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftCustomization((prev) => {
                                  const updated = [...prev.partnerBrands];
                                  updated[bIdx] = { ...updated[bIdx], logoUrl: val };
                                  return { ...prev, partnerBrands: updated };
                                });
                              }}
                              className="flex-1 h-8 px-2 border border-[#DCDCDC] rounded-[2px] bg-white text-[#333333]"
                            />
                            <label className="h-8 px-2.5 rounded-[2px] bg-white border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 text-[11px]">
                              <Upload className="w-3 h-3" />
                              {uploadingField === `brand-${bIdx}` ? '...' : 'Upload'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingField !== null}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadImage(`brand-${bIdx}`, file, (url) => {
                                      setDraftCustomization((prev) => {
                                        const updated = [...prev.partnerBrands];
                                        updated[bIdx] = { ...updated[bIdx], logoUrl: url };
                                        return { ...prev, partnerBrands: updated };
                                      });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 5: CONTATOS & REDES SOCIAIS */}
              {cmsSubTab === 'contacts' && (
                <div className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="block font-bold text-[#444444] mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#18A3DE]" />
                      Endereço Oficial da Empresa
                    </label>
                    <input
                      type="text"
                      value={draftCustomization.contact.address}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, address: e.target.value },
                        }))
                      }
                      className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#444444] mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#18A3DE]" />
                        Telefone Principal (Linha 1)
                      </label>
                      <input
                        type="text"
                        value={draftCustomization.contact.phone1}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, phone1: e.target.value },
                          }))
                        }
                        className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#444444] mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#18A3DE]" />
                        Telefone Secundário (Linha 2)
                      </label>
                      <input
                        type="text"
                        value={draftCustomization.contact.phone2 || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, phone2: e.target.value },
                          }))
                        }
                        className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#444444] mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#18A3DE]" />
                        E-mail de Suporte ao Cliente
                      </label>
                      <input
                        type="email"
                        value={draftCustomization.contact.emailSupport}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, emailSupport: e.target.value },
                          }))
                        }
                        className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#444444] mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#18A3DE]" />
                        E-mail de Parcerias / Lojistas
                      </label>
                      <input
                        type="email"
                        value={draftCustomization.contact.emailPartners || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, emailPartners: e.target.value },
                          }))
                        }
                        className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#444444] mb-1">
                      WhatsApp Oficial
                    </label>
                    <input
                      type="text"
                      value={draftCustomization.contact.whatsapp || ''}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, whatsapp: e.target.value },
                        }))
                      }
                      placeholder="+258 84 400 2026"
                      className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#EAEAEA] space-y-3">
                    <p className="font-bold text-[#0A3768] text-sm uppercase">
                      Redes Sociais Oficiais
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#555555] mb-1">Facebook</label>
                        <input
                          type="text"
                          value={draftCustomization.contact.socials?.facebook || draftCustomization.contact.facebook || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                facebook: e.target.value,
                                socials: {
                                  ...(prev.contact.socials || {}),
                                  facebook: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="https://facebook.com/cellbox"
                          className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#555555] mb-1">Instagram</label>
                        <input
                          type="text"
                          value={draftCustomization.contact.socials?.instagram || draftCustomization.contact.instagram || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                instagram: e.target.value,
                                socials: {
                                  ...(prev.contact.socials || {}),
                                  instagram: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="https://instagram.com/cellbox"
                          className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#555555] mb-1">Twitter / X</label>
                        <input
                          type="text"
                          value={draftCustomization.contact.socials?.twitter || draftCustomization.contact.twitter || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                twitter: e.target.value,
                                socials: {
                                  ...(prev.contact.socials || {}),
                                  twitter: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="https://x.com/cellbox"
                          className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#555555] mb-1">YouTube</label>
                        <input
                          type="text"
                          value={draftCustomization.contact.socials?.youtube || draftCustomization.contact.youtube || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                youtube: e.target.value,
                                socials: {
                                  ...(prev.contact.socials || {}),
                                  youtube: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="https://youtube.com/@cellbox"
                          className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[#555555] mb-1">TikTok</label>
                        <input
                          type="text"
                          value={draftCustomization.contact.socials?.tiktok || draftCustomization.contact.tiktok || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                tiktok: e.target.value,
                                socials: {
                                  ...(prev.contact.socials || {}),
                                  tiktok: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="https://tiktok.com/@cellbox"
                          className="w-full h-9 px-2.5 border border-[#DCDCDC] rounded-[2px] text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 6: RODAPÉ */}
              {cmsSubTab === 'footer' && (
                <div className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="block font-bold text-[#444444] mb-1">
                      Título da Seção Sobre
                    </label>
                    <input
                      type="text"
                      value={draftCustomization.footer.aboutTitle || ''}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, aboutTitle: e.target.value },
                        }))
                      }
                      className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#444444] mb-1">
                      Texto Institucional Sobre a Cellbox
                    </label>
                    <textarea
                      rows={3}
                      value={draftCustomization.footer.aboutText}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, aboutText: e.target.value },
                        }))
                      }
                      className="w-full p-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#444444] mb-1">
                      Título da Compra Garantida
                    </label>
                    <input
                      type="text"
                      value={draftCustomization.footer.guaranteeTitle || ''}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, guaranteeTitle: e.target.value },
                        }))
                      }
                      className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#444444] mb-1">
                      Texto da Compra Garantida
                    </label>
                    <textarea
                      rows={3}
                      value={draftCustomization.footer.guaranteeText}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, guaranteeText: e.target.value },
                        }))
                      }
                      className="w-full p-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#444444] mb-1">
                      Texto de Copyright
                    </label>
                    <input
                      type="text"
                      value={draftCustomization.footer.copyrightText}
                      onChange={(e) =>
                        setDraftCustomization((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, copyrightText: e.target.value },
                        }))
                      }
                      className="w-full h-10 px-3 border border-[#DCDCDC] rounded-[2px] text-xs text-[#333333]"
                    />
                  </div>
                </div>
              )}

              {/* SUBTAB 7: GATEWAYS DE PAGAMENTO (APIS DINÂMICAS + ESCALEPAY) */}
              {cmsSubTab === 'gateways' && (
                <div className="space-y-6 max-w-4xl text-xs">
                  {/* Cabeçalho + Seletor do Gateway Ativo do Carrinho */}
                  <div className="bg-[#F0F7FF] border border-[#BFDBFE] rounded-[3px] p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-[#0A3768] text-sm flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#0475EE]" />
                          Configuração dos Gateways de Pagamento (Moçambique)
                        </h3>
                        <p className="text-[#334155] leading-relaxed max-w-2xl">
                          Configure abaixo as credenciais das suas contas assim que as obtiver. As chaves secretas ficam protegidas no servidor (nunca são expostas a compradores ou lojistas). Clique em <strong>Salvar Alterações do Site</strong> no rodapé para gravar no PostgreSQL.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGatewaySecrets((prev) => !prev)}
                        className="h-8 px-3 rounded-[3px] bg-white border border-[#CBD5E1] text-[#334155] hover:border-[#0475EE] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {showGatewaySecrets ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Ocultar Chaves
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Mostrar Chaves
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#BFDBFE]/70">
                      <div>
                        <label
                          htmlFor="active_cart_gateway_select"
                          className="block font-bold text-[#0A3768] text-xs mb-1.5"
                        >
                          Gateway Ativo para o Carrinho de Compras (Valores Variáveis):
                        </label>
                        <select
                          id="active_cart_gateway_select"
                          value={draftCustomization.gateways?.activeCartGateway || 'manual'}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                activeCartGateway: e.target.value as ActiveCartGateway,
                              },
                            }))
                          }
                          className="w-full h-10 px-3 bg-white border border-[#93C5FD] rounded-[3px] text-xs font-semibold text-[#0F172A] focus:border-[#0475EE] focus:outline-none"
                        >
                          <option value="manual">Nenhum / Confirmação Manual (Padrão atual)</option>
                          <option value="paysuite">Opção 1: PaySuite (M-Pesa, e-Mola, mKesh, Cartão)</option>
                          <option value="debitopay">Opção 2: Debito Pay (M-Pesa, e-Mola, Cartão)</option>
                          <option value="mpesa_direct">Opção 3: API Oficial Vodacom M-Pesa / e-Mola</option>
                        </select>
                      </div>
                      <div className="bg-white/80 border border-[#BFDBFE] rounded-[3px] p-3 flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-[#0A3768] uppercase">
                          Status das Credenciais Preenchidas
                        </span>
                        <span className="text-xs text-[#334155] mt-1">
                          {[
                            draftCustomization.gateways?.paySuite?.apiKey?.trim() ? 'PaySuite' : null,
                            draftCustomization.gateways?.debitoPay?.apiKey?.trim() ? 'Debito Pay' : null,
                            draftCustomization.gateways?.mpesaDirect?.apiKey?.trim() ||
                            draftCustomization.gateways?.mpesaDirect?.emolaApiKey?.trim()
                              ? 'M-Pesa / e-Mola'
                              : null,
                            draftCustomization.gateways?.escalePayCheckoutUrl?.trim()
                              ? 'EscalePay (100 MT)'
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Nenhum gateway configurado ainda'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OPÇÃO 1: PAYSUITE */}
                  <div className="p-5 bg-white border border-[#CBD5E1] rounded-[3px] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEAEA] pb-3">
                      <div>
                        <h4 className="font-bold text-[#0A3768] text-sm">
                          Opção 1 — PaySuite (paysuite.co.mz)
                        </h4>
                        <p className="text-[11px] text-[#64748B]">
                          Agregador moçambicano unificado para M-Pesa, e-Mola, mKesh, Ponto24 e Visa/Mastercard.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          aria-label="Ambiente PaySuite"
                          value={draftCustomization.gateways?.paySuite?.environment || 'sandbox'}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                paySuite: {
                                  ...(prev.gateways?.paySuite ?? {}),
                                  environment: e.target.value as GatewayEnvironment,
                                },
                              },
                            }))
                          }
                          className="h-8 px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] text-[11px] font-bold"
                        >
                          <option value="sandbox">Sandbox (Testes)</option>
                          <option value="production">Produção (Real)</option>
                        </select>
                        <label className="inline-flex items-center gap-1.5 font-bold text-[#1E293B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(draftCustomization.gateways?.paySuite?.enabled)}
                            onChange={(e) =>
                              setDraftCustomization((prev) => ({
                                ...prev,
                                gateways: {
                                  ...(prev.gateways ?? {}),
                                  paySuite: {
                                    ...(prev.gateways?.paySuite ?? {}),
                                    enabled: e.target.checked,
                                  },
                                },
                              }))
                            }
                          />
                          Ativar PaySuite
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-[#475569] text-[11px]">
                        URL do Webhook PaySuite (Cole no painel da PaySuite):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://cellbox-psi.vercel.app/api/webhooks/paysuite"
                          className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] font-mono text-[11px] text-[#0F172A] select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('https://cellbox-psi.vercel.app/api/webhooks/paysuite');
                            showToast('URL do Webhook PaySuite copiada!', 'success');
                          }}
                          className="h-9 px-3.5 rounded-[3px] bg-[#0A3768] hover:bg-[#0475EE] text-white text-[11px] font-bold uppercase whitespace-nowrap cursor-pointer"
                        >
                          Copiar URL
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="paysuite_api_key" className="block font-bold text-[#1E293B] mb-1">
                          API Key / Bearer Token:
                        </label>
                        <input
                          id="paysuite_api_key"
                          name="paysuite_api_key"
                          type={showGatewaySecrets ? 'text' : 'password'}
                          autoComplete="off"
                          data-lpignore="true"
                          placeholder="Cole aqui o Token / API Key da PaySuite"
                          value={draftCustomization.gateways?.paySuite?.apiKey || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                paySuite: {
                                  ...(prev.gateways?.paySuite ?? {}),
                                  apiKey: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="paysuite_merchant_id" className="block font-bold text-[#1E293B] mb-1">
                          Merchant ID / Client ID (opcional):
                        </label>
                        <input
                          id="paysuite_merchant_id"
                          name="paysuite_merchant_id"
                          type="text"
                          autoComplete="off"
                          placeholder="ID da conta comercial PaySuite"
                          value={draftCustomization.gateways?.paySuite?.merchantId || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                paySuite: {
                                  ...(prev.gateways?.paySuite ?? {}),
                                  merchantId: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="paysuite_webhook_secret" className="block font-bold text-[#1E293B] mb-1">
                          Webhook Secret:
                        </label>
                        <input
                          id="paysuite_webhook_secret"
                          name="paysuite_webhook_secret"
                          type={showGatewaySecrets ? 'text' : 'password'}
                          autoComplete="off"
                          data-lpignore="true"
                          placeholder="Segredo para validar notificações"
                          value={draftCustomization.gateways?.paySuite?.webhookSecret || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                paySuite: {
                                  ...(prev.gateways?.paySuite ?? {}),
                                  webhookSecret: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="paysuite_base_url" className="block font-bold text-[#1E293B] mb-1">
                          Base URL da API:
                        </label>
                        <input
                          id="paysuite_base_url"
                          name="paysuite_base_url"
                          type="url"
                          autoComplete="off"
                          placeholder="https://paysuite.tech/api/v1"
                          value={draftCustomization.gateways?.paySuite?.baseUrl || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                paySuite: {
                                  ...(prev.gateways?.paySuite ?? {}),
                                  baseUrl: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OPÇÃO 2: DEBITO PAY */}
                  <div className="p-5 bg-white border border-[#CBD5E1] rounded-[3px] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEAEA] pb-3">
                      <div>
                        <h4 className="font-bold text-[#0A3768] text-sm">
                          Opção 2 — Debito Pay (debito.co.mz)
                        </h4>
                        <p className="text-[11px] text-[#64748B]">
                          API REST unificada para M-Pesa, e-Mola e cartões Visa/Mastercard com suporte a HMAC e carteiras.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          aria-label="Ambiente Debito Pay"
                          value={draftCustomization.gateways?.debitoPay?.environment || 'sandbox'}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                debitoPay: {
                                  ...(prev.gateways?.debitoPay ?? {}),
                                  environment: e.target.value as GatewayEnvironment,
                                },
                              },
                            }))
                          }
                          className="h-8 px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] text-[11px] font-bold"
                        >
                          <option value="sandbox">Sandbox (Testes)</option>
                          <option value="production">Produção (Real)</option>
                        </select>
                        <label className="inline-flex items-center gap-1.5 font-bold text-[#1E293B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(draftCustomization.gateways?.debitoPay?.enabled)}
                            onChange={(e) =>
                              setDraftCustomization((prev) => ({
                                ...prev,
                                gateways: {
                                  ...(prev.gateways ?? {}),
                                  debitoPay: {
                                    ...(prev.gateways?.debitoPay ?? {}),
                                    enabled: e.target.checked,
                                  },
                                },
                              }))
                            }
                          />
                          Ativar Debito Pay
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-[#475569] text-[11px]">
                        URL do Webhook Debito Pay (Cole no painel da Debito Pay):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://cellbox-psi.vercel.app/api/webhooks/debitopay"
                          className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] font-mono text-[11px] text-[#0F172A] select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('https://cellbox-psi.vercel.app/api/webhooks/debitopay');
                            showToast('URL do Webhook Debito Pay copiada!', 'success');
                          }}
                          className="h-9 px-3.5 rounded-[3px] bg-[#0A3768] hover:bg-[#0475EE] text-white text-[11px] font-bold uppercase whitespace-nowrap cursor-pointer"
                        >
                          Copiar URL
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="debitopay_api_key" className="block font-bold text-[#1E293B] mb-1">
                          API Key (sk_live_... / sk_test_...):
                        </label>
                        <input
                          id="debitopay_api_key"
                          name="debitopay_api_key"
                          type={showGatewaySecrets ? 'text' : 'password'}
                          autoComplete="off"
                          data-lpignore="true"
                          placeholder="Chave secreta da API Debito Pay"
                          value={draftCustomization.gateways?.debitoPay?.apiKey || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                debitoPay: {
                                  ...(prev.gateways?.debitoPay ?? {}),
                                  apiKey: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="debitopay_wallet_id" className="block font-bold text-[#1E293B] mb-1">
                          Wallet ID / Merchant ID:
                        </label>
                        <input
                          id="debitopay_wallet_id"
                          name="debitopay_wallet_id"
                          type="text"
                          autoComplete="off"
                          placeholder="ID da carteira Debito Pay"
                          value={draftCustomization.gateways?.debitoPay?.walletId || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                debitoPay: {
                                  ...(prev.gateways?.debitoPay ?? {}),
                                  walletId: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="debitopay_webhook_secret" className="block font-bold text-[#1E293B] mb-1">
                          Webhook Secret (HMAC):
                        </label>
                        <input
                          id="debitopay_webhook_secret"
                          name="debitopay_webhook_secret"
                          type={showGatewaySecrets ? 'text' : 'password'}
                          autoComplete="off"
                          data-lpignore="true"
                          placeholder="Segredo HMAC do webhook"
                          value={draftCustomization.gateways?.debitoPay?.webhookSecret || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                debitoPay: {
                                  ...(prev.gateways?.debitoPay ?? {}),
                                  webhookSecret: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="debitopay_base_url" className="block font-bold text-[#1E293B] mb-1">
                          Base URL da API:
                        </label>
                        <input
                          id="debitopay_base_url"
                          name="debitopay_base_url"
                          type="url"
                          autoComplete="off"
                          placeholder="https://my.debito.co.mz/api"
                          value={draftCustomization.gateways?.debitoPay?.baseUrl || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                debitoPay: {
                                  ...(prev.gateways?.debitoPay ?? {}),
                                  baseUrl: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OPÇÃO 3: API OFICIAL VODACOM M-PESA + MOVITEL E-MOLA */}
                  <div className="p-5 bg-white border border-[#CBD5E1] rounded-[3px] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEAEA] pb-3">
                      <div>
                        <h4 className="font-bold text-[#0A3768] text-sm">
                          Opção 3 — API Oficial Vodacom M-Pesa &amp; Movitel e-Mola
                        </h4>
                        <p className="text-[11px] text-[#64748B]">
                          Integração direta com as operadoras (USSD Push na tela da CellBox). Sandbox disponível em developer.mpesa.vm.co.mz.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          aria-label="Ambiente API Oficial M-Pesa"
                          value={draftCustomization.gateways?.mpesaDirect?.environment || 'sandbox'}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                mpesaDirect: {
                                  ...(prev.gateways?.mpesaDirect ?? {}),
                                  environment: e.target.value as GatewayEnvironment,
                                },
                              },
                            }))
                          }
                          className="h-8 px-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] text-[11px] font-bold"
                        >
                          <option value="sandbox">Sandbox (Testes)</option>
                          <option value="production">Produção (Real)</option>
                        </select>
                        <label className="inline-flex items-center gap-1.5 font-bold text-[#1E293B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(draftCustomization.gateways?.mpesaDirect?.enabled)}
                            onChange={(e) =>
                              setDraftCustomization((prev) => ({
                                ...prev,
                                gateways: {
                                  ...(prev.gateways ?? {}),
                                  mpesaDirect: {
                                    ...(prev.gateways?.mpesaDirect ?? {}),
                                    enabled: e.target.checked,
                                  },
                                },
                              }))
                            }
                          />
                          Ativar API Direta
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-[#475569] text-[11px]">
                        URL de Callback / Webhook M-Pesa &amp; e-Mola:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://cellbox-psi.vercel.app/api/webhooks/mpesa"
                          className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] font-mono text-[11px] text-[#0F172A] select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('https://cellbox-psi.vercel.app/api/webhooks/mpesa');
                            showToast('URL de Callback M-Pesa/e-Mola copiada!', 'success');
                          }}
                          className="h-9 px-3.5 rounded-[3px] bg-[#0A3768] hover:bg-[#0475EE] text-white text-[11px] font-bold uppercase whitespace-nowrap cursor-pointer"
                        >
                          Copiar URL
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="mpesa_api_key" className="block font-bold text-[#1E293B] mb-1">
                          Vodacom M-Pesa API Key:
                        </label>
                        <input
                          id="mpesa_api_key"
                          name="mpesa_api_key"
                          type={showGatewaySecrets ? 'text' : 'password'}
                          autoComplete="off"
                          data-lpignore="true"
                          placeholder="API Key do portal M-Pesa"
                          value={draftCustomization.gateways?.mpesaDirect?.apiKey || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                mpesaDirect: {
                                  ...(prev.gateways?.mpesaDirect ?? {}),
                                  apiKey: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="mpesa_service_code" className="block font-bold text-[#1E293B] mb-1">
                          Service Provider Code (Shortcode):
                        </label>
                        <input
                          id="mpesa_service_code"
                          name="mpesa_service_code"
                          type="text"
                          autoComplete="off"
                          placeholder="Ex: 171717"
                          value={draftCustomization.gateways?.mpesaDirect?.serviceProviderCode || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                mpesaDirect: {
                                  ...(prev.gateways?.mpesaDirect ?? {}),
                                  serviceProviderCode: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="mpesa_origin_host" className="block font-bold text-[#1E293B] mb-1">
                          Host da API (Origin):
                        </label>
                        <input
                          id="mpesa_origin_host"
                          name="mpesa_origin_host"
                          type="text"
                          autoComplete="off"
                          placeholder="api.sandbox.vm.co.mz"
                          value={draftCustomization.gateways?.mpesaDirect?.originHost || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                mpesaDirect: {
                                  ...(prev.gateways?.mpesaDirect ?? {}),
                                  originHost: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="mpesa_public_key" className="block font-bold text-[#1E293B] mb-1">
                        Vodacom M-Pesa Public Key (RSA):
                      </label>
                      <textarea
                        id="mpesa_public_key"
                        name="mpesa_public_key"
                        rows={2}
                        autoComplete="off"
                        placeholder="Cole aqui a Public Key RSA fornecida no portal M-Pesa Developer"
                        value={draftCustomization.gateways?.mpesaDirect?.publicKey || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            gateways: {
                              ...(prev.gateways ?? {}),
                              mpesaDirect: {
                                ...(prev.gateways?.mpesaDirect ?? {}),
                                publicKey: e.target.value.trim(),
                              },
                            },
                          }))
                        }
                        className="w-full p-2.5 border border-[#CBD5E1] rounded-[3px] font-mono text-[11px] focus:border-[#0475EE] focus:outline-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-[#EAEAEA] grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="emola_api_key" className="block font-bold text-[#1E293B] mb-1">
                          Movitel e-Mola API Key / Client ID (opcional):
                        </label>
                        <input
                          id="emola_api_key"
                          name="emola_api_key"
                          type={showGatewaySecrets ? 'text' : 'password'}
                          autoComplete="off"
                          data-lpignore="true"
                          placeholder="Client ID e-Mola"
                          value={draftCustomization.gateways?.mpesaDirect?.emolaApiKey || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                mpesaDirect: {
                                  ...(prev.gateways?.mpesaDirect ?? {}),
                                  emolaApiKey: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="emola_api_secret" className="block font-bold text-[#1E293B] mb-1">
                          Movitel e-Mola API Secret (opcional):
                        </label>
                        <input
                          id="emola_api_secret"
                          name="emola_api_secret"
                          type={showGatewaySecrets ? 'text' : 'password'}
                          autoComplete="off"
                          data-lpignore="true"
                          placeholder="Secret Key e-Mola"
                          value={draftCustomization.gateways?.mpesaDirect?.emolaApiSecret || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                mpesaDirect: {
                                  ...(prev.gateways?.mpesaDirect ?? {}),
                                  emolaApiSecret: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="emola_shortcode" className="block font-bold text-[#1E293B] mb-1">
                          e-Mola Shortcode / Número Comercial:
                        </label>
                        <input
                          id="emola_shortcode"
                          name="emola_shortcode"
                          type="text"
                          autoComplete="off"
                          placeholder="Código comercial e-Mola"
                          value={draftCustomization.gateways?.mpesaDirect?.emolaShortcode || ''}
                          onChange={(e) =>
                            setDraftCustomization((prev) => ({
                              ...prev,
                              gateways: {
                                ...(prev.gateways ?? {}),
                                mpesaDirect: {
                                  ...(prev.gateways?.mpesaDirect ?? {}),
                                  emolaShortcode: e.target.value.trim(),
                                },
                              },
                            }))
                          }
                          className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] font-mono text-xs focus:border-[#0475EE] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* OPÇÃO 4: ESCALEPAY (TAXA FIXA DE 100 MT) */}
                  <div className="p-5 bg-white border border-[#CBD5E1] rounded-[3px] space-y-4">
                    <div className="border-b border-[#EAEAEA] pb-3">
                      <h4 className="font-bold text-[#0A3768] text-sm">
                        Opção 4 — EscalePay (Taxa Fixa de Ativação de Lojistas — 100 MT)
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Ao configurar o link do seu produto da EscalePay abaixo, os lojistas pagam a taxa de adesão de 100 MT diretamente pelo checkout oficial e a loja é ativada automaticamente via Webhook.
                      </p>
                    </div>

                    {/* URL DO WEBHOOK PARA O USUÁRIO COPIAR */}
                    <div className="space-y-2">
                      <label className="block font-bold text-[#1E293B] text-xs">
                        1. URL do Webhook da CellBox (Cole nas configurações da sua conta EscalePay):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://cellbox-psi.vercel.app/api/webhooks/escalepay"
                          className="w-full h-10 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] font-mono text-xs text-[#0F172A] select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('https://cellbox-psi.vercel.app/api/webhooks/escalepay');
                            showToast('URL do Webhook copiada para a área de transferência!', 'success');
                          }}
                          className="h-10 px-4 rounded-[3px] bg-[#0A3768] hover:bg-[#0475EE] text-white text-xs font-bold uppercase whitespace-nowrap cursor-pointer transition-colors"
                        >
                          Copiar URL
                        </button>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        No painel da EscalePay, cadastre essa URL em <em>Configurações / Webhooks</em> para o evento de venda aprovada.
                      </p>
                    </div>

                    {/* LINK DO PRODUTO ESCALEPAY */}
                    <div className="space-y-2">
                      <label className="block font-bold text-[#1E293B] text-xs">
                        2. Link do Produto / Checkout EscalePay (100 MT):
                      </label>
                      <input
                        type="url"
                        id="cellbox_escalepay_checkout_link"
                        name="cellbox_escalepay_checkout_link"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        placeholder="Ex: https://pay.escalepay.com/pay/abc123xyz"
                        value={draftCustomization.gateways?.escalePayCheckoutUrl || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            gateways: {
                              ...(prev.gateways ?? {}),
                              escalePayCheckoutUrl: e.target.value.trim(),
                            },
                          }))
                        }
                        className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] text-xs focus:border-[#0475EE] focus:outline-none"
                      />
                      <p className="text-[11px] text-[#64748B]">
                        Crie um produto na sua conta EscalePay com valor de 100 MT e cole aqui o link gerado. Esse link será aberto automaticamente quando o lojista clicar em pagar no painel do vendedor.
                      </p>
                    </div>

                    {/* TOKEN SECRETO (OPCIONAL) */}
                    <div className="space-y-2">
                      <label className="block font-bold text-[#1E293B] text-xs">
                        3. Chave Secreta / Token do Webhook (Opcional):
                      </label>
                      <input
                        type={showGatewaySecrets ? 'text' : 'password'}
                        id="cellbox_escalepay_webhook_token"
                        name="cellbox_escalepay_webhook_token"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        placeholder="Token de segurança fornecido pela EscalePay (opcional)"
                        value={draftCustomization.gateways?.escalePayWebhookSecret || ''}
                        onChange={(e) =>
                          setDraftCustomization((prev) => ({
                            ...prev,
                            gateways: {
                              ...(prev.gateways ?? {}),
                              escalePayWebhookSecret: e.target.value.trim(),
                            },
                          }))
                        }
                        className="w-full h-10 px-3 border border-[#CBD5E1] rounded-[3px] text-xs font-mono focus:border-[#0475EE] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Salvar no Rodapé da Aba */}
              <div className="pt-6 border-t border-[#EAEAEA] flex items-center justify-between">
                <p className="text-xs text-[#777777]">
                  As alterações são salvas diretamente no banco de dados e refletem em tempo real no site.
                </p>
                <MotionButton
                  type="button"
                  onClick={() => handleSaveCms()}
                  disabled={savingCms}
                  className="h-10 px-8 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {savingCms ? 'Salvando...' : 'Salvar Alterações do Site'}
                </MotionButton>
              </div>
            </div>
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
              const sStats = calculateSellerAnalytics(inspectedSeller.id, orders, commissionRate, payouts);
              const sProds = products.filter((p) => p.sellerId === inspectedSeller.id);
              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#F7F8FA] border border-[#EAEAEA] rounded-[3px] p-3.5">
                      <p className="text-xs text-[#777777]">Faturamento Bruto</p>
                      <p className="text-base font-extrabold font-mono tabular-nums text-[#333333] mt-1">
                        {formatCurrency(sStats.monthlySales)}
                      </p>
                    </div>
                    <div className="bg-[#F7F8FA] border border-[#EAEAEA] rounded-[3px] p-3.5">
                      <p className="text-xs text-[#777777]">Comissão Cellbox ({commissionRate}%)</p>
                      <p className="text-base font-extrabold font-mono tabular-nums text-[#0475EE] mt-1">
                        {formatCurrency(sStats.commissionDeducted)}
                      </p>
                    </div>
                    <div className="bg-[#F7F8FA] border border-[#EAEAEA] rounded-[3px] p-3.5">
                      <p className="text-xs text-[#777777]">Saldo Disponível</p>
                      <p className="text-base font-extrabold font-mono tabular-nums text-[#0A3768] mt-1">
                        {formatCurrency(sStats.availableBalance)}
                      </p>
                    </div>
                    <div className="bg-[#F7F8FA] border border-[#EAEAEA] rounded-[3px] p-3.5">
                      <p className="text-xs text-[#777777]">Já Repassado</p>
                      <p className="text-base font-extrabold font-mono tabular-nums text-emerald-700 mt-1">
                        {formatCurrency(sStats.paidPayoutsTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-[#555555] space-y-2 border-t border-[#EAEAEA] pt-4">
                    <div className="flex items-center justify-between">
                      <p>
                        <strong>Status da Loja:</strong>{' '}
                        <span className={`font-bold ${statusColor(inspectedSeller.status)}`}>
                          {statusLabel(inspectedSeller.status)}
                        </span>
                      </p>
                      <p>
                        <strong>Verificada:</strong>{' '}
                        {inspectedSeller.verified ? (
                          <span className="text-emerald-700 font-bold">Sim (Oficial)</span>
                        ) : (
                          <span className="text-amber-700 font-bold">Não</span>
                        )}
                      </p>
                    </div>

                    <p>
                      <strong>Categoria principal:</strong> {inspectedSeller.mainCategory}
                    </p>
                    <p>
                      <strong>Produtos cadastrados:</strong> {sProds.length}
                    </p>
                    <p>
                      <strong>Dados de repasse:</strong> {formatSellerPayoutSummary(inspectedSeller.payoutInfo)}
                    </p>

                    {/* Dados e Controles de Verificação KYC e Taxa de Inscrição */}
                    {(() => {
                      const cur = sellers.find((it) => it.id === inspectedSeller.id) || inspectedSeller;
                      const kycStatus = cur.kyc?.status || (cur.activation?.kycCompleted ? 'verified' : 'not_submitted');
                      const feeStatus = cur.activation?.feePaid ? 'verified' : cur.activation?.feeStatus || (cur.activation?.feeTransactionId ? 'pending' : 'not_submitted');

                      return (
                        <div className="space-y-3 pt-2">
                          {/* SEÇÃO 1: VALIDAÇÃO KYC */}
                          <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] space-y-3">
                            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                              <p className="font-bold text-[#0A3768] text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-[#0475EE]" />
                                Validação de Identidade (KYC)
                              </p>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  kycStatus === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : kycStatus === 'pending'
                                      ? 'bg-amber-100 text-amber-800'
                                      : kycStatus === 'rejected'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {kycStatus === 'verified'
                                  ? 'Aprovado ✓'
                                  : kycStatus === 'pending'
                                    ? 'Em Análise ⏳'
                                    : kycStatus === 'rejected'
                                      ? 'Rejeitado ✕'
                                      : 'Não Submetido'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-[#334155]">
                              <p>
                                <strong>Titular:</strong> {cur.kyc?.fullName || 'Não informado'}
                              </p>
                              <p>
                                <strong>Tipo:</strong> {cur.kyc?.documentType || 'BI'}
                              </p>
                              <p className="col-span-2 font-mono">
                                <strong>Número do Doc:</strong> {cur.kyc?.documentNumber || cur.documentId || 'Não informado'}
                              </p>
                              {cur.kyc?.rejectionReason && (
                                <p className="col-span-2 text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                                  <strong>Motivo da Rejeição:</strong> {cur.kyc.rejectionReason}
                                </p>
                              )}
                            </div>

                            {/* Imagens do documento (Frente e Verso) */}
                            <div className="flex flex-wrap gap-3 pt-1">
                              {cur.kyc?.documentFrontUrl && (
                                <div>
                                  <p className="text-[10px] font-bold text-[#64748B] mb-1">Foto da Frente:</p>
                                  <a
                                    href={cur.kyc.documentFrontUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block border border-[#CBD5E1] rounded overflow-hidden w-28 hover:border-[#0475EE]"
                                  >
                                    <img
                                      src={cur.kyc.documentFrontUrl}
                                      alt="Frente do Documento"
                                      className="w-full h-16 object-cover"
                                    />
                                    <span className="block text-[9px] text-center bg-white py-0.5 text-[#0475EE] font-bold">
                                      Ampliar
                                    </span>
                                  </a>
                                </div>
                              )}
                              {cur.kyc?.documentBackUrl && (
                                <div>
                                  <p className="text-[10px] font-bold text-[#64748B] mb-1">Foto do Verso:</p>
                                  <a
                                    href={cur.kyc.documentBackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block border border-[#CBD5E1] rounded overflow-hidden w-28 hover:border-[#0475EE]"
                                  >
                                    <img
                                      src={cur.kyc.documentBackUrl}
                                      alt="Verso do Documento"
                                      className="w-full h-16 object-cover"
                                    />
                                    <span className="block text-[9px] text-center bg-white py-0.5 text-[#0475EE] font-bold">
                                      Ampliar
                                    </span>
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Botões de Ação KYC */}
                            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                              {kycStatus !== 'verified' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await reviewSellerKyc(cur.id, 'approve');
                                  }}
                                  className="h-7 px-3 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase cursor-pointer"
                                >
                                  Aprovar KYC
                                </button>
                              )}
                              {kycStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const reason = window.prompt('Informe o motivo da rejeição do KYC:', 'Documento ilegível ou inválido.');
                                    if (reason) {
                                      await reviewSellerKyc(cur.id, 'reject', reason);
                                    }
                                  }}
                                  className="h-7 px-3 rounded-[3px] border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-bold uppercase cursor-pointer"
                                >
                                  Rejeitar KYC
                                </button>
                              )}
                            </div>
                          </div>

                          {/* SEÇÃO 2: VALIDAÇÃO DA TAXA DE ADESÃO (100 MT) */}
                          <div className="p-3.5 bg-[#FFFDF5] border border-[#FDE68A] rounded-[3px] space-y-3">
                            <div className="flex items-center justify-between border-b border-[#FDE68A] pb-2">
                              <p className="font-bold text-[#92400E] text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-[#D97706]" />
                                Pagamento da Taxa de Inscrição (100,00 MT)
                              </p>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  feeStatus === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : feeStatus === 'pending'
                                      ? 'bg-amber-100 text-amber-800'
                                      : feeStatus === 'rejected'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {feeStatus === 'verified'
                                  ? '100 MT Confirmado ✓'
                                  : feeStatus === 'pending'
                                    ? 'Transação em Análise ⏳'
                                    : feeStatus === 'rejected'
                                      ? 'Rejeitado ✕'
                                      : 'Pendente'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-[#334155]">
                              <p>
                                <strong>Carteira:</strong> {cur.activation?.feePaymentMethod === 'emola' ? 'Movitel e-Mola' : 'Vodacom M-Pesa'}
                              </p>
                              <p>
                                <strong>Celular Pagador:</strong> {cur.activation?.feePhone || 'Não informado'}
                              </p>
                              <div className="col-span-2 bg-white p-2 rounded border border-[#FDE68A]">
                                <p className="text-[10px] font-bold text-[#78350F] uppercase">Código / ID da Transação (SMS):</p>
                                <p className="font-mono text-xs font-bold text-[#1E293B] mt-0.5">
                                  {cur.activation?.feeTransactionId || cur.activation?.feeReceipt || 'Nenhum código informado'}
                                </p>
                              </div>
                              {cur.activation?.feeRejectionReason && (
                                <p className="col-span-2 text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                                  <strong>Motivo da Rejeição:</strong> {cur.activation.feeRejectionReason}
                                </p>
                              )}
                            </div>

                            {/* Comprovante anexado */}
                            {cur.activation?.feeProofUrl && (
                              <div>
                                <p className="text-[10px] font-bold text-[#64748B] mb-1">Comprovante de Pagamento:</p>
                                <a
                                  href={cur.activation.feeProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block border border-[#CBD5E1] rounded overflow-hidden w-28 hover:border-[#0475EE]"
                                >
                                  <img
                                    src={cur.activation.feeProofUrl}
                                    alt="Comprovante de Pagamento"
                                    className="w-full h-16 object-cover"
                                  />
                                  <span className="block text-[9px] text-center bg-white py-0.5 text-[#0475EE] font-bold">
                                    Ampliar
                                  </span>
                                </a>
                              </div>
                            )}

                            {/* Botões de Ação da Taxa */}
                            <div className="pt-2 border-t border-[#FDE68A] flex items-center justify-end gap-2">
                              {feeStatus !== 'verified' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await reviewSellerFee(cur.id, 'approve');
                                  }}
                                  className="h-7 px-3 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase cursor-pointer"
                                >
                                  Confirmar 100 MT
                                </button>
                              )}
                              {feeStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const reason = window.prompt('Informe o motivo da rejeição do pagamento:', 'Transação não encontrada no extrato.');
                                    if (reason) {
                                      await reviewSellerFee(cur.id, 'reject', reason);
                                    }
                                  }}
                                  className="h-7 px-3 rounded-[3px] border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-bold uppercase cursor-pointer"
                                >
                                  Rejeitar Taxa
                                </button>
                              )}
                            </div>
                          </div>

                          {/* SEÇÃO 3: CONTROLE GERAL DA LOJA */}
                          <div className="pt-2 flex items-center justify-between border-t border-[#EAEAEA]">
                            <div>
                              <p className="text-xs font-bold text-[#334155]">
                                Status Oficial: <span className="uppercase text-[#0475EE]">{cur.status}</span>
                              </p>
                              <p className="text-[11px] text-[#64748B]">
                                {cur.verified ? '✓ Loja Oficial Verificada' : 'Pendente de Verificação Completa'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {cur.status !== 'active' ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await setSellerStatus(cur.id, 'active');
                                  }}
                                  className="h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase cursor-pointer"
                                >
                                  Ativar Loja
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await setSellerStatus(cur.id, 'suspended');
                                  }}
                                  className="h-9 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase cursor-pointer"
                                >
                                  Suspender Loja
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
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL DE CONFERÊNCIA E CONFIRMAÇÃO DE REPASSE (MODO A) */}
      {reviewingPayout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-admin-payout-title"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[4px] border border-[#EAEAEA] w-full max-w-lg shadow-2xl overflow-hidden">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                payoutActionMode === 'approve' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}
            >
              <div>
                <h3 id="modal-admin-payout-title" className="font-condensed text-xl font-bold uppercase">
                  {payoutActionMode === 'approve'
                    ? 'Confirmar Transferência de Repasse'
                    : 'Rejeitar Solicitação de Saque'}
                </h3>
                <p className="text-xs text-white/85">
                  {reviewingPayout.sellerName} · {formatCurrency(reviewingPayout.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingPayout(null)}
                className="p-1 rounded-full hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayoutReview} className="p-6 space-y-4">
              {payoutReviewError && (
                <div className="p-3 rounded-[3px] bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {payoutReviewError}
                </div>
              )}

              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[3px] p-3.5 text-xs space-y-1">
                <p>
                  <strong>Destino do Pagamento:</strong> {reviewingPayout.destinationSummary}
                </p>
                <p>
                  <strong>Valor a Transferir:</strong>{' '}
                  <span className="font-mono font-bold text-[#0A3768]">
                    {formatCurrency(reviewingPayout.amount)}
                  </span>
                </p>
              </div>

              {payoutActionMode === 'approve' ? (
                <>
                  <div>
                    <label htmlFor="admin-payout-ref" className="block text-xs font-bold text-[#333333] mb-1">
                      Código / Referência da Transação *
                    </label>
                    <input
                      id="admin-payout-ref"
                      type="text"
                      required
                      value={payoutTxRef}
                      onChange={(e) => setPayoutTxRef(e.target.value)}
                      placeholder="Ex: MPESA-987654321 ou NIB-REF-001"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#333333] mb-1">
                      Comprovante de Transferência (opcional)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="h-9 px-4 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingPayoutProof ? 'Enviando...' : 'Anexar Imagem'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          disabled={uploadingPayoutProof}
                          onChange={(e) => void handlePayoutProofUpload(e)}
                          className="sr-only"
                        />
                      </label>
                      {payoutProofUrl && (
                        <a
                          href={payoutProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                        >
                          Comprovante anexado <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-payout-notes" className="block text-xs font-bold text-[#333333] mb-1">
                      Observações (opcional)
                    </label>
                    <input
                      id="admin-payout-notes"
                      type="text"
                      value={payoutAdminNotes}
                      onChange={(e) => setPayoutAdminNotes(e.target.value)}
                      placeholder="Ex: Transferência realizada via M-Pesa B2C"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="admin-payout-reject-reason" className="block text-xs font-bold text-[#333333] mb-1">
                    Motivo da Rejeição (estornará o saldo ao vendedor) *
                  </label>
                  <textarea
                    id="admin-payout-reject-reason"
                    rows={3}
                    required
                    value={payoutAdminNotes}
                    onChange={(e) => setPayoutAdminNotes(e.target.value)}
                    placeholder="Ex: Número M-Pesa não corresponde ao titular cadastrado."
                    className="w-full p-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewingPayout(null)}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingPayout}
                  className={`h-9 px-6 rounded-full text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer ${
                    payoutActionMode === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingPayout
                    ? 'Processando...'
                    : payoutActionMode === 'approve'
                      ? 'Registrar Repasse Pago'
                      : 'Confirmar Rejeição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
