import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, ShoppingBag, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { validateRegistration } from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
}

export function AuthView({ initialMode = 'login' }: AuthViewProps) {
  const { categories, login, registerUser } = useMarketplace();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Login state (clean empty fields, zero demo shortcuts or hints)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
      setLoginError('Preencha e-mail e senha para entrar.');
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
    <main className="max-w-[480px] mx-auto px-4 py-10 pb-16">
      <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 sm:p-8 shadow-2xs">
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
            Entrar
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
            Criar Conta
          </MotionButton>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <h1 className="font-condensed text-[26px] font-bold uppercase text-[#0A3768]">
              Entrar
            </h1>

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
                placeholder="seu@email.co.mz"
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
                  placeholder="Digite sua senha"
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

            <label className="inline-flex items-center gap-2 text-xs text-[#555555] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#CCCCCC] accent-[#0475EE]"
              />
              Lembrar-me
            </label>

            <MotionButton
              type="submit"
              disabled={submitting}
              data-testid="login-submit-btn"
              className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </MotionButton>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <h1 className="font-condensed text-[26px] font-bold uppercase text-[#0A3768]">
              Criar Conta
            </h1>

            {/* Account Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRegisterIntent('buyer')}
                className={`p-3.5 rounded-[3px] border text-left transition-colors cursor-pointer ${
                  registerIntent === 'buyer'
                    ? 'border-[#0475EE] bg-[#0475EE]/5'
                    : 'border-[#E0E0E0] hover:border-[#CCCCCC]'
                }`}
              >
                <ShoppingBag
                  className={`w-4 h-4 mb-1.5 ${
                    registerIntent === 'buyer' ? 'text-[#0475EE]' : 'text-[#999999]'
                  }`}
                />
                <p className="text-xs font-bold text-[#333333]">Quero Comprar</p>
              </button>
              <button
                type="button"
                onClick={() => setRegisterIntent('seller')}
                className={`p-3.5 rounded-[3px] border text-left transition-colors cursor-pointer ${
                  registerIntent === 'seller'
                    ? 'border-[#0475EE] bg-[#0475EE]/5'
                    : 'border-[#E0E0E0] hover:border-[#CCCCCC]'
                }`}
              >
                <Store
                  className={`w-4 h-4 mb-1.5 ${
                    registerIntent === 'seller' ? 'text-[#0475EE]' : 'text-[#999999]'
                  }`}
                />
                <p className="text-xs font-bold text-[#333333]">Quero Vender</p>
              </button>
            </div>

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
              {regErrors.name && <p className="text-xs text-rose-600 mt-1">{regErrors.name}</p>}
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
                placeholder="seu@email.co.mz"
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
              {regErrors.email && <p className="text-xs text-rose-600 mt-1">{regErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-[#444444] mb-1">
                Senha *
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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
              <div className="pt-3 border-t border-[#EAEAEA] space-y-3">
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
                    placeholder="Nome da sua loja"
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
              </div>
            )}

            <MotionButton
              type="submit"
              disabled={submitting}
              data-testid="register-submit-btn"
              className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {submitting ? 'Criando conta...' : 'Criar Conta'}
            </MotionButton>
          </form>
        )}
      </div>
    </main>
  );
}
