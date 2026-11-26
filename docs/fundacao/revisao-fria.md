# Revisão Fria — CellBox (Fase 7)

- **Data**: 2026-11-26
- **Revisor**: Agente Revisor Frio Independente (sem contexto prévio do construtor)
- **Pergunta central**: *"Você lançaria isto amanhã?"*
- **Veredito inicial**: **Não** (7 bloqueadores identificados).

---

## Fechamento dos 7 Bloqueadores

| # | Bloqueador encontrado na Revisão Fria | Correção aplicada e verificação |
|---|---|---|
| 1 | Vazamento público de KYC, comprovativos e dados bancários em `GET /api/bootstrap` e `GET /api/sellers` + uploads/signed-url S3 abertos | Adicionado `sanitizeSellersForUser` em `src/server/security.ts` e aplicado em `buildBootstrapPayload` e `GET /api/sellers`; `POST /api/uploads` exige `requireRole`; rotas de assets/signed-url para caminhos `kyc`/`proof`/`fee` exigem `requireRole(['admin', 'seller'])`. Testado em `tests/security.test.ts`. |
| 2 | Vendedor podia avançar pedido para `'Entregue'` e liberar a própria custódia | `PATCH /api/orders/:orderId/fulfillment` em `src/server/app.ts` agora bloqueia `'Entregue'` para `seller` (`403`) e exige `buyer` dono do pedido ou `admin`. *(Integração real com gateways de pagamento segue em `nao-exercitado.md` até ativação de credenciais).* |
| 3 | Webhook EscalePay sem autenticação e `!status` tratado como pago | `ALL /api/webhooks/escalepay` e `handleDynamicGatewayWebhook` em `src/server/app.ts` agora falham fechado (`503`) se não houver segredo configurado, validam em tempo constante com `safeSecretEqual` e exigem status explícito de aprovação. |
| 4 | `escalePayWebhookSecret` gravado em texto claro em `platform_settings` | Incluído `escalePayWebhookSecret` em `transformGatewaySecrets` (`AES-256-GCM`) em `src/server/security.ts` e coberto em `tests/security.test.ts`. |
| 5 | Manipulação de estoque/vendas com quantidade negativa em `POST /api/orders` | `POST /api/orders` em `src/server/app.ts` agora valida `Number.isInteger(entry.quantity) && entry.quantity > 0 && entry.quantity <= entry.product.stock` e constrói `qtyByProduct` a partir dos grupos validados. |
| 6 | Mass assignment em `PATCH /api/products/:id` | Aplicada whitelist estrita de campos editáveis (`title`, `brand`, `category`, `condition`, `price`, `originalPrice`, `stock`, `description`, `images`, `specs`) em `src/server/app.ts`. |
| 7 | Cerca de papéis ausente, 15 comparações manuais de `.role` e resposta distinta em `forgot-password` | Todas as comparações manuais em `src/server/app.ts` substituídas por `requireRole`/`hasRole`, adicionada cerca real em `tests/fences/no-secrets-and-role-fence.test.ts`, e `POST /api/auth/forgot-password` uniformizado com mesma mensagem neutra e checagem prévia de SMTP/Resend. |

---

## Itens Importantes / Menores em Backlog (Não bloqueiam dia 1, registados para próximas entregas)
- Remover fallback padrão de `SESSION_SECRET` em produção exigindo variável obrigatória no ambiente Vercel.
- Endurecer `POST /api/seller/payouts` com transação/lock para evitar race condition de duplo saque.
- Filtrar `fulfillments` por vendedor em `listScopedOrders` (`src/lib/db.ts`) para pedidos multi-loja.
- Invalidar sessões antigas após `change-password` / `reset-password` via `tokenVersion`.
- Criar `README.md` na raiz e adicionar testes E2E de navegador no CI.
*(Corrigido também o bug SQL de 4 argumentos em `findUserByPhone` em `src/lib/db.ts` e removido telefone real de `docs/fundacao/prova-montada.md`.)*
