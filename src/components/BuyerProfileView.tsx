import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  CheckCircle2,
  Heart,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Settings,
  Star,
  Trash2,
  Truck,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { formatCurrency, ORDER_STATUS_FLOW } from '../utils/marketplace';
import { MotionButton, SPRING_CARD } from './MotionPrimitives';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

interface BuyerProfileViewProps {
  initialTab?: 'orders' | 'addresses' | 'wishlist' | 'settings';
}

const MZ_PROVINCES = [
  'Maputo',
  'Maputo Província (Matola)',
  'Sofala (Beira)',
  'Nampula',
  'Zambézia (Quelimane)',
  'Tete',
  'Gaza (Xai-Xai)',
  'Inhambane',
  'Manica (Chimoio)',
  'Cabo Delgado (Pemba)',
  'Niassa (Lichinga)',
];

export function BuyerProfileView({ initialTab = 'orders' }: BuyerProfileViewProps) {
  const {
    currentUser,
    orders,
    addresses,
    wishlist,
    products,
    addToCart,
    addAddress,
    setDefaultAddress,
    removeAddress,
    updateProfile,
    changePassword,
    uploadImageAsset,
    logout,
    navigate,
    showToast,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'settings'>(
    initialTab
  );

  // Sync tab whenever navigation updates initialTab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Account settings form
  const [name, setName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl ?? '');
  const [province, setProvince] = useState(currentUser?.province ?? 'Maputo');
  const [city, setCity] = useState(currentUser?.city ?? '');
  const [neighborhood, setNeighborhood] = useState(currentUser?.neighborhood ?? '');
  const [zipCode, setZipCode] = useState(currentUser?.zipCode ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setPhone(currentUser.phone ?? '');
    setAvatarUrl(currentUser.avatarUrl ?? '');
    setProvince(currentUser.province ?? 'Maputo');
    setCity(currentUser.city ?? '');
    setNeighborhood(currentUser.neighborhood ?? '');
    setZipCode(currentUser.zipCode ?? '');
  }, [currentUser]);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // New address form
  const [addrForm, setAddrForm] = useState({
    label: '',
    recipient: currentUser?.name ?? '',
    street: '',
    city: '',
    state: 'Maputo',
    zipCode: '',
    isDefault: false,
  });
  const [addrError, setAddrError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Keep controlled inputs synchronized when user logs in / switches account
  useEffect(() => {
    setName(currentUser?.name ?? '');
    setPhone(currentUser?.phone ?? '');
    setAddrForm((prev) => ({
      ...prev,
      recipient: currentUser?.name ?? '',
    }));
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'buyer') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-14 text-center">
        <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-10 space-y-4">
          <LogIn className="w-10 h-10 text-[#0475EE] mx-auto" />
          <h1 className="font-condensed text-2xl font-bold uppercase text-[#0A3768]">
            Área exclusiva para Compradores
          </h1>
          <p className="text-sm text-[#666666] max-w-md mx-auto">
            Acompanhe seus pedidos em tempo real, gerencie seus endereços em Moçambique, salve favoritos e altere sua senha.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'auth', mode: 'login' })}
              className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Entrar na Minha Conta
            </MotionButton>
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'auth', mode: 'register' })}
              className="h-10 px-6 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] hover:text-[#0475EE] text-[#444444] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Criar Nova Conta
            </MotionButton>
          </div>
        </div>
      </main>
    );
  }

  // Strictly scope orders to the logged-in user
  const userOrders = orders.filter((o) => o.buyerId === currentUser.id);
  const wishedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !addrForm.label.trim() ||
      !addrForm.street.trim() ||
      !addrForm.city.trim() ||
      !addrForm.zipCode.trim()
    ) {
      setAddrError('Preencha identificação, rua, cidade e código postal.');
      return;
    }
    setSavingAddress(true);
    try {
      const created = await addAddress({
        label: addrForm.label.trim(),
        recipient: addrForm.recipient.trim() || currentUser.name,
        street: addrForm.street.trim(),
        city: addrForm.city.trim(),
        state: addrForm.state.trim() || 'Maputo',
        zipCode: addrForm.zipCode.trim(),
        isDefault: addrForm.isDefault,
      });
      if (created) {
        setAddrForm({
          label: '',
          recipient: currentUser.name,
          street: '',
          city: '',
          state: 'Maputo',
          zipCode: '',
          isDefault: false,
        });
        setAddrError('');
      }
    } finally {
      setSavingAddress(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('O arquivo excede o limite máximo de 5 MB.', 'warning');
      return;
    }
    setUploadingAvatar(true);
    try {
      const res = await uploadImageAsset(file, 'avatars');
      if (res.ok && res.url) {
        setAvatarUrl(res.url);
        await updateProfile({
          name,
          phone,
          avatarUrl: res.url,
          province,
          city,
          neighborhood,
          zipCode,
        });
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        phone,
        avatarUrl,
        province,
        city,
        neighborhood,
        zipCode,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword) {
      setPasswordError('Preencha a senha atual e a nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (!res.ok) {
        setPasswordError(res.error ?? 'Erro ao atualizar senha.');
      } else {
        setPasswordSuccess('Senha atualizada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleBuyAgain = (items: Array<{ productId: string; quantity: number }>) => {
    let addedAny = false;
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId && p.stock > 0);
      if (prod) {
        addToCart(prod.id, item.quantity);
        addedAny = true;
      }
    }
    if (addedAny) {
      navigate({ type: 'cart' });
    } else {
      showToast('Os itens deste pedido estão temporariamente sem estoque.', 'warning');
    }
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0475EE]">
            Área do Cliente · Conta Verificada
          </p>
          <h1
            data-testid="profile-greeting"
            className="font-condensed text-[28px] font-bold uppercase text-[#222222] mt-0.5"
          >
            Olá, {currentUser.name}
          </h1>
          <p className="text-xs text-[#777777] mt-0.5">
            {currentUser.email}
            {currentUser.phone ? ` · ${currentUser.phone}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <MotionButton
            type="button"
            onClick={() => navigate({ type: 'home' })}
            className="h-9 px-5 rounded-full border border-[#DCDCDC] bg-white hover:border-[#0475EE] hover:text-[#0475EE] text-xs font-bold uppercase tracking-wide text-[#444444] whitespace-nowrap cursor-pointer"
          >
            Voltar à vitrine
          </MotionButton>
          <MotionButton
            type="button"
            onClick={() => void logout()}
            className="h-9 px-4 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold uppercase tracking-wide text-rose-700 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </MotionButton>
        </div>
      </div>

      {/* Horizontal Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <MotionButton
              key={tab.id}
              type="button"
              hoverScale={1.03}
              hoverY={-1}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#0475EE] text-white shadow-xs'
                  : 'bg-[#F2F3F5] text-[#555555] hover:bg-[#E6E8EC]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    active ? 'text-white/90' : 'text-[#888888]'
                  }`}
                >
                  ({tab.count})
                </span>
              )}
            </MotionButton>
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
              <p className="text-xs text-[#777777] mt-1">
                Seus pedidos concluídos na Cellbox aparecerão aqui com código de rastreamento.
              </p>
              <MotionButton
                type="button"
                onClick={() => navigate({ type: 'home' })}
                className="mt-4 h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Explorar ofertas
              </MotionButton>
            </div>
          ) : (
            userOrders.map((order) => (
              <motion.article
                key={order.id}
                whileHover={{ boxShadow: '0 8px 24px -8px rgba(10,55,104,0.1)' }}
                transition={SPRING_CARD}
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
                  <div className="flex items-center gap-4">
                    <MotionButton
                      type="button"
                      onClick={() =>
                        handleBuyAgain(order.fulfillments.flatMap((f) => f.items))
                      }
                      className="h-8 px-3.5 rounded-full bg-white border border-[#0475EE] text-[#0475EE] hover:bg-[#0475EE] hover:text-white text-[11px] font-bold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Comprar Novamente
                    </MotionButton>
                    <div className="text-right">
                      <span className="text-[11px] uppercase text-[#777777] block">Total</span>
                      <span className="text-lg font-extrabold font-mono tabular-nums text-[#0475EE]">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
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
                              className="font-bold text-[#333333] hover:text-[#0475EE] cursor-pointer"
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
                              <CheckCircle2 className="w-4 h-4 text-[#0475EE]" />
                            ) : (
                              <Truck className="w-4 h-4 text-[#18A3DE]" />
                            )}
                            <span
                              className={
                                f.status === 'Entregue' ? 'text-[#0A3768]' : 'text-[#18A3DE]'
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
                                    reached ? 'bg-[#0475EE]' : 'bg-[#E5E7EB]'
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
                              <button
                                type="button"
                                onClick={() =>
                                  navigate({ type: 'product', productId: item.productId })
                                }
                                className="w-16 h-12 rounded-[2px] overflow-hidden bg-white border border-[#EAEAEA] shrink-0 cursor-pointer"
                              >
                                <ProductImage
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                              <div className="flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate({ type: 'product', productId: item.productId })
                                  }
                                  className="text-sm font-semibold text-[#333333] hover:text-[#0475EE] truncate block text-left cursor-pointer"
                                >
                                  {item.title}
                                </button>
                                <p className="text-xs text-[#777777]">
                                  Qtd: {item.quantity} · {item.condition}
                                </p>
                              </div>
                              <span className="text-sm font-bold font-mono tabular-nums text-[#0475EE] whitespace-nowrap">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </motion.article>
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
              <MotionButton
                type="button"
                onClick={() => navigate({ type: 'home' })}
                className="mt-4 h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Descobrir produtos
              </MotionButton>
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
            {addresses.length === 0 ? (
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-10 text-center">
                <MapPin className="w-9 h-9 text-[#CCCCCC] mx-auto mb-2.5" />
                <p className="text-sm font-bold text-[#333333]">
                  Nenhum endereço cadastrado ainda
                </p>
                <p className="text-xs text-[#777777] mt-1">
                  Adicione um endereço ao lado para agilizar seu checkout na Cellbox.
                </p>
              </div>
            ) : (
              addresses.map((addr) => (
                <motion.div
                  key={addr.id}
                  whileHover={{ y: -2 }}
                  transition={SPRING_CARD}
                  className={`bg-white border rounded-[3px] p-5 flex items-start justify-between gap-4 ${
                    addr.isDefault ? 'border-[#0475EE]' : 'border-[#EAEAEA]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-[#333333] flex items-center gap-2">
                      <span>{addr.label}</span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0475EE]">
                          <Star className="w-3 h-3 fill-[#0475EE]" />
                          Padrão
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[#555555] mt-1">{addr.recipient}</p>
                    <p className="text-sm text-[#777777]">{addr.street}</p>
                    <p className="text-xs text-[#777777] font-mono tabular-nums mt-1">
                      {addr.city} - {addr.state} · CP {addr.zipCode}
                    </p>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => void setDefaultAddress(addr.id)}
                        className="mt-2.5 text-xs font-bold text-[#0475EE] hover:text-[#0A3768] cursor-pointer"
                      >
                        Definir como endereço padrão
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remover endereço ${addr.label}`}
                    onClick={() => void removeAddress(addr.id)}
                    className="p-2 text-[#999999] hover:text-rose-600 rounded-[2px] hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          <form
            onSubmit={handleAddAddress}
            className="lg:col-span-5 bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4 h-fit"
          >
            <h2 className="font-condensed text-[18px] font-bold uppercase text-[#0A3768] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#0475EE]" />
              Adicionar Novo Endereço
            </h2>
            {addrError && <p className="text-xs font-medium text-rose-600">{addrError}</p>}
            <div>
              <label htmlFor="prof-addr-label" className="block text-xs font-bold text-[#444444] mb-1">
                Apelido do endereço *
              </label>
              <input
                id="prof-addr-label"
                type="text"
                value={addrForm.label}
                onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="Ex: Casa, Escritório"
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>
            <div>
              <label htmlFor="prof-addr-recipient" className="block text-xs font-bold text-[#444444] mb-1">
                Destinatário
              </label>
              <input
                id="prof-addr-recipient"
                type="text"
                value={addrForm.recipient}
                onChange={(e) => setAddrForm((p) => ({ ...p, recipient: e.target.value }))}
                placeholder="Quem vai receber"
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>
            <div>
              <label htmlFor="prof-addr-street" className="block text-xs font-bold text-[#444444] mb-1">
                Logradouro e número *
              </label>
              <input
                id="prof-addr-street"
                type="text"
                value={addrForm.street}
                onChange={(e) => setAddrForm((p) => ({ ...p, street: e.target.value }))}
                placeholder="Avenida, número e bairro"
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-addr-city" className="block text-xs font-bold text-[#444444] mb-1">
                  Cidade *
                </label>
                <input
                  id="prof-addr-city"
                  type="text"
                  value={addrForm.city}
                  onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Maputo"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                />
              </div>
              <div>
                <label htmlFor="prof-addr-zip" className="block text-xs font-bold text-[#444444] mb-1">
                  Código Postal *
                </label>
                <input
                  id="prof-addr-zip"
                  type="text"
                  value={addrForm.zipCode}
                  onChange={(e) => setAddrForm((p) => ({ ...p, zipCode: e.target.value }))}
                  placeholder="1100"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#0475EE]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="prof-addr-province" className="block text-xs font-bold text-[#444444] mb-1">
                Província
              </label>
              <select
                id="prof-addr-province"
                value={addrForm.state}
                onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))}
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
              >
                {MZ_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-[#555555] cursor-pointer">
              <input
                type="checkbox"
                checked={addrForm.isDefault}
                onChange={(e) => setAddrForm((p) => ({ ...p, isDefault: e.target.checked }))}
                className="accent-[#0475EE]"
              />
              Definir como endereço padrão de entrega
            </label>
            <MotionButton
              type="submit"
              disabled={savingAddress}
              className="w-full h-10 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {savingAddress ? 'Salvando...' : 'Salvar Endereço'}
            </MotionButton>
          </form>
        </div>
      )}

      {/* Tab 4: Configurações da Conta + Alterar Senha */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4 h-fit"
          >
            <h2 className="font-condensed text-[20px] font-bold uppercase text-[#0A3768]">
              Dados Pessoais
            </h2>
            {/* Foto de Perfil */}
            <div className="flex items-center gap-4 pb-4 border-b border-[#EAEAEA]">
              <div className="w-16 h-16 rounded-full border border-[#DCDCDC] overflow-hidden bg-[#F0F4F8] flex items-center justify-center shrink-0 shadow-inner">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-7 h-7 text-[#888888]" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-[#444444] mb-1">Foto de Perfil</p>
                <p className="text-[11px] text-[#777777] mb-2">Recomendado: 500x500 px (1:1), máx. 5 MB</p>
                <label className="h-8 px-3.5 rounded-[3px] border border-[#DCDCDC] hover:border-[#0475EE] bg-[#F9FAFB] text-xs font-semibold text-[#333333] inline-flex items-center gap-2 cursor-pointer transition-colors">
                  <Camera className="w-3.5 h-3.5 text-[#0475EE]" />
                  {uploadingAvatar ? 'Carregando...' : 'Alterar Foto'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="acc-name" className="block text-xs font-bold text-[#444444] mb-1">
                Nome completo *
              </label>
              <input
                id="acc-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>
            <div>
              <label htmlFor="acc-email" className="block text-xs font-bold text-[#444444] mb-1">
                E-mail (opcional)
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
                Telefone / WhatsApp *
              </label>
              <input
                id="acc-phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+258 84 000 0000"
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#0475EE]"
              />
            </div>

            {/* Endereço completo conforme especificação */}
            <div className="pt-2 border-t border-[#EAEAEA] space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0A3768]">
                Endereço de Entrega Principal
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="acc-province" className="block text-xs font-bold text-[#444444] mb-1">
                    Província *
                  </label>
                  <select
                    id="acc-province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                  >
                    {MZ_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="acc-city" className="block text-xs font-bold text-[#444444] mb-1">
                    Cidade *
                  </label>
                  <input
                    id="acc-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Matola, Maputo, Beira"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="acc-neigh" className="block text-xs font-bold text-[#444444] mb-1">
                    Bairro *
                  </label>
                  <input
                    id="acc-neigh"
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Central, Polana, Sommerschield"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="acc-zip" className="block text-xs font-bold text-[#444444] mb-1">
                    Código Postal *
                  </label>
                  <input
                    id="acc-zip"
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="1100"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                  />
                </div>
              </div>
            </div>
            <MotionButton
              type="submit"
              disabled={savingProfile}
              className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </MotionButton>
          </form>

          <form
            onSubmit={handleChangePassword}
            className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-4 h-fit"
          >
            <h2 className="font-condensed text-[20px] font-bold uppercase text-[#0A3768] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#0475EE]" />
              Segurança e Alteração de Senha
            </h2>
            {passwordError && (
              <div role="alert" className="p-3 rounded-[2px] bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div role="status" className="p-3 rounded-[2px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                {passwordSuccess}
              </div>
            )}
            <div>
              <label htmlFor="pwd-current" className="block text-xs font-bold text-[#444444] mb-1">
                Senha atual
              </label>
              <input
                id="pwd-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>
            <div>
              <label htmlFor="pwd-new" className="block text-xs font-bold text-[#444444] mb-1">
                Nova senha (mín. 6 caracteres)
              </label>
              <input
                id="pwd-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>
            <div>
              <label htmlFor="pwd-confirm" className="block text-xs font-bold text-[#444444] mb-1">
                Confirmar nova senha
              </label>
              <input
                id="pwd-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>
            <MotionButton
              type="submit"
              disabled={savingPassword}
              className="h-10 px-6 rounded-full bg-[#0A3768] hover:bg-[#0475EE] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {savingPassword ? 'Atualizando...' : 'Alterar Senha'}
            </MotionButton>
          </form>
        </div>
      )}
    </main>
  );
}
