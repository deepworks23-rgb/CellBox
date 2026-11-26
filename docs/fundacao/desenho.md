# CellBox: desenho da fundação

> Data: 2026-11-26. Estado: aprovado pelo dono em conversa (`aprovo todas`, 2026-11-26).
> **[dono]** marca o que o dono decidiu de fato. **[construtor]** marca o que quem escreveu decidiu e pode ser revisto.

## Intenção

O **CellBox** é um marketplace multivendedor para Moçambique que anuncia a plataforma para atrair lojistas e revendedores, divulga as lojas verificadas numa vitrine pública para atrair compradores, e garante pagamentos com custódia (Modo A) até à confirmação de entrega — gerando receita por taxa de inscrição e comissões sobre vendas. Não é um software open-source auto-hospedável em VPS nem um sistema de entregas com frota própria.

## Por que agora

A plataforma já possui vitrine pública em produção (`https://cellbox-psi.vercel.app`), base de dados Neon PostgreSQL com lojas reais (`Tech258`, `Wil Shop`, `Lara Fashion`), painéis dedicados (Comprador, Vendedor, Super Admin) e proteção de segurança endurecida. Faltava consolidar os documentos de fundação, contratos entre peças, matriz de riscos/lições e verificação ponta a ponta pelo método da Fábrica.

## Decisões do dono

1. **Parceiro de distribuição [dono]:** Não há parceiro de infraestrutura; itens de parceiro ficam *não se aplica*.
2. **Casa e licença [dono]:** `deepworks23-rgb/CellBox`, código proprietário / privado (*All Rights Reserved*).
3. **Fronteira com outros produtos [dono]:** Tudo unificado no CellBox (vitrine + painéis Comprador, Vendedor e Super Admin), sem produto irmão por agora.
4. **Peça central da stack e pagamentos [dono]:** Vercel + Neon PostgreSQL, com PaySuite / Debito Pay como gateway principal para M-Pesa, e-Mola e Cartão (mantendo M-Pesa/e-Mola direto como opção secundária).
5. **O que nasce desligado [dono]:**
   - Gateways dinâmicos em produção: desligados até o Admin inserir `apiKey` e `webhookSecret` reais.
   - Lojas novas na vitrine pública: ocultas até aprovação de KYC + taxa de inscrição (100 MT) + ativação.
   - Saques automáticos B2C: desligados; repasses exigem aprovação manual no Super Admin.
6. **Modelo de instalação e marca própria [dono]:** Plataforma única multi-loja isolada por `sellerId`, sem marca própria (*white-label*).
7. **Direção visual [dono]:** *"Limpo, comercial e confiável — vitrine vibrante para compras com painéis sóbrios para gestão"*.
8. **Manutenção e revisão [dono]:** `deepworks23-rgb` é o dono; mudanças passam por CI obrigatório (`npm run lint && npm test && npm run build`) e revisão independente em segurança/financeiro.
9. **Nível das configurações [dono]:**
   - **Plataforma (Super Admin)**: comissão, gateways, categorias, CMS (slides, banners, rodapé, contactos), aprovação de KYC/taxa/saques.
   - **Loja (Vendedor)**: perfil da loja, catálogo/stock, envio dos pedidos da sua loja e dados de saque.

## Objetivos da fundação

- Um comprador consegue navegar por categorias/lojas, adicionar produtos ao carrinho, finalizar compra e acompanhar o pedido em custódia até confirmar receção.
- Um lojista consegue registar loja, enviar KYC e comprovativo de taxa de 100 MT, importar produtos (individual ou CSV) e solicitar saque após vendas concluídas.
- O Super Admin consegue configurar o CMS completo, aprovar/rejeitar KYC, taxas e saques, e verificar a saúde em `/api/health`.
- Qualquer alteração no código passa localmente e no CI por `npm run verify` (`tsc --noEmit`, testes/cercas e `vite build`).

## Fora do escopo desta fundação

- Integração automática com transportadoras externas (envio é atualizado pelo lojista no painel).
- Aplicativo móvel nativo iOS/Android separado (atendido pela web responsiva em Flexbox).
- Repasse financeiro automático B2C sem revisão humana (aguarda credenciais e homologação de produção).
- Política automatizada de anonimização/expurgo periódico de documentos KYC (registada como melhoria futura).

## Antiobjetivos

Seria um fracasso, mesmo funcionando, se:

- Uma loja não verificada (sem KYC/taxa) aparecer na vitrine pública (guardado por `isStorePubliclyActive` em `src/utils/marketplace.ts`).
- Segredos de gateways (`apiKey`, `webhookSecret`) forem gravados em texto claro no Neon PostgreSQL (guardado por `encryptGatewaySecrets` em `src/lib/db.ts` e `tests/security.test.ts`).
- Rotas protegidas confiarem em comparação manual de papel ou permitirem bypass (guardado por `requireRole`/`hasRole` em `src/server/security.ts`).
- Ataques de força bruta trancarem contas de terceiros apenas sabendo o telefone/e-mail ou enumeração revelar contas existentes (guardado por `LoginRateLimiter` + resposta neutra em `forgot-password` e `tests/security.test.ts`).
- Dados de negócio voltarem a depender de ficheiros mock/seed estáticos no código (guardado em `AGENTS.md`).

## Arquitetura

