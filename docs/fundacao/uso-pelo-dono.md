# Uso pelo Dono — CellBox (Fase 9)

- **Data**: 2026-11-26
- **Ambiente testado pelo dono**: `https://cellbox-psi.vercel.app` (produção ligada ao Neon PostgreSQL)

## Fluxos validados pelo dono
1. **Vitrine pública**: navegação pelos 3 hero slides, 3 banners lado a lado, categorias e lojas verificadas (**Tech258**, **Wil Shop** e **Lara Fashion**).
2. **Painel Super Admin**: acesso administrativo, conferência do CMS e gateways de pagamento, e botão **"Ver Loja Pública"**.
3. **Painel Lojista**: acesso à loja, gestão de catálogo/produtos e consulta financeira.

## Resultado
- **Travamentos reportados**: nenhum (`sim`, confirmado pelo dono em 2026-11-26).
- **Observação operacional**: configurar `SESSION_SECRET`, `ENCRYPTION_KEY` e credenciais de produção dos gateways (PaySuite / Debito Pay / M-Pesa / e-Mola / EscalePay) e e-mail (Resend/SMTP) na Vercel quando ativar pagamentos reais — itens já rastreados em [nao-exercitado.md](nao-exercitado.md).
