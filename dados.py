import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("orcafacil.db")


def conectar():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def criar_banco():
    with conectar() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                telefone TEXT,
                email TEXT,
                endereco TEXT,
                criado_em TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS orcamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente_id INTEGER NOT NULL,
                data TEXT NOT NULL,
                validade_dias INTEGER NOT NULL DEFAULT 7,
                status TEXT NOT NULL DEFAULT 'rascunho',
                observacoes TEXT,
                total REAL NOT NULL DEFAULT 0,
                pdf TEXT,
                FOREIGN KEY (cliente_id)
                    REFERENCES clientes(id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS itens_orcamento (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                orcamento_id INTEGER NOT NULL,
                descricao TEXT NOT NULL,
                quantidade REAL NOT NULL DEFAULT 1,
                valor_unitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (orcamento_id)
                    REFERENCES orcamentos(id)
                    ON DELETE CASCADE
            )
        """)


def buscar_ou_criar_cliente(nome, telefone="", email="", endereco="", criado_em=""):
    with conectar() as conn:
        cliente = conn.execute(
            "SELECT id FROM clientes WHERE nome = ? COLLATE NOCASE LIMIT 1",
            (nome,),
        ).fetchone()

        if cliente:
            return cliente[0]

        cursor = conn.execute(
            """
            INSERT INTO clientes (nome, telefone, email, endereco, criado_em)
            VALUES (?, ?, ?, ?, ?)
            """,
            (nome, telefone, email, endereco, criado_em),
        )
        return cursor.lastrowid


def salvar_orcamento(
    cliente_id,
    data,
    itens,
    validade_dias=7,
    status="emitido",
    observacoes="",
):
    total = sum(item["subtotal"] for item in itens)

    with conectar() as conn:
        cursor = conn.execute(
            """
            INSERT INTO orcamentos (
                cliente_id, data, validade_dias, status, observacoes, total
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (cliente_id, data, validade_dias, status, observacoes, total),
        )
        orcamento_id = cursor.lastrowid

        conn.executemany(
            """
            INSERT INTO itens_orcamento (
                orcamento_id, descricao, quantidade, valor_unitario, subtotal
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (
                    orcamento_id,
                    item["descricao"],
                    item["quantidade"],
                    item["valor_unitario"],
                    item["subtotal"],
                )
                for item in itens
            ],
        )

        return orcamento_id


def atualizar_pdf_orcamento(orcamento_id, caminho):
    with conectar() as conn:
        conn.execute(
            "UPDATE orcamentos SET pdf = ? WHERE id = ?",
            (caminho, orcamento_id),
        )
