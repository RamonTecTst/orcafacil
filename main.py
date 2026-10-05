import tkinter as tk
from tkinter import messagebox, ttk
from datetime import date

from dados import (
    atualizar_pdf_orcamento,
    buscar_ou_criar_cliente,
    criar_banco,
    salvar_orcamento,
)
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
        ).pack(pady=(0, 15))

        dados = ttk.LabelFrame(self.root, text="Dados do cliente")
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

        servico = ttk.LabelFrame(self.root, text="Adicionar item")
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

        tabela_frame = ttk.LabelFrame(self.root, text="Itens do orçamento")
        tabela_frame.pack(fill="both", expand=True, padx=20, pady=5)

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

        rodape = ttk.Frame(self.root)
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
