# ADR 0001 — Arquitetura Comercial Gerida (Vercel + Neon PostgreSQL)

- **Data**: 2026-11-26
- **Estado**: Decidido (produto comercial SaaS pré-existente)
- **Contexto**: A Fábrica DeskLabs assume por padrão produtos open-source auto-hospedáveis em VPS com Docker (`conformidade.md` §3, §11, §12, §14, §15). O **CellBox** é um marketplace multivendedor comercial já implantado em produção na Vercel com base de dados Neon PostgreSQL (`DATABASE_URL`).

## Decisão
Manter a stack gerida **Vercel (Serverless + Frontend estático Vite/React) + Neon PostgreSQL + S3 opcional**.

## Alternativas Descartadas
1. **Migrar para VPS + Docker Compose com PostgreSQL local**: exigiria reescrever o modelo de deploy (`vercel.json`, `api/`), provisionar servidor próprio, proxy reverso, backups manuais e TLS, sem ganho funcional imediato para o operador.
2. **Armazenamento local em disco/SQLite**: incompatível com funções serverless stateless na Vercel.

## Custo de Divergir da Fábrica
- O sistema depende de serviços de terceiros geridos (Vercel e Neon) e não sobe de forma auto-hospedável em VPS sem adaptação (`§3.2`, `§11`, `§12` marcados como **Decidido diferente** na auditoria).
- Fica dependente das quotas e limites do plano Vercel/Neon, exigindo monitorização pelo operador.
