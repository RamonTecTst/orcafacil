# OrçaFácil

Aplicativo desktop em Python para criar orçamentos em PDF de forma simples.

## v0.1 — Primeiro protótipo

- Cadastro do cliente
- Adição de vários serviços
- Cálculo automático do total
- Geração de orçamento em PDF
- Salvamento dos dados em SQLite
- Numeração automática dos orçamentos

## Tecnologias

- Python
- Tkinter
- SQLite
- ReportLab
- Git/GitHub

## Como executar

1. Instale Python 3.
2. Abra um terminal na pasta do projeto.
3. Instale a dependência:

```bash
pip install -r requirements.txt
```

4. Execute:

```bash
python main.py
```

Os PDFs serão salvos na pasta `orcamentos/`.

## Estrutura

```text
orcafacil/
├── main.py
├── dados.py
├── pdf.py
├── requirements.txt
└── README.md
```

## Próximos passos

- Histórico de orçamentos na interface
- Editar e excluir orçamentos
- Cadastro dos dados da empresa
- Logo e identidade visual
- Validade do orçamento
- Melhor acabamento do PDF
- Empacotar como aplicativo executável
