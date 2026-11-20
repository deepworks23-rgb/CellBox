import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { IMAGE_PRESET_OPTIONS } from '../data/seedData';
import type { ProductCondition } from '../types';
import {
  calculateSellerAnalytics,
  formatCurrency,
  getNextOrderStatus,
  validateProductForm,
} from '../utils/marketplace';
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
    deleteProduct,
    updateOrderFulfillmentStatus,
    updateSellerSettings,
    navigate,
    switchDemoRole,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings'>(
    initialTab
  );
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Todas');
  const [newProductOpen, setNewProductOpen] = useState(false);

  const seller =
    sellers.find((s) => s.id === currentUser.sellerId) ??
    sellers.find((s) => s.ownerUserId === currentUser.id) ??
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

  const sellerProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (p.sellerId !== seller.id) return false;
      if (productCategoryFilter !== 'Todas' && p.category !== productCategoryFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [products, seller.id, productSearch, productCategoryFilter]);

  const sellerOrders = useMemo(() => {
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
  }, [orders, seller.id]);

  const analytics = useMemo(
    () => calculateSellerAnalytics(seller.id, orders, commissionRate),
    [seller.id, orders, commissionRate]
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

  const navItems = [
    { id: 'overview' as const, label: 'Visão Geral', icon: BarChart3 },
    { id: 'products' as const, label: 'Produtos', icon: Package },
    { id: 'orders' as const, label: 'Pedidos', icon: ShoppingBag },
    { id: 'settings' as const, label: 'Configurações da Loja', icon: Settings },
  ];

  const statusText =
    seller.status === 'active'
      ? 'Loja Ativa'
      : seller.status === 'pending'
        ? 'Pendente de Aprovação'
        : 'Loja Suspensa';

  return (
    <div className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      {/* Status alert banner if seller is pending or suspended */}
      {seller.status !== 'active' && (
        <div
          role="alert"
          className="mb-6 bg-amber-50 border border-amber-200 rounded-[3px] p-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-950">
                Status da Loja: {statusText}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Você já pode cadastrar produtos e configurar sua vitrine, mas seus anúncios só ficarão públicos após aprovação do Super Admin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => switchDemoRole('admin')}
            className="h-9 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase whitespace-nowrap cursor-pointer"
          >
            Ir para Painel Super Admin
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
            <button
              type="button"
              onClick={() => setNewProductOpen(true)}
              className="h-10 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
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
                      {sellerProducts.map((p) => (
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
                            {p.stock}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                            {formatCurrency(p.price)}
                          </td>
                          <td className="py-3 px-5 text-right">
                            <button
                              type="button"
                              aria-label={`Excluir ${p.title}`}
                              onClick={() => deleteProduct(p.id)}
                              className="p-2 text-[#999999] hover:text-rose-600 rounded-[2px] hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
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
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderFulfillmentStatus(entry.orderId, seller.id, nextStatus)
                              }
                              className="h-8 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[11px] font-bold uppercase inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              Avançar para {nextStatus}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
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
                      URL do Banner da Loja
                    </label>
                    <input
                      id="store-banner"
                      type="text"
                      value={storeForm.bannerImage}
                      onChange={(e) => setStoreForm((p) => ({ ...p, bannerImage: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
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
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Salvar Configurações
                </button>
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
                    Foto de Estúdio (Preset ou URL)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
    </div>
  );
}
