import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  LogIn,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Order, PaymentMethod } from '../types';
import {
  calculateCartTotals,
  formatCurrency,
  groupCartBySeller,
} from '../utils/marketplace';
import { MotionButton, SPRING_CARD } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

export function CartCheckoutView() {
  const {
    currentUser,
    cart,
    products,
    sellers,
    addresses,
    updateCartQuantity,
    removeFromCart,
    addAddress,
    placeOrder,
    navigate,
  } = useMarketplace();

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix_mobile');
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    recipient: currentUser?.name ?? '',
    street: '',
    city: '',
    state: 'Maputo',
    zipCode: '',
  });
  const [addressError, setAddressError] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!addresses.some((a) => a.id === selectedAddressId)) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? '');
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];

  const groups = useMemo(
    () =>
      groupCartBySeller(
        cart,
        products,
        sellers,
        selectedAddress?.zipCode ?? '1100'
      ),
    [cart, products, sellers, selectedAddress]
  );

  const totals = useMemo(() => calculateCartTotals(groups), [groups]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newAddress.label.trim() ||
      !newAddress.recipient.trim() ||
      !newAddress.street.trim() ||
      !newAddress.city.trim() ||
      !newAddress.zipCode.trim()
    ) {
      setAddressError('Preencha todos os campos obrigatórios do endereço.');
      return;
    }
    const created = await addAddress({
      label: newAddress.label.trim(),
      recipient: newAddress.recipient.trim(),
      street: newAddress.street.trim(),
      city: newAddress.city.trim(),
      state: newAddress.state.trim() || 'Maputo',
      zipCode: newAddress.zipCode.trim(),
    });
    if (created) {
      setSelectedAddressId(created.id);
      setAddingAddress(false);
      setAddressError('');
      setNewAddress({
        label: '',
        recipient: currentUser?.name ?? '',
        street: '',
        city: '',
        state: 'Maputo',
        zipCode: '',
      });
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      navigate({ type: 'auth', mode: 'login' });
      return;
    }
    if (!selectedAddress) return;
    setSubmittingOrder(true);
    try {
      const order = await placeOrder(selectedAddress, paymentMethod);
      if (order) {
        setConfirmedOrder(order);
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (confirmedOrder) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_CARD}
          className="bg-white border border-[#EAEAEA] rounded-[3px] p-8"
        >
          <div className="flex items-center gap-3 text-[#0A3768]">
            <CheckCircle2 className="w-8 h-8 shrink-0 text-[#0475EE]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0475EE]">
                Pedido Confirmado
              </p>
              <h1 className="font-condensed text-2xl font-bold uppercase text-[#222222]">
                Pedido {confirmedOrder.id} — Pagamento Aprovado
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-[#555555] leading-relaxed">
            Seu pedido foi distribuído automaticamente para{' '}
            <strong className="text-[#222222]">
              {confirmedOrder.fulfillments.length}{' '}
              {confirmedOrder.fulfillments.length === 1 ? 'lojista' : 'lojistas diferentes'}
            </strong>
            . Você pode acompanhar a separação e o código de rastreio em tempo real no seu perfil.
          </p>

          <div className="mt-6 space-y-4">
            {confirmedOrder.fulfillments.map((f) => (
              <div
                key={f.sellerId}
                className="border border-[#EAEAEA] rounded-[3px] p-4 bg-[#F7F8FA]"
              >
                <div className="flex items-center justify-between text-xs text-[#666666] mb-2">
                  <span className="font-bold text-[#333333]">Loja: {f.sellerName}</span>
                  <span className="font-mono tabular-nums">
                    Rastreio: {f.trackingCode} · Status: {f.status}
                  </span>
                </div>
                <ul className="divide-y divide-[#E5E7EB] text-sm">
                  {f.items.map((item) => (
                    <li
                      key={item.productId}
                      className="py-2 flex items-center justify-between gap-3"
                    >
                      <span className="text-[#333333]">
                        {item.quantity}x {item.title}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#0475EE] whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-[#EAEAEA] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#666666]">Total Pago</span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-[#0475EE]">
              {formatCurrency(confirmedOrder.total)}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'profile', tab: 'orders' })}
              className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Acompanhar Meus Pedidos
            </MotionButton>
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'home' })}
              className="h-10 px-5 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] hover:text-[#0475EE] text-[#444444] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Continuar Comprando
            </MotionButton>
          </div>
        </motion.div>
      </main>
    );
  }

  if (groups.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-12">
          <ShoppingBag className="w-12 h-12 text-[#CCCCCC] mx-auto mb-4" />
          <h1 className="font-condensed text-2xl font-bold uppercase text-[#333333]">
            Seu carrinho está vazio
          </h1>
          <p className="mt-2 text-sm text-[#666666] max-w-md mx-auto">
            Explore smartphones, laptops, tablets e acessórios de múltiplos vendedores em um único checkout integrado.
          </p>
          <MotionButton
            type="button"
            onClick={() => navigate({ type: 'home' })}
            className="mt-6 h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Explorar Vitrine Cellbox
          </MotionButton>
        </div>
      </main>
    );
  }

  const paymentOptions: Array<{
    id: PaymentMethod;
    label: string;
    detail: string;
    icon: typeof CreditCard;
  }> = [
    {
      id: 'pix_mobile',
      label: 'M-Pesa / e-Mola / Carteira Móvel',
      detail: 'Aprovação instantânea e liberação imediata do envio',
      icon: Smartphone,
    },
    {
      id: 'credit_card',
      label: 'Cartão de Crédito / Débito',
      detail: 'Em até 12x sem juros com proteção antifraude',
      icon: CreditCard,
    },
    {
      id: 'bank_transfer',
      label: 'Transferência Bancária',
      detail: 'Compensação em até 1 dia útil via NIB/IBAN',
      icon: Building2,
    },
  ];

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#EAEAEA]">
        <div>
          <button
            type="button"
            onClick={() => navigate({ type: 'home' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#0475EE] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Continuar comprando
          </button>
          <h1 className="font-condensed text-[28px] font-bold uppercase tracking-wide text-[#0A3768]">
            Carrinho e Checkout Multi-Vendor
          </h1>
          <p className="text-xs text-[#777777] mt-0.5 tabular-nums">
            {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'itens'} de {groups.length}{' '}
            {groups.length === 1 ? 'loja parceira' : 'lojas parceiras'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-5">
          {groups.map((group) => (
            <section
              key={group.seller.id}
              aria-label={`Itens de ${group.seller.name}`}
              className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#0475EE]" />
                  <span className="text-sm font-bold text-[#333333]">{group.seller.name}</span>
                  <span className="text-xs text-[#777777]">· {group.seller.location}</span>
                </div>
                <span className="text-xs font-bold text-[#0A3768] font-mono tabular-nums">
                  {group.shipping === 0
                    ? 'Frete grátis'
                    : `Frete: ${formatCurrency(group.shipping)}`}
                </span>
              </div>

              <ul className="divide-y divide-[#EAEAEA]">
                {group.items.map(({ product, quantity, lineTotal }) => (
                  <li key={product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                    <div className="w-24 h-20 rounded-[2px] overflow-hidden bg-white border border-[#EAEAEA] shrink-0">
                      <ProductImage
                        src={product.images[0]}
                        alt={product.title}
                        category={product.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#777777]">
                        {product.brand} · {product.condition}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate({ type: 'product', productId: product.id })}
                        className="text-[14px] font-bold text-[#333333] hover:text-[#0475EE] text-left mt-0.5 cursor-pointer"
                      >
                        {product.title}
                      </button>
                      <p className="text-xs text-[#777777] mt-1">
                        Unitário:{' '}
                        <span className="font-mono tabular-nums">{formatCurrency(product.price)}</span>
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                      <p className="text-base font-extrabold font-mono tabular-nums text-[#0475EE]">
                        {formatCurrency(lineTotal)}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#DCDCDC] rounded-[2px] overflow-hidden">
                          <button
                            type="button"
                            aria-label={`Reduzir quantidade de ${product.title}`}
                            onClick={() => updateCartQuantity(product.id, quantity - 1)}
                            className="w-8 h-8 text-[#444444] hover:bg-[#F1F2F4] font-bold cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-mono tabular-nums font-bold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Aumentar quantidade de ${product.title}`}
                            onClick={() => updateCartQuantity(product.id, quantity + 1)}
                            className="w-8 h-8 text-[#444444] hover:bg-[#F1F2F4] font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover ${product.title} do carrinho`}
                          onClick={() => removeFromCart(product.id)}
                          className="p-2 text-[#999999] hover:text-rose-600 rounded-[2px] hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Delivery Address Selection */}
          <section className="bg-white border border-[#EAEAEA] rounded-[3px] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0475EE]" />
                <h2 className="font-condensed text-[18px] font-bold uppercase text-[#333333]">
                  Endereço de Entrega
                </h2>
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setAddingAddress((v) => !v)}
                  className="text-xs font-bold text-[#0475EE] hover:text-[#0A3768] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo endereço
                </button>
              )}
            </div>

            {!currentUser ? (
              <div className="p-4 bg-[#F7F9FB] border border-[#E5E7EB] rounded-[3px] flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#555555]">
                  Faça login ou crie sua conta para selecionar seu endereço de entrega e finalizar o pedido. Seu carrinho será mantido!
                </p>
                <MotionButton
                  type="button"
                  onClick={() => navigate({ type: 'auth', mode: 'login' })}
                  className="h-8 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[11px] font-bold uppercase inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar Agora
                </MotionButton>
              </div>
            ) : (
              <>
                {addresses.length === 0 && !addingAddress && (
                  <div className="p-4 bg-[#F7F9FB] border border-[#E5E7EB] rounded-[3px] flex items-center justify-between gap-3">
                    <p className="text-xs text-[#555555]">
                      Você ainda não possui um endereço salvo. Cadastre um para finalizar a compra.
                    </p>
                    <MotionButton
                      type="button"
                      onClick={() => setAddingAddress(true)}
                      className="h-8 px-4 rounded-full bg-[#0475EE] text-white text-[11px] font-bold uppercase cursor-pointer"
                    >
                      + Cadastrar Endereço
                    </MotionButton>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const active = selectedAddress?.id === addr.id;
                    return (
                      <motion.button
                        key={addr.id}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        transition={SPRING_CARD}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`text-left p-4 rounded-[3px] border transition-colors cursor-pointer ${
                          active
                            ? 'border-[#0475EE] bg-[#0475EE]/5'
                            : 'border-[#E0E0E0] hover:border-[#0475EE]/60 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#333333]">{addr.label}</span>
                          {active && (
                            <span className="text-[11px] font-bold text-[#0A3768] uppercase">
                              Selecionado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#555555] mt-1">{addr.recipient}</p>
                        <p className="text-xs text-[#777777] mt-0.5">{addr.street}</p>
                        <p className="text-xs text-[#777777] font-mono tabular-nums mt-0.5">
                          {addr.city} - {addr.state} · CP {addr.zipCode}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                {addingAddress && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="mt-4 pt-4 border-t border-[#EAEAEA] grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {addressError && (
                      <p className="sm:col-span-2 text-xs font-medium text-rose-600">{addressError}</p>
                    )}
                    <input
                      type="text"
                      placeholder="Identificação (ex: Casa, Trabalho)"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress((p) => ({ ...p, label: e.target.value }))}
                      className="h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Nome do destinatário"
                      value={newAddress.recipient}
                      onChange={(e) => setNewAddress((p) => ({ ...p, recipient: e.target.value }))}
                      className="h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Rua, número e complemento"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                      className="sm:col-span-2 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                      className="h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Código Postal (ex: 1100)"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress((p) => ({ ...p, zipCode: e.target.value }))}
                      className="h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs font-mono"
                    />
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingAddress(false)}
                        className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-semibold text-[#555555] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <MotionButton
                        type="submit"
                        className="h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase cursor-pointer"
                      >
                        Salvar Endereço
                      </MotionButton>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>

          {/* Payment Method Simulation */}
          <section className="bg-white border border-[#EAEAEA] rounded-[3px] p-5 sm:p-6">
            <h2 className="font-condensed text-[18px] font-bold uppercase text-[#333333] mb-4">
              Forma de Pagamento
            </h2>
            <div className="space-y-2.5">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const active = paymentMethod === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    transition={SPRING_CARD}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`w-full text-left p-4 rounded-[3px] border flex items-center gap-4 transition-colors cursor-pointer ${
                      active
                        ? 'border-[#0475EE] bg-[#0475EE]/5'
                        : 'border-[#E0E0E0] hover:border-[#0475EE]/60 bg-white'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${active ? 'text-[#0475EE]' : 'text-[#888888]'}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#333333]">{opt.label}</p>
                      <p className="text-xs text-[#777777] mt-0.5">{opt.detail}</p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        active ? 'border-[#0475EE]' : 'border-[#CCCCCC]'
                      }`}
                    >
                      {active && <span className="w-2 h-2 rounded-full bg-[#0475EE]" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right column: Sticky Order Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-[174px] bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-5">
          <h2 className="font-condensed text-[20px] font-bold uppercase text-[#0A3768] pb-3 border-b border-[#EAEAEA]">
            Resumo do Pedido
          </h2>

          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between text-[#666666]">
              <dt>Produtos ({totals.itemCount})</dt>
              <dd className="font-mono tabular-nums font-semibold text-[#333333]">
                {formatCurrency(totals.subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between text-[#666666]">
              <dt>
                Frete ({groups.length} {groups.length === 1 ? 'envio' : 'envios'})
              </dt>
              <dd className="font-mono tabular-nums font-bold text-[#0A3768]">
                {totals.shippingTotal === 0 ? 'Grátis' : formatCurrency(totals.shippingTotal)}
              </dd>
            </div>
            <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
              <dt className="text-base font-bold text-[#333333]">Total</dt>
              <dd className="text-2xl font-extrabold font-mono tabular-nums text-[#0475EE]">
                {formatCurrency(totals.grandTotal)}
              </dd>
            </div>
          </dl>

          {!currentUser ? (
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'auth', mode: 'login' })}
              className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Entrar para Finalizar
            </MotionButton>
          ) : (
            <MotionButton
              type="button"
              onClick={() => void handleCheckout()}
              disabled={!selectedAddress || submittingOrder}
              className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:bg-[#CCCCCC] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {submittingOrder ? 'Processando Pedido...' : 'Finalizar Compra'}
            </MotionButton>
          )}

          <div className="flex items-start gap-2.5 text-xs text-[#666666] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#0475EE] shrink-0 mt-0.5" />
            <span>
              Seu pagamento fica protegido pela Cellbox até você confirmar o recebimento de todos os itens.
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
