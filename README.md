# OrçaFácil

Sistema de criação de orçamentos pensado para pequenos prestadores de serviço.

## Direção atual

O projeto desktop em Python/Tkinter foi congelado como protótipo. O desenvolvimento principal passa a ser **mobile-first**, para que o usuário consiga criar e enviar orçamentos pelo celular.

## Protótipo Web Mobile

A primeira versão web fica em `web/`:

- Interface responsiva para celular e PC
- Cadastro básico do cliente
- Adição de vários itens
- Quantidade e valor unitário
- Cálculo automático do total
- Validade do orçamento
- Observações
- Histórico de orçamentos
- Visualização de detalhes
- Exclusão de orçamento
- Geração de PDF no navegador
- Armazenamento local no navegador com `localStorage`

### Teste

A interface web pode ser publicada pelo GitHub Pages. Depois de habilitar o Pages para a branch `main`, abra:

`https://ramontecst.github.io/orcafacil/web/`

> Substitua o espaço do endereço por nada: `ramontectst.github.io`.

## Arquitetura

### Protótipo desktop
- Python
- Tkinter
- SQLite
- ReportLab

Arquivos principais:

```
main.py
dados.py
historico.py
pdf.py
requirements.txt
```

### Protótipo mobile
- HTML
- CSS
- JavaScript
- jsPDF
- localStorage

Arquivos:

```
web/
├── index.html
├── style.css
└── app.js
```

## Próxima arquitetura de produção

O protótipo mobile usa `localStorage` apenas para validar a experiência de uso. Para um produto comercial, os dados deverão migrar para um backend com banco de dados centralizado, permitindo:

- conta do usuário;
- sincronização entre celular e PC;
- histórico permanente;
- backup;
- clientes cadastrados;
- edição de orçamentos;
- compartilhamento;
- controle de acesso;
- planos gratuito e pago.

## Roadmap

- [x] Protótipo desktop
- [x] Banco relacional inicial
- [x] Histórico desktop
- [x] Regeneração de PDF
- [x] Primeiro protótipo web mobile
- [ ] Teste real pelo celular
- [ ] Melhorar experiência mobile
- [ ] Cadastro completo de clientes
- [ ] Edição de orçamentos
- [ ] Compartilhamento por WhatsApp
- [ ] Backend e banco centralizado
- [ ] Login e contas
- [ ] PWA instalável
- [ ] Modelo comercial
