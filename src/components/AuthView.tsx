import React, { useState } from 'react';
import { ShieldCheck, ShoppingBag, Store, UserCheck } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { validateRegistration } from '../utils/marketplace';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
}

export function AuthView({ initialMode = 'login' }: AuthViewProps) {
  const { categories, loginWithEmail, registerUser, switchDemoRole } = useMarketplace();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login state
  const [loginEmail, setLoginEmail] = useState('mariana@cellbox.com');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Register state
  const [registerIntent, setRegisterIntent] = useState<'buyer' | 'seller'>('buyer');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [mainCategory, setMainCategory] = useState(categories[0] ?? 'Smartphones');
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Preencha e-mail e senha para continuar.');
      return;
    }
    const res = loginWithEmail(loginEmail);
    if (!res.ok) {
      setLoginError(res.error ?? 'Erro ao autenticar.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateRegistration({
      name: regName,
      email: regEmail,
      password: regPassword,
      isSeller: registerIntent === 'seller',
      storeName,
      documentId,
      mainCategory,
    });
    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }
    setRegErrors({});
    const res = registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      isSeller: registerIntent === 'seller',
      storeName,
      documentId,
      mainCategory,
    });
    if (!res.ok && res.error) {
      setRegErrors({ email: res.error });
    }
  };

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-8 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Auth Form Card */}
        <div className="lg:col-span-7 bg-white border border-[#EAEAEA] rounded-[3px] p-6 sm:p-8">
          {/* Segmented Mode Switch */}
          <div className="grid grid-cols-2 p-1 bg-[#F1F2F4] rounded-full mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`h-9 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#43AA5B] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#333333]'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`h-9 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#43AA5B] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#333333]'
              }`}
            >
              Criar Cadastro
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h1 className="font-condensed text-[26px] font-bold uppercase text-[#43AA5B]">
                  Acesse sua conta Cellbox
                </h1>
                <p className="text-xs text-[#777777] mt-1">
                  Entre com suas credenciais ou teste qualquer perfil RBAC ao lado.
                </p>
              </div>

              {loginError && (
                <div
                  role="alert"
                  className="p-3 rounded-[3px] bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
                >
                  {loginError}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-[#444444] mb-1.5">
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-[#444444] mb-1.5"
                >
                  Senha
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-[#555555] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#CCCCCC] accent-[#43AA5B]"
                  />
                  Lembrar-me neste dispositivo
                </label>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Entrar
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h1 className="font-condensed text-[26px] font-bold uppercase text-[#43AA5B]">
                  Cadastre-se na Cellbox
                </h1>
                <p className="text-xs text-[#777777] mt-1">
                  Escolha seu objetivo para criarmos a experiência certa.
                </p>
              </div>

              {/* Intent Selector: Quero Comprar vs Quero Vender na Cellbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRegisterIntent('buyer')}
                  className={`p-4 rounded-[3px] border text-left transition-colors cursor-pointer ${
                    registerIntent === 'buyer'
                      ? 'border-[#0098D8] bg-[#0098D8]/5'
                      : 'border-[#E0E0E0] hover:border-[#CCCCCC]'
                  }`}
                >
                  <ShoppingBag
                    className={`w-5 h-5 mb-2 ${
                      registerIntent === 'buyer' ? 'text-[#0098D8]' : 'text-[#999999]'
                    }`}
                  />
                  <p className="text-sm font-bold text-[#333333]">Quero Comprar</p>
                  <p className="text-xs text-[#777777] mt-0.5">
                    Acesso imediato à vitrine e pedidos
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterIntent('seller')}
                  className={`p-4 rounded-[3px] border text-left transition-colors cursor-pointer ${
                    registerIntent === 'seller'
                      ? 'border-[#43AA5B] bg-[#43AA5B]/5'
                      : 'border-[#E0E0E0] hover:border-[#CCCCCC]'
                  }`}
                >
                  <Store
                    className={`w-5 h-5 mb-2 ${
                      registerIntent === 'seller' ? 'text-[#43AA5B]' : 'text-[#999999]'
                    }`}
                  />
                  <p className="text-sm font-bold text-[#333333]">Quero Vender na Cellbox</p>
                  <p className="text-xs text-[#777777] mt-0.5">
                    Crie sua loja (sujeita à aprovação)
                  </p>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold text-[#444444] mb-1">
                    Nome completo *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
                  />
                  {regErrors.name && (
                    <p className="text-xs text-rose-600 mt-1">{regErrors.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold text-[#444444] mb-1">
                    E-mail *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
                  />
                  {regErrors.email && (
                    <p className="text-xs text-rose-600 mt-1">{regErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold text-[#444444] mb-1">
                  Senha (mín. 6 caracteres) *
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Crie uma senha segura"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
                />
                {regErrors.password && (
                  <p className="text-xs text-rose-600 mt-1">{regErrors.password}</p>
                )}
              </div>

              {registerIntent === 'seller' && (
                <div className="pt-4 border-t border-[#EAEAEA] space-y-3">
                  <p className="text-xs font-bold uppercase text-[#43AA5B]">Dados da Loja Parceira</p>
                  <div>
                    <label
                      htmlFor="reg-store-name"
                      className="block text-xs font-bold text-[#444444] mb-1"
                    >
                      Nome da Loja *
                    </label>
                    <input
                      id="reg-store-name"
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex: NovaTech Eletrônicos"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#43AA5B]"
                    />
                    {regErrors.storeName && (
                      <p className="text-xs text-rose-600 mt-1">{regErrors.storeName}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="reg-doc"
                        className="block text-xs font-bold text-[#444444] mb-1"
                      >
                        Documento / NIF / CNPJ *
                      </label>
                      <input
                        id="reg-doc"
                        type="text"
                        value={documentId}
                        onChange={(e) => setDocumentId(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#43AA5B]"
                      />
                      {regErrors.documentId && (
                        <p className="text-xs text-rose-600 mt-1">{regErrors.documentId}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="reg-cat"
                        className="block text-xs font-bold text-[#444444] mb-1"
                      >
                        Categoria Principal *
                      </label>
                      <select
                        id="reg-cat"
                        value={mainCategory}
                        onChange={(e) => setMainCategory(e.target.value)}
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm bg-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-[2px] px-3 py-2">
                    Novos lojistas iniciam com status <strong>Pendente de Aprovação</strong> até validação no painel Super Admin.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 rounded-full bg-[#43AA5B] hover:bg-[#2F8E47] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {registerIntent === 'seller'
                  ? 'Enviar Cadastro de Vendedor'
                  : 'Criar Conta de Comprador'}
              </button>
            </form>
          )}
        </div>

        {/* Right: Quick RBAC Access Panel (Green Gradient matching Hero) */}
        <aside className="lg:col-span-5 cellbox-hero-gradient text-white rounded-[3px] p-6 sm:p-7 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/85">
              Acesso Rápido de Demonstração
            </p>
            <h2 className="font-condensed text-[26px] font-bold uppercase text-white mt-0.5 leading-tight">
              Teste os 3 perfis RBAC
            </h2>
            <p className="text-xs text-white/90 mt-1.5 leading-relaxed">
              Alterne instantaneamente entre Comprador, Vendedor e Super Admin. Todas as ações (novos produtos, aprovação de lojas, pedidos) sincronizam em tempo real.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => switchDemoRole('buyer')}
              className="w-full text-left p-4 rounded-[3px] bg-white hover:bg-[#F7F8FA] text-[#333333] transition-colors flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <UserCheck className="w-5 h-5 text-[#0098D8] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#222222]">Entrar como Comprador</p>
                <p className="text-xs text-[#666666] mt-0.5">
                  Mariana Costa · Vitrine, comparador, carrinho multi-vendor e pedidos
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => switchDemoRole('seller')}
              className="w-full text-left p-4 rounded-[3px] bg-white hover:bg-[#F7F8FA] text-[#333333] transition-colors flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <Store className="w-5 h-5 text-[#43AA5B] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#222222]">Entrar como Vendedor</p>
                <p className="text-xs text-[#666666] mt-0.5">
                  TechZone Store · Analytics, catálogo, estoque e expedição de pedidos
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => switchDemoRole('admin')}
              className="w-full text-left p-4 rounded-[3px] bg-white hover:bg-[#F7F8FA] text-[#333333] transition-colors flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-5 h-5 text-[#2F8E47] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#222222]">Entrar como Super Admin</p>
                <p className="text-xs text-[#666666] mt-0.5">
                  Gestor Cellbox · GMV global, aprovação da GadgetHub e taxa de comissão
                </p>
              </div>
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
