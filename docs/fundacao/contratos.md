# Contratos do Sistema — CellBox

Este documento reúne os contratos entre o frontend (`src/components/*`), a API (`src/server/app.ts`) e o banco de dados Neon PostgreSQL (`src/lib/db.ts`).

## 1. Tabelas PostgreSQL (`src/lib/db.ts`)

| Tabela | Responsabilidade | Chave / Isolamento |
|---|---|---|
| `users` | Contas (`admin`, `seller`, `buyer`), `password_hash`, morada | `id` (PK), `email`, `phone`, `seller_id` |
| `sellers` | Lojas oficiais, KYC, taxa de ativação, status, `payout_info` | `id` (PK), `owner_user_id` |
| `categories` | Categorias do marketplace | `name` (PK) |
| `products` | Catálogo de produtos das lojas | `id` (PK), `seller_id` |
| `orders` | Pedidos dos compradores, itens, pagamento e estado de custódia | `id` (PK), `buyer_id`, `seller_id` |
| `addresses` | Endereços guardados dos compradores | `id` (PK), `user_id` |
| `wishlists` | Lista de desejos por utilizador | `(user_id, product_id)` |
| `newsletter_subscribers` | Subscritores da newsletter | `email` (PK) |
| `contact_messages` | Mensagens enviadas pelo formulário de contacto | `id` (PK) |
| `platform_settings` | `commissionRate` e `siteCustomization` (segredos de gateways cifrados) | `key` (PK) |
| `uploaded_assets` | Metadados/ativos de upload | `key` (PK) |
| `reviews` | Avaliações de produtos e lojas | `id` (PK), `target_type`, `target_id` |
| `password_reset_tokens` | Tokens de recuperação de senha (hash + expiração) | `token_hash` (PK), `user_id` |
| `seller_payouts` | Pedidos de saque dos lojistas (Modo A) e revisão do Admin | `id` (PK), `seller_id` |

## 2. Interfaces Centrais (`src/types.ts`)

- `User`: `{ id, name, email, role: 'buyer' | 'seller' | 'admin', phone?, sellerId?, province?, city?, neighborhood?, zipCode? }`
- `SellerStore`: `{ id, ownerUserId, name, mainCategory, status: 'active' | 'pending' | 'suspended', verified, kyc, activation, payoutInfo }`
- `Product`: `{ id, sellerId, title, brand, category, condition, price, originalPrice?, stock, images, description, specs }`
- `Order`: `{ id, buyerId, items, total, status, paymentMethod, escrowStatus, createdAt }`
- `SellerPayoutRequest`: `{ id, sellerId, amount, method, destinationSummary, payoutSnapshot, status: 'pending' | 'paid' | 'rejected', transactionRef? }`
- `SiteCustomization`: `{ header, heroSlides, subBannersLayout, subBanners, wideBanner, partnerBrands, contact, footer, gateways }`

## 3. Rotas HTTP Principais (`src/server/app.ts`)

| Grupo | Rotas | Autorização |
|---|---|---|
| **Saúde & Bootstrap** | `GET /api/health`, `GET /api/bootstrap` | Público (payload sanitizado por papel) |
| **Autenticação** | `POST /api/auth/login` (rate limit `/64`), `POST /api/auth/register`, `POST /api/auth/logout`, `POST /api/auth/forgot-password` (resposta neutra), `POST /api/auth/reset-password`, `POST /api/auth/change-password` | Público / Sessão |
| **Produtos** | `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `POST /api/products/bulk`, `PATCH /api/products/:id`, `DELETE /api/products/:id` | Público (leitura) / `seller` dono (`requireRole`) |
| **Lojas & Ativação** | `POST /api/seller/kyc`, `POST /api/seller/activate-fee`, `PATCH /api/sellers/:id`, `PATCH /api/sellers/:id/status`, `PATCH /api/sellers/:id/kyc`, `PATCH /api/sellers/:id/fee` | `seller` dono ou `admin` (`requireRole`) |
| **Pedidos & Saques (Modo A)** | `POST /api/orders`, `PATCH /api/orders/:orderId/fulfillment`, `POST /api/seller/payouts`, `POST /api/admin/payouts/:id/review` | `buyer` / `seller` / `admin` (`requireRole`) |
| **CMS & Admin** | `POST /api/categories`, `DELETE /api/categories/:name`, `PATCH /api/commission`, `GET /api/site-customization`, `PUT /api/site-customization` | `admin` (`requireRole`) |
| **Webhooks** | `ALL /api/webhooks/paysuite`, `debitopay`, `mpesa`, `escalepay` | Segredo de webhook (`expectedSecret`) |

## 4. Variáveis de Ambiente (`.env.example`)

- **Obrigatórias em produção**: `DATABASE_URL`, `SESSION_SECRET` (e opcionalmente `ENCRYPTION_KEY` dedicada para cifragem de gateways).
- **Opcionais / Serviços externos**: `S3_BUCKET`, `AWS_REGION`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `MAIL_FROM`, `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
