# Prova Montada — CellBox (Fase 6)

- **Data da execução**: 2026-11-26
- **Alvo executado**: `https://cellbox-psi.vercel.app` (produção ligada ao Neon PostgreSQL)

## 1. Portão da Fase 5 (Verificação local)
- `npm run lint` (`tsc --noEmit`): **0 erros**
- `npm test` (`tests/security.test.ts` + `tests/fences/no-secrets-and-role-fence.test.ts`): **6/6 aprovados**
- `npm run build` (`vite build`): **concluído** (`dist/assets/index-Bx6LyArC.js`)

## 2. Saída lida da Prova Montada (Entradas reais da API)

| Entrada / Rota | Método | Resultado Observado | Evidência |
|---|---|---|---|
| `/api/health` | `GET` | `200 OK` | `{"ok":true,"database":"postgresql","users":5,"sellers":3,"products":30,"categories":14}` |
| `/api/bootstrap` | `GET` | `200 OK` | `slides=3 banners=3 layout=3-cols sellers=3 products=30` |
| `/api/auth/forgot-password` (e-mail inexistente) | `POST` | `200 OK` (resposta neutra, sem enumeração) | `{"ok":true,"message":"Se existir uma conta registada com este e-mail..."}` |
| `/api/categories` (sem token) | `POST` | `401 Unauthorized` (`requireRole`) | `{"error":"Autenticação necessária para aceder a este recurso."}` |
| `/api/auth/login` (Admin) | `POST` | `200 OK` | `role=admin tokenPresent=true` |
| `/api/site-customization` (Bearer Admin) | `GET` | `200 OK` | `slides=3` |

## 3. 2ª Rodada — Repetição após Revisão Fria (Commit `aa21707`)
- **Data**: 2026-11-26 (`https://cellbox-psi.vercel.app`)
- `GET /api/health` → `200 OK` (`users: 5`, `sellers: 3`, `products: 30`, `categories: 14`)
- `GET /api/bootstrap` (anónimo) → `sellers: 3`, **`PII_LEAKED: false`** (`documentId`, `kyc.documentNumber`, `payoutInfo.accountNumber` e `activation.feeTransactionId` sanitizados)
- `POST /api/uploads` (anónimo) → `401 Unauthorized`
- `POST /api/webhooks/escalepay` (sem segredo configurado) → `503 Service Unavailable` (falha fechada)

## 4. O que ficou em modo simulado / não exercitado
- Fluxos externos de pagamento com dinheiro real (PaySuite, Debito Pay, M-Pesa/e-Mola) e envio de e-mail transacional estão listados em [nao-exercitado.md](nao-exercitado.md).
