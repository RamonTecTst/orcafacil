# Sprint 1 — Fundação do SaaS

## Decisão técnica inicial

O OrçaFácil será preparado para **PostgreSQL + autenticação + RLS**, com Supabase como candidato inicial para acelerar o MVP.

O repositório agora contém um schema inicial em:

`supabase/schema.sql`

Ele separa os dados por usuário e já inclui Row Level Security (RLS).

## O que o schema resolve

- Empresa vinculada a uma conta.
- Clientes vinculados ao dono.
- Orçamentos vinculados ao dono.
- Itens vinculados aos respectivos orçamentos.
- Numeração de orçamento única por usuário.
- Status de orçamento.
- Integridade por foreign keys.
- Proteção de acesso por RLS.

## Próxima implementação

1. Criar o projeto Supabase.
2. Executar `supabase/schema.sql`.
3. Configurar autenticação por e-mail.
4. Criar `web/config.js` localmente a partir de `config.example.js`.
5. Integrar login/cadastro.
6. Substituir leitura/escrita de `localStorage` por consultas ao banco.
7. Manter o modo local apenas como fallback de desenvolvimento.
8. Testar duas contas diferentes e confirmar que uma nunca consegue enxergar os dados da outra.

## Regra de segurança

A chave `service_role` nunca deve ir para o frontend.

O navegador poderá usar somente a chave pública do projeto. As políticas RLS devem continuar ativas.

## Critério de conclusão da Sprint 1

Um usuário deve conseguir:

```
Cadastrar conta
    ↓
Entrar
    ↓
Cadastrar empresa
    ↓
Cadastrar cliente
    ↓
Criar orçamento
    ↓
Sair
    ↓
Entrar novamente
    ↓
Encontrar os mesmos dados
```

E uma segunda conta deve enxergar somente os próprios dados.
