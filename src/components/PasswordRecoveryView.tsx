import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { evaluatePasswordStrength } from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';

interface PasswordRecoveryViewProps {
  mode: 'forgot' | 'reset';
  token?: string;
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

export function PasswordRecoveryView({ mode, token }: PasswordRecoveryViewProps) {
  const { navigate, requestPasswordReset, verifyResetToken, confirmPasswordReset } =
    useMarketplace();

  // Forgot password state
  const [email, setEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  // Reset password state
  const [verifying, setVerifying] = useState(mode === 'reset');
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [emailMasked, setEmailMasked] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetCompleted, setResetCompleted] = useState(false);

  const strength = evaluatePasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    if (mode !== 'reset') return;
    let active = true;

    if (!token || token.trim().length < 32) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('Link de redefinição ausente ou inválido. Solicite uma nova recuperação.');
      return;
    }

    setVerifying(true);
    setTokenError('');
    (async () => {
      const result = await verifyResetToken(token);
      if (!active) return;
      if (result.valid) {
        setTokenValid(true);
        setEmailMasked(result.emailMasked ?? '');
      } else {
        setTokenValid(false);
        setTokenError(
          result.error ?? 'Este link de recuperação é inválido, expirou ou já foi utilizado.'
        );
      }
      setVerifying(false);
    })();

    return () => {
      active = false;
    };
  }, [mode, token, verifyResetToken]);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setForgotError('Informe um endereço de e-mail válido.');
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await requestPasswordReset(trimmed);
      if (!res.ok) {
        setForgotError(res.error ?? 'Não foi possível enviar o link de recuperação.');
      } else {
        setForgotSuccessMessage(
          res.message ??
            'Enviámos um link de redefinição de senha para o seu e-mail. Verifique a caixa de entrada.'
        );
      }
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!token) {
      setResetError('Token de recuperação ausente.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('As senhas não coincidem.');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await confirmPasswordReset(token, newPassword, confirmPassword);
      if (!res.ok) {
        setResetError(res.error ?? 'Não foi possível redefinir a senha.');
      } else {
        setResetCompleted(true);
      }
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-220px)] bg-[#F7F9FC] py-10 sm:py-14 px-4">
      <div className="max-w-[480px] mx-auto">
        <div className="bg-white border border-[#E5EAF2] rounded-[4px] shadow-[0_12px_36px_rgba(10,55,104,0.06)] p-6 sm:p-8">
          <button
            type="button"
            onClick={() => navigate({ type: 'auth', mode: 'login' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0475EE] mb-5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Login
          </button>

          {mode === 'forgot' ? (
            forgotSuccessMessage ? (
              <div className="space-y-4" data-testid="forgot-password-success">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h1 className="font-condensed text-[26px] leading-tight font-bold uppercase text-[#0A3768]">
                  E-mail Enviado
                </h1>
                <p className="text-sm text-[#475569] leading-relaxed">{forgotSuccessMessage}</p>
                <div className="p-3 rounded-[3px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569]">
                  Conta solicitada: <strong className="text-[#0A3768]">{email.trim()}</strong>
                </div>
                <MotionButton
                  type="button"
                  onClick={() => navigate({ type: 'auth', mode: 'login' })}
                  className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Voltar para Entrar
                </MotionButton>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} noValidate className="space-y-5">
                <div>
                  <div className="w-11 h-11 rounded-full bg-[#0475EE]/10 text-[#0475EE] flex items-center justify-center mb-3">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h1 className="font-condensed text-[28px] leading-tight font-bold uppercase text-[#0A3768]">
                    Recuperar Senha
                  </h1>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Informe o e-mail da sua conta registada. Enviaremos um link seguro para definir
                    uma nova senha.
                  </p>
                </div>

                {forgotError && (
                  <div
                    role="alert"
                    data-testid="forgot-password-error"
                    className="flex items-start gap-2.5 p-3.5 rounded-[3px] bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-bold text-[#334155] mb-1.5"
                  >
                    E-mail registado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      placeholder="seu@email.co.mz"
                      className="w-full h-11 pl-10 pr-3.5 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                    />
                  </div>
                </div>

                <MotionButton
                  type="submit"
                  disabled={forgotSubmitting}
                  data-testid="forgot-password-submit"
                  className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {forgotSubmitting ? 'A enviar link...' : 'Enviar Link de Recuperação'}
                </MotionButton>
              </form>
            )
          ) : verifying ? (
            <div className="py-10 text-center space-y-3" data-testid="reset-password-verifying">
              <Loader2 className="w-7 h-7 animate-spin text-[#0475EE] mx-auto" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0A3768]">
                A validar link de recuperação...
              </p>
            </div>
          ) : resetCompleted ? (
            <div className="space-y-4" data-testid="reset-password-success">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="font-condensed text-[26px] leading-tight font-bold uppercase text-[#0A3768]">
                Senha Atualizada
              </h1>
              <p className="text-sm text-[#475569] leading-relaxed">
                A sua nova senha foi guardada com segurança e este link de recuperação foi
                invalidado. Já pode iniciar sessão.
              </p>
              <MotionButton
                type="button"
                data-testid="reset-go-login-btn"
                onClick={() => navigate({ type: 'auth', mode: 'login' })}
                className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Ir para o Login
              </MotionButton>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-4" data-testid="reset-password-invalid">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="font-condensed text-[26px] leading-tight font-bold uppercase text-[#0A3768]">
                Link Inválido ou Expirado
              </h1>
              <p className="text-sm text-[#475569] leading-relaxed">{tokenError}</p>
              <MotionButton
                type="button"
                onClick={() => navigate({ type: 'forgot_password' })}
                className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Solicitar Novo Link
              </MotionButton>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} noValidate className="space-y-5">
              <div>
                <div className="w-11 h-11 rounded-full bg-[#0475EE]/10 text-[#0475EE] flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="font-condensed text-[28px] leading-tight font-bold uppercase text-[#0A3768]">
                  Redefinir Senha
                </h1>
                <p className="text-xs text-[#64748B] mt-1">
                  Defina uma nova senha para a conta{' '}
                  <strong className="text-[#0A3768]">{emailMasked}</strong>.
                </p>
              </div>

              {resetError && (
                <div
                  role="alert"
                  data-testid="reset-password-error"
                  className="flex items-start gap-2.5 p-3.5 rounded-[3px] bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-bold text-[#334155] mb-1.5"
                >
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-11 pl-10 pr-11 rounded-[3px] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0475EE] focus:ring-2 focus:ring-[#0475EE]/15"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                    onClick={() => setShowNewPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0475EE] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mt-2">
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
                    <span className={`text-[11px] font-bold ${STRENGTH_TEXT_COLORS[strength.score]}`}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-bold text-[#334155] mb-1.5"
                >
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    placeholder="Repita a nova senha"
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
                {passwordsMatch && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    As senhas coincidem
                  </p>
                )}
              </div>

              <MotionButton
                type="submit"
                disabled={resetSubmitting}
                data-testid="reset-password-submit"
                className="w-full h-11 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {resetSubmitting ? 'A guardar nova senha...' : 'Salvar Nova Senha'}
              </MotionButton>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
