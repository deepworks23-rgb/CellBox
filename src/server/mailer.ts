import nodemailer from 'nodemailer';

export type EmailProvider = 'resend' | 'smtp';

export interface PasswordResetEmailParams {
  to: string;
  userName: string;
  resetUrl: string;
  expiresMinutes: number;
}

function getTrimmedEnv(name: string): string {
  return (process.env[name] ?? '').trim();
}

export function getEmailProviderName(): EmailProvider | null {
  if (getTrimmedEnv('RESEND_API_KEY')) {
    return 'resend';
  }
  if (getTrimmedEnv('SMTP_HOST') && getTrimmedEnv('SMTP_USER') && getTrimmedEnv('SMTP_PASS')) {
    return 'smtp';
  }
  return null;
}

export function isEmailServiceConfigured(): boolean {
  return getEmailProviderName() !== null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildResetEmailContent(params: PasswordResetEmailParams): {
  subject: string;
  text: string;
  html: string;
} {
  const safeName = escapeHtml(params.userName || 'Cliente');
  const safeUrl = escapeHtml(params.resetUrl);
  const subject = 'Cellbox — Redefinição da sua senha';

  const text = [
    `Olá, ${params.userName || 'Cliente'},`,
    '',
    'Recebemos um pedido para redefinir a senha da sua conta na Cellbox.',
    `Abra o link abaixo para definir uma nova senha (válido por ${params.expiresMinutes} minutos):`,
    '',
    params.resetUrl,
    '',
    'Se não solicitou esta alteração, pode ignorar este e-mail em segurança. A sua senha atual continuará ativa.',
    '',
    'Equipa Cellbox Moçambique',
  ].join('\n');

  const html = `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F5F7FA;font-family:Inter,Arial,sans-serif;color:#222222;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E6EAF0;border-radius:6px;overflow:hidden;">
            <tr>
              <td style="background:#0A3768;padding:24px 32px;">
                <div style="font-size:20px;font-weight:800;letter-spacing:0.06em;color:#FFFFFF;text-transform:uppercase;">
                  CELLBOX
                </div>
                <div style="font-size:12px;color:#1AD6DE;margin-top:4px;font-weight:600;">
                  Segurança da Conta
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#0A3768;">
                  Redefinir a sua senha
                </h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#444444;">
                  Olá, <strong>${safeName}</strong>. Recebemos um pedido para redefinir a senha da sua conta Cellbox.
                </p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#444444;">
                  Clique no botão abaixo para criar uma nova senha. Por motivos de segurança, este link expira em <strong>${params.expiresMinutes} minutos</strong> e só pode ser utilizado uma vez.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;">
                  <tr>
                    <td style="border-radius:999px;background:#0475EE;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 28px;font-size:13px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">
                        Redefinir Minha Senha
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:12px;color:#666666;">
                  Se o botão não abrir, copie e cole este endereço no seu navegador:
                </p>
                <p style="margin:0 0 24px 0;font-size:12px;line-height:1.5;word-break:break-all;color:#0475EE;">
                  <a href="${safeUrl}" style="color:#0475EE;">${safeUrl}</a>
                </p>
                <hr style="border:none;border-top:1px solid #EAEAEA;margin:20px 0;" />
                <p style="margin:0;font-size:12px;line-height:1.5;color:#777777;">
                  Não solicitou a redefinição? Pode ignorar esta mensagem — a sua conta permanece protegida.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams
): Promise<{ provider: EmailProvider; messageId?: string }> {
  const provider = getEmailProviderName();
  if (!provider) {
    throw new Error(
      'Serviço de e-mail não configurado. Defina RESEND_API_KEY ou SMTP_HOST, SMTP_USER e SMTP_PASS nas variáveis de ambiente.'
    );
  }

  const from =
    getTrimmedEnv('MAIL_FROM') ||
    (provider === 'smtp' ? getTrimmedEnv('SMTP_USER') : 'Cellbox <no-reply@cellbox.co.mz>');
  const content = buildResetEmailContent(params);

  if (provider === 'resend') {
    const apiKey = getTrimmedEnv('RESEND_API_KEY');
    const apiUrl = getTrimmedEnv('RESEND_API_URL') || 'https://api.resend.com/emails';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Falha ao enviar e-mail via Resend (${response.status}): ${errorText.slice(0, 240)}`
      );
    }

    const payload = (await response.json().catch(() => ({}))) as { id?: string };
    return { provider: 'resend', messageId: payload.id };
  }

  const port = Number(getTrimmedEnv('SMTP_PORT') || 587);
  const secure = getTrimmedEnv('SMTP_SECURE').toLowerCase() === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: getTrimmedEnv('SMTP_HOST'),
    port,
    secure,
    auth: {
      user: getTrimmedEnv('SMTP_USER'),
      pass: getTrimmedEnv('SMTP_PASS'),
    },
  });

  const info = await transporter.sendMail({
    from,
    to: params.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  return { provider: 'smtp', messageId: info.messageId };
}
