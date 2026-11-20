import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export function Footer() {
  const {
    categories,
    navigate,
    switchDemoRole,
    setFilters,
    showToast,
  } = useMarketplace();
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Digite um e-mail válido para assinar a newsletter.', 'warning');
      return;
    }
    showToast(`E-mail ${email.trim()} inscrito com sucesso nas ofertas Cellbox!`, 'success');
    setEmail('');
  };

  const quickFilter = (term: string, isCategory = false) => {
    setFilters((prev) => ({
      ...prev,
      category: isCategory ? term : 'Todas',
      search: isCategory ? '' : term,
    }));
    navigate({ type: 'home' });
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
              <button
                type="submit"
                className="h-9 px-4 bg-[#0A3768] hover:bg-[#082C54] text-white text-[11px] font-bold uppercase tracking-wider rounded-r-[2px] transition-colors whitespace-nowrap cursor-pointer"
              >
                ASSINAR
              </button>
            </form>

            <div className="text-center sm:text-left">
              <p className="font-condensed text-[14px] font-bold uppercase tracking-wide text-white leading-tight">
                ASSINE NOSSA NEWSLETTER
              </p>
              <p className="text-[11px] text-white/90 mt-0.5">
                Receba descontos exclusivos e lançamentos de tecnologia em Moçambique.
              </p>
            </div>
          </div>

          {/* 4 Crisp White Square Social Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {[
              { label: 'Facebook', glyph: 'f' },
              { label: 'Twitter', glyph: '𝕏' },
              { label: 'Instagram', glyph: 'ig' },
              { label: 'YouTube', glyph: '▶' },
            ].map((social) => (
              <button
                key={social.label}
                type="button"
                aria-label={social.label}
                onClick={() => showToast(`Siga a Cellbox no ${social.label}!`, 'info')}
                className="w-8 h-8 bg-white hover:bg-[#EAF6FC] text-[#0A3768] rounded-[2px] flex items-center justify-center text-[12px] font-extrabold transition-colors cursor-pointer"
              >
                {social.glyph}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Band 2: 5-Column White Links Directory */}
      <div className="bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[1170px] mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: CONTATO */}
          <div className="lg:col-span-1">
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              CONTATO
            </h3>
            <ul className="space-y-3 text-[11px] leading-relaxed text-[#666666]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-[2px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3 h-3" />
                </span>
                <span>
                  <strong className="text-[#0A3768] uppercase text-[10px]">ENDEREÇO:</strong> Av.
                  25 de Setembro, 1374 — Maputo, Moçambique
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-[2px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-3 h-3" />
                </span>
                <span>
                  <strong className="text-[#0A3768] uppercase text-[10px]">TELEFONE:</strong> +258
                  84 400 2026
                  <br />
                  +258 82 987 4321
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-[2px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-3 h-3" />
                </span>
                <span>
                  <strong className="text-[#0A3768] uppercase text-[10px]">E-MAIL:</strong>{' '}
                  suporte@cellbox.co.mz
                  <br />
                  parceiros@cellbox.co.mz
                </span>
              </li>
            </ul>
          </div>

          {/* Col 2: INSTITUCIONAL */}
          <div>
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              INSTITUCIONAL
            </h3>
            <ul className="space-y-2 text-[12px] text-[#666666]">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'home' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Sobre a Cellbox
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'store', sellerId: 'seller-techzone' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Lojas Oficiais Verificadas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    showToast('Todas as compras possuem garantia Cellbox de 30 dias.', 'info')
                  }
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Compra Garantida
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showToast('Política de Privacidade e proteção de dados ativa.', 'info')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => showToast('Termos de Uso do Marketplace Cellbox.', 'info')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Termos de Uso
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: MINHA CONTA */}
          <div>
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              MINHA CONTA
            </h3>
            <ul className="space-y-2 text-[12px] text-[#666666]">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'auth', mode: 'login' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Entrar / Cadastrar
                </button>
              </li>
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
                  onClick={() => navigate({ type: 'cart' })}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Meu Carrinho
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: PAINÉIS RBAC */}
          <div>
            <h3 className="font-condensed text-[14px] font-bold uppercase tracking-wide text-[#0A3768] mb-4">
              PAINÉIS RBAC
            </h3>
            <ul className="space-y-2 text-[12px] text-[#666666]">
              <li>
                <button
                  type="button"
                  onClick={() => switchDemoRole('buyer')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Área do Comprador
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => switchDemoRole('seller')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Painel do Vendedor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => switchDemoRole('admin')}
                  className="hover:text-[#0475EE] transition-colors cursor-pointer"
                >
                  Super Admin Master
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ type: 'auth', mode: 'register' })}
                  className="text-[#0475EE] font-semibold hover:text-[#0A3768] transition-colors cursor-pointer"
                >
                  Quero Vender na Cellbox
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: CATEGORIAS */}
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

      {/* Band 3: Light Gray Trust Seals, Payment Methods & App Store Strip (#F0F2F4) */}
      <div className="bg-[#F0F2F4] border-b border-[#E5E7EB]">
        <div className="max-w-[1170px] mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Security Trust Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-white border border-[#DCDCDC] rounded-[3px] px-2.5 py-1">
              <ShieldCheck className="w-4 h-4 text-[#0475EE]" />
              <div className="leading-none">
                <p className="text-[10px] font-extrabold text-[#0A3768] tracking-tight">
                  SITE VERIFICADO
                </p>
                <p className="text-[8px] text-[#777777] uppercase">SSL 256-BIT</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#DCDCDC] rounded-[3px] px-2.5 py-1">
              <CheckCircle2 className="w-4 h-4 text-[#18A3DE]" />
              <div className="leading-none">
                <p className="text-[10px] font-extrabold text-[#0A3768] tracking-tight">
                  COMPRA SEGURA
                </p>
                <p className="text-[8px] text-[#777777] uppercase">GARANTIA CELLBOX</p>
              </div>
            </div>
          </div>

          {/* Center: Mozambican Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {[
              { label: 'M-Pesa', color: 'text-[#E60000]' },
              { label: 'e-Mola', color: 'text-[#F59E0B]' },
              { label: 'VISA', color: 'text-[#0A3768]' },
              { label: 'MasterCard', color: 'text-[#EB001B]' },
              { label: 'Millennium bim', color: 'text-[#0475EE]' },
              { label: 'BCI', color: 'text-[#18A3DE]' },
            ].map((pm) => (
              <span
                key={pm.label}
                className={`inline-flex items-center justify-center bg-white border border-[#DCDCDC] rounded-[3px] px-2.5 h-7 text-[10px] font-extrabold tracking-tight ${pm.color}`}
              >
                {pm.label}
              </span>
            ))}
          </div>

          {/* Right: App Store Badges */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showToast('App Cellbox para Android em breve na Google Play.', 'info')}
              className="flex items-center gap-1.5 bg-[#0A3768] hover:bg-[#0475EE] text-white px-2.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#1AD6DE]" />
              <div className="text-left leading-none">
                <p className="text-[7px] uppercase text-white/75">DISPONÍVEL NO</p>
                <p className="text-[10px] font-bold">Google Play</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => showToast('App Cellbox para iOS em breve na App Store.', 'info')}
              className="flex items-center gap-1.5 bg-[#0A3768] hover:bg-[#0475EE] text-white px-2.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-white" />
              <div className="text-left leading-none">
                <p className="text-[7px] uppercase text-white/75">BAIXAR NA</p>
                <p className="text-[10px] font-bold">App Store</p>
              </div>
            </button>
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
            Copyright © 2026 Cellbox Moçambique. Todos os direitos reservados · Preços em Meticais (MZN).
          </p>
        </div>
      </div>
    </footer>
  );
}
