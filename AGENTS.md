# AGENTS.md — Documento de Autoridade do CellBox

Este é o documento de autoridade para qualquer pessoa ou assistente de IA trabalhando no repositório **CellBox**.

## Stack Real

As versões exatas das dependências moram em `package.json` (nunca afirmadas manualmente em prosa):
- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4.
- **Backend**: Express + Node.js (`server.ts` e `src/server/app.ts`) com deploy serverless (`api/` + `vercel.json`).
- **Base de Dados**: PostgreSQL gerido na nuvem (Neon) em `src/lib/db.ts`.
- **Armazenamento de Ficheiros**: Compatível com S3 (`src/server/storage.ts`).
- **E-mail Transacional**: Resend / SMTP (`src/server/mailer.ts`).

## Convenções e Cercas

1. **Verificação antes de declarar pronto**: rodar `npm run verify` (`npm run lint && npm test && npm run build`). Cobrado pelo workflow `.github/workflows/ci.yml`.
2. **Autorização centralizada por papel**: toda rota protegida deve usar `requireRole` / `hasRole` de `src/server/security.ts`. Nunca comparar papéis manualmente fora desse módulo (Conformidade 6.2).
3. **Proteção de força bruta e privacidade no login**: `POST /api/auth/login` usa `LoginRateLimiter` com chave `(identificador + IP /64)` e `POST /api/auth/forgot-password` nunca revela se um e-mail possui conta (Conformidade 6.6 e 6.7; testado em `tests/security.test.ts`).
4. **Segredos cifrados em repouso**: chaves de API e webhooks de gateways gravadas em `platform_settings` passam por `encryptGatewaySecrets` / `decryptGatewaySecrets` (`AES-256-GCM`) em `src/lib/db.ts` (Conformidade 6.8; testado em `tests/security.test.ts`).
5. **Zero segredos ou placeholders em código**: cobrado pela cerca `tests/fences/no-secrets-and-role-fence.test.ts`.
6. **Dados de negócio pertencem ao Neon PostgreSQL**: nunca restaurar ficheiros de seed/mock em `src/` para popular loja pública; toda loja e produto nasce no banco de dados via API.

## Antipadrões (com origem)

- **Comparar `user.role` à mão em rotas novas**: gera bypass silencioso e inconsistência de códigos HTTP (`401` vs `403`). Origem: Lição M6 / Conformidade 6.2.
- **Rate limit apenas por e-mail/telefone**: permite trancar a conta de terceiros apenas sabendo o identificador. Origem: Lição K27 / Conformidade 6.7.
- **Gravar `apiKey` / `webhookSecret` de gateways em texto claro no JSONB**: expõe credenciais de pagamento em backups/dumps do banco. Origem: Conformidade 6.8.
- **Testes dependentes de `Date.now()` real ou portas fixas**: causam falhas intermitentes no CI. Origem: Lição D1 / Conformidade 5.19.

## Definition of Done (Definição de Pronto)

### O que o CI reprova (`.github/workflows/ci.yml`)
- Erros de tipo TypeScript (`npm run lint`).
- Falha em testes unitários ou cercas (`npm test`).
- Falha no build de produção Vite (`npm run build`).

### O que o CI não vê (conferência na revisão)
- Persistência real no Neon PostgreSQL e comportamento visual no navegador (`HomeView`, painéis Admin/Vendedor/Comprador).
- Fluxos de pagamento externos (PaySuite, Debito Pay, M-Pesa/e-Mola, EscalePay) que dependem de credenciais de produção.
- Verificação de links externos ou imagens de catálogo em produção.
