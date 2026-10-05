import tkinter as tk
from tkinter import messagebox, ttk
from datetime import date

from dados import (
    atualizar_pdf_orcamento,
    buscar_ou_criar_cliente,
    criar_banco,
    salvar_orcamento,
)
from historico import atualizar_pdf, buscar_orcamento, listar_orcamentos
from pdf import gerar_pdf


class OrcaFacilApp:
    def __init__(self, root):
        self.root = root
        self.root.title("OrçaFácil")
        self.root.geometry("720x520")
        self.root.minsize(650, 480)

        self.itens = []
        self.cliente_var = tk.StringVar()
        self.servico_var = tk.StringVar()
        self.valor_var = tk.StringVar()

        self.montar_interface()

    def montar_interface(self):
        ttk.Label(
            self.root,
            text="OrçaFácil",
            font=("TkDefaultFont", 20, "bold"),
        ).pack(pady=(18, 4))

        ttk.Label(
            self.root,
            text="Gerador simples de orçamentos",
        ).pack(pady=(0, 10))

        navegacao = ttk.Frame(self.root)
        navegacao.pack(fill="x", padx=20, pady=(0, 8))

        ttk.Button(
            navegacao,
            text="Novo orçamento",
            command=self.mostrar_novo_orcamento,
        ).pack(side="left")

        ttk.Button(
            navegacao,
            text="Histórico",
            command=self.abrir_historico,
        ).pack(side="left", padx=8)

        self.conteudo = ttk.Frame(self.root)
        self.conteudo.pack(fill="both", expand=True)

        self.montar_formulario()

    def montar_formulario(self):
        for widget in self.conteudo.winfo_children():
            widget.destroy()

        dados = ttk.LabelFrame(self.conteudo, text="Dados do cliente")
        dados.pack(fill="x", padx=20, pady=5)

        ttk.Label(dados, text="Cliente:").grid(
            row=0, column=0, padx=10, pady=12
        )

        ttk.Entry(
            dados,
            textvariable=self.cliente_var,
            width=55,
        ).grid(
            row=0, column=1, padx=10, pady=12, sticky="ew"
        )

        dados.columnconfigure(1, weight=1)

        servico = ttk.LabelFrame(self.conteudo, text="Adicionar item")
        servico.pack(fill="x", padx=20, pady=10)

        ttk.Label(servico, text="Descrição:").grid(
            row=0, column=0, padx=10, pady=10
        )

        ttk.Entry(
            servico,
            textvariable=self.servico_var,
            width=45,
        ).grid(
            row=0, column=1, padx=10, pady=10
        )

        ttk.Label(servico, text="Valor (R$):").grid(
            row=0, column=2, padx=10, pady=10
        )

        ttk.Entry(
            servico,
            textvariable=self.valor_var,
            width=12,
        ).grid(
            row=0, column=3, padx=10, pady=10
        )

        ttk.Button(
            servico,
            text="Adicionar",
            command=self.adicionar_item,
        ).grid(
            row=0, column=4, padx=10, pady=10
        )

        tabela_frame = ttk.LabelFrame(
            self.conteudo,
            text="Itens do orçamento",
        )
        tabela_frame.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=5,
        )

        self.tabela = ttk.Treeview(
            tabela_frame,
            columns=("descricao", "quantidade", "valor", "subtotal"),
            show="headings",
            height=9,
        )

        self.tabela.heading("descricao", text="Descrição")
        self.tabela.heading("quantidade", text="Qtd.")
        self.tabela.heading("valor", text="Unitário")
        self.tabela.heading("subtotal", text="Subtotal")

        self.tabela.column("descricao", width=350)
        self.tabela.column("quantidade", width=70, anchor="center")
        self.tabela.column("valor", width=100, anchor="e")
        self.tabela.column("subtotal", width=100, anchor="e")

        self.tabela.pack(fill="both", expand=True, padx=8, pady=8)

        rodape = ttk.Frame(self.conteudo)
        rodape.pack(fill="x", padx=20, pady=10)

        self.total_label = ttk.Label(
            rodape,
            text="Total: R$ 0,00",
            font=("TkDefaultFont", 13, "bold"),
        )
        self.total_label.pack(side="left")

        ttk.Button(
            rodape,
            text="Gerar orçamento PDF",
            command=self.gerar_orcamento,
        ).pack(side="right")

    def mostrar_novo_orcamento(self):
        self.montar_formulario()

    def abrir_historico(self):
        janela = tk.Toplevel(self.root)
        janela.title("Histórico de Orçamentos")
        janela.geometry("720x430")
        janela.minsize(650, 380)

        ttk.Label(
            janela,
            text="Histórico de Orçamentos",
            font=("TkDefaultFont", 16, "bold"),
        ).pack(pady=(15, 10))

        tabela = ttk.Treeview(
            janela,
            columns=("numero", "cliente", "data", "total", "status"),
            show="headings",
            height=14,
        )

        for coluna, titulo in (
            ("numero", "Nº"),
            ("cliente", "Cliente"),
            ("data", "Data"),
            ("total", "Total"),
            ("status", "Status"),
        ):
            tabela.heading(coluna, text=titulo)

        tabela.column("numero", width=60, anchor="center")
        tabela.column("cliente", width=260)
        tabela.column("data", width=100)
        tabela.column("total", width=110, anchor="e")
        tabela.column("status", width=100, anchor="center")

        tabela.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=10,
        )

        for numero, cliente, data, total, status in listar_orcamentos():
            data_exibicao = data
            if len(data) == 10 and data[4] == "-" and data[7] == "-":
                data_exibicao = f"{data[8:10]}/{data[5:7]}/{data[:4]}"

            tabela.insert(
                "",
                "end",
                iid=str(numero),
                values=(
                    numero,
                    cliente,
                    data_exibicao,
                    f"R$ {total:.2f}".replace(".", ","),
                    status,
                ),
            )

        botoes = ttk.Frame(janela)
        botoes.pack(fill="x", padx=20, pady=(0, 15))

        ttk.Button(
            botoes,
            text="Ver detalhes",
            command=lambda: self.ver_detalhes(tabela),
        ).pack(side="left")

        ttk.Button(
            botoes,
            text="Gerar PDF",
            command=lambda: self.gerar_pdf_historico(tabela),
        ).pack(side="left", padx=8)

        ttk.Button(
            botoes,
            text="Atualizar",
            command=lambda: self.atualizar_historico(tabela),
        ).pack(side="left", padx=8)

    def gerar_pdf_historico(self, tabela):
        selecionado = tabela.selection()

        if not selecionado:
            messagebox.showwarning(
                "Atenção",
                "Selecione um orçamento.",
            )
            return

        numero = int(selecionado[0])
        resultado = buscar_orcamento(numero)

        if not resultado:
            messagebox.showerror(
                "Erro",
                "Orçamento não encontrado.",
            )
            return

        orcamento, itens = resultado
        _, cliente, data, _, _, _, total, _ = orcamento

        data_exibicao = data
        if len(data) == 10 and data[4] == "-" and data[7] == "-":
            data_exibicao = f"{data[8:10]}/{data[5:7]}/{data[:4]}"

        servicos_pdf = [
            (descricao, subtotal)
            for descricao, _, _, subtotal in itens
        ]

        caminho = gerar_pdf(
            numero,
            cliente,
            servicos_pdf,
            total,
            data_exibicao,
        )

        atualizar_pdf(numero, caminho)

        messagebox.showinfo(
            "PDF gerado",
            f"PDF do orçamento #{numero} gerado com sucesso!\n\n"
            f"Arquivo:\n{caminho}",
        )

    def atualizar_historico(self, tabela):
        for item in tabela.get_children():
            tabela.delete(item)

        for numero, cliente, data, total, status in listar_orcamentos():
            data_exibicao = data
            if len(data) == 10 and data[4] == "-" and data[7] == "-":
                data_exibicao = f"{data[8:10]}/{data[5:7]}/{data[:4]}"

            tabela.insert(
                "",
                "end",
                iid=str(numero),
                values=(
                    numero,
                    cliente,
                    data_exibicao,
                    f"R$ {total:.2f}".replace(".", ","),
                    status,
                ),
            )

    def ver_detalhes(self, tabela):
        selecionado = tabela.selection()

        if not selecionado:
            messagebox.showwarning(
                "Atenção",
                "Selecione um orçamento.",
            )
            return

        numero = int(selecionado[0])
        resultado = buscar_orcamento(numero)

        if not resultado:
            messagebox.showerror(
                "Erro",
                "Orçamento não encontrado.",
            )
            return

        orcamento, itens = resultado
        (
            numero,
            cliente,
            data,
            validade,
            status,
            observacoes,
            total,
            pdf,
        ) = orcamento

        detalhes = tk.Toplevel(self.root)
        detalhes.title(f"Orçamento #{numero}")
        detalhes.geometry("620x400")

        ttk.Label(
            detalhes,
            text=f"Orçamento #{numero}",
            font=("TkDefaultFont", 16, "bold"),
        ).pack(pady=(15, 5))

        ttk.Label(
            detalhes,
            text=f"Cliente: {cliente} | Data: {data}",
        ).pack()

        tabela_itens = ttk.Treeview(
            detalhes,
            columns=("descricao", "quantidade", "unitario", "subtotal"),
            show="headings",
            height=10,
        )

        for coluna, titulo in (
            ("descricao", "Descrição"),
            ("quantidade", "Qtd."),
            ("unitario", "Unitário"),
            ("subtotal", "Subtotal"),
        ):
            tabela_itens.heading(coluna, text=titulo)

        tabela_itens.column("descricao", width=280)
        tabela_itens.column("quantidade", width=70, anchor="center")
        tabela_itens.column("unitario", width=100, anchor="e")
        tabela_itens.column("subtotal", width=100, anchor="e")

        tabela_itens.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=12,
        )

        for descricao, quantidade, unitario, subtotal in itens:
            tabela_itens.insert(
                "",
                "end",
                values=(
                    descricao,
                    quantidade,
                    f"R$ {unitario:.2f}".replace(".", ","),
                    f"R$ {subtotal:.2f}".replace(".", ","),
                ),
            )

        ttk.Label(
            detalhes,
            text=f"Total: R$ {total:.2f}".replace(".", ","),
            font=("TkDefaultFont", 13, "bold"),
        ).pack(pady=(0, 10))

        ttk.Button(
            detalhes,
            text="Fechar",
            command=detalhes.destroy,
        ).pack(pady=(0, 12))

    def adicionar_item(self):
        descricao = self.servico_var.get().strip()
        texto_valor = self.valor_var.get().strip().replace(",", ".")

        if not descricao:
            messagebox.showwarning(
                "Atenção",
                "Digite a descrição do serviço.",
            )
            return

        try:
            valor = float(texto_valor)
            if valor < 0:
                raise ValueError
        except ValueError:
            messagebox.showerror(
                "Valor inválido",
                "Digite um valor numérico, como 150,00.",
            )
            return

        item = {
            "descricao": descricao,
            "quantidade": 1,
            "valor_unitario": valor,
            "subtotal": valor,
        }

        self.itens.append(item)

        self.tabela.insert(
            "",
            "end",
            values=(
                descricao,
                "1",
                f"R$ {valor:.2f}".replace(".", ","),
                f"R$ {valor:.2f}".replace(".", ","),
            ),
        )

        self.servico_var.set("")
        self.valor_var.set("")
        self.atualizar_total()

    def atualizar_total(self):
        total = sum(item["subtotal"] for item in self.itens)
        self.total_label.config(
            text=f"Total: R$ {total:.2f}".replace(".", ",")
        )

    def gerar_orcamento(self):
        cliente = self.cliente_var.get().strip()

        if not cliente:
            messagebox.showwarning(
                "Atenção",
                "Digite o nome do cliente.",
            )
            return

        if not self.itens:
            messagebox.showwarning(
                "Atenção",
                "Adicione pelo menos um item.",
            )
            return

        data = date.today().strftime("%Y-%m-%d")
        data_exibicao = date.today().strftime("%d/%m/%Y")

        cliente_id = buscar_ou_criar_cliente(
            nome=cliente,
            criado_em=data,
        )

        numero = salvar_orcamento(
            cliente_id=cliente_id,
            data=data,
            itens=self.itens,
            validade_dias=7,
            status="emitido",
        )

        total = sum(item["subtotal"] for item in self.itens)

        servicos_pdf = [
            (item["descricao"], item["subtotal"])
            for item in self.itens
        ]

        caminho = gerar_pdf(
            numero,
            cliente,
            servicos_pdf,
            total,
            data_exibicao,
        )

        atualizar_pdf_orcamento(numero, caminho)

        messagebox.showinfo(
            "Orçamento criado",
            f"Orçamento #{numero} criado com sucesso!\n\n"
            f"Arquivo:\n{caminho}",
        )


if __name__ == "__main__":
    criar_banco()

    root = tk.Tk()
    app = OrcaFacilApp(root)
    root.mainloop()
