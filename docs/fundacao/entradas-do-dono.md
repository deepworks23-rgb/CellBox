# Entradas do Dono — Fundação CellBox

- **Data**: 2026-11-26
- **Fase**: 1. Entradas do dono

## 1. O problema e para quem (nas palavras do dono)

> "A CellBox trabalha para anunciar a plataforma, conseguir lojistas e revendedores a aderir à plataforma, e anuncia as lojas para atrair compradores; e a CellBox ganha com comissões e taxa de inscrições."

- **Público comprador**: encontra lojas verificadas, compara produtos de tecnologia, beleza e moda, e compra com pagamento protegido.
- **Público lojista / revendedor**: adere pagando a taxa de inscrição/ativação, publica catálogo (manual ou CSV) e recebe visibilidade na vitrine oficial.
- **Dono / Operador (CellBox)**: ganha com a **taxa de inscrição** dos lojistas e **comissão** sobre as vendas concretizadas.

## 2. Parceiro de distribuição

- **Decisão**: **Não há parceiro.**
- **Efeito na conformidade**: os itens da seção 2 (`2.1` a `2.5`, `2.17` a `2.19`) e da seção 14 (`14.11`) referentes a parceiro de infraestrutura ficam marcados como **não se aplica**.

## 3. A casa (repositório e licença)

- **Conta / Repositório no GitHub**: `deepworks23-rgb/CellBox`
- **Modelo de código**: **Proprietário / Privado (`All Rights Reserved`)** — opção 1 selecionada pelo dono.

---

## 4. Resultado do Teste de Entrada (Capítulo 02)

| Pergunta | Resultado | Análise para o CellBox |
|---|---|---|
| 1. Economiza ou gera dinheiro para quem usa? | **Sim** | Gera vendas e vitrine pronta para lojistas/revendedores, e receita direta (taxa + comissão) para a CellBox. |
| 2. Surpreende numa demonstração? | **Sim** | Vitrine pública ao vivo (`https://cellbox-psi.vercel.app`) com lojas reais, slides, banners e painéis dedicados. |
| 3. Tem motivo para ficar ligado o tempo todo? | **Sim** | Loja online 24/7 com pedidos, custódia e notificações contínuas. |
| 4. Outra pessoa consegue vender a instalação? | **Não se aplica / Parcial** | Modelo SaaS comercial único (não revenda de código/instalação), mas terceiros podem aderir como lojistas/revendedores na plataforma. |
| 5. Mantém-se sem o dono disponível todo dia? *(eliminatória)* | **Atenção** | Hoje **taxa de inscrição (100 MT)**, **KYC** e **repasses/saques** exigem aprovação manual no Super Admin. |

### Recomendação sobre a 5ª pergunta (eliminatória)
Para que o negócio escale sem exigir a presença diária do dono para cada aprovação simples:
- **Curto prazo**: manter aprovação humana apenas para **KYC** (primeira entrada do lojista) e **saques manuais** acima de um valor de risco.
- **Próximo passo recomendado (Fase 3 / Evolução)**: automatizar a confirmação da **taxa de inscrição** e dos **pedidos** via webhook automático (PaySuite / Debito Pay / M-Pesa API) assim que as credenciais de produção forem configuradas no painel Admin.
