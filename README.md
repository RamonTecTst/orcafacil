# OrçaFácil

SaaS mobile-first para criação, organização e envio de orçamentos para pequenos prestadores de serviço.

## Objetivo do projeto

A estratégia do OrçaFácil é **lançar rápido, validar com clientes pagantes e evoluir usando a receita do próprio produto**.

O objetivo inicial não é construir uma plataforma gigante. O primeiro produto comercial precisa resolver muito bem:

**criar orçamento → gerar PDF → guardar histórico → compartilhar com o cliente → vender o serviço.**

## Estado atual

O projeto desktop em Python/Tkinter foi congelado como protótipo.

O produto principal agora é o **web app mobile-first** em `web/`.

O protótipo atual já possui:

- interface responsiva;
- dados da empresa;
- dados do cliente;
- múltiplos itens;
- quantidade e valor unitário;
- cálculo automático;
- condições comerciais;
- histórico;
- detalhes e exclusão;
- geração de PDF pelo navegador;
- armazenamento local com `localStorage`.

> O `localStorage` é temporário e serve apenas para validar a experiência. Ele não será usado como armazenamento definitivo do SaaS comercial.

## Arquitetura comercial planejada

A evolução seguirá esta ordem:

```
Frontend mobile
      ↓
Conta do usuário / autenticação
      ↓
Backend / API
      ↓
Banco de dados centralizado
      ↓
Assinatura e controle de acesso
      ↓
Produto comercial
```

O banco central deverá separar, no mínimo:

- usuários;
- empresas;
- clientes;
- orçamentos;
- itens de orçamento;
- assinaturas;
- plano do usuário.

Cada usuário deverá acessar somente os próprios dados.

## Planos planejados para o lançamento

| Plano | Preço mensal | Posicionamento |
|---|---:|---|
| Essencial | R$ 19,90 | Para começar |
| Profissional | R$ 39,90 | **Mais escolhido** |
| MAX | R$ 79,90 | Para quem quer o processo comercial completo |

Os preços são **hipóteses de lançamento**, não uma promessa definitiva. Serão validados com os primeiros clientes. O modelo editável de custos, margens e ponto de equilíbrio está em [`docs/modelo-custos-e-precos.md`](docs/modelo-custos-e-precos.md).

## Regra de desenvolvimento

Não construir funcionalidades caras antes de validar a demanda.

Prioridade:

1. produto funcional;
2. contas e banco centralizado;
3. assinatura;
4. primeiros clientes pagantes;
5. melhorias baseadas no uso real;
6. recursos avançados.

Recursos como IA, WhatsApp automatizado, assinatura digital, dashboard avançado e multiusuário entram depois da validação comercial.

## Roadmap de lançamento

### Fase 1 — MVP comercial
- [x] Protótipo mobile
- [x] PDF
- [x] Histórico
- [x] Dados da empresa
- [ ] Cadastro de clientes reutilizáveis
- [ ] Edição de orçamento
- [ ] Backend
- [ ] Banco centralizado
- [ ] Login
- [ ] Controle de acesso

### Fase 2 — Monetização
- [ ] Página de preços
- [ ] Teste grátis
- [ ] Integração de pagamento recorrente
- [ ] Assinaturas
- [ ] Limites por plano
- [ ] Tela de conta/assinatura

### Fase 3 — Lançamento
- [ ] Migrar o frontend para hospedagem compatível com SaaS comercial (GitHub Pages não é adequado para essa finalidade)
- [ ] Confirmar custos reais de hospedagem, e-mail, cobrança e contabilidade
- [ ] Domínio próprio
- [ ] Landing page
- [ ] Termos e política de privacidade
- [ ] Monitoramento de erros
- [ ] Primeiros clientes pagantes

### Fase 4 — Evolução pós-venda
- [ ] Link público do orçamento
- [ ] Aprovação online
- [ ] Compartilhamento otimizado por WhatsApp
- [ ] Desconto
- [ ] Produtos/serviços cadastrados
- [ ] Dashboard
- [ ] IA
- [ ] Assinatura digital
- [ ] Multiusuário

## Princípio

**Lançar cedo. Cobrar cedo. Aprender cedo. Melhorar com dados reais.**
