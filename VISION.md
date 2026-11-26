# VISION.md — Visão do Produto CellBox

## Tese
O **CellBox** permite que compradores e vendedores em Moçambique realizem transações comerciais digitais com confiança: o comprador recebe o produto exatamente como anunciado antes de o dinheiro ser libertado, e o vendedor recebe repasses auditáveis sem precisar de construir infraestrutura técnica própria.

## Nome e Significado
**CellBox**: nascido originalmente para comércio de telemóveis e tecnologia, evoluído para uma caixa modular de lojas verificadas multivendedor (Tecnologia, Beleza e Moda).

## Crenças
1. Comércio local precisa de pagamentos móveis nativos (M-Pesa, e-Mola, PaySuite, Debito Pay) integrados à experiência de compra.
2. Custódia de pagamento (Modo A: pagamento retido até confirmação de entrega) reduz fraude nos dois lados.
3. Lojistas devem gerir catálogo, pedidos e saques sem depender de código nem de suporte técnico diário.

## Públicos
- **Compradores em Moçambique**: procuram lojas verificadas e pagamento seguro.
- **Vendedores / Lojas Oficiais**: precisam de vitrine pública, gestão de stock, pedidos e solicitação de saques.
- **Operador / Super Admin**: gere KYC, taxa de ativação, comissões, CMS da vitrine, gateways e aprovação de repasses.

## Modelo
Marketplace multivendedor comercial SaaS (hospedado em Vercel + Neon PostgreSQL) com comissão por transação e custódia de repasses aos lojistas.

## Antiobjetivos e os Três Tipos de "Não"
- **Fora da fundação (agora)**: entrega automática via API de transportadoras externas (hoje o envio é gerido pelo lojista e confirmado pelo comprador — revisão em painel).
- **Fora do horizonte (médio prazo)**: app nativo iOS/Android separado (mantemos PWA/web responsivo com Flexbox; ver `index.html`).
- **Fora para sempre**: armazenar dados de catálogo em ficheiros estáticos/mock dentro do código-fonte (guardado pela arquitetura DB-first em `src/lib/db.ts` e revisão) ou gravar chaves secretas de pagamento em texto claro (guardado por `tests/security.test.ts`).

## Norte
Qualquer loja verificada em Moçambique consegue abrir conta, ativar a vitrine, vender com M-Pesa/e-Mola e receber o repasse com trilha completa de auditoria.
