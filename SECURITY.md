# Segurança do OrçaFácil

## Estado da revisão

Revisão de segurança aplicada em outubro de 2026.

O frontend público usa somente a **Publishable Key** do Supabase. Nenhuma Secret Key/service_role foi encontrada na árvore atual do repositório durante a revisão.

## Controles aplicados

- Row Level Security (RLS) nas tabelas de aplicação.
- Policies limitadas ao papel `authenticated` e ao `auth.uid()` do usuário.
- Cliente, orçamento e item precisam pertencer ao mesmo usuário.
- A criação de orçamento usa RPC atômica para calcular número e totais no banco.
- Numeração por usuário usa lock transacional para evitar colisões por concorrência.
- O frontend não usa a Secret Key.
- O modo online não cai silenciosamente para dados locais quando uma conta está autenticada.
- Ao sair da conta, os dados online são removidos do estado em memória e o modo local é restaurado.
- Campos de texto e quantidade de itens possuem limites.
- Valores monetários são arredondados para centavos.
- Conteúdo inserido no histórico e no PDF é escapado antes de virar HTML.
- CSP foi adicionada às páginas web para restringir scripts, conexões e recursos.
- A biblioteca Supabase JS foi fixada em uma versão para evitar dependência flutuante do CDN.
- Arquivos de banco SQLite e configurações locais foram adicionados ao `.gitignore`.

## Segredos

Nunca coloque no frontend:

- `sb_secret_...`
- `service_role`
- tokens privados
- senhas
- credenciais de SMTP
- chaves de pagamento

A Publishable Key pode aparecer no frontend; ela não substitui RLS.

## Supabase

Depois de atualizar o schema, confirme no Dashboard:

1. Site URL apontando para a URL pública do OrçaFácil.
2. Redirect URL permitindo exatamente a página pública de autenticação.
3. Confirmação de e-mail conforme a política desejada.
4. SMTP de produção antes de depender de envio de e-mail em escala.

O limite do provedor de e-mail padrão pode bloquear testes repetidos de cadastro; isso é uma limitação do serviço, não uma falha do botão de cadastro.

## Limitações conhecidas

GitHub Pages é hospedagem estática. CSP em meta tag é uma camada adicional, mas não substitui headers HTTP de segurança fornecidos por uma hospedagem com controle de headers.

O PDF é gerado no navegador e não é uma prova de integridade do orçamento. A fonte de verdade do modo online é o banco.

Antes de cobrança real, o controle de assinatura deverá ficar no backend/webhook e nunca ser decidido pelo navegador.
