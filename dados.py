import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("orcafacil.db")

def conectar():
    return sqlite3.connect(DB_PATH)

def criar_banco():
    with conectar() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS orcamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente TEXT NOT NULL,
                servico TEXT NOT NULL,
                valor REAL NOT NULL,
                data TEXT NOT NULL,
                pdf TEXT
            )
        """)

def salvar_orcamento(cliente, servico, valor, data, pdf=""):
    with conectar() as conn:
        cursor = conn.execute(
            "INSERT INTO orcamentos (cliente, servico, valor, data, pdf) VALUES (?, ?, ?, ?, ?)",
            (cliente, servico, valor, data, pdf),
        )
        return cursor.lastrowid
