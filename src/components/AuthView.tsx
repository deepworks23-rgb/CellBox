import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  User as UserIcon,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { evaluatePasswordStrength, validateRegistration } from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
}

type RegisterStep = 1 | 2 | 3;

const STRENGTH_BAR_COLORS: Record<number, string> = {
  0: 'bg-[#E5E7EB]',
  1: 'bg-rose-500',
  2: 'bg-amber-500',
  3: 'bg-[#0475EE]',
  4: 'bg-emerald-500',
};

const STRENGTH_TEXT_COLORS: Record<number, string> = {
  0: 'text-[#888888]',
  1: 'text-rose-600',
  2: 'text-amber-600',
  3: 'text-[#0475EE]',
  4: 'text-emerald-600',
};

export function AuthView({ initialMode = 'login' }: AuthViewProps) {
  const { categories, login, registerUser, navigate } = useMarketplace();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Login state (clean empty fields, zero demo buttons or hints)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Multi-step Register state
  const [step, setStep] = useState<RegisterStep>(1);
  const [registerIntent, setRegisterIntent] = useState<'buyer' | 'seller'>('buyer');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [mainCategory, setMainCategory] = useState(categories[0] ?? 'Smartphones');

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regSubmitError, setRegSubmitError] = useState('');

  useEffect(() => {
    if (!mainCategory && categories.length > 0) {
      setMainCategory(categories[0]);
    }
  }, [categories, mainCategory]);

  const strength = evaluatePasswordStrength(regPassword);
  const passwordsMatch = regConfirmPassword.length > 0 && regPassword === regConfirmPassword;

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setLoginError('');
    setRegErrors({});
    setRegSubmitError('');
    navigate({ type: 'auth', mode: nextMode });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLoginError('Informe um endereço de e-mail válido.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Digite a sua senha para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login(trimmedEmail, loginPassword);
      if (!res.ok) {
        setLoginError(res.error ?? 'E-mail ou senha incorretos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep1 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errors.email = 'Informe um endereço de e-mail válido.';
    }
    if (!regPassword || regPassword.length < 6) {
      errors.password = 'A senha deve conter no mínimo 6 caracteres.';
    }
    if (!regConfirmPassword) {
      errors.confirmPassword = 'Confirme a sua senha.';
    } else if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem.';
    }
    return errors;
  };

  const validateStep2 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!regName.trim() || regName.trim().length < 2) {
      errors.name = 'Informe o seu nome completo.';
    }
    const phoneDigits = regPhone.replace(/\D/g, '');
    if (!regPhone.trim() || phoneDigits.length < 7) {
      errors.phone = 'Informe um número de telefone ou WhatsApp válido.';
    }
    if (registerIntent === 'seller') {
      if (!storeName.trim() || storeName.trim().length < 3) {
        errors.storeName = 'Informe o nome da sua loja (mínimo 3 caracteres).';
      }
      if (!mainCategory.trim()) {
        errors.mainCategory = 'Selecione a categoria principal da loja.';
      }
      if (documentId.trim().length > 0 && documentId.trim().length < 8) {
        errors.documentId = 'Informe um NUIT / NIF válido (mínimo 8 dígitos) ou deixe em branco.';
      }
    }
    return errors;
  };

  const handleNextStep = () => {
    setRegSubmitError('');
    if (step === 1) {
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) {
        setRegErrors(errors);
        return;
      }
      setRegErrors({});
      setStep(2);
      return;
    }

    if (step === 2) {
      const errors = validateStep2();
      if (Object.keys(errors).length > 0) {
        setRegErrors(errors);
        return;
      }
      setRegErrors({});
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setRegErrors({});
    setRegSubmitError('');
    setStep((prev) => (prev === 3 ? 2 : 1));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) {
      handleNextStep();
      return;
    }

    setRegSubmitError('');
    if (!acceptedTerms) {
      setRegErrors({ terms: 'É necessário aceitar os Termos de Uso para concluir o cadastro.' });
      return;
    }

    const step1Errors = validateStep1();
    if (Object.keys(step1Errors).length > 0) {
      setRegErrors(step1Errors);
      setStep(1);
      return;
    }

    const step2Errors = validateStep2();
    if (Object.keys(step2Errors).length > 0) {
      setRegErrors(step2Errors);
      setStep(2);
      return;
    }

    const fullValidation = validateRegistration({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      isSeller: registerIntent === 'seller',
      storeName,
      documentId: documentId.trim() || undefined,
      mainCategory,
    });
    if (Object.keys(fullValidation).length > 0) {
      setRegErrors(fullValidation);
      setStep(fullValidation.email || fullValidation.password ? 1 : 2);
      return;
    }

    setRegErrors({});
    setSubmitting(true);
    try {
      const res = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        isSeller: registerIntent === 'seller',
        storeName: registerIntent === 'seller' ? storeName.trim() : undefined,
        documentId: registerIntent === 'seller' && documentId.trim() ? documentId.trim() : undefined,
        mainCategory: registerIntent === 'seller' ? mainCategory : undefined,
      });
      if (!res.ok && res.error) {
        if (res.error.toLowerCase().includes('e-mail')) {
          setRegErrors({ email: res.error });
          setStep(1);
        } else {
          setRegSubmitError(res.error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta = [
    { id: 1 as const, label: 'Conta' },
    { id: 2 as const, label: registerIntent === 'seller' ? 'Perfil e Loja' : 'Dados Pessoais' },
    { id: 3 as const, label: 'Confirmação' },
  ];

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <main className="min-h-[calc(100vh-220px)] bg-[#F7F9FC] py-10 sm:py-14 px-4">
      <div className="max-w-[520px] mx-auto">
        <div className="bg-white border border-[#E5EAF2] rounded-[4px] shadow-[0_12px_36px_rgba(10,55,104,0.06)] overflow-hidden">
          {/* Top Brand Strip */}
          <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#EEF2F7] bg-white">
            <div className="grid grid-cols-2 p-1 bg-[#F1F4F9] rounded-full">
              <MotionButton
                type="button"
                hoverScale={1.01}
                hoverY={0}
                data-testid="auth-tab-login"
                onClick={() => switchMode('login')}
                className={`h-10 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#0475EE] text-white shadow-xs'
                    : 'text-[#5A6779] hover:text-[#0A3768]'
                }`}
              >
                Entrar
              </MotionButton>
              <MotionButton
                type="button"
                hoverScale={1.01}
                hoverY={0}
                data-testid="auth-tab-register"
                onClick={() => switchMode('register')}
                className={`h-10 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#0475EE] text-white shadow-xs'
                    : 'text-[#5A6779] hover:text-[#0A3768]'
                }`}
              >
                Criar Conta
              </MotionButton>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-5">
                <div>
                  <h1 className="font-condensed text-[28px] leading-tight font-bold uppercase text-[#0A3768]">
                    Acesse a sua conta
                  </h1>
                  <p className="text-xs text-[#64748B] mt-1">
                    Introduza as suas credenciais para continuar na Cellbox.
                  </p>
                </div>

                {loginError && (
                  <div
                    role="alert"
                    data-testid="login-error-alert"
                    className="flex items-start gap-2.5 p-3.5 rounded-[3px] bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-[#334155] mb-1.5"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="seu@email.co.mz"
                      className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold text-[#334155]"
                    >
                      Senha
                    </label>
                    <button
                      type="button"
                      data-testid="forgot-password-link"
                      onClick={() => navigate({ type: 'forgot_password' })}
                      className="text-xs font-semibold text-[#0475EE] hover:text-[#0A3768] hover:underline cursor-pointer"
                    >
                      Esqueci a minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="Digite a sua senha"
                      className="w-full h-11 pl-10 pr-11 rounded-[3px] border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15 transition-colors"
                    />
                    <button
                      type="button"
                      aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowLoginPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0475EE] cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="inline-flex items-center gap-2 text-xs text-[#475569] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#CBD5E1] accent-[#0475EE]"
                    />
                    Manter sessão iniciada
                  </label>
                </div>

                <MotionButton
                  type="submit"
                  disabled={submitting}
                  data-testid="login-submit-btn"
                  className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {submitting ? 'A autenticar...' : 'Entrar na Conta'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </MotionButton>

                <div className="pt-4 border-t border-[#EEF2F7] text-center">
                  <p className="text-xs text-[#64748B]">
                    Ainda não tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#0475EE] hover:text-[#0A3768] hover:underline cursor-pointer"
                    >
                      Criar conta agora
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="font-condensed text-[28px] leading-tight font-bold uppercase text-[#0A3768]">
                      Criar Conta
                    </h1>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0475EE]">
                      Etapa {step} de 3
                    </span>
                  </div>

                  {/* Multi-Step Progress Bar & Step Indicators */}
                  <div className="mt-4" data-testid="register-step-progress">
                    <div className="h-1.5 w-full bg-[#E8EEF5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0475EE] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {stepsMeta.map((item) => {
                        const completed = step > item.id;
                        const active = step === item.id;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-1.5 min-w-0"
                          >
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border transition-colors ${
                                completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : active
                                    ? 'bg-[#0475EE] border-[#0475EE] text-white'
                                    : 'bg-white border-[#CBD5E1] text-[#64748B]'
                              }`}
                            >
                              {completed ? <Check className="w-3 h-3" /> : item.id}
                            </span>
                            <span
                              className={`text-[11px] font-semibold truncate ${
                                active
                                  ? 'text-[#0A3768]'
                                  : completed
                                    ? 'text-emerald-700'
                                    : 'text-[#94A3B8]'
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {regSubmitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 rounded-[3px] bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{regSubmitError}</span>
                  </div>
                )}

                {/* STEP 1 — Account Type & Credentials */}
                {step === 1 && (
                  <div className="space-y-4" data-testid="register-step-1">
                    <div>
                      <span className="block text-xs font-bold text-[#334155] mb-2">
                        Tipo de Conta *
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          data-testid="role-select-buyer"
                          onClick={() => setRegisterIntent('buyer')}
                          className={`p-3.5 rounded-[3px] border text-left transition-colors cursor-pointer ${
                            registerIntent === 'buyer'
                              ? 'border-[#0475EE] bg-[#0475EE]/5 ring-1 ring-[#0475EE]'
                              : 'border-[#DCE3EC] hover:border-[#94A3B8]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <ShoppingBag
                              className={`w-4 h-4 ${
                                registerIntent === 'buyer' ? 'text-[#0475EE]' : 'text-[#94A3B8]'
                              }`}
                            />
                            {registerIntent === 'buyer' && (
                              <span className="w-4 h-4 rounded-full bg-[#0475EE] text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#0A3768]">Comprador</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            Comprar produtos e acompanhar pedidos
                          </p>
                        </button>

                        <button
                          type="button"
                          data-testid="role-select-seller"
                          onClick={() => setRegisterIntent('seller')}
                          className={`p-3.5 rounded-[3px] border text-left transition-colors cursor-pointer ${
                            registerIntent === 'seller'
                              ? 'border-[#0475EE] bg-[#0475EE]/5 ring-1 ring-[#0475EE]'
                              : 'border-[#DCE3EC] hover:border-[#94A3B8]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Store
                              className={`w-4 h-4 ${
                                registerIntent === 'seller' ? 'text-[#0475EE]' : 'text-[#94A3B8]'
                              }`}
                            />
                            {registerIntent === 'seller' && (
                              <span className="w-4 h-4 rounded-full bg-[#0475EE] text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#0A3768]">Vendedor</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            Abrir loja e publicar catálogo
                          </p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-email"
                        className="block text-xs font-bold text-[#334155] mb-1.5"
                      >
                        E-mail *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-email"
                          type="email"
                          autoComplete="email"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          placeholder="seu@email.co.mz"
                          className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                        />
                      </div>
                      {regErrors.email && (
                        <p className="text-xs text-rose-600 mt-1">{regErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-xs font-bold text-[#334155] mb-1.5"
                      >
                        Senha *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-password"
                          type={showRegPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            if (regErrors.password) {
                              setRegErrors((prev) => ({ ...prev, password: '' }));
                            }
                          }}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full h-11 pl-10 pr-11 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                        />
                        <button
                          type="button"
                          aria-label={showRegPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          onClick={() => setShowRegPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0475EE] cursor-pointer"
                        >
                          {showRegPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      <div className="mt-2" data-testid="password-strength-meter">
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((segment) => (
                            <div
                              key={segment}
                              className={`h-1.5 rounded-full transition-colors ${
                                strength.score >= segment
                                  ? STRENGTH_BAR_COLORS[strength.score]
                                  : 'bg-[#E5E7EB]'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-[#64748B]">Força da senha</span>
                          <span
                            className={`text-[11px] font-bold ${STRENGTH_TEXT_COLORS[strength.score]}`}
                          >
                            {strength.label}
                          </span>
                        </div>
                      </div>

                      {regErrors.password && (
                        <p className="text-xs text-rose-600 mt-1">{regErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="reg-confirm-password"
                        className="block text-xs font-bold text-[#334155] mb-1.5"
                      >
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={regConfirmPassword}
                          onChange={(e) => {
                            setRegConfirmPassword(e.target.value);
                            if (regErrors.confirmPassword) {
                              setRegErrors((prev) => ({ ...prev, confirmPassword: '' }));
                            }
                          }}
                          placeholder="Repita a senha"
                          className="w-full h-11 pl-10 pr-11 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                        />
                        <button
                          type="button"
                          aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0475EE] cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordsMatch && !regErrors.confirmPassword && (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          As senhas coincidem
                        </p>
                      )}
                      {regErrors.confirmPassword && (
                        <p className="text-xs text-rose-600 mt-1">{regErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2 — Personal Profile & Seller Store Details */}
                {step === 2 && (
                  <div className="space-y-4" data-testid="register-step-2">
                    <div>
                      <label
                        htmlFor="reg-name"
                        className="block text-xs font-bold text-[#334155] mb-1.5"
                      >
                        Nome completo *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-name"
                          type="text"
                          autoComplete="name"
                          value={regName}
                          onChange={(e) => {
                            setRegName(e.target.value);
                            if (regErrors.name) setRegErrors((prev) => ({ ...prev, name: '' }));
                          }}
                          placeholder="Ex: Carlos Matusse"
                          className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                        />
                      </div>
                      {regErrors.name && (
                        <p className="text-xs text-rose-600 mt-1">{regErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="reg-phone"
                        className="block text-xs font-bold text-[#334155] mb-1.5"
                      >
                        Telefone / WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-phone"
                          type="tel"
                          autoComplete="tel"
                          value={regPhone}
                          onChange={(e) => {
                            setRegPhone(e.target.value);
                            if (regErrors.phone) setRegErrors((prev) => ({ ...prev, phone: '' }));
                          }}
                          placeholder="+258 84 000 0000"
                          className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                        />
                      </div>
                      {regErrors.phone && (
                        <p className="text-xs text-rose-600 mt-1">{regErrors.phone}</p>
                      )}
                    </div>

                    {registerIntent === 'seller' && (
                      <div className="pt-4 border-t border-[#EEF2F7] space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A3768]">
                          <Store className="w-4 h-4 text-[#0475EE]" />
                          Dados da Loja
                        </div>

                        <div>
                          <label
                            htmlFor="reg-store-name"
                            className="block text-xs font-bold text-[#334155] mb-1.5"
                          >
                            Nome da Loja *
                          </label>
                          <div className="relative">
                            <Store className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="reg-store-name"
                              type="text"
                              value={storeName}
                              onChange={(e) => {
                                setStoreName(e.target.value);
                                if (regErrors.storeName) {
                                  setRegErrors((prev) => ({ ...prev, storeName: '' }));
                                }
                              }}
                              placeholder="Ex: Maputo Tech Store"
                              className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                            />
                          </div>
                          {regErrors.storeName && (
                            <p className="text-xs text-rose-600 mt-1">{regErrors.storeName}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="reg-cat"
                              className="block text-xs font-bold text-[#334155] mb-1.5"
                            >
                              Categoria Principal *
                            </label>
                            <div className="relative">
                              <Tag className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <select
                                id="reg-cat"
                                value={mainCategory}
                                onChange={(e) => setMainCategory(e.target.value)}
                                className="w-full h-11 pl-10 pr-3 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] bg-white focus:outline-none focus:border-[#0475EE]"
                              >
                                {(categories.length > 0
                                  ? categories
                                  : ['Smartphones', 'Laptops', 'Áudio', 'Gaming', 'Acessórios']
                                ).map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {regErrors.mainCategory && (
                              <p className="text-xs text-rose-600 mt-1">{regErrors.mainCategory}</p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="reg-doc"
                              className="block text-xs font-bold text-[#334155] mb-1.5"
                            >
                              NUIT / NIF (opcional)
                            </label>
                            <div className="relative">
                              <FileText className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                id="reg-doc"
                                type="text"
                                value={documentId}
                                onChange={(e) => {
                                  setDocumentId(e.target.value);
                                  if (regErrors.documentId) {
                                    setRegErrors((prev) => ({ ...prev, documentId: '' }));
                                  }
                                }}
                                placeholder="400000000"
                                className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] text-sm font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE]"
                              />
                            </div>
                            {regErrors.documentId && (
                              <p className="text-xs text-rose-600 mt-1">{regErrors.documentId}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3 — Confirmation & Terms */}
                {step === 3 && (
                  <div className="space-y-4" data-testid="register-step-3">
                    <div className="rounded-[3px] border border-[#E2E8F0] bg-[#F8FAFC] divide-y divide-[#E2E8F0]">
                      <div className="p-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                            Conta e Acesso
                          </p>
                          <p className="text-sm font-bold text-[#0A3768] mt-0.5">
                            {registerIntent === 'seller' ? 'Conta de Vendedor' : 'Conta de Comprador'}
                          </p>
                          <p className="text-xs text-[#475569] mt-0.5">{regEmail.trim()}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs font-semibold text-[#0475EE] hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>

                      <div className="p-3.5 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                            Dados Pessoais{registerIntent === 'seller' ? ' e Loja' : ''}
                          </p>
                          <p className="text-sm font-bold text-[#0F172A]">{regName.trim()}</p>
                          <p className="text-xs text-[#475569]">{regPhone.trim()}</p>
                          {registerIntent === 'seller' && (
                            <div className="pt-1.5 text-xs text-[#334155] space-y-0.5">
                              <p>
                                <span className="font-semibold">Loja:</span> {storeName.trim()}
                              </p>
                              <p>
                                <span className="font-semibold">Categoria:</span> {mainCategory}
                              </p>
                              {documentId.trim() && (
                                <p>
                                  <span className="font-semibold">NUIT / NIF:</span>{' '}
                                  <span className="font-mono">{documentId.trim()}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-xs font-semibold text-[#0475EE] hover:underline cursor-pointer shrink-0"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-3.5 rounded-[3px] border border-[#E2E8F0] bg-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        data-testid="register-terms-checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => {
                          setAcceptedTerms(e.target.checked);
                          if (regErrors.terms) setRegErrors((prev) => ({ ...prev, terms: '' }));
                        }}
                        className="w-4 h-4 mt-0.5 rounded border-[#CBD5E1] accent-[#0475EE] shrink-0"
                      />
                      <span className="text-xs text-[#475569] leading-relaxed">
                        Li e concordo com os{' '}
                        <strong className="text-[#0A3768]">Termos de Uso</strong> e a{' '}
                        <strong className="text-[#0A3768]">Política de Privacidade</strong> da
                        Cellbox Moçambique.
                      </span>
                    </label>
                    {regErrors.terms && (
                      <p className="text-xs text-rose-600 -mt-2">{regErrors.terms}</p>
                    )}
                  </div>
                )}

                {/* Navigation Controls */}
                <div className="flex items-center gap-3 pt-2">
                  {step > 1 && (
                    <button
                      type="button"
                      data-testid="register-back-btn"
                      onClick={handlePrevStep}
                      className="h-11 px-5 rounded-full border border-[#CBD5E1] hover:border-[#0A3768] text-[#334155] hover:text-[#0A3768] text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                  )}

                  {step < 3 ? (
                    <MotionButton
                      type="button"
                      data-testid="register-next-btn"
                      onClick={handleNextStep}
                      className="flex-1 h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </MotionButton>
                  ) : (
                    <MotionButton
                      type="submit"
                      disabled={submitting}
                      data-testid="register-submit-btn"
                      className="flex-1 h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {submitting ? 'A concluir cadastro...' : 'Concluir Cadastro'}
                    </MotionButton>
                  )}
                </div>

                <div className="pt-4 border-t border-[#EEF2F7] text-center">
                  <p className="text-xs text-[#64748B]">
                    Já tem conta na Cellbox?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#0475EE] hover:text-[#0A3768] hover:underline cursor-pointer"
                    >
                      Iniciar sessão
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
