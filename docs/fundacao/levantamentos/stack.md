# Levantamento 2 — A Stack do Domínio (Critérios do Capítulo 03)

- **Data**: 2026-11-26
- **Referência arquitetural**: [ADR 0001 — Arquitetura Vercel + Neon PostgreSQL](../../decisions/0001-arquitetura-vercel-neon.md)

## 1. Avaliação pelos 6 critérios do Capítulo 03 (na ordem)

| Critério | Avaliação no CellBox | Classificação |
|---|---|---|
| **1. Não reconstrua o que o domínio já resolveu** | O ponto difícil do domínio é processar pagamentos locais (M-Pesa, e-Mola, cartões) e autenticação/armazenamento. O CellBox delega pagamentos a gateways locais (PaySuite, Debito Pay, M-Pesa API / EscalePay), storage a S3 e e-mail a Resend/SMTP. | **Fato lido** (2026-11-26) — `src/server/app.ts`, `src/server/storage.ts`, `src/server/mailer.ts` |
| **2. Aceite o que o mercado do usuário realmente usa** | Em Moçambique, carteiras móveis (M-Pesa da Vodacom e e-Mola da Movitel) dominam pagamentos digitais, além de cartões/Ponto24 via agregadores como PaySuite e Debito Pay. O CellBox já modela exatamente esses provedores em `SiteCustomization.gateways`. | **Fato lido** (2026-11-26) — `src/types.ts`, pesquisa web PaySuite/Debito Pay |
| **3. Uma linguagem só** | Todo o projeto (frontend React, backend Express, acesso a dados, scripts e testes) usa **TypeScript** sobre Node.js (`package.json`). | **Fato lido** (2026-11-26) — `package.json`, `tsconfig.json` |
| **4. Cada serviço a mais é memória, instalação e ponto de falha** | Stack enxuta: 1 processo API Express + build estático Vite na Vercel + 1 base PostgreSQL no Neon (`DATABASE_URL`). Sem Redis nem fila externa separada. | **Fato lido** (2026-11-26) — `vercel.json`, `server.ts`, `src/lib/db.ts` |
| **5. Peça viva e licença compatível** | React 19, Vite 8, Express 4, `pg` 8, Tailwind CSS v4 são projetos ativos com licenças permissivas (MIT/Apache). *Nota*: o produto em si é comercial/proprietário (decisão do dono na Fase 1). | **Fato lido** (2026-11-26) — `package.json` |
| **6. Prefira o que todo contribuidor já sabe ler** | SQL direto com `pg` em `src/lib/db.ts`, rotas REST Express simples e componentes React funcionais, fáceis de manter por qualquer programador ou assistente de IA. | **Fato lido** (2026-11-26) — `src/lib/db.ts`, `src/server/app.ts` |

## 2. Peça de maior risco técnico

- **Integração de pagamentos dinâmicos locais (C2B + webhooks + confirmação automática de taxa/pedidos)**:
  - **Risco**: redes móveis podem ter latência; webhooks precisam de validação criptográfica de assinatura (`webhookSecret`) e idempotência para não confirmar um pedido duas vezes ou perder uma confirmação.
  - **Estado atual**: os endpoints `/api/webhooks/paysuite`, `/api/webhooks/debitopay`, `/api/webhooks/mpesa` e `/api/webhooks/escalepay` já existem em `src/server/app.ts` (`fato lido`, 2026-11-26), mas **ainda não foram testados contra contas reais de produção** (`não verificado` em produção).

---

### Lido de fato
- `package.json`, `vercel.json`, `src/server/app.ts`, `src/lib/db.ts`, `src/server/storage.ts`, `src/server/mailer.ts`.
- Documentação pública pesquisada em 2026-11-26 sobre PaySuite (Hypertech, Sandbox Banco de Moçambique) e Debito Pay.

### Inferido ou não lido
- Latência real e taxa de falha de callbacks em produção do M-Pesa/e-Mola via PaySuite/Debito Pay (**não verificado** sem credenciais reais).
- Limites exatos de consumo mensal da conta atual Vercel/Neon sob tráfego real (**estimativa**).
