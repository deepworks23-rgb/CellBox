import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { IMAGE_PRESET_OPTIONS } from '../data/seedData';
import type { ProductCondition } from '../types';
import {
  calculateSellerAnalytics,
  formatCurrency,
  getNextOrderStatus,
  isStorePubliclyActive,
  validateProductForm,
} from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

interface SellerDashboardViewProps {
  initialTab?: 'overview' | 'products' | 'orders' | 'settings';
}

export function SellerDashboardView({ initialTab = 'overview' }: SellerDashboardViewProps) {
  const {
    currentUser,
    sellers,
    products,
    categories,
    orders,
    commissionRate,
    createProduct,
    updateProduct,
    deleteProduct,
    updateOrderFulfillmentStatus,
    updateSellerSettings,
    uploadImageAsset,
    submitSellerKyc,
    paySellerActivationFee,
    navigate,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings'>(
    initialTab
  );
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Todas');
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [uploadingBannerImg, setUploadingBannerImg] = useState(false);

  // Activation, KYC & Fee Payment State
  const [kycDocType, setKycDocType] = useState<'bi' | 'nuit' | 'passaporte' | 'licenca'>('bi');
  const [kycDocNumber, setKycDocNumber] = useState(seller?.documentId ?? '');
  const [kycFullName, setKycFullName] = useState(currentUser?.name ?? '');
  const [kycDocFrontUrl, setKycDocFrontUrl] = useState('');
  const [uploadingKycDoc, setUploadingKycDoc] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const [feeMethod, setFeeMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [feePhone, setFeePhone] = useState(currentUser?.phone ?? '');
  const [payingFee, setPayingFee] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false);

  const isPublicActive = seller ? isStorePubliclyActive(seller) : false;
  const profileDone = Boolean(
    seller?.activation?.profileCompleted ?? (seller?.name && seller?.mainCategory && seller?.location)
  );
  const kycDone = Boolean(
    seller?.activation?.kycCompleted || seller?.kyc?.status === 'verified'
  );
  const kycPending = seller?.kyc?.status === 'pending';
  const feeDone = Boolean(seller?.activation?.feePaid);

  const completedStepsCount = (profileDone ? 1 : 0) + (kycDone ? 1 : 0) + (feeDone ? 1 : 0);
  const progressPercent = Math.round((completedStepsCount / 3) * 100);

  const handleUploadKycDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingKycDoc(true);
    try {
      const result = await uploadImageAsset(file, 'banners');
      if (result.ok && result.url) {
        setKycDocFrontUrl(result.url);
      }
    } finally {
      setUploadingKycDoc(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || !kycDocNumber.trim() || !kycFullName.trim()) return;
    setSubmittingKyc(true);
    try {
      const ok = await submitSellerKyc(seller.id, {
        documentType: kycDocType,
        documentNumber: kycDocNumber.trim(),
        fullName: kycFullName.trim(),
        documentFrontUrl: kycDocFrontUrl || undefined,
      });
      if (ok) {
        setKycModalOpen(false);
      }
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || !feePhone.trim()) return;
    setPayingFee(true);
    try {
      const ok = await paySellerActivationFee(seller.id, {
        method: feeMethod,
        phone: feePhone.trim(),
      });
      if (ok) {
        setFeeModalOpen(false);
      }
    } finally {
      setPayingFee(false);
    }
  };

  const seller =
    sellers.find((s) => currentUser?.sellerId && s.id === currentUser.sellerId) ??
    sellers.find((s) => currentUser && s.ownerUserId === currentUser.id) ??
    sellers[0];

  // Product Form State
  const [formState, setFormState] = useState({
    title: '',
    brand: '',
    category: categories[0] ?? 'Smartphones',
    condition: 'Novo' as ProductCondition,
    price: '',
    originalPrice: '',
    stock: '10',
    description: '',
    imageUrl: IMAGE_PRESET_OPTIONS[0].url as string,
    ram: '',
    storage: '',
    processor: '',
    display: '',
    battery: '',
    warranty: '12 meses oficial',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Store settings form
  const [storeForm, setStoreForm] = useState({
    name: seller?.name ?? '',
    description: seller?.description ?? '',
    logoText: seller?.logoText ?? '',
    accentColor: seller?.accentColor ?? '#0475EE',
    location: seller?.location ?? '',
    bannerImage: seller?.bannerImage ?? '',
    bankName: seller?.payoutInfo.bankName ?? '',
    accountType: seller?.payoutInfo.accountType ?? '',
    accountNumber: seller?.payoutInfo.accountNumber ?? '',
    pixOrWallet: seller?.payoutInfo.pixOrWallet ?? '',
  });

  useEffect(() => {
    if (!seller) return;
    setStoreForm({
      name: seller.name,
      description: seller.description,
      logoText: seller.logoText,
      accentColor: seller.accentColor,
      location: seller.location,
      bannerImage: seller.bannerImage,
      bankName: seller.payoutInfo.bankName,
      accountType: seller.payoutInfo.accountType,
      accountNumber: seller.payoutInfo.accountNumber,
      pixOrWallet: seller.payoutInfo.pixOrWallet,
    });
  }, [seller]);

  const sellerProducts = useMemo(() => {
    if (!seller) return [];
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (p.sellerId !== seller.id) return false;
      if (productCategoryFilter !== 'Todas' && p.category !== productCategoryFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [products, seller, productSearch, productCategoryFilter]);

  const sellerOrders = useMemo(() => {
    if (!seller) return [];
    const list: Array<{
      orderId: string;
      buyerName: string;
      buyerEmail: string;
      createdAt: string;
      city: string;
      fulfillment: (typeof orders)[0]['fulfillments'][0];
    }> = [];
    for (const order of orders) {
      const f = order.fulfillments.find((entry) => entry.sellerId === seller.id);
      if (f) {
        list.push({
          orderId: order.id,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          createdAt: order.createdAt,
          city: `${order.shippingAddress.city} - ${order.shippingAddress.state}`,
          fulfillment: f,
        });
      }
    }
    return list;
  }, [orders, seller]);

  const analytics = useMemo(
    () =>
      seller
        ? calculateSellerAnalytics(seller.id, orders, commissionRate)
        : {
            monthlySales: 0,
            availableBalance: 0,
            pendingOrdersCount: 0,
            totalOrdersCount: 0,
            itemsSold: 0,
          },
    [seller, orders, commissionRate]
  );

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(formState.price);
    const numericStock = Number(formState.stock);
    const errors = validateProductForm({
      title: formState.title,
      brand: formState.brand,
      category: formState.category,
      condition: formState.condition,
      price: numericPrice,
      stock: numericStock,
      description: formState.description,
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    createProduct({
      sellerId: seller.id,
      title: formState.title,
      brand: formState.brand,
      category: formState.category,
      condition: formState.condition,
      price: numericPrice,
      originalPrice: formState.originalPrice ? Number(formState.originalPrice) : undefined,
      stock: numericStock,
      description: formState.description,
      imageUrl: formState.imageUrl,
      specs: {
        ram: formState.ram || undefined,
        storage: formState.storage || undefined,
        processor: formState.processor || undefined,
        display: formState.display || undefined,
        battery: formState.battery || undefined,
        warranty: formState.warranty || '12 meses',
      },
    });
    setNewProductOpen(false);
    setFormState({
      title: '',
      brand: '',
      category: categories[0] ?? 'Smartphones',
      condition: 'Novo',
      price: '',
      originalPrice: '',
      stock: '10',
      description: '',
      imageUrl: IMAGE_PRESET_OPTIONS[0].url,
      ram: '',
      storage: '',
      processor: '',
      display: '',
      battery: '',
      warranty: '12 meses oficial',
    });
    setActiveTab('products');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSellerSettings(seller.id, {
      name: storeForm.name.trim() || seller.name,
      description: storeForm.description.trim(),
      logoText: storeForm.logoText.trim().slice(0, 3).toUpperCase() || seller.logoText,
      accentColor: storeForm.accentColor,
      location: storeForm.location.trim(),
      bannerImage: storeForm.bannerImage.trim(),
      payoutInfo: {
        bankName: storeForm.bankName.trim(),
        accountType: storeForm.accountType.trim(),
        accountNumber: storeForm.accountNumber.trim(),
        pixOrWallet: storeForm.pixOrWallet.trim(),
      },
    });
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingProductImg(true);
    try {
      const result = await uploadImageAsset(file, 'products');
      if (result.ok && result.url) {
        setFormState((p) => ({ ...p, imageUrl: result.url! }));
      }
    } finally {
      setUploadingProductImg(false);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingBannerImg(true);
    try {
      const result = await uploadImageAsset(file, 'banners');
      if (result.ok && result.url) {
        setStoreForm((p) => ({ ...p, bannerImage: result.url! }));
      }
    } finally {
      setUploadingBannerImg(false);
    }
  };

  const navItems = [
    { id: 'overview' as const, label: 'Visão Geral', icon: BarChart3 },
    { id: 'products' as const, label: 'Produtos', icon: Package },
    { id: 'orders' as const, label: 'Pedidos', icon: ShoppingBag },
    { id: 'settings' as const, label: 'Configurações da Loja', icon: Settings },
  ];

  const statusText =
    seller?.status === 'active'
      ? 'Loja Ativa'
      : seller?.status === 'pending'
        ? 'Pendente de Aprovação'
        : 'Loja Suspensa';

  if (!currentUser || currentUser.role !== 'seller' || !seller) {
    return null;
  }

  return (
    <div className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      {/* Visual Activation Banner if store is not publicly active */}
      {!isPublicActive ? (
        <section
          aria-label="Ativação da Loja"
          className="mb-8 bg-gradient-to-r from-[#0A3768] via-[#0D4B8A] to-[#0475EE] text-white rounded-[4px] p-6 shadow-sm border border-[#0A3768]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950">
                  Modo Privado · Ativação Pendente
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {completedStepsCount} de 3 etapas concluídas ({progressPercent}%)
                </span>
              </div>
              <h2 className="font-condensed text-2xl font-bold uppercase tracking-tight">
                Ativação da sua Loja na CellBox
              </h2>
              <p className="text-xs text-white/90 max-w-2xl mt-1 leading-relaxed">
                Para proteger os compradores e garantir a qualidade dos parceiros, sua loja e produtos permanecem invisíveis no catálogo público até a conclusão de 3 etapas simples.
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full md:w-56 shrink-0 bg-white/10 p-3 rounded-[3px] border border-white/15">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span>Progresso</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#34D399] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {/* Step 1: Store Profile */}
            <div className="bg-white/10 rounded-[3px] p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
                    Etapa 1
                  </span>
                  {profileDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Pendente
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Perfil da Loja</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Nome da loja, categoria de atuação e endereço comercial configurados.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="w-full h-8 px-3 rounded-[3px] bg-white/15 hover:bg-white/25 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {profileDone ? 'Ver Configurações' : 'Completar Perfil'}
                </button>
              </div>
            </div>

            {/* Step 2: KYC Identity Verification */}
            <div className="bg-white/10 rounded-[3px] p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
                    Etapa 2
                  </span>
                  {kycDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                    </span>
                  ) : kycPending ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Em Análise
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300">
                      <ShieldAlert className="w-3.5 h-3.5" /> Obrigatório
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Verificação de Identidade (KYC)</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Envio de BI, NUIT ou Passaporte do responsável legal pela loja.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                {kycDone ? (
                  <span className="text-xs font-semibold text-emerald-300 block text-center py-1">
                    Documento Aprovado
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setKycModalOpen(true)}
                    className="w-full h-8 px-3 rounded-[3px] bg-white text-[#0A3768] hover:bg-white/90 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {kycPending ? 'Atualizar Documentos' : 'Enviar Documento (KYC)'}
                  </button>
                )}
              </div>
            </div>

            {/* Step 3: Registration Fee (100 MZN) */}
            <div className="bg-white/10 rounded-[3px] p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
                    Etapa 3
                  </span>
                  {feeDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100 MT Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <CreditCard className="w-3.5 h-3.5" /> 100 MT Pendente
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Taxa de Inscrição (100 MZN)</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Taxa única de ativação via <strong>M-Pesa</strong> ou <strong>e-Mola</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                {feeDone ? (
                  <span className="text-xs font-semibold text-emerald-300 block text-center py-1">
                    Taxa Confirmada ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFeeModalOpen(true)}
                    className="w-full h-8 px-3 rounded-[3px] bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Pagar 100 MZN
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div
          role="status"
          className="mb-6 bg-emerald-50 border border-emerald-200 rounded-[3px] p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-950">
                Loja Oficial Ativa & Verificada
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Sua vitrine está disponível em /lojas e seus anúncios estão ativos no catálogo CellBox.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate({ type: 'store', sellerId: seller.id })}
            className="h-8 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            Ver Loja Pública
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white border border-[#EAEAEA] rounded-[3px] p-4 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#EAEAEA]">
            <div
              className="w-11 h-11 rounded-[3px] flex items-center justify-center text-white font-extrabold text-sm shrink-0"
              style={{ backgroundColor: seller.accentColor }}
            >
              {seller.logoText}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#222222] truncate">{seller.name}</p>
              <p className="text-xs text-[#0475EE] font-semibold truncate">{statusText}</p>
            </div>
          </div>

          <nav aria-label="Navegação do Painel do Vendedor" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[3px] text-[13px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0475EE] text-white'
                      : 'text-[#555555] hover:bg-[#F1F2F4] hover:text-[#222222]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#EAEAEA] space-y-2">
            <button
              type="button"
              onClick={() => navigate({ type: 'store', sellerId: seller.id })}
              className="w-full h-9 px-3 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] hover:text-[#0475EE] text-xs font-bold uppercase text-[#444444] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              Ver Vitrine Pública
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'home' })}
              className="w-full h-8 px-3 rounded-full text-xs font-semibold text-[#777777] hover:text-[#333333] cursor-pointer"
            >
              Voltar ao Marketplace
            </button>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="lg:col-span-9 space-y-6 min-w-0">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Painel do Vendedor / {navItems.find((i) => i.id === activeTab)?.label}
              </p>
              <h1 className="font-condensed text-[28px] font-bold uppercase text-[#0A3768] mt-0.5">
                {navItems.find((i) => i.id === activeTab)?.label}
              </h1>
            </div>
            <MotionButton
              type="button"
              onClick={() => setNewProductOpen(true)}
              className="h-10 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </MotionButton>
          </div>

          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">Vendas do Mês (Bruto)</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2">
                    {formatCurrency(analytics.monthlySales)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {analytics.itemsSold} unidades vendidas
                  </p>
                </div>

                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">Saldo Disponível para Saque</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#0475EE] mt-2">
                    {formatCurrency(analytics.availableBalance)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    Líquido após comissão de {commissionRate}%
                  </p>
                </div>

                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">Pedidos Pendentes</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#18A3DE] mt-2">
                    {analytics.pendingOrdersCount}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    De {analytics.totalOrdersCount} pedidos totais
                  </p>
                </div>

                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5">
                  <p className="text-xs font-semibold text-[#777777]">Avaliação da Loja</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2 inline-flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-[#F5A623] text-[#F5A623]" />
                    {seller.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {seller.reviewCount} avaliações de clientes
                  </p>
                </div>
              </div>

              {/* Recent Orders Quick Table */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between">
                  <h2 className="font-condensed text-[17px] font-bold uppercase text-[#333333]">
                    Últimos Pedidos Recebidos
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#0475EE] hover:text-[#0A3768] cursor-pointer"
                  >
                    Ver todos
                  </button>
                </div>
                {sellerOrders.length === 0 ? (
                  <p className="p-8 text-center text-sm text-[#777777]">
                    Nenhum pedido recebido ainda para esta loja.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                        <tr>
                          <th className="py-3 px-5 font-bold">Pedido</th>
                          <th className="py-3 px-4 font-bold">Cliente</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-5 font-bold text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {sellerOrders.slice(0, 5).map((entry) => (
                          <tr key={entry.orderId} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-5 font-mono tabular-nums font-bold text-[#333333]">
                              {entry.orderId}
                            </td>
                            <td className="py-3 px-4 text-[#555555]">{entry.buyerName}</td>
                            <td className="py-3 px-4 font-semibold text-[#333333]">
                              {entry.fulfillment.status}
                            </td>
                            <td className="py-3 px-5 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                              {formatCurrency(entry.fulfillment.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GESTÃO DE PRODUTOS */}
          {activeTab === 'products' && (
            <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
              <div className="p-4 bg-[#F1F2F4] border-b border-[#E5E7EB] flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[#999999] absolute left-3 top-2.5" />
                  <input
                    type="search"
                    aria-label="Buscar produtos da loja"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar por título ou marca..."
                    className="w-full h-9 pl-9 pr-3 rounded-[2px] bg-white border border-[#DCDCDC] text-xs focus:outline-none focus:border-[#0475EE]"
                  />
                </div>
                <select
                  aria-label="Filtrar por categoria"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-xs"
                >
                  <option value="Todas">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {sellerProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-bold text-[#333333]">
                    Nenhum produto encontrado neste filtro.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewProductOpen(true)}
                    className="mt-4 h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase cursor-pointer"
                  >
                    + Cadastrar primeiro produto
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                      <tr>
                        <th className="py-3 px-5 font-bold">Produto</th>
                        <th className="py-3 px-4 font-bold">Categoria</th>
                        <th className="py-3 px-4 font-bold">Condição</th>
                        <th className="py-3 px-4 font-bold text-right">Estoque</th>
                        <th className="py-3 px-4 font-bold text-right">Preço</th>
                        <th className="py-3 px-5 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {sellerProducts.map((p) => {
                        const isEditing = editingProductId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-9 rounded-[2px] overflow-hidden bg-white border border-[#EAEAEA] shrink-0">
                                  <ProductImage
                                    src={p.images[0]}
                                    alt={p.title}
                                    category={p.category}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#333333] truncate max-w-[260px]">
                                    {p.title}
                                  </p>
                                  <p className="text-xs text-[#777777]">{p.brand}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#666666]">{p.category}</td>
                            <td className="py-3 px-4 text-[#444444]">{p.condition}</td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#333333]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  aria-label={`Editar estoque de ${p.title}`}
                                  value={editStock}
                                  onChange={(e) => setEditStock(e.target.value)}
                                  className="w-16 h-8 px-2 text-right border border-[#0475EE] rounded-[2px] text-xs font-mono"
                                />
                              ) : (
                                p.stock
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={1}
                                  aria-label={`Editar preço de ${p.title}`}
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-24 h-8 px-2 text-right border border-[#0475EE] rounded-[2px] text-xs font-mono"
                                />
                              ) : (
                                formatCurrency(p.price)
                              )}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <div className="inline-flex items-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      aria-label={`Salvar alterações de ${p.title}`}
                                      onClick={() => {
                                        const nextPrice = Number(editPrice);
                                        const nextStock = Number(editStock);
                                        if (nextPrice > 0 && nextStock >= 0) {
                                          void updateProduct(p.id, {
                                            price: nextPrice,
                                            stock: nextStock,
                                          });
                                        }
                                        setEditingProductId(null);
                                      }}
                                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-[2px] cursor-pointer"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="Cancelar edição"
                                      onClick={() => setEditingProductId(null)}
                                      className="p-2 text-[#777777] hover:bg-[#F1F2F4] rounded-[2px] cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    aria-label={`Editar ${p.title}`}
                                    onClick={() => {
                                      setEditingProductId(p.id);
                                      setEditPrice(String(p.price));
                                      setEditStock(String(p.stock));
                                    }}
                                    className="p-2 text-[#777777] hover:text-[#0475EE] rounded-[2px] hover:bg-[#EAF6FC] cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  aria-label={`Excluir ${p.title}`}
                                  onClick={() => void deleteProduct(p.id)}
                                  className="p-2 text-[#999999] hover:text-rose-600 rounded-[2px] hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
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
          )}

          {/* TAB 3: GESTÃO DE PEDIDOS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {sellerOrders.length === 0 ? (
                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-12 text-center text-sm text-[#777777]">
                  Ainda não há pedidos registrados para {seller.name}.
                </div>
              ) : (
                sellerOrders.map((entry) => {
                  const nextStatus = getNextOrderStatus(entry.fulfillment.status);
                  return (
                    <div
                      key={entry.orderId}
                      className="bg-white border border-[#EAEAEA] rounded-[3px] p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#EAEAEA]">
                        <div>
                          <p className="text-sm font-bold font-mono tabular-nums text-[#222222]">
                            Pedido {entry.orderId}
                          </p>
                          <p className="text-xs text-[#777777] mt-0.5">
                            Cliente: {entry.buyerName} · {entry.city} · {entry.createdAt}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#555555]">
                            Status atual:{' '}
                            <span
                              className={
                                entry.fulfillment.status === 'Entregue'
                                  ? 'text-[#0A3768]'
                                  : 'text-[#18A3DE]'
                              }
                            >
                              {entry.fulfillment.status}
                            </span>
                          </span>
                          {nextStatus ? (
                            <MotionButton
                              type="button"
                              onClick={() =>
                                void updateOrderFulfillmentStatus(entry.orderId, seller.id, nextStatus)
                              }
                              className="h-8 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[11px] font-bold uppercase inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              Avançar para {nextStatus}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </MotionButton>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A3768]">
                              <CheckCircle2 className="w-4 h-4 text-[#0475EE]" />
                              Concluído
                            </span>
                          )}
                        </div>
                      </div>

                      <ul className="divide-y divide-[#EAEAEA] text-sm">
                        {entry.fulfillment.items.map((item) => (
                          <li
                            key={item.productId}
                            className="py-2 flex items-center justify-between gap-4"
                          >
                            <span className="text-[#333333] font-medium">
                              {item.quantity}x {item.title}
                            </span>
                            <span className="font-mono tabular-nums font-bold text-[#0475EE] whitespace-nowrap">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: CONFIGURAÇÕES DA LOJA */}
          {activeTab === 'settings' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-6"
            >
              <div>
                <h2 className="font-condensed text-[19px] font-bold uppercase text-[#0A3768]">
                  Identidade da Loja
                </h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="store-name" className="block text-xs font-bold text-[#444444] mb-1">
                      Nome da Loja
                    </label>
                    <input
                      id="store-name"
                      type="text"
                      value={storeForm.name}
                      onChange={(e) => setStoreForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="store-logo" className="block text-xs font-bold text-[#444444] mb-1">
                        Sigla Logotipo
                      </label>
                      <input
                        id="store-logo"
                        type="text"
                        maxLength={3}
                        value={storeForm.logoText}
                        onChange={(e) => setStoreForm((p) => ({ ...p, logoText: e.target.value }))}
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label htmlFor="store-color" className="block text-xs font-bold text-[#444444] mb-1">
                        Cor da Marca
                      </label>
                      <input
                        id="store-color"
                        type="color"
                        value={storeForm.accentColor}
                        onChange={(e) => setStoreForm((p) => ({ ...p, accentColor: e.target.value }))}
                        className="w-full h-10 p-1 rounded-[2px] border border-[#DCDCDC] bg-white cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="store-desc" className="block text-xs font-bold text-[#444444] mb-1">
                      Descrição da Loja
                    </label>
                    <textarea
                      id="store-desc"
                      rows={3}
                      value={storeForm.description}
                      onChange={(e) => setStoreForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full p-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                    />
                  </div>
                  <div>
                    <label htmlFor="store-loc" className="block text-xs font-bold text-[#444444] mb-1">
                      Cidade / Província
                    </label>
                    <input
                      id="store-loc"
                      type="text"
                      value={storeForm.location}
                      onChange={(e) => setStoreForm((p) => ({ ...p, location: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="store-banner" className="block text-xs font-bold text-[#444444] mb-1">
                      Banner da Loja (URL ou Upload)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="store-banner"
                        type="text"
                        value={storeForm.bannerImage}
                        onChange={(e) => setStoreForm((p) => ({ ...p, bannerImage: e.target.value }))}
                        className="flex-1 min-w-0 h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                      />
                      <label className="h-10 px-3 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingBannerImg ? 'Enviando...' : 'Enviar'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          disabled={uploadingBannerImg}
                          onChange={(e) => void handleBannerImageUpload(e)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[#EAEAEA]">
                <h2 className="font-condensed text-[19px] font-bold uppercase text-[#0A3768]">
                  Dados Bancários / Carteira de Repasse
                </h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bank-name" className="block text-xs font-bold text-[#444444] mb-1">
                      Banco / Instituição
                    </label>
                    <input
                      id="bank-name"
                      type="text"
                      value={storeForm.bankName}
                      onChange={(e) => setStoreForm((p) => ({ ...p, bankName: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="bank-acc" className="block text-xs font-bold text-[#444444] mb-1">
                      NIB / Conta Bancária
                    </label>
                    <input
                      id="bank-acc"
                      type="text"
                      value={storeForm.accountNumber}
                      onChange={(e) => setStoreForm((p) => ({ ...p, accountNumber: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="bank-pix" className="block text-xs font-bold text-[#444444] mb-1">
                      Carteira Móvel (M-Pesa / e-Mola)
                    </label>
                    <input
                      id="bank-pix"
                      type="text"
                      value={storeForm.pixOrWallet}
                      onChange={(e) => setStoreForm((p) => ({ ...p, pixOrWallet: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <MotionButton
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Salvar Configurações
                </MotionButton>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Modal: + Novo Produto */}
      {newProductOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-product-modal-title"
        >
          <div className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between">
              <h2
                id="new-product-modal-title"
                className="font-condensed text-[20px] font-bold uppercase text-[#0A3768]"
              >
                Cadastrar Novo Produto — {seller.name}
              </h2>
              <button
                type="button"
                onClick={() => setNewProductOpen(false)}
                aria-label="Fechar formulário de produto"
                className="p-1.5 rounded-[2px] text-[#666666] hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="np-title" className="block text-xs font-bold text-[#444444] mb-1">
                    Título do Produto *
                  </label>
                  <input
                    id="np-title"
                    type="text"
                    value={formState.title}
                    onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Ex: MacBook Air M3 16GB 512GB Meia-Noite"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                  />
                  {formErrors.title && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="np-cat" className="block text-xs font-bold text-[#444444] mb-1">
                    Categoria *
                  </label>
                  <select
                    id="np-cat"
                    value={formState.category}
                    onChange={(e) => setFormState((p) => ({ ...p, category: e.target.value }))}
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="np-brand" className="block text-xs font-bold text-[#444444] mb-1">
                    Marca *
                  </label>
                  <input
                    id="np-brand"
                    type="text"
                    value={formState.brand}
                    onChange={(e) => setFormState((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="Ex: Apple, Samsung, Dell"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                  />
                  {formErrors.brand && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.brand}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="np-cond" className="block text-xs font-bold text-[#444444] mb-1">
                    Condição
                  </label>
                  <select
                    id="np-cond"
                    value={formState.condition}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, condition: e.target.value as ProductCondition }))
                    }
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Recondicionado">Recondicionado</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="np-price" className="block text-xs font-bold text-[#444444] mb-1">
                      Preço (MT) *
                    </label>
                    <input
                      id="np-price"
                      type="number"
                      min={1}
                      step="0.01"
                      value={formState.price}
                      onChange={(e) => setFormState((p) => ({ ...p, price: e.target.value }))}
                      placeholder="55000"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#0475EE]"
                    />
                    {formErrors.price && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="np-stock" className="block text-xs font-bold text-[#444444] mb-1">
                      Estoque *
                    </label>
                    <input
                      id="np-stock"
                      type="number"
                      min={0}
                      value={formState.stock}
                      onChange={(e) => setFormState((p) => ({ ...p, stock: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="np-img-preset" className="block text-xs font-bold text-[#444444] mb-1">
                    Foto de Estúdio (Preset, URL ou Upload)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      id="np-img-preset"
                      value={formState.imageUrl}
                      onChange={(e) => setFormState((p) => ({ ...p, imageUrl: e.target.value }))}
                      className="h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                    >
                      {IMAGE_PRESET_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.url}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      aria-label="URL personalizada da imagem"
                      value={formState.imageUrl}
                      onChange={(e) => setFormState((p) => ({ ...p, imageUrl: e.target.value }))}
                      placeholder="Ou cole uma URL de imagem"
                      className="h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-xs font-mono"
                    />
                    <label className="h-10 px-3 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingProductImg ? 'Enviando...' : 'Enviar Imagem'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        disabled={uploadingProductImg}
                        onChange={(e) => void handleProductImageUpload(e)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Specs */}
                <div>
                  <label htmlFor="np-proc" className="block text-xs font-bold text-[#444444] mb-1">
                    Processador
                  </label>
                  <input
                    id="np-proc"
                    type="text"
                    value={formState.processor}
                    onChange={(e) => setFormState((p) => ({ ...p, processor: e.target.value }))}
                    placeholder="Ex: Apple M3 / Snapdragon 8 Gen 3"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="np-ram" className="block text-xs font-bold text-[#444444] mb-1">
                      RAM
                    </label>
                    <input
                      id="np-ram"
                      type="text"
                      value={formState.ram}
                      onChange={(e) => setFormState((p) => ({ ...p, ram: e.target.value }))}
                      placeholder="16 GB"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="np-storage" className="block text-xs font-bold text-[#444444] mb-1">
                      Armazenamento
                    </label>
                    <input
                      id="np-storage"
                      type="text"
                      value={formState.storage}
                      onChange={(e) => setFormState((p) => ({ ...p, storage: e.target.value }))}
                      placeholder="512 GB SSD"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="np-desc" className="block text-xs font-bold text-[#444444] mb-1">
                    Descrição Técnica *
                  </label>
                  <textarea
                    id="np-desc"
                    rows={3}
                    value={formState.description}
                    onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Descreva diferenciais, acessórios inclusos e condições de garantia..."
                    className="w-full p-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                  />
                  {formErrors.description && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.description}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewProductOpen(false)}
                  className="h-10 px-5 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Publicar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMETER KYC */}
      {kycModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-[4px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0475EE]" />
                <h3 className="font-condensed text-xl font-bold uppercase text-[#0A3768]">
                  Verificação de Identidade (KYC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setKycModalOpen(false)}
                className="text-[#777777] hover:text-[#222222] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              Para validar sua loja como parceira oficial CellBox em Moçambique, informe o documento oficial de identificação do titular ou representante legal.
            </p>

            <form onSubmit={handleSubmitKyc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Tipo de Documento *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bi', label: 'B.I.' },
                    { id: 'nuit', label: 'NUIT' },
                    { id: 'passaporte', label: 'Passaporte' },
                    { id: 'licenca', label: 'Alvará' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setKycDocType(t.id as any)}
                      className={`h-9 rounded-[3px] text-xs font-bold border transition-colors cursor-pointer ${
                        kycDocType === t.id
                          ? 'border-[#0475EE] bg-[#0475EE]/10 text-[#0475EE]'
                          : 'border-[#DCDCDC] text-[#555555] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="kyc-doc-number" className="block text-xs font-bold text-[#444444] mb-1">
                  Número do Documento *
                </label>
                <input
                  id="kyc-doc-number"
                  type="text"
                  required
                  value={kycDocNumber}
                  onChange={(e) => setKycDocNumber(e.target.value)}
                  placeholder="Ex: 110100234567M ou NUIT"
                  className="w-full h-10 px-3 rounded-[3px] border border-[#DCDCDC] text-sm focus:border-[#0475EE] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="kyc-full-name" className="block text-xs font-bold text-[#444444] mb-1">
                  Nome Completo no Documento *
                </label>
                <input
                  id="kyc-full-name"
                  type="text"
                  required
                  value={kycFullName}
                  onChange={(e) => setKycFullName(e.target.value)}
                  placeholder="Nome do titular como consta no documento"
                  className="w-full h-10 px-3 rounded-[3px] border border-[#DCDCDC] text-sm focus:border-[#0475EE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Foto ou Cópia do Documento (Frente)
                </label>
                <div className="flex items-center gap-3">
                  <label className="h-10 px-4 rounded-[3px] border border-[#DCDCDC] hover:border-[#0475EE] bg-[#F9FAFB] text-xs font-bold text-[#333333] inline-flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-[#0475EE]" />
                    {uploadingKycDoc ? 'Carregando...' : 'Carregar Imagem'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadKycDoc}
                      className="hidden"
                      disabled={uploadingKycDoc}
                    />
                  </label>
                  {kycDocFrontUrl && (
                    <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Arquivo anexado
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setKycModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingKyc || !kycDocNumber.trim() || !kycFullName.trim()}
                  className="h-9 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {submittingKyc ? 'Submetendo...' : 'Submeter Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAGAR TAXA DE INSCRIÇÃO (100 MZN) */}
      {feeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-[4px] max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#E50914]" />
                <h3 className="font-condensed text-xl font-bold uppercase text-[#0A3768]">
                  Taxa de Inscrição de Loja
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFeeModalOpen(false)}
                className="text-[#777777] hover:text-[#222222] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF5F5] border border-[#FFD6D6] rounded-[3px] p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#777777] font-semibold">Valor da Taxa de Adesão</p>
                <p className="font-condensed text-2xl font-bold text-[#E50914] mt-0.5">
                  100,00 MT (MZN)
                </p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-white border border-[#FFD6D6] rounded-full text-[#E50914]">
                Pagamento Único
              </span>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              O pagamento da taxa de adesão ativa permanentemente a vitrine da sua loja para receber pedidos de todo o território nacional.
            </p>

            <form onSubmit={handlePayFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-2">
                  Escolha a Carteira Móvel *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeeMethod('mpesa')}
                    className={`p-3 rounded-[3px] border text-left transition-all cursor-pointer ${
                      feeMethod === 'mpesa'
                        ? 'border-[#E50914] bg-[#E50914]/5 ring-1 ring-[#E50914]'
                        : 'border-[#DCDCDC] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#E50914]">M-Pesa</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-[#E50914] flex items-center justify-center">
                        {feeMethod === 'mpesa' && <span className="w-2 h-2 rounded-full bg-[#E50914]" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777777] mt-1">Vodacom Moçambique (84 / 85)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeeMethod('emola')}
                    className={`p-3 rounded-[3px] border text-left transition-all cursor-pointer ${
                      feeMethod === 'emola'
                        ? 'border-[#F58220] bg-[#F58220]/5 ring-1 ring-[#F58220]'
                        : 'border-[#DCDCDC] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#F58220]">e-Mola</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-[#F58220] flex items-center justify-center">
                        {feeMethod === 'emola' && <span className="w-2 h-2 rounded-full bg-[#F58220]" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777777] mt-1">Movitel Moçambique (86 / 87)</p>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="fee-phone" className="block text-xs font-bold text-[#444444] mb-1">
                  Número de Celular {feeMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'} *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="fee-phone"
                    type="tel"
                    required
                    value={feePhone}
                    onChange={(e) => setFeePhone(e.target.value)}
                    placeholder={feeMethod === 'mpesa' ? '84 123 4567' : '86 123 4567'}
                    className="w-full h-10 pl-9 pr-3 rounded-[3px] border border-[#DCDCDC] text-sm focus:border-[#0475EE] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#777777] mt-1">
                  Você receberá uma solicitação USSD para inserir seu PIN e confirmar o pagamento de 100 MT.
                </p>
              </div>

              <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFeeModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payingFee || !feePhone.trim()}
                  className="h-9 px-6 rounded-full bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {payingFee ? (
                    'Confirmando...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Pagar 100 MT agora
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