```text
[Navegador: React + Vite + Tailwind v4]
        │  HTTPS JSON (/api/*) + Cookie/Bearer Token
        ▼
[API Express Serverless (api/ + src/server/app.ts)]
   ├── Segurança (src/server/security.ts): requireRole, LoginRateLimiter, AES-256-GCM
   ├── Storage opcional S3 (src/server/storage.ts)
   ├── E-mail transacional Resend/SMTP (src/server/mailer.ts)
   └── Webhooks (/api/webhooks/paysuite|debitopay|mpesa|escalepay)
        │  SQL parametrizado (pg Pool)
        ▼
[Neon PostgreSQL (src/lib/db.ts)]
```

Regras de forma:
- **Um caminho de schema:** `initDatabase()` idempotente em `src/lib/db.ts` (migrações versionadas por carimbo de tempo ficam registadas como backlog no relatório de conformidade).
- **Uma porta de acesso ao dado por loja:** verificação `doesUserOwnSeller` / `findSellerOwnedBy` em `src/lib/db.ts` e `src/server/app.ts`.
- **Configuração de operador tem tela:** CMS, comissão e gateways editáveis no painel Super Admin (`AdminDashboardView.tsx`); variáveis de infraestrutura em `.env.example`.

## Peças e responsabilidades

| Peça | Responsabilidade |
|---|---|
| `src/components/*` | Vitrine pública e painéis (Comprador, Vendedor, Super Admin) |
| `src/server/app.ts` | Rotas REST, sessões, validação de entradas e webhooks |
| `src/server/security.ts` | `hasRole`/`requireRole`, `LoginRateLimiter` (`/64`), `AES-256-GCM` |
| `src/lib/db.ts` | Persistência no Neon PostgreSQL e cifragem/decifragem de gateways |
| `src/server/storage.ts` & `mailer.ts` | Upload de imagens S3 e envio de e-mails de recuperação |
| `tests/` & `.github/workflows/ci.yml` | Cercas de segurança/metadata, testes determinísticos e CI |

## Contratos

Os formatos exatos de tabelas SQL, interfaces TypeScript, rotas HTTP e variáveis de ambiente estão em [docs/fundacao/contratos.md](contratos.md).

## Erros que esta fundação fecha (referência `licoes.md`)

| Grupo / Lição | Regra no CellBox | O que cobra / Estado |
|---|---|---|
| **A1–A3** (Schema e migrations) | `initDatabase` único em `src/lib/db.ts` | Ainda não cobrado por migration timestamp (backlog em `conformidade-2026-11-26.md`) |
| **A4** (Banco na nuvem) | Decidido diferente: SaaS comercial usa Neon PostgreSQL | [ADR 0001](../decisions/0001-arquitetura-vercel-neon.md) |
| **B1–B4** (Isolamento) | Isolamento por `sellerId` + `doesUserOwnSeller` | Revisão de rotas em `src/server/app.ts` |
| **D1** (Relógio/porta em testes) | Testes com `nowFn` injetável, sem porta fixa | [tests/security.test.ts](../../tests/security.test.ts) |
| **D5** (Fila de CI) | `concurrency` com `cancel-in-progress: true` | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) |
| **D6–D7** (Cercas com dono/DoD) | Cabeçalho de dono/motivo/data e DoD em 2 listas | [AGENTS.md](../../AGENTS.md), [no-secrets-and-role-fence.test.ts](../../tests/fences/no-secrets-and-role-fence.test.ts) |
| **E1–E24** (Instalador/VPS) | Não se aplica (deploy gerido Vercel + Neon) | [ADR 0001](../decisions/0001-arquitetura-vercel-neon.md) |
| **F2** (Falhas visíveis) | Aviso explícito de `SESSION_SECRET` ausente + respostas HTTP claras | `src/server/app.ts` |
| **G1, G5** (Governança e autoridade) | `GOVERNANCE.md` e `AGENTS.md` único | [GOVERNANCE.md](../../GOVERNANCE.md), [AGENTS.md](../../AGENTS.md) |
| **H7** (Zero segredos no código) | Varredura automática de segredos em `src/` | [no-secrets-and-role-fence.test.ts](../../tests/fences/no-secrets-and-role-fence.test.ts) |
| **I1–I2** (Afirmações e versões) | Versões apenas em `package.json`; metadata alinhada | `AGENTS.md`, `tests/fences/no-secrets-and-role-fence.test.ts` |
| **K27** (Rate limit /64 + faxina) | `LoginRateLimiter` com chave `(id + IP /64)` e `prune()` | `src/server/security.ts`, `tests/security.test.ts` |
| **L4–L5** (Telas e erros claros) | Validações nomeiam o campo em falta; painéis explicam estado pendente | `SellerDashboardView.tsx`, `src/server/app.ts` |
| **M6** (Função única de papel) | `hasRole` / `requireRole` centralizados | `src/server/security.ts`, `tests/security.test.ts` |
| **N1–N6, O1–O20** (Site separado / Equipa autónoma) | Não se aplica (marketplace comercial unificado, mantenedor único) | [conformidade-2026-11-26.md](conformidade-2026-11-26.md) |

## Decisões do construtor

- **Compatibilidade de cifragem em repouso [construtor]:** `decryptSecret` aceita valores legados sem prefixo `enc:v1:` e cifra automaticamente na próxima gravação em `setSiteCustomization()`, evitando quebra com configurações já gravadas no Neon.
- **Type guard em `requireRole` [construtor]:** `requireRole` usa predicado de tipo TypeScript (`user is T`) para eliminar checagens redundantes e garantir estreitamento seguro de `user` nas rotas.
