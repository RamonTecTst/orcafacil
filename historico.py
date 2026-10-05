from dados import conectar


def listar_orcamentos():
    with conectar() as conn:
        return conn.execute(
            """
            SELECT
                o.id,
                c.nome,
                o.data,
                o.total,
                o.status
            FROM orcamentos AS o
            INNER JOIN clientes AS c
                ON o.cliente_id = c.id
            ORDER BY o.id DESC
            """
        ).fetchall()


def buscar_orcamento(orcamento_id):
    with conectar() as conn:
        orcamento = conn.execute(
            """
            SELECT
                o.id,
                c.nome,
                o.data,
                o.validade_dias,
                o.status,
                o.observacoes,
                o.total,
                o.pdf
            FROM orcamentos AS o
            INNER JOIN clientes AS c
                ON o.cliente_id = c.id
            WHERE o.id = ?
            """,
            (orcamento_id,),
        ).fetchone()

        if not orcamento:
            return None

        itens = conn.execute(
            """
            SELECT
                descricao,
                quantidade,
                valor_unitario,
                subtotal
            FROM itens_orcamento
            WHERE orcamento_id = ?
            ORDER BY id
            """,
            (orcamento_id,),
        ).fetchall()

        return orcamento, itens


def atualizar_pdf(orcamento_id, caminho):
    with conectar() as conn:
        conn.execute(
            "UPDATE orcamentos SET pdf = ? WHERE id = ?",
            (caminho, orcamento_id),
        )
