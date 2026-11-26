# Governança do CellBox

## Papéis e Autoridade
- **Dono do Produto**: `deepworks23-rgb` — aprova decisões de negócio, modelo financeiro (comissões, taxa de inscrição, gateways), regras de privacidade e publicação em produção.
- **Manutenção Técnica**: alterações entram em `main` apenas após passar pelo CI obrigatório (`npm run lint && npm test && npm run build`) definido em `.github/workflows/ci.yml`.
- **Mudanças sensíveis (segurança, autenticação, custódia e repasses)**: exigem revisão independente antes de ir para produção.

## Regras de Produto (com o porquê)
1. **Dados de negócio vivem apenas no Neon PostgreSQL**: nunca restaurar listas estáticas/mock de lojas ou produtos em `src/` para evitar divergência entre código e produção.
2. **Nenhuma loja entra na vitrine pública sem validação completa**: KYC aprovado + taxa de inscrição validada + status `active` (`isStorePubliclyActive`), prevenindo fraude contra compradores.
3. **Segredos de pagamento nunca são gravados em texto claro nem expostos ao cliente**: cifragem `AES-256-GCM` em repouso (`src/lib/db.ts`) e sanitização por papel antes de enviar `siteCustomization` ao frontend (`src/server/app.ts`).
4. **Ações irreversíveis exigem confirmação e trilha**: aprovação/rejeição de saques, suspensão de lojas e remoção de produtos registam referência e responsável.
5. **Zero dados pessoais reais em testes ou exemplos**: usar apenas dados fictícios em `tests/` e documentação.

## Pedidos de Decisão
Quando uma decisão depender do dono:
- Apresentar **contexto**, **opções com custo** e **recomendação padrão** (que passa a valer se não houver resposta em **7 dias**, exceto para mudanças financeiras ou de segurança que falham fechado).
