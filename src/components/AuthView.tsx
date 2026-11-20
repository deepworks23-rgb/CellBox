import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCheck,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { validateRegistration } from '../utils/marketplace';
import { MotionButton, SPRING_CARD } from './MotionPrimitives';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
}

export function AuthView({ initialMode = 'login' }: AuthViewProps) {
  const { categories, login, registerUser, switchDemoRole } = useMarketplace();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('mariana@cellbox.co.mz');
  const [loginPassword, setLoginPassword] = useState('cellbox123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Register state
  const [registerIntent, setRegisterIntent] = useState<'buyer' | 'seller'>('buyer');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [mainCategory, setMainCategory] = useState(categories[0] ?? 'Smartphones');
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Preencha e-mail e senha para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.ok) {
        setLoginError(res.error ?? 'E-mail ou senha inválidos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
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
    setSubmitting(true);
    try {
      const res = await registerUser({
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-[1170px] mx-auto px-4 py-8 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Auth Form Card */}
        <div className="lg:col-span-7 bg-white border border-[#EAEAEA] rounded-[3px] p-6 sm:p-8 shadow-2xs">
          {/* Segmented Mode Switch */}
          <div className="grid grid-cols-2 p-1 bg-[#F1F2F4] rounded-full mb-6">
            <MotionButton
              type="button"
              hoverScale={1.01}
              hoverY={0}
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`h-9 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#0475EE] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#333333]'
              }`}
            >
              Entrar na Conta
            </MotionButton>
            <MotionButton
              type="button"
              hoverScale={1.01}
              hoverY={0}
              onClick={() => {
                setMode('register');
                setRegErrors({});
              }}
              className={`h-9 rounded-full text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#0475EE] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#333333]'
              }`}
            >
              Criar Cadastro
            </MotionButton>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h1 className="font-condensed text-[26px] font-bold uppercase text-[#0A3768]">
                  Acesse sua conta Cellbox
                </h1>
                <p className="text-xs text-[#777777] mt-1">
                  Autenticação segura com validação real de e-mail e senha criptografada.
                </p>
              </div>

              {loginError && (
                <div
                  role="alert"
                  data-testid="login-error-alert"
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
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-[#444444] mb-1.5"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-10 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowLoginPassword((s) => !s)}
                    className="absolute right-2.5 top-2.5 text-[#888888] hover:text-[#0475EE] cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-[#555555] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#CCCCCC] accent-[#0475EE]"
                  />
                  Lembrar-me neste dispositivo
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#777777] font-mono">
                  <KeyRound className="w-3 h-3 text-[#18A3DE]" />
                  Demo: cellbox123
                </span>
              </div>

              <MotionButton
                type="submit"
                disabled={submitting}
                data-testid="login-submit-btn"
                className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {submitting ? 'Autenticando...' : 'Entrar'}
              </MotionButton>

              {/* Clickable credential quick-fill pills */}
              <div className="pt-3 border-t border-[#EFEFEF]">
                <p className="text-[11px] font-bold uppercase text-[#888888] mb-2">
                  Preencher credenciais de teste:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Comprador', email: 'mariana@cellbox.co.mz' },
                    { label: 'Vendedor', email: 'carlos@techzone.co.mz' },
                    { label: 'Super Admin', email: 'admin@cellbox.co.mz' },
                  ].map((cred) => (
                    <button
                      key={cred.email}
                      type="button"
                      onClick={() => {
                        setLoginEmail(cred.email);
                        setLoginPassword('cellbox123');
                        setLoginError('');
                      }}
                      className="px-3 py-1 rounded-full bg-[#F1F2F4] hover:bg-[#EAF6FC] text-[11px] font-semibold text-[#0A3768] transition-colors cursor-pointer"
                    >
                      {cred.label} ({cred.email})
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h1 className="font-condensed text-[26px] font-bold uppercase text-[#0A3768]">
                  Cadastre-se na Cellbox
                </h1>
                <p className="text-xs text-[#777777] mt-1">
                  Escolha seu objetivo para criarmos sua conta real com sessão persistente.
                </p>
              </div>

              {/* Intent Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING_CARD}
                  onClick={() => setRegisterIntent('buyer')}
                  className={`p-4 rounded-[3px] border text-left transition-colors cursor-pointer ${
                    registerIntent === 'buyer'
                      ? 'border-[#18A3DE] bg-[#18A3DE]/5'
                      : 'border-[#E0E0E0] hover:border-[#CCCCCC]'
                  }`}
                >
                  <ShoppingBag
                    className={`w-5 h-5 mb-2 ${
                      registerIntent === 'buyer' ? 'text-[#18A3DE]' : 'text-[#999999]'
                    }`}
                  />
                  <p className="text-sm font-bold text-[#333333]">Quero Comprar</p>
                  <p className="text-xs text-[#777777] mt-0.5">
                    Acesso imediato à vitrine e pedidos
                  </p>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING_CARD}
                  onClick={() => setRegisterIntent('seller')}
                  className={`p-4 rounded-[3px] border text-left transition-colors cursor-pointer ${
                    registerIntent === 'seller'
                      ? 'border-[#0475EE] bg-[#0475EE]/5'
                      : 'border-[#E0E0E0] hover:border-[#CCCCCC]'
                  }`}
                >
                  <Store
                    className={`w-5 h-5 mb-2 ${
                      registerIntent === 'seller' ? 'text-[#0475EE]' : 'text-[#999999]'
                    }`}
                  />
                  <p className="text-sm font-bold text-[#333333]">Quero Vender na Cellbox</p>
                  <p className="text-xs text-[#777777] mt-0.5">
                    Crie sua loja (sujeita à aprovação)
                  </p>
                </motion.button>
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
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
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
                    placeholder="voce@empresa.co.mz"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
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
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Crie uma senha segura"
                    className="w-full h-10 pl-3 pr-10 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                  />
                  <button
                    type="button"
                    aria-label={showRegPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowRegPassword((s) => !s)}
                    className="absolute right-2.5 top-2.5 text-[#888888] hover:text-[#0475EE] cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regErrors.password && (
                  <p className="text-xs text-rose-600 mt-1">{regErrors.password}</p>
                )}
              </div>

              {registerIntent === 'seller' && (
                <div className="pt-4 border-t border-[#EAEAEA] space-y-3">
                  <p className="text-xs font-bold uppercase text-[#0475EE]">Dados da Loja Parceira</p>
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
                      placeholder="Ex: MaputoTech Eletrônicos"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
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
                        NUIT / NIF *
                      </label>
                      <input
                        id="reg-doc"
                        type="text"
                        value={documentId}
                        onChange={(e) => setDocumentId(e.target.value)}
                        placeholder="400000000"
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#0475EE]"
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

              <MotionButton
                type="submit"
                disabled={submitting}
                data-testid="register-submit-btn"
                className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Criando conta...'
                  : registerIntent === 'seller'
                    ? 'Enviar Cadastro de Vendedor'
                    : 'Criar Conta de Comprador'}
              </MotionButton>
            </form>
          )}
        </div>

        {/* Right: Quick RBAC Access Panel */}
        <aside className="lg:col-span-5 cellbox-hero-gradient text-white rounded-[3px] p-6 sm:p-7 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/85">
              Acesso Rápido de Demonstração
            </p>
            <h2 className="font-condensed text-[26px] font-bold uppercase text-white mt-0.5 leading-tight">
              Teste os 3 perfis RBAC
            </h2>
            <p className="text-xs text-white/90 mt-1.5 leading-relaxed">
              Alterne instantaneamente entre Comprador, Vendedor e Super Admin com sessão autenticada no servidor.
            </p>
          </div>

          <div className="space-y-3">
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_CARD}
              onClick={() => void switchDemoRole('buyer')}
              className="w-full text-left p-4 rounded-[3px] bg-white hover:bg-[#F7F8FA] text-[#333333] transition-colors flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <UserCheck className="w-5 h-5 text-[#18A3DE] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#222222]">Entrar como Comprador</p>
                <p className="text-xs text-[#666666] mt-0.5">
                  Mariana Costa · Vitrine, comparador, carrinho multi-vendor e pedidos
                </p>
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_CARD}
              onClick={() => void switchDemoRole('seller')}
              className="w-full text-left p-4 rounded-[3px] bg-white hover:bg-[#F7F8FA] text-[#333333] transition-colors flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <Store className="w-5 h-5 text-[#0475EE] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#222222]">Entrar como Vendedor</p>
                <p className="text-xs text-[#666666] mt-0.5">
                  TechZone Store · Analytics, catálogo, estoque e expedição de pedidos
                </p>
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_CARD}
              onClick={() => void switchDemoRole('admin')}
              className="w-full text-left p-4 rounded-[3px] bg-white hover:bg-[#F7F8FA] text-[#333333] transition-colors flex items-start gap-3.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-5 h-5 text-[#0A3768] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#222222]">Entrar como Super Admin</p>
                <p className="text-xs text-[#666666] mt-0.5">
                  Gestor Cellbox · GMV global, aprovação da GadgetHub e taxa de comissão
                </p>
              </div>
            </motion.button>
          </div>
        </aside>
      </div>
    </main>
  );
}
