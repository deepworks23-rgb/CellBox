import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { AppStoreBadgeIcon, PaymentBadgeLogo, type PaymentMethodBrand } from './BrandLogo';
import { MotionButton, SPRING_CARD } from './MotionPrimitives';

type InfoModalKey = 'about' | 'guarantee' | 'privacy' | 'terms';

const INFO_MODAL_CONTENT: Record<
  InfoModalKey,
  { title: string; subtitle: string; paragraphs: string[] }
> = {
  about: {
    title: 'Sobre a Cellbox Moçambique',
    subtitle: 'O marketplace especializado em tecnologia verificada',
    paragraphs: [
      'A Cellbox conecta consumidores em todo Moçambique às melhores lojas oficiais de smartphones, laptops, tablets, áudio e acessórios de alta performance.',
      'Todos os lojistas passam por verificação documental (NUIT/NIF) e controle contínuo de qualidade antes de publicar produtos na vitrine.',
      'Oferecemos checkout unificado multi-vendor em Meticais (MZN) com suporte a M-Pesa, e-Mola, cartões e transferência bancária.',
    ],
  },
  guarantee: {
    title: 'Compra Garantida Cellbox',
    subtitle: 'Proteção total do pagamento até a entrega',
    paragraphs: [
      'Na Cellbox, o valor pago fica protegido em conta de garantia até você receber seu produto e confirmar que está tudo conforme o anúncio.',
      'Você tem até 30 dias corridos para devolução gratuita caso o produto apresente qualquer divergência técnica ou defeito.',
      'Produtos recondicionados A+ passam por inspeção de 40 pontos em laboratório parceiro e possuem 12 meses de garantia oficial.',
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    subtitle: 'Segurança e transparência no tratamento dos seus dados',
    paragraphs: [
      'Suas senhas são protegidas com hash criptográfico com salt único (scrypt) e nunca são armazenadas em texto simples.',
      'Seus dados de entrega e contato são compartilhados exclusivamente com o lojista responsável pela expedição do seu pedido.',
      'Você pode atualizar seus dados pessoais, endereços e senha a qualquer momento na área Minha Conta > Configurações.',
    ],
  },
  terms: {
    title: 'Termos de Uso do Marketplace',
    subtitle: 'Direitos e responsabilidades de compradores e lojistas',
    paragraphs: [
      'Ao utilizar a Cellbox, compradores e lojistas concordam com as regras de transparência de preços em Meticais (MT), autenticidade de produtos e prazos de expedição.',
      'Lojistas parceiros comprometem-se a manter estoque atualizado, emitir comprovativo fiscal e atualizar os marcos de rastreio (Pago, Em Separação, Enviado, Entregue).',
      'A equipe Super Admin da Cellbox monitora a qualidade do catálogo e pode suspender contas que violem as políticas da plataforma.',
    ],
  },
};

export function Footer() {
  const {
    currentUser,
    categories,
    navigate,
    setFilters,
    subscribeNewsletter,
    showToast,
    siteCustomization,
  } = useMarketplace();
  const [email, setEmail] = useState('');
  const [submittingNews, setSubmittingNews] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<InfoModalKey | null>(null);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Digite um e-mail válido para assinar a newsletter.', 'warning');
      return;
    }
    setSubmittingNews(true);
    try {
      const res = await subscribeNewsletter(email.trim());
      if (res.ok) {
        setSubscribedEmail(email.trim());
        setEmail('');
      } else if (res.error) {
        showToast(res.error, 'warning');
      }
    } finally {
      setSubmittingNews(false);
    }
  };

  const quickFilter = (term: string, isCategory = false) => {
    setFilters((prev) => ({
      ...prev,
      category: isCategory ? term : 'Todas',
      search: isCategory ? '' : term,
    }));
    navigate({ type: 'home' });
    window.setTimeout(() => {
      document.getElementById('catalogo-principal')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const quickKeywords = [
    { label: 'Smartphones', isCategory: true },
    { label: 'Laptops', isCategory: true },
    { label: 'Tablets', isCategory: true },
    { label: 'Áudio', isCategory: true },
    { label: 'Gaming', isCategory: true },
    { label: 'iPhone 16 Pro', isCategory: false },
    { label: 'Galaxy S24 Ultra', isCategory: false },
    { label: 'MacBook Pro M3', isCategory: false },
    { label: 'Dell XPS 15', isCategory: false },
    { label: 'iPad Pro', isCategory: false },
    { label: 'Sony WH-1000XM5', isCategory: false },
    { label: 'Carregador GaN', isCategory: false },
    { label: 'ROG Ally', isCategory: false },
    { label: 'SSD NVMe', isCategory: false },
  ];

  const activeInfo = infoModal ? INFO_MODAL_CONTENT[infoModal] : null;

  return (
    <footer className="mt-auto bg-white text-[#555555]">
      {/* Band 1: Full-width Official Cellbox Cyan-Blue Newsletter Bar (#18A3DE) */}
      <div className="bg-[#18A3DE] text-white">
        <div className="max-w-[1170px] mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <form onSubmit={handleNewsletter} className="flex items-stretch w-full sm:w-auto">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Seu e-mail para newsletter
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail..."
                className="h-9 flex-1 sm:w-[220px] bg-white text-[#333333] placeholder:text-[#999999] px-3 text-[12px] rounded-l-[2px] focus:outline-none"
              />
              <MotionButton
                type="submit"
                hoverScale={1.02}
                hoverY={0}
                disabled={submittingNews}
                className="h-9 px-4 bg-[#0A3768] hover:bg-[#082C54] disabled:opacity-60 text-white text-[11px] font-bold uppercase tracking-wider rounded-r-[2px] transition-colors whitespace-nowrap cursor-pointer"
              >
                {submittingNews ? '...' : 'ASSINAR'}
              </MotionButton>
            </form>

            <div className="text-center sm:text-left">
              <p className="font-condensed text-[14px] font-bold uppercase tracking-wide text-white leading-tight">
                {subscribedEmail ? 'INSCRIÇÃO CONFIRMADA!' : 'ASSINE NOSSA NEWSLETTER'}
              </p>
              <p className="text-[11px] text-white/90 mt-0.5">
                {subscribedEmail
                  ? `Ofertas exclusivas serão enviadas para ${subscribedEmail}.`
                  : 'Receba descontos exclusivos e lançamentos de tecnologia em Moçambique.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {[
              { label: 'Facebook', glyph: 'f', url: siteCustomization.contact.facebook },
              { label: 'Twitter', glyph: '𝕏', url: siteCustomization.contact.twitter },
              { label: 'Instagram', glyph: 'ig', url: siteCustomization.contact.instagram },
              { label: 'YouTube', glyph: '▶', url: siteCustomization.contact.youtube },
              ...(siteCustomization.contact.tiktok
                ? [{ label: 'TikTok', glyph: 'tk', url: siteCustomization.contact.tiktok }]
                : []),
            ].map((social) => (
              <MotionButton
                key={social.label}
                type="button"
                hoverScale={1.08}
                hoverY={-1}
                aria-label={social.label}
                onClick={() => {
                  if (social.url && social.url.startsWith('http')) {
                    window.open(social.url, '_blank', 'noopener,noreferrer');
                  } else {
                    showToast(`Siga @cellbox.mz no ${social.label}!`, 'info');
                  }
                }}
                className="w-8 h-8 bg-white hover:bg-[#EAF6FC] text-[#0A3768] rounded-[2px] flex items-center justify-center text-[12px] font-extrabold transition-colors cursor-pointer"
              >
                {social.glyph}
              </MotionButton>
            ))}
          </div>
        </div>
      </div>

      {/* Band 2: 5-Column White Links Directory */}
      <div className="bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[1170px] mx-auto px-4 py-10 flex flex-wrap justify-between gap-8">
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              CONTATO
            </h3>
            <ul className="space-y-3 text-[11px] leading-relaxed text-[#666666]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-[2px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3 h-3" />
                </span>
                <span>
                  <strong className="text-[#0A3768] uppercase text-[10px]">ENDEREÇO:</strong>{' '}
                  {siteCustomization.contact.address}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-[2px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-3 h-3" />
                </span>
                <span>
                  <strong className="text-[#0A3768] uppercase text-[10px]">TELEFONE:</strong>{' '}
                  {siteCustomization.contact.phone1}
                  {siteCustomization.contact.phone2 && (
                    <>
                      <br />
                      {siteCustomization.contact.phone2}
                    </>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-[2px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-3 h-3" />
                </span>
                <span>
                  <strong className="text-[#0A3768] uppercase text-[10px]">E-MAIL:</strong>{' '}
                  {siteCustomization.contact.emailSupport}
                  {siteCustomization.contact.emailPartners && (
                    <>
                      <br />
                      {siteCustomization.contact.emailPartners}
                    </>
                  )}
                </span>
              </li>
            </ul>
          </div>

          <div className="flex-1 min-w-[160px]">
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              INSTITUCIONAL
            </h3>
            <ul className="space-y-2 text-[12px] text-[#666666]">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'about' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Sobre a Cellbox
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'stores' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Lojas Oficiais Verificadas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setInfoModal('guarantee')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Compra Garantida
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setInfoModal('privacy')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setInfoModal('terms')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Termos de Uso
                </button>
              </li>
            </ul>
          </div>

          <div className="flex-1 min-w-[160px]">
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              MINHA CONTA
            </h3>
            <ul className="space-y-2 text-[12px] text-[#666666]">
              {!currentUser && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'auth', mode: 'login' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Entrar
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'auth', mode: 'register' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Criar Conta
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'cart' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Meu Carrinho
                    </button>
                  </li>
                </>
              )}

              {currentUser?.role === 'buyer' && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'profile', tab: 'orders' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Meus Pedidos
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'profile', tab: 'wishlist' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Lista de Desejos
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'profile', tab: 'addresses' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Endereços Salvos
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'profile', tab: 'settings' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Configurações
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'cart' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Meu Carrinho
                    </button>
                  </li>
                </>
              )}

              {currentUser?.role === 'seller' && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'seller_dashboard', tab: 'overview' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Painel do Vendedor
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'seller_dashboard', tab: 'products' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Meus Produtos
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'seller_dashboard', tab: 'orders' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Pedidos da Loja
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate({ type: 'seller_dashboard', tab: 'settings' })}
                      className="hover:text-[#0475EE] transition-colors cursor-pointer"
                    >
                      Configurações da Loja
                    </button>
                  </li>
                </>
              )}

              {currentUser?.role === 'admin' && (
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ type: 'admin_dashboard', tab: 'overview' })}
                    className="hover:text-[#0475EE] transition-colors cursor-pointer"
                  >
                    Painel Administrativo
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="flex-1 min-w-[160px]">
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              ATENDIMENTO
            </h3>
            <ul className="space-y-2 text-[12px] text-[#666666]">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'about' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Sobre a Cellbox
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'stores' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Lojas Oficiais
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'offers' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Ofertas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'contact' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              CATEGORIAS
            </h3>
            <ul className="space-y-2 text-[12px] text-[#666666]">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => quickFilter(cat, true)}
                    className="hover:text-[#0475EE] transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Band 3: Trust Seals, Official Payment Logos & Official App Store Badges */}
      <div
        data-testid="footer-trust-payment-bar"
        className="bg-[#F0F2F4] border-b border-[#E5E7EB]"
      >
        <div className="max-w-[1170px] mx-auto px-4 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Trust Seals */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 flex items-center gap-1.5 bg-white border border-[#DCDCDC] rounded-[3px] px-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#0475EE] shrink-0" />
              <div className="leading-tight">
                <p className="text-[9.5px] font-extrabold text-[#0A3768] tracking-tight whitespace-nowrap">
                  SITE VERIFICADO
                </p>
                <p className="text-[7.5px] text-[#777777] uppercase whitespace-nowrap">
                  SSL 256-BIT
                </p>
              </div>
            </div>
            <div className="h-8 flex items-center gap-1.5 bg-white border border-[#DCDCDC] rounded-[3px] px-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#18A3DE] shrink-0" />
              <div className="leading-tight">
                <p className="text-[9.5px] font-extrabold text-[#0A3768] tracking-tight whitespace-nowrap">
                  COMPRA SEGURA
                </p>
                <p className="text-[7.5px] text-[#777777] uppercase whitespace-nowrap">
                  GARANTIA CELLBOX
                </p>
              </div>
            </div>
          </div>

          {/* Official Payment Methods */}
          <div
            aria-label="Métodos de pagamento aceites"
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {(
              [
                { id: 'mpesa', title: 'M-Pesa Vodacom' },
                { id: 'emola', title: 'e-Mola Movitel' },
                { id: 'visa', title: 'Visa' },
                { id: 'mastercard', title: 'Mastercard' },
                { id: 'millennium', title: 'Millennium bim' },
                { id: 'bci', title: 'BCI Moçambique' },
              ] as Array<{ id: PaymentMethodBrand; title: string }>
            ).map((pm) => (
              <span
                key={pm.id}
                title={pm.title}
                className="h-8 px-2.5 inline-flex items-center justify-center bg-white border border-[#DCDCDC] rounded-[3px] shadow-2xs"
              >
                <PaymentBadgeLogo brand={pm.id} />
              </span>
            ))}
          </div>

          {/* Official App Store Badges */}
          <div className="flex items-center gap-2 shrink-0">
            <MotionButton
              type="button"
              onClick={() => showToast('App Cellbox para Android em breve na Google Play.', 'info')}
              className="h-9 px-3 flex items-center gap-2 bg-[#0A3768] hover:bg-[#0475EE] text-white rounded-[4px] transition-colors cursor-pointer whitespace-nowrap"
            >
              <AppStoreBadgeIcon store="google_play" />
              <div className="text-left leading-tight">
                <p className="text-[7px] uppercase tracking-wide text-white/75">DISPONÍVEL NO</p>
                <p className="text-[10.5px] font-bold">Google Play</p>
              </div>
            </MotionButton>
            <MotionButton
              type="button"
              onClick={() => showToast('App Cellbox para iOS em breve na App Store.', 'info')}
              className="h-9 px-3 flex items-center gap-2 bg-[#0A3768] hover:bg-[#0475EE] text-white rounded-[4px] transition-colors cursor-pointer whitespace-nowrap"
            >
              <AppStoreBadgeIcon store="app_store" />
              <div className="text-left leading-tight">
                <p className="text-[7px] uppercase tracking-wide text-white/75">BAIXAR NA</p>
                <p className="text-[10.5px] font-bold">App Store</p>
              </div>
            </MotionButton>
          </div>
        </div>
      </div>

      {/* Band 4: Quick Directory Keywords & Copyright */}
      <div className="bg-white py-6">
        <div className="max-w-[1170px] mx-auto px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-[#777777] max-w-4xl mx-auto">
            {quickKeywords.map((kw, idx) => (
              <React.Fragment key={kw.label}>
                <button
                  type="button"
                  onClick={() => quickFilter(kw.label, kw.isCategory)}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  {kw.label}
                </button>
                {idx < quickKeywords.length - 1 && (
                  <span aria-hidden="true" className="text-[#CCCCCC]">
                    -
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-[11px] text-[#888888] mt-3">
            {siteCustomization.footer.copyrightText ||
              'Copyright © 2026 Cellbox Moçambique. Todos os direitos reservados · Preços em Meticais (MZN).'}
          </p>
        </div>
      </div>

      {/* Interactive Institutional Info Modal */}
      <AnimatePresence>
        {activeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInfoModal(null)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-info-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={SPRING_CARD}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#EAEAEA]">
                <div>
                  <h2
                    id="footer-info-modal-title"
                    className="font-condensed text-[22px] font-bold uppercase text-[#0A3768]"
                  >
                    {activeInfo.title}
                  </h2>
                  <p className="text-xs text-[#18A3DE] font-semibold mt-0.5">
                    {activeInfo.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  aria-label="Fechar janela informativa"
                  className="p-1.5 rounded-[2px] text-[#666666] hover:bg-[#F1F2F4] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-[#555555] leading-relaxed">
                {activeInfo.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <MotionButton
                  type="button"
                  onClick={() => setInfoModal(null)}
                  className="h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Entendido
                </MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
