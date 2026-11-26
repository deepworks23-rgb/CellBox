# Levantamento 3 — O que a lei e o mercado do domínio impõem

- **Data**: 2026-11-26
- **Base metodológica**: As 4 perguntas de domínio do Capítulo 09 (`manual/09-doutrinas.md`).

## 1. Que abuso este produto facilita, se ninguém cuidar?

1. **Lojas falsas ou fraude na entrega**: vendedor abrir loja, receber dinheiro e não entregar.
   - *Mitigação existente*: KYC obrigatório + taxa de ativação + custódia Modo A (`fato lido`, 2026-11-26).
2. **Comprovativos falsos na taxa de inscrição (100 MT)**: envio de ID de transação inventado antes da validação automática.
   - *Mitigação existente*: revisão manual no Admin; *lacuna*: falta integração automática via webhook para eliminar erro humano (`fato lido`, 2026-11-26).
3. **Ataque de força bruta no login e enumeração de contas**:
   - *Mitigação aplicada*: `LoginRateLimiter` por `(identificador + IP /64)` e resposta neutra em `forgot-password` (`fato lido`, 2026-11-26 — `src/server/security.ts`).

## 2. Que canal ou recurso é regulado?

- **Comércio Eletrónico em Moçambique — Lei n.º 3/2017 (Lei das Transacções Electrónicas)**:
  - Impõe transparência pré-contratual clara (identificação do vendedor/plataforma, preços totais, termos de venda/devolução) e reconhece validade jurídica a registos eletrónicos (`fato lido`, 2026-11-26 — resumo jurídico consultado na web).
  - O **INTIC** (*Instituto Nacional de Tecnologias de Informação e Comunicação*) supervisiona certificação digital, domínios `.mz` e conformidade cibernética (`fato lido`, 2026-11-26).
- **Pagamentos Móveis e Gateways (Banco de Moçambique)**:
  - Agregadores como PaySuite operam sob o *Sandbox Regulatório do Banco de Moçambique* e exigem conta empresarial registada (NUIT/Alvará) para liberar credenciais de API em produção (`fato lido`, 2026-11-26).

## 3. Que dado pessoal passa por aqui, e quem responde por ele?

- **Dados tratados no CellBox** (`fato lido`, 2026-11-26 — `src/types.ts`, `src/lib/db.ts`):
  - **Compradores**: nome, telefone, e-mail, morada completa (província, cidade, bairro, código postal), histórico de pedidos.
  - **Lojistas**: nome completo, telefone, e-mail, **documentos KYC (BI, NUIT, Passaporte ou Alvará + fotos frente/verso)**, dados bancários (NIB/conta) e carteiras móveis para saque.
- **Responsável pelos dados**: o operador do **CellBox** (empresa titular da plataforma).
- **Enquadramento legal**: a Constituição de Moçambique protege a privacidade e dados pessoais, complementada por disposições da Lei n.º 3/2017 e pela ratificação da Convenção de Malabo / proposta de Lei de Proteção de Dados Pessoais (`fato lido`, 2026-11-26). *Nota*: o produto ainda precisa definir política de retenção/anonimização formal de documentos KYC (`não verificado` / pendente na Fase 3).

## 4. Que ação o produto toma em nome de alguém, sem volta?

1. **Aprovar/pagar saque financeiro ao vendedor** (`POST /api/admin/payouts/:id/review`) — movimentação financeira real irreversível (`fato lido`, 2026-11-26).
2. **Liberar custódia ou alterar estado de pedido concluído** — impacta saldo do vendedor e direito do comprador (`fato lido`, 2026-11-26).
3. **Suspender ou apagar loja / produto** — remove presença comercial e histórico operacional (`fato lido`, 2026-11-26).

---

### Lido de fato
- Código do CellBox (`src/types.ts`, `src/server/app.ts`, `src/server/security.ts`, `src/lib/db.ts`).
- Referências pesquisadas em 2026-11-26 sobre a Lei n.º 3/2017 (Moçambique), INTIC, PaySuite e proteção de dados em Moçambique.

### Inferido ou não lido
- Texto integral oficial do Boletim da República da Lei n.º 3/2017 e regulamentos internos recentes do Banco de Moçambique para fintechs (**não lido na íntegra**, baseado em resumos jurídicos pesquisados em 2026-11-26).
- Requisitos contratuais específicos da conta empresarial CellBox junto à Vodacom (M-Pesa) e Movitel (e-Mola) (**não verificado**).
