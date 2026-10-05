import sqlite3
import tkinter as tk
from tkinter import messagebox, ttk
from datetime import date

from dados import criar_banco, salvar_orcamento
from pdf import gerar_pdf

class OrcaFacilApp:
    def __init__(self, root):
        self.root = root
        self.root.title("OrçaFácil")
        self.root.geometry("720x520")
        self.root.minsize(650, 480)

        self.servicos = []
        self.cliente_var = tk.StringVar()
        self.servico_var = tk.StringVar()
        self.valor_var = tk.StringVar()
        self.montar_interface()

    def montar_interface(self):
        ttk.Label(self.root, text="OrçaFácil",
                  font=("TkDefaultFont", 20, "bold")).pack(pady=(18, 4))
        ttk.Label(self.root, text="Gerador simples de orçamentos").pack(pady=(0, 15))

        dados = ttk.LabelFrame(self.root, text="Dados do cliente")
        dados.pack(fill="x", padx=20, pady=5)
        ttk.Label(dados, text="Cliente:").grid(row=0, column=0, padx=10, pady=12)
        ttk.Entry(dados, textvariable=self.cliente_var, width=55).grid(
            row=0, column=1, padx=10, pady=12, sticky="ew")
        dados.columnconfigure(1, weight=1)

        servico = ttk.LabelFrame(self.root, text="Adicionar serviço")
        servico.pack(fill="x", padx=20, pady=10)
        ttk.Label(servico, text="Descrição:").grid(row=0, column=0, padx=10, pady=10)
        ttk.Entry(servico, textvariable=self.servico_var, width=45).grid(
            row=0, column=1, padx=10, pady=10)
        ttk.Label(servico, text="Valor (R$):").grid(row=0, column=2, padx=10, pady=10)
        ttk.Entry(servico, textvariable=self.valor_var, width=12).grid(
            row=0, column=3, padx=10, pady=10)
        ttk.Button(servico, text="Adicionar",
                   command=self.adicionar_servico).grid(row=0, column=4, padx=10, pady=10)

        tabela_frame = ttk.LabelFrame(self.root, text="Itens do orçamento")
        tabela_frame.pack(fill="both", expand=True, padx=20, pady=5)
        self.tabela = ttk.Treeview(tabela_frame, columns=("descricao", "valor"),
                                   show="headings", height=9)
        self.tabela.heading("descricao", text="Descrição")
        self.tabela.heading("valor", text="Valor")
        self.tabela.column("descricao", width=480)
        self.tabela.column("valor", width=120, anchor="e")
        self.tabela.pack(fill="both", expand=True, padx=8, pady=8)

        rodape = ttk.Frame(self.root)
        rodape.pack(fill="x", padx=20, pady=10)
        self.total_label = ttk.Label(
            rodape, text="Total: R$ 0,00", font=("TkDefaultFont", 13, "bold"))
        self.total_label.pack(side="left")
        ttk.Button(rodape, text="Gerar orçamento PDF",
                   command=self.gerar_orcamento).pack(side="right")

    def adicionar_servico(self):
        descricao = self.servico_var.get().strip()
        texto_valor = self.valor_var.get().strip().replace(",", ".")
        if not descricao:
            messagebox.showwarning("Atenção", "Digite a descrição do serviço.")
            return
        try:
            valor = float(texto_valor)
            if valor < 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Valor inválido",
                                 "Digite um valor numérico, como 150,00.")
            return
        self.servicos.append((descricao, valor))
        self.tabela.insert(
            "", "end",
            values=(descricao, f"R$ {valor:.2f}".replace(".", ","))
        )
        self.servico_var.set("")
        self.valor_var.set("")
        self.atualizar_total()

    def atualizar_total(self):
        total = sum(valor for _, valor in self.servicos)
        self.total_label.config(text=f"Total: R$ {total:.2f}".replace(".", ","))

    def gerar_orcamento(self):
        cliente = self.cliente_var.get().strip()
        if not cliente:
            messagebox.showwarning("Atenção", "Digite o nome do cliente.")
            return
        if not self.servicos:
            messagebox.showwarning("Atenção", "Adicione pelo menos um serviço.")
            return

        total = sum(valor for _, valor in self.servicos)
        data = date.today().strftime("%d/%m/%Y")

        numero = salvar_orcamento(
            cliente,
            " | ".join(descricao for descricao, _ in self.servicos),
            total,
            data,
        )

        caminho = gerar_pdf(numero, cliente, self.servicos, total, data)

        with sqlite3.connect(str(__import__("dados").DB_PATH)) as conn:
            conn.execute(
                "UPDATE orcamentos SET pdf = ? WHERE id = ?",
                (caminho, numero),
            )

        messagebox.showinfo(
            "Orçamento criado",
            f"Orçamento #{numero} criado com sucesso!\n\nArquivo:\n{caminho}",
        )

if __name__ == "__main__":
    criar_banco()
    root = tk.Tk()
    app = OrcaFacilApp(root)
    root.mainloop()
