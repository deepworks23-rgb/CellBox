# Levantamento 1 — O que o público pede e do que reclama

- **Data**: 2026-11-26
- **Tipo de evidência**: **Evidência indireta** (o CellBox não possui histórico público de issues/comunidade aberta; levantamento baseado na análise do próprio produto e nas práticas conhecidas de marketplaces em Moçambique).

## 1. O que os compradores pedem e temem

| Necessidade / Reclamação | Status no CellBox | Evidência |
|---|---|---|
| Medo de pagar antecipado a lojas desconhecidas e não receber o produto | **Atendido em desenho (Modo A — Custódia)** (`fato lido`, 2026-11-26) | Fluxo de custódia e confirmação de entrega em `src/server/app.ts` e `src/components/CartCheckoutView.tsx` |
| Pagar com carteiras móveis locais sem precisar de cartão internacional | **Parcialmente atendido** (`fato lido`, 2026-11-26) | Suporte a M-Pesa/e-Mola, PaySuite e Debito Pay no checkout e painel Admin, mas ainda sem credenciais de produção configuradas |
| Saber se uma loja é real e verificada antes de comprar | **Atendido** (`fato lido`, 2026-11-26) | Lojas só aparecem na vitrine pública (`isStorePubliclyActive`) após KYC + taxa + ativação |
| Navegação clara por categorias e lojas no telemóvel | **Atendido** (`fato lido`, 2026-11-26) | Layout responsivo em Flexbox em `HomeView.tsx`, `StoresView.tsx` e `OffersView.tsx` |

## 2. O que os lojistas e revendedores pedem e onde travam

| Necessidade / Atrito | Status no CellBox | Evidência |
|---|---|---|
| Cadastrar muitos produtos rapidamente sem digitar um a um | **Atendido** (`fato lido`, 2026-11-26) | Importação CSV em lote (`POST /api/products/bulk`, até 300 itens) em `SellerDashboardView.tsx` |
| Ativar a loja sem esperar dias por validação manual | **Atrito aberto** (`fato lido`, 2026-11-26) | Hoje a taxa de inscrição (100 MT) e o KYC exigem aprovação manual no painel Admin |
| Saber quanto dinheiro está em custódia vs. disponível para saque | **Atendido** (`fato lido`, 2026-11-26) | Aba financeira e solicitação de saque (`POST /api/seller/payouts`) com snapshot de conta/carteira |

## 3. O que o operador (CellBox) reclama na operação diária

- **Dependência de aprovação manual diária** (`fato lido`, 2026-11-26): validar manualmente comprovativos de 100 MT (M-Pesa/e-Mola) e processar cada pedido de saque manualmente cria gargalo conforme o número de lojas cresce.

---

### Lido de fato
- Código-fonte e fluxos reais de `src/App.tsx`, `src/components/SellerDashboardView.tsx`, `src/server/app.ts` e `src/lib/db.ts`.
- Documentação de `licoes.md` da Fábrica DeskLabs (erros recorrentes de descoberta, telas vazias e aprovações manuais).

### Inferido ou não lido
- Não foram lidos comentários reais de compradores ou lojistas em redes sociais/WhatsApp do CellBox (**evidência indireta** baseada no mercado de Moçambique e na arquitetura atual do sistema).
