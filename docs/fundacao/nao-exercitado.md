# Configurado e Ainda Não Exercitado — CellBox

Este ficheiro lista honestamente tudo o que está configurado no código ou no repositório, mas **ainda não foi executado em ambiente real de produção** (Conformidade 13.9 / Lição K11).

| Item | Onde está configurado | O que falta para exercitar |
|---|---|---|
| **Webhooks PaySuite, Debito Pay e M-Pesa/e-Mola direto** | `src/server/app.ts` (`/api/webhooks/*`) | Configurar `apiKey` e `webhookSecret` reais de produção no painel Super Admin e realizar pagamento real end-to-end |
| **Aprovação automática da taxa de inscrição (100 MT)** | `src/server/app.ts` (`/api/seller/activate-fee`) | Ligar callback de pagamento confirmado pelo gateway para dispensar aprovação manual no Admin |
| **Envio real de e-mail de recuperação de senha** | `src/server/mailer.ts` (`RESEND_API_KEY` / SMTP) | Definir variáveis de e-mail em produção na Vercel e testar `POST /api/auth/forgot-password` com caixa real |
| **Primeiro run real do GitHub Actions CI** | `.github/workflows/ci.yml` | Acompanhar a execução automática no GitHub Actions após push para `main` / abertura de PR |
| **Armazenamento de imagens em bucket S3** | `src/server/storage.ts` | Confirmar credenciais S3 configuradas na Vercel e upload real de imagem de produto/KYC |
