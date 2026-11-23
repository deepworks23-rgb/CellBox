import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  ImageIcon,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MOZAMBIQUE_PROVINCES } from '../types';
import { evaluatePasswordStrength, validateRegistration } from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
}

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
  const { categories, login, registerUser, uploadImageAsset, navigate } = useMarketplace();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // ── Login State ────────────────────────────────────────────────────────────
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Register State ─────────────────────────────────────────────────────────
  const [profileType, setProfileType] = useState<'buyer' | 'seller'>('buyer');
  const [step, setStep] = useState<number>(1);

  // Etapa 1 Comum: Dados Pessoais e Localização
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState<string>(MOZAMBIQUE_PROVINCES[0]);
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Etapa 2 Vendedor: Dados da Loja
  const [storeName, setStoreName] = useState('');
  const [mainCategory, setMainCategory] = useState(categories[0] ?? 'Smartphones');
  const [description, setDescription] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Redes Sociais da Loja (Opcionais)
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');

  // Etapa Final: Segurança e Finalização
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Erros e Validação
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regSubmitError, setRegSubmitError] = useState('');

  useEffect(() => {
    if (!mainCategory && categories.length > 0) {
      setMainCategory(categories[0]);
    }
  }, [categories, mainCategory]);

  const strength = evaluatePasswordStrength(password);
  const totalSteps = profileType === 'buyer' ? 2 : 3;

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
    const trimmedIdentifier = loginPhone.trim();
    if (!trimmedIdentifier) {
      setLoginError('Informe o seu número de telefone para entrar.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Digite a sua senha para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login(trimmedIdentifier, loginPassword);
      if (!res.ok) {
        setLoginError(res.error ?? 'Número de telefone ou senha inválidos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Validação por Etapas ──────────────────────────────────────────────────
  const validateStep1 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Informe o seu nome completo.';
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone.trim() || phoneDigits.length < 8) {
      errors.phone = 'Informe um número de telefone válido (mínimo 8 dígitos).';
    }
    if (email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Informe um e-mail válido ou deixe o campo em branco.';
    }
    if (!province.trim()) {
      errors.province = 'Selecione a província.';
    }
    if (!city.trim() || city.trim().length < 2) {
      errors.city = 'Informe a cidade.';
    }
    if (!neighborhood.trim() || neighborhood.trim().length < 2) {
      errors.neighborhood = 'Informe o bairro.';
    }
    if (!zipCode.trim() || zipCode.trim().length < 3) {
      errors.zipCode = 'Informe o código postal.';
    }
    return errors;
  };

  const validateStep2Seller = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!storeName.trim() || storeName.trim().length < 3) {
      errors.storeName = 'Informe o nome da sua loja (mínimo 3 caracteres).';
    }
    if (!mainCategory.trim()) {
      errors.mainCategory = 'Selecione a categoria principal da loja.';
    }
    return errors;
  };

  const validateSecurityStep = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!password || password.length < 6) {
      errors.password = 'A senha deve conter no mínimo 6 caracteres.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirme a sua senha.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas digitadas não coincidem.';
    }
    if (!acceptedTerms) {
      errors.terms = 'É obrigatório concordar com os Termos de Uso e Política de Privacidade.';
    }
    return errors;
  };

  const handleNextStep = () => {
    setRegSubmitError('');
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) {
        setRegErrors(errs);
        return;
      }
      setRegErrors({});
      setStep(2);
      return;
    }

    if (step === 2 && profileType === 'seller') {
      const errs = validateStep2Seller();
      if (Object.keys(errs).length > 0) {
        setRegErrors(errs);
        return;
      }
      setRegErrors({});
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setRegErrors({});
    setRegSubmitError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se ainda não estiver na última etapa, avança
    if ((profileType === 'buyer' && step < 2) || (profileType === 'seller' && step < 3)) {
      handleNextStep();
      return;
    }

    setRegSubmitError('');

    // Validação completa antes do envio
    const step1Errs = validateStep1();
    if (Object.keys(step1Errs).length > 0) {
      setRegErrors(step1Errs);
      setStep(1);
      return;
    }

    if (profileType === 'seller') {
      const step2Errs = validateStep2Seller();
      if (Object.keys(step2Errs).length > 0) {
        setRegErrors(step2Errs);
        setStep(2);
        return;
      }
    }

    const secErrs = validateSecurityStep();
    if (Object.keys(secErrs).length > 0) {
      setRegErrors(secErrs);
      return;
    }

    setRegErrors({});
    setSubmitting(true);

    try {
      const res = await registerUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        province,
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        zipCode: zipCode.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        isSeller: profileType === 'seller',
        storeName: profileType === 'seller' ? storeName.trim() : undefined,
        mainCategory: profileType === 'seller' ? mainCategory : undefined,
        description: profileType === 'seller' && description.trim() ? description.trim() : undefined,
        storeLocation:
          profileType === 'seller' && storeLocation.trim()
            ? storeLocation.trim()
            : `${city.trim()}, ${province}`,
        logoUrl: profileType === 'seller' && logoUrl.trim() ? logoUrl.trim() : undefined,
        bannerImage: profileType === 'seller' && bannerImage.trim() ? bannerImage.trim() : undefined,
        socials:
          profileType === 'seller'
            ? {
                facebook: facebook.trim() || undefined,
                instagram: instagram.trim() || undefined,
                tiktok: tiktok.trim() || undefined,
                youtube: youtube.trim() || undefined,
              }
            : undefined,
      });

      if (!res.ok && res.error) {
        setRegSubmitError(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    const res = await uploadImageAsset(file, 'avatars');
    setUploadingAvatar(false);
    if (res.ok && res.url) {
      setAvatarUrl(res.url);
    }
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingLogo(true);
    const res = await uploadImageAsset(file, 'logos');
    setUploadingLogo(false);
    if (res.ok && res.url) {
      setLogoUrl(res.url);
    }
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingBanner(true);
    const res = await uploadImageAsset(file, 'banners');
    setUploadingBanner(false);
    if (res.ok && res.url) {
      setBannerImage(res.url);
    }
  };

  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <main className="min-h-[calc(100vh-220px)] bg-[#F7F9FC] py-10 sm:py-14 px-4">
      <div className="max-w-[560px] mx-auto">
        <div className="bg-white border border-[#E5EAF2] rounded-[4px] shadow-[0_12px_36px_rgba(10,55,104,0.06)] overflow-hidden">
          {/* Alternador Entrar / Criar Conta */}
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
              /* ── FORMULÁRIO DE LOGIN (/login) ───────────────────────────── */
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-5">
                <div>
                  <h1 className="font-condensed text-[28px] leading-tight font-bold uppercase text-[#0A3768]">
                    Acesse a sua conta
                  </h1>
                  <p className="text-xs text-[#64748B] mt-1">
                    Entre com o seu número de telefone e senha de acesso.
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
                    htmlFor="login-phone"
                    className="block text-xs font-bold text-[#334155] mb-1.5"
                  >
                    Número de Telefone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-phone"
                      type="tel"
                      autoComplete="tel"
                      value={loginPhone}
                      onChange={(e) => {
                        setLoginPhone(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="Ex: 84 123 4567 ou 86 123 4567"
                      className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15 transition-colors font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    Também pode informar o seu e-mail cadastrado caso prefira.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold text-[#334155]"
                    >
                      Senha <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      data-testid="forgot-password-link"
                      onClick={() => navigate({ type: 'forgot_password' })}
                      className="text-xs font-semibold text-[#0475EE] hover:text-[#0A3768] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
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
              /* ── FORMULÁRIO DE CADASTRO (/cadastro) ────────────────────────── */
              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="font-condensed text-[28px] leading-tight font-bold uppercase text-[#0A3768]">
                      Criar Conta
                    </h1>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0475EE]">
                      Etapa {step} de {totalSteps}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    {profileType === 'buyer'
                      ? 'Compre smartphones, laptops e tecnologia com entrega segura em Moçambique.'
                      : 'Abra a sua loja oficial na CellBox e alcance milhares de clientes.'}
                  </p>

                  {/* Barra de Progresso */}
                  <div className="mt-4" data-testid="register-step-progress">
                    <div className="h-1.5 w-full bg-[#E8EEF5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0475EE] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
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

                {/* Seletor de Tipo de Perfil (Comprador vs Vendedor) */}
                {step === 1 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                      Tipo de Perfil <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileType('buyer');
                          setStep(1);
                        }}
                        className={`p-3.5 rounded-[4px] border text-left transition-all cursor-pointer ${
                          profileType === 'buyer'
                            ? 'border-[#0475EE] bg-[#EAF6FC]/60 ring-2 ring-[#0475EE]/20'
                            : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              profileType === 'buyer'
                                ? 'bg-[#0475EE] text-white'
                                : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#0A3768]">Comprador</p>
                            <p className="text-[10px] text-[#64748B]">Quero comprar</p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileType('seller');
                          setStep(1);
                        }}
                        className={`p-3.5 rounded-[4px] border text-left transition-all cursor-pointer ${
                          profileType === 'seller'
                            ? 'border-[#0475EE] bg-[#EAF6FC]/60 ring-2 ring-[#0475EE]/20'
                            : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              profileType === 'seller'
                                ? 'bg-[#0475EE] text-white'
                                : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                          >
                            <Store className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#0A3768]">Vendedor</p>
                            <p className="text-[10px] text-[#64748B]">Quero vender</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 1 (Comum): DADOS PESSOAIS E LOCALIZAÇÃO ──────────── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="border-b border-[#EEF2F7] pb-2">
                      <h2 className="text-sm font-bold text-[#0A3768]">
                        {profileType === 'seller'
                          ? 'Etapa 1 — Dados Pessoais do Responsável'
                          : 'Etapa 1 — Dados Pessoais e Localização'}
                      </h2>
                      <p className="text-[11px] text-[#64748B]">
                        Preencha as informações obrigatórias para criar o seu acesso.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-bold text-[#334155] mb-1">
                        Nome Completo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (regErrors.name) setRegErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        placeholder="Ex: Carlos Alberto Macamo"
                        className={`w-full h-10 px-3 rounded-[3px] border text-sm text-[#0F172A] focus:outline-none transition-colors ${
                          regErrors.name
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-[#CBD5E1] focus:border-[#0475EE]'
                        }`}
                      />
                      {regErrors.name && (
                        <p className="text-[11px] text-rose-600 mt-1">{regErrors.name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-phone" className="block text-xs font-bold text-[#334155] mb-1">
                          Número de Telefone <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="reg-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (regErrors.phone) setRegErrors((prev) => ({ ...prev, phone: '' }));
                            }}
                            placeholder="84 123 4567"
                            className={`w-full h-10 pl-9 pr-3 rounded-[3px] border text-sm text-[#0F172A] font-mono focus:outline-none transition-colors ${
                              regErrors.phone
                                ? 'border-rose-400 bg-rose-50/30'
                                : 'border-[#CBD5E1] focus:border-[#0475EE]'
                            }`}
                          />
                        </div>
                        {regErrors.phone && (
                          <p className="text-[11px] text-rose-600 mt-1">{regErrors.phone}</p>
                        )}
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">
                          Identificador principal de acesso à conta.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="reg-email" className="block text-xs font-bold text-[#334155] mb-1">
                          E-mail <span className="text-xs font-normal text-[#94A3B8]">(opcional)</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="reg-email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: '' }));
                            }}
                            placeholder="seu@email.co.mz"
                            className={`w-full h-10 pl-9 pr-3 rounded-[3px] border text-sm text-[#0F172A] focus:outline-none transition-colors ${
                              regErrors.email
                                ? 'border-rose-400 bg-rose-50/30'
                                : 'border-[#CBD5E1] focus:border-[#0475EE]'
                            }`}
                          />
                        </div>
                        {regErrors.email && (
                          <p className="text-[11px] text-rose-600 mt-1">{regErrors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Endereço: Província, Cidade, Bairro, Código Postal */}
                    <div className="pt-2 border-t border-[#EEF2F7]">
                      <p className="text-xs font-bold text-[#0A3768] mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0475EE]" />
                        Endereço de Localização
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="reg-prov" className="block text-[11px] font-bold text-[#475569] mb-1">
                            Província <span className="text-rose-500">*</span>
                          </label>
                          <select
                            id="reg-prov"
                            value={province}
                            onChange={(e) => {
                              setProvince(e.target.value);
                              if (regErrors.province) setRegErrors((prev) => ({ ...prev, province: '' }));
                            }}
                            className="w-full h-10 px-2.5 rounded-[3px] border border-[#CBD5E1] bg-white text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                          >
                            {MOZAMBIQUE_PROVINCES.map((prov) => (
                              <option key={prov} value={prov}>
                                {prov}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="reg-city" className="block text-[11px] font-bold text-[#475569] mb-1">
                            Cidade <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="reg-city"
                            type="text"
                            value={city}
                            onChange={(e) => {
                              setCity(e.target.value);
                              if (regErrors.city) setRegErrors((prev) => ({ ...prev, city: '' }));
                            }}
                            placeholder="Ex: Maputo ou Matola"
                            className={`w-full h-10 px-3 rounded-[3px] border text-xs text-[#0F172A] focus:outline-none ${
                              regErrors.city ? 'border-rose-400 bg-rose-50/30' : 'border-[#CBD5E1] focus:border-[#0475EE]'
                            }`}
                          />
                          {regErrors.city && (
                            <p className="text-[11px] text-rose-600 mt-1">{regErrors.city}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label htmlFor="reg-neighborhood" className="block text-[11px] font-bold text-[#475569] mb-1">
                            Bairro <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="reg-neighborhood"
                            type="text"
                            value={neighborhood}
                            onChange={(e) => {
                              setNeighborhood(e.target.value);
                              if (regErrors.neighborhood)
                                setRegErrors((prev) => ({ ...prev, neighborhood: '' }));
                            }}
                            placeholder="Ex: Polana Cimento B"
                            className={`w-full h-10 px-3 rounded-[3px] border text-xs text-[#0F172A] focus:outline-none ${
                              regErrors.neighborhood
                                ? 'border-rose-400 bg-rose-50/30'
                                : 'border-[#CBD5E1] focus:border-[#0475EE]'
                            }`}
                          />
                          {regErrors.neighborhood && (
                            <p className="text-[11px] text-rose-600 mt-1">{regErrors.neighborhood}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="reg-zip" className="block text-[11px] font-bold text-[#475569] mb-1">
                            Código Postal <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="reg-zip"
                            type="text"
                            value={zipCode}
                            onChange={(e) => {
                              setZipCode(e.target.value);
                              if (regErrors.zipCode) setRegErrors((prev) => ({ ...prev, zipCode: '' }));
                            }}
                            placeholder="Ex: 1100"
                            className={`w-full h-10 px-3 rounded-[3px] border text-xs text-[#0F172A] font-mono focus:outline-none ${
                              regErrors.zipCode
                                ? 'border-rose-400 bg-rose-50/30'
                                : 'border-[#CBD5E1] focus:border-[#0475EE]'
                            }`}
                          />
                          {regErrors.zipCode && (
                            <p className="text-[11px] text-rose-600 mt-1">{regErrors.zipCode}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Foto de Perfil (Opcional - Apenas Vendedor) */}
                    {profileType === 'seller' && (
                      <div className="pt-2 border-t border-[#EEF2F7]">
                        <label className="block text-xs font-bold text-[#334155] mb-1">
                          Foto de Perfil do Responsável <span className="text-xs font-normal text-[#94A3B8]">(opcional)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Foto de perfil"
                              className="w-12 h-12 rounded-full object-cover border border-[#CBD5E1]"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#94A3B8]">
                              <UserIcon className="w-5 h-5" />
                            </div>
                          )}
                          <label className="h-9 px-3.5 rounded-[3px] border border-[#CBD5E1] hover:border-[#0475EE] text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 cursor-pointer bg-white transition-colors">
                            <Upload className="w-3.5 h-3.5 text-[#0475EE]" />
                            <span>{uploadingAvatar ? 'A carregar...' : 'Carregar Foto'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingAvatar}
                              onChange={handleAvatarFile}
                              className="sr-only"
                            />
                          </label>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="text-xs text-rose-600 hover:underline"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <MotionButton
                        type="button"
                        onClick={handleNextStep}
                        className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>Avançar para Etapa 2</span>
                        <ArrowRight className="w-4 h-4" />
                      </MotionButton>
                    </div>
                  </div>
                )}

                {/* ── ETAPA 2 (Vendedor): DADOS DA LOJA ────────────────────────── */}
                {step === 2 && profileType === 'seller' && (
                  <div className="space-y-4">
                    <div className="border-b border-[#EEF2F7] pb-2">
                      <h2 className="text-sm font-bold text-[#0A3768]">
                        Etapa 2 — Dados da Loja
                      </h2>
                      <p className="text-[11px] text-[#64748B]">
                        Configure as informações comerciais da sua loja.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="reg-store-name" className="block text-xs font-bold text-[#334155] mb-1">
                        Nome da Loja <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="reg-store-name"
                        type="text"
                        value={storeName}
                        onChange={(e) => {
                          setStoreName(e.target.value);
                          if (regErrors.storeName) setRegErrors((prev) => ({ ...prev, storeName: '' }));
                        }}
                        placeholder="Ex: TechZone Moçambique"
                        className={`w-full h-10 px-3 rounded-[3px] border text-sm text-[#0F172A] focus:outline-none ${
                          regErrors.storeName
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-[#CBD5E1] focus:border-[#0475EE]'
                        }`}
                      />
                      {regErrors.storeName && (
                        <p className="text-[11px] text-rose-600 mt-1">{regErrors.storeName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-store-cat" className="block text-xs font-bold text-[#334155] mb-1">
                          Categoria da Loja <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id="reg-store-cat"
                          value={mainCategory}
                          onChange={(e) => setMainCategory(e.target.value)}
                          className="w-full h-10 px-2.5 rounded-[3px] border border-[#CBD5E1] bg-white text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="reg-store-loc" className="block text-xs font-bold text-[#334155] mb-1">
                          Localização Física da Loja <span className="text-xs font-normal text-[#94A3B8]">(opcional)</span>
                        </label>
                        <input
                          id="reg-store-loc"
                          type="text"
                          value={storeLocation}
                          onChange={(e) => setStoreLocation(e.target.value)}
                          placeholder={`Ex: ${city || 'Maputo'}, Av. 24 de Julho`}
                          className="w-full h-10 px-3 rounded-[3px] border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-store-desc" className="block text-xs font-bold text-[#334155] mb-1">
                        Descrição da Loja <span className="text-xs font-normal text-[#94A3B8]">(opcional)</span>
                      </label>
                      <textarea
                        id="reg-store-desc"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva brevemente sua loja, especialidades e diferenciais..."
                        className="w-full p-2.5 rounded-[3px] border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                      />
                    </div>

                    {/* Logotipo e Capa (Opcionais) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#EEF2F7]">
                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] mb-1">
                          Logotipo da Loja <span className="font-normal text-[#94A3B8]">(opcional)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="Logo"
                              className="w-10 h-10 rounded-[3px] object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-[3px] bg-slate-100 border flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <label className="h-8 px-2.5 rounded-[3px] border border-[#CBD5E1] text-[11px] font-semibold text-[#475569] inline-flex items-center gap-1 cursor-pointer bg-white">
                            <Upload className="w-3 h-3 text-[#0475EE]" />
                            <span>{uploadingLogo ? 'Carregando...' : 'Upload Logo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingLogo}
                              onChange={handleLogoFile}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] mb-1">
                          Capa / Banner da Loja <span className="font-normal text-[#94A3B8]">(opcional)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {bannerImage ? (
                            <img
                              src={bannerImage}
                              alt="Banner"
                              className="w-16 h-10 rounded-[3px] object-cover border"
                            />
                          ) : (
                            <div className="w-16 h-10 rounded-[3px] bg-slate-100 border flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <label className="h-8 px-2.5 rounded-[3px] border border-[#CBD5E1] text-[11px] font-semibold text-[#475569] inline-flex items-center gap-1 cursor-pointer bg-white">
                            <Upload className="w-3 h-3 text-[#0475EE]" />
                            <span>{uploadingBanner ? 'Carregando...' : 'Upload Capa'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingBanner}
                              onChange={handleBannerFile}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Redes Sociais da Loja (Todas Opcionais) */}
                    <div className="pt-2 border-t border-[#EEF2F7]">
                      <p className="text-xs font-bold text-[#0A3768] mb-2 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#0475EE]" />
                        Redes Sociais da Loja <span className="font-normal text-xs text-[#94A3B8]">(todas opcionais)</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          placeholder="Facebook (ex: facebook.com/loja)"
                          className="h-9 px-3 rounded-[3px] border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                        />
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="Instagram (ex: @loja)"
                          className="h-9 px-3 rounded-[3px] border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                        />
                        <input
                          type="text"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          placeholder="TikTok (ex: @loja)"
                          className="h-9 px-3 rounded-[3px] border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                        />
                        <input
                          type="text"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          placeholder="YouTube (ex: @canal)"
                          className="h-9 px-3 rounded-[3px] border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0475EE]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="h-11 px-5 rounded-full border border-[#CBD5E1] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar</span>
                      </button>
                      <MotionButton
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1 h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>Avançar para Etapa 3</span>
                        <ArrowRight className="w-4 h-4" />
                      </MotionButton>
                    </div>
                  </div>
                )}

                {/* ── ETAPA FINAL: SEGURANÇA E FINALIZAÇÃO ────────────────────── */}
                {((profileType === 'buyer' && step === 2) || (profileType === 'seller' && step === 3)) && (
                  <div className="space-y-4">
                    <div className="border-b border-[#EEF2F7] pb-2">
                      <h2 className="text-sm font-bold text-[#0A3768]">
                        {profileType === 'buyer' ? 'Etapa 2 — Segurança e Finalização' : 'Etapa 3 — Segurança e Finalização'}
                      </h2>
                      <p className="text-[11px] text-[#64748B]">
                        Defina uma senha segura para proteger o seu acesso à CellBox.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="reg-pwd" className="block text-xs font-bold text-[#334155] mb-1">
                        Senha <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-pwd"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (regErrors.password) setRegErrors((prev) => ({ ...prev, password: '' }));
                          }}
                          placeholder="Mínimo de 6 caracteres"
                          className={`w-full h-10 pl-9 pr-10 rounded-[3px] border text-sm text-[#0F172A] focus:outline-none ${
                            regErrors.password
                              ? 'border-rose-400 bg-rose-50/30'
                              : 'border-[#CBD5E1] focus:border-[#0475EE]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0475EE]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regErrors.password && (
                        <p className="text-[11px] text-rose-600 mt-1">{regErrors.password}</p>
                      )}

                      {/* Medidor de Força */}
                      {password.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="grid grid-cols-4 gap-1.5 h-1">
                            {[1, 2, 3, 4].map((lvl) => (
                              <div
                                key={lvl}
                                className={`h-full rounded-full transition-colors ${
                                  strength.score >= lvl ? STRENGTH_BAR_COLORS[lvl] : 'bg-[#E5E7EB]'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-[11px] font-semibold ${STRENGTH_TEXT_COLORS[strength.score]}`}>
                            Força da senha: {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reg-confirm-pwd" className="block text-xs font-bold text-[#334155] mb-1">
                        Confirmar Senha <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-confirm-pwd"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (regErrors.confirmPassword)
                              setRegErrors((prev) => ({ ...prev, confirmPassword: '' }));
                          }}
                          placeholder="Repita a senha digitada"
                          className={`w-full h-10 pl-9 pr-10 rounded-[3px] border text-sm text-[#0F172A] focus:outline-none ${
                            regErrors.confirmPassword
                              ? 'border-rose-400 bg-rose-50/30'
                              : 'border-[#CBD5E1] focus:border-[#0475EE]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0475EE]"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regErrors.confirmPassword && (
                        <p className="text-[11px] text-rose-600 mt-1">{regErrors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Informação sobre Ativação de Vendedor */}
                    {profileType === 'seller' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-[3px] text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-amber-950">
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          Regras de Ativação da Loja
                        </p>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          Ao concluir o cadastro, a sua loja será criada com estado <strong>Pendente</strong>. Para torná-la visível na página pública <code>/lojas</code> e exibir seus produtos, deverá concluir a Verificação KYC e o pagamento da taxa de inscrição de 100 MZN no Painel do Vendedor.
                        </p>
                      </div>
                    )}

                    {/* Termos de Uso */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 text-xs text-[#475569] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => {
                            setAcceptedTerms(e.target.checked);
                            if (regErrors.terms) setRegErrors((prev) => ({ ...prev, terms: '' }));
                          }}
                          className="w-4 h-4 rounded border-[#CBD5E1] accent-[#0475EE] mt-0.5"
                        />
                        <span>
                          Concordo com os{' '}
                          <a href="#termos" className="text-[#0475EE] font-semibold hover:underline">
                            Termos de Uso
                          </a>{' '}
                          e a{' '}
                          <a href="#privacidade" className="text-[#0475EE] font-semibold hover:underline">
                            Política de Privacidade
                          </a>{' '}
                          da CellBox <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      {regErrors.terms && (
                        <p className="text-[11px] text-rose-600 mt-1">{regErrors.terms}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="h-11 px-5 rounded-full border border-[#CBD5E1] hover:bg-[#F1F5F9] text-xs font-bold text-[#475569] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar</span>
                      </button>
                      <MotionButton
                        type="submit"
                        disabled={submitting}
                        className="flex-1 h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        {submitting ? (
                          'A criar conta...'
                        ) : profileType === 'seller' ? (
                          <>
                            <span>Cadastrar Loja</span>
                            <Store className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Criar Conta de Comprador</span>
                            <Check className="w-4 h-4" />
                          </>
                        )}
                      </MotionButton>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#EEF2F7] text-center">
                  <p className="text-xs text-[#64748B]">
                    Já possui conta na CellBox?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#0475EE] hover:text-[#0A3768] hover:underline cursor-pointer"
                    >
                      Fazer login
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
