import React, { useState } from 'react';
import {
  Heart,
  MapPin,
  Package,
  Plus,
  Settings,
  Trash2,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { formatCurrency, ORDER_STATUS_FLOW } from '../utils/marketplace';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

interface BuyerProfileViewProps {
  initialTab?: 'orders' | 'addresses' | 'wishlist' | 'settings';
}

export function BuyerProfileView({ initialTab = 'orders' }: BuyerProfileViewProps) {
  const {
    currentUser,
    orders,
    addresses,
    wishlist,
    products,
    addAddress,
    removeAddress,
    updateProfile,
    navigate,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'settings'>(
    initialTab
  );

  // Account settings form
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone ?? '');

  // New address form
  const [addrForm, setAddrForm] = useState({
    label: '',
    recipient: currentUser.name,
    street: '',
    city: '',
    state: 'SP',
    zipCode: '',
  });
  const [addrError, setAddrError] = useState('');

  const userOrders = orders.filter(
    (o) => o.buyerId === currentUser.id || currentUser.role === 'buyer'
  );

  const wishedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.label.trim() || !addrForm.street.trim() || !addrForm.city.trim() || !addrForm.zipCode.trim()) {
      setAddrError('Preencha identificação, rua, cidade e CEP.');
      return;
    }
    addAddress({
      label: addrForm.label.trim(),
      recipient: addrForm.recipient.trim() || currentUser.name,
      street: addrForm.street.trim(),
      city: addrForm.city.trim(),
      state: addrForm.state.trim() || 'SP',
      zipCode: addrForm.zipCode.trim(),
    });
    setAddrForm({
      label: '',
      recipient: currentUser.name,
      street: '',
      city: '',
      state: 'SP',
      zipCode: '',
    });
    setAddrError('');
  };

  const tabs = [
    { id: 'orders' as const, label: 'Meus Pedidos', icon: Package, count: userOrders.length },
    { id: 'wishlist' as const, label: 'Lista de Desejos', icon: Heart, count: wishedProducts.length },
    { id: 'addresses' as const, label: 'Endereços', icon: MapPin, count: addresses.length },
    { id: 'settings' as const, label: 'Configurações', icon: Settings },
  ];

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      <div className="mb-6 pb-4 border-b border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#43AA5B]">
            Área do Cliente
          </p>
          <h1 className="font-condensed text-[28px] font-bold uppercase text-[#222222] mt-0.5">
            Olá, {currentUser.name}
          </h1>
          <p className="text-xs text-[#777777] mt-0.5">{currentUser.email}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate({ type: 'home' })}
          className="h-9 px-5 rounded-full border border-[#DCDCDC] bg-white hover:border-[#43AA5B] hover:text-[#43AA5B] text-xs font-bold uppercase tracking-wide text-[#444444] whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          Voltar à vitrine
        </button>
      </div>

      {/* Horizontal Pill Tabs matching Home category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#43AA5B] text-white'
                  : 'bg-[#F2F3F5] text-[#555555] hover:bg-[#E6E8EC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`font-mono tabular-nums text-[11px] ${active ? 'text-white/90' : 'text-[#888888]'}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Meus Pedidos */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          {userOrders.length === 0 ? (
            <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-12 text-center">
              <Package className="w-10 h-10 text-[#CCCCCC] mx-auto mb-3" />
              <h2 className="font-condensed text-xl font-bold uppercase text-[#333333]">
                Você ainda não realizou pedidos
              </h2>
              <button
                type="button"
                onClick={() => navigate({ type: 'home' })}
                className="mt-4 h-10 px-6 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Explorar ofertas
              </button>
            </div>
          ) : (
            userOrders.map((order) => (
              <article
                key={order.id}
                className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div className="flex flex-wrap items-center gap-5">
                    <div>
                      <span className="text-[11px] uppercase text-[#777777] block">Pedido</span>
                      <span className="font-bold font-mono tabular-nums text-[#222222]">
                        {order.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-[#777777] block">Data</span>
                      <span className="font-medium font-mono tabular-nums text-[#444444]">
                        {order.createdAt}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-[#777777] block">Entrega</span>
                      <span className="font-medium text-[#444444]">
                        {order.shippingAddress.city} - {order.shippingAddress.state}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase text-[#777777] block">Total</span>
                    <span className="text-lg font-extrabold font-mono tabular-nums text-[#43AA5B]">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[#EAEAEA]">
                  {order.fulfillments.map((f) => {
                    const currentIdx = ORDER_STATUS_FLOW.indexOf(f.status);
                    return (
                      <div key={f.sellerId} className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm">
                            <span className="text-[#777777]">Vendido por </span>
                            <button
                              type="button"
                              onClick={() => navigate({ type: 'store', sellerId: f.sellerId })}
                              className="font-bold text-[#333333] hover:text-[#43AA5B] cursor-pointer"
                            >
                              {f.sellerName}
                            </button>
                            <span className="text-[#CCCCCC] mx-2">·</span>
                            <span className="text-xs font-mono text-[#777777]">
                              Rastreio: {f.trackingCode}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                            {f.status === 'Entregue' ? (
                              <CheckCircle2 className="w-4 h-4 text-[#43AA5B]" />
                            ) : (
                              <Truck className="w-4 h-4 text-[#0070B8]" />
                            )}
                            <span
                              className={
                                f.status === 'Entregue' ? 'text-[#2F8E47]' : 'text-[#0070B8]'
                              }
                            >
                              {f.status}
                            </span>
                          </span>
                        </div>

                        {/* Visual Tracking Stepper */}
                        <div className="grid grid-cols-4 gap-2">
                          {ORDER_STATUS_FLOW.map((step, idx) => {
                            const reached = idx <= currentIdx;
                            return (
                              <div key={step} className="space-y-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-colors ${
                                    reached ? 'bg-[#43AA5B]' : 'bg-[#E5E7EB]'
                                  }`}
                                />
                                <p
                                  className={`text-xs font-semibold ${
                                    reached ? 'text-[#333333]' : 'text-[#AAAAAA]'
                                  }`}
                                >
                                  {step}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        <ul className="space-y-3 pt-1">
                          {f.items.map((item) => (
                            <li key={item.productId} className="flex items-center gap-4">
                              <div className="w-16 h-12 rounded-[2px] overflow-hidden bg-white border border-[#EAEAEA] shrink-0">
                                <ProductImage
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#333333] truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-[#777777]">
                                  Qtd: {item.quantity} · {item.condition}
                                </p>
                              </div>
                              <span className="text-sm font-bold font-mono tabular-nums text-[#43AA5B] whitespace-nowrap">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Lista de Desejos */}
      {activeTab === 'wishlist' && (
        <div>
          {wishedProducts.length === 0 ? (
            <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-12 text-center">
              <Heart className="w-10 h-10 text-[#CCCCCC] mx-auto mb-3" />
              <h2 className="font-condensed text-xl font-bold uppercase text-[#333333]">
                Sua lista de desejos está vazia
              </h2>
              <p className="text-sm text-[#777777] mt-1">
                Clique no ícone de coração nos produtos para acompanhar preços e disponibilidade.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-[#EAEAEA] bg-white">
              {wishedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Endereços Salvos */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3.5">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-[#333333]">
                    {addr.label}{' '}
                    {addr.isDefault && (
                      <span className="text-xs font-bold text-[#43AA5B] ml-2">· Padrão</span>
                    )}
                  </p>
                  <p className="text-sm text-[#555555] mt-1">{addr.recipient}</p>
                  <p className="text-sm text-[#777777]">{addr.street}</p>
                  <p className="text-xs text-[#777777] font-mono tabular-nums mt-1">
                    {addr.city} - {addr.state} · CEP {addr.zipCode}
                  </p>
                </div>
                {addresses.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remover endereço ${addr.label}`}
                    onClick={() => removeAddress(addr.id)}
                    className="p-2 text-[#999999] hover:text-rose-600 rounded-[2px] hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddAddress}
            className="lg:col-span-5 bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4 h-fit"
          >
            <h2 className="font-condensed text-[18px] font-bold uppercase text-[#43AA5B] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Novo Endereço
            </h2>
            {addrError && <p className="text-xs font-medium text-rose-600">{addrError}</p>}
            <div>
              <label htmlFor="prof-addr-label" className="block text-xs font-bold text-[#444444] mb-1">
                Apelido do endereço
              </label>
              <input
                id="prof-addr-label"
                type="text"
                value={addrForm.label}
                onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="Ex: Casa, Escritório"
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
              />
            </div>
            <div>
              <label htmlFor="prof-addr-street" className="block text-xs font-bold text-[#444444] mb-1">
                Logradouro e número
              </label>
              <input
                id="prof-addr-street"
                type="text"
                value={addrForm.street}
                onChange={(e) => setAddrForm((p) => ({ ...p, street: e.target.value }))}
                placeholder="Rua, número e complemento"
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-addr-city" className="block text-xs font-bold text-[#444444] mb-1">
                  Cidade
                </label>
                <input
                  id="prof-addr-city"
                  type="text"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
                />
              </div>
              <div>
                <label htmlFor="prof-addr-zip" className="block text-xs font-bold text-[#444444] mb-1">
                  CEP
                </label>
                <input
                  id="prof-addr-zip"
                  type="text"
                  value={addrForm.zipCode}
                  onChange={(e) => setAddrForm((p) => ({ ...p, zipCode: e.target.value }))}
                  placeholder="01310-100"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#43AA5B]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-10 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Salvar Endereço
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Configurações da Conta */}
      {activeTab === 'settings' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile({ name, phone });
          }}
          className="max-w-xl bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4"
        >
          <h2 className="font-condensed text-[20px] font-bold uppercase text-[#43AA5B]">
            Dados Pessoais
          </h2>
          <div>
            <label htmlFor="acc-name" className="block text-xs font-bold text-[#444444] mb-1">
              Nome completo
            </label>
            <input
              id="acc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
            />
          </div>
          <div>
            <label htmlFor="acc-email" className="block text-xs font-bold text-[#444444] mb-1">
              E-mail de acesso
            </label>
            <input
              id="acc-email"
              type="email"
              disabled
              value={currentUser.email}
              className="w-full h-10 px-3 rounded-[2px] border border-[#EAEAEA] bg-[#F7F8FA] text-sm text-[#888888]"
            />
          </div>
          <div>
            <label htmlFor="acc-phone" className="block text-xs font-bold text-[#444444] mb-1">
              Telefone / WhatsApp
            </label>
            <input
              id="acc-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#43AA5B]"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-6 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Salvar Alterações
          </button>
        </form>
      )}
    </main>
  );
}
