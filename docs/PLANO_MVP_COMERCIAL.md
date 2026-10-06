# Plano de execução — OrçaFácil MVP comercial

## Meta

Sair do protótipo local e chegar a um produto que possa receber usuários pagantes sem depender do armazenamento do navegador.

## Sprint 1 — Fundação

### Entregável
Sistema preparado para contas de usuário e dados persistentes.

### Tarefas
1. Escolher backend e banco.
2. Criar schema multiusuário.
3. Criar autenticação.
4. Associar empresa ao usuário.
5. Migrar clientes e orçamentos para o banco.
6. Manter o frontend mobile-first.

### Critério de pronto
Um usuário consegue entrar em uma conta e encontrar seus dados em outro dispositivo.

## Sprint 2 — Orçamento comercial

### Entregável
Fluxo completo de criação e gerenciamento.

### Tarefas
1. Cadastro reutilizável de clientes.
2. Seleção de cliente no orçamento.
3. Edição de orçamento.
4. Exclusão segura.
5. Numeração por conta.
6. PDF usando os dados persistidos.

## Sprint 3 — Monetização

### Entregável
Primeira versão comercial.

### Tarefas
1. Landing page.
2. Página de planos.
3. Teste grátis.
4. Checkout recorrente.
5. Webhook de pagamento.
6. Status da assinatura no backend.
7. Middleware de acesso por plano.
8. Tela de assinatura.

### Regra de segurança
Nunca confiar no frontend para decidir se o usuário pagou. O backend deve ser a fonte de verdade da assinatura.

## Sprint 4 — Lançamento

### Entregável
Produto publicável e vendável.

### Tarefas
1. Domínio.
2. HTTPS.
3. Política de privacidade.
4. Termos de uso.
5. Página de suporte.
6. Monitoramento de erros.
7. Teste com usuários reais.
8. Primeiros clientes pagantes.

## Pós-lançamento

Construir somente o que aumentar:

- ativação;
- retenção;
- conversão;
- ticket médio;
- economia de tempo;
- quantidade de orçamentos enviados;
- taxa de aprovação.

### Regra

Se uma funcionalidade não ajudar o usuário ou o negócio, ela espera.
