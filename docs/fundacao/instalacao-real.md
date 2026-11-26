# Ambiente Real de Produção — CellBox (Fase 8)

- **Data**: 2026-11-26
- **Plataforma de execução**: Vercel Serverless + Frontend estático Vite (`https://cellbox-psi.vercel.app`)
- **Base de dados**: Neon PostgreSQL (`ep-quiet-shadow-bdugvj6l-pooler.c-8.us-east-2.aws.neon.tech`)
- **Nota metodológica**: Por ser um SaaS comercial gerido na Vercel ([ADR 0001](../decisions/0001-arquitetura-vercel-neon.md)), não há instalação em VPS Linux por linha de comando; a prova de ambiente real foi feita diretamente na implantação de produção na Vercel.

## Evidência Medida de Fora (2026-11-26)
- `GET https://cellbox-psi.vercel.app/api/health` → `200 OK`, PostgreSQL ligado (`users: 5`, `sellers: 3`, `products: 30`, `categories: 14`).
- `GET https://cellbox-psi.vercel.app/api/bootstrap` → `200 OK`, `3` lojas ativas sem exposição de PII/KYC (`PII_LEAKED: false`).
- `POST https://cellbox-psi.vercel.app/api/uploads` (anónimo) → `401 Unauthorized`.
- `POST https://cellbox-psi.vercel.app/api/webhooks/escalepay` (sem segredo) → `503 Service Unavailable`.

## O que NÃO foi provado ainda em produção
- Credenciais reais de produção de PaySuite, Debito Pay, M-Pesa/e-Mola e EscalePay (aguardam ativação pelo dono — ver [nao-exercitado.md](nao-exercitado.md)).
- Envio real de e-mail (`RESEND_API_KEY` / SMTP) e upload real em bucket S3.
- Presença de `SESSION_SECRET` / `ENCRYPTION_KEY` dedicada nas variáveis de ambiente da Vercel (recomendação: confirmar no painel da Vercel que não está a usar o valor fallback).
