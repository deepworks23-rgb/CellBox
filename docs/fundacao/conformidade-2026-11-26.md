# Auditoria de Conformidade pela Fábrica DeskLabs — CellBox

- **Data da auditoria**: 2026-11-26
- **Commit base medido**: `a95e1b5ff65dbb5554332f6b812a12adbfb616e1` (convergido nesta entrega)
- **Natureza do produto**: Marketplace multivendedor comercial SaaS (Vercel + Neon PostgreSQL), não um produto open-source auto-hospedável em VPS.

## Resumo de Resultados

| Resultado | Descrição |
|---|---|
| **Conforme** | Cumpre a exigência após medição ou convergência aplicada nesta entrega |
| **Decidido diferente** | Diverge com justificativa escrita em ADR (`docs/decisions/0001-arquitetura-vercel-neon.md`) |
| **Não se aplica** | Condição do item (open-source, revenda white-label, VPS/Docker, equipe autônoma) não existe no CellBox |
| **Não conforme** | Item ainda pendente de decisão ou implementação futura |
| **Não medido** | Requer ambiente externo/credenciais em tempo de execução |

> **Contagem por seção (itens principais avaliados)**:
> - **Conformes**: `1.1–1.5`, `4.7`, `5.1–5.4`, `5.9`, `5.17`, `5.19`, `6.2`, `6.6`, `6.7`, `6.8`, `6.12`, `8.12`, `10.13` (19 itens principais convergidos/verificados)
> - **Decididos diferentes**: `3.1`, `3.2`, `3.3`, `11.1–11.25`, `12.1–12.21` (arquitetura Vercel+Neon via [ADR 0001](file:///c:/Users/LECASU/Desktop/JOSWIL%20EI/Sistemas/CellBox/docs/decisions/0001-arquitetura-vercel-neon.md))
> - **Não se aplica**: `2.1–2.19` (sem parceiro VPS/revenda), `7.1–7.11` (marketplace único CellBox com isolamento por `sellerId`, não multi-tenant de instalações), `10.1–10.12` (repositório comercial privado/único mantenedor), `14.1–14.14` (site institucional e loja estão unificados no domínio CellBox), `15.1–15.18` (sem equipe autônoma de agentes em VPS)
> - **Não conforme (backlog de melhoria contínua)**: `4.2–4.6` (tokens semânticos e dicionário i18n estritos), `5.5` (migrations por carimbo de tempo em vez de `initDatabase` idempotente em `src/lib/db.ts`), `5.14`, `5.21` (testes E2E no navegador no CI), `6.1`, `6.9`, `6.15` (tabela formal de decisões de auth + filtro de contas desativadas em todas as consultas)

---

## Melhorias Aplicadas Nesta Convergência (Prioridade 1 → 4 da Fábrica)

1. **Segurança & Autenticação (Prioridade 1 — o que pode causar dano)**:
   - **Rate limit de login por par `(identificador + prefixo IP /64)` com faxina em memória** (`src/server/security.ts` + `src/server/app.ts`) — fecha **Conformidade 6.7 / Lição K27**.
   - **Prevenção de enumeração de contas em `POST /api/auth/forgot-password`** (`src/server/app.ts`) — retorna `200` com mensagem neutra em vez de `404`, fechando **Conformidade 6.6**.
   - **Cifragem em repouso `AES-256-GCM` para segredos de gateways (`apiKey`, `webhookSecret`, `publicKey`, etc.)** (`src/server/security.ts` + `src/lib/db.ts`) — fecha **Conformidade 6.8**.
   - **Centralização de autorização por papel (`hasRole` / `requireRole`)** (`src/server/security.ts` + `src/server/app.ts`) — fecha **Conformidade 6.2 / 8.12 / Lição M6**.
   - **Aviso explícito quando `SESSION_SECRET` falta em produção** (`src/server/app.ts`).

2. **Cercas e CI (Prioridade 3)**:
   - **Testes unitários determinísticos** (`tests/security.test.ts`) cobrindo IPv6 `/64`, rate limit, AES-256-GCM e `requireRole` sem relógio real ou porta fixa (**Conformidade 5.19**).
   - **Cerca de varredura de segredos e metadata** (`tests/fences/no-secrets-and-role-fence.test.ts`) com dono, motivo e data de revisão (**Conformidade 5.9, 5.17**).
   - **Pipeline de CI** (`.github/workflows/ci.yml`) com `concurrency` cancelando execuções anteriores (**Lição D5**) rodando `npm run lint`, `npm test` e `npm run build`.
   - **Correção de metadata desatualizada** em `index.html` e `package.json` (**Conformidade 12.20 / Lição I1**).

3. **Documentação da Fábrica (Prioridade 4)**:
   - `AGENTS.md` (**Conformidade 5.1–5.4**)
   - `VISION.md` (**Conformidade 1.1–1.5**)
   - `docs/decisions/0001-arquitetura-vercel-neon.md` (**Conformidade 3.1**)

---

## Para a Fábrica (Devolução)
- Produtos comerciais já em produção na Vercel + Neon PostgreSQL beneficiam de um perfil opcional "SaaS Comercial Gerido" na `conformidade.md` para distinguir automaticamente os itens de VPS/Docker/Instalação (§3, §11, §12) sem exigir `Decidido diferente` repetitivo em dezenas de linhas.
