from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from pathlib import Path

def gerar_pdf(numero, cliente, servicos, total, data):
    pasta = Path(__file__).with_name("orcamentos")
    pasta.mkdir(exist_ok=True)
    caminho = pasta / f"orcamento_{numero}.pdf"

    c = canvas.Canvas(str(caminho), pagesize=A4)
    largura, altura = A4

    c.setTitle(f"Orçamento {numero}")
    c.setFont("Helvetica-Bold", 20)
    c.drawString(20 * mm, altura - 25 * mm, "ORÇAFÁCIL")

    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, altura - 32 * mm, f"Orçamento nº {numero}")
    c.drawRightString(largura - 20 * mm, altura - 32 * mm, f"Data: {data}")

    y = altura - 50 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Cliente:")
    c.setFont("Helvetica", 11)
    c.drawString(42 * mm, y, cliente)

    y -= 15 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Serviços")

    y -= 8 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, y, "Descrição")
    c.drawRightString(180 * mm, y, "Valor")

    y -= 6 * mm
    c.line(20 * mm, y, 190 * mm, y)

    c.setFont("Helvetica", 10)
    for descricao, valor in servicos:
        y -= 7 * mm
        c.drawString(20 * mm, y, descricao[:70])
        c.drawRightString(180 * mm, y, f"R$ {valor:.2f}".replace(".", ","))
        if y < 35 * mm:
            c.showPage()
            y = altura - 25 * mm

    y -= 10 * mm
    c.setFont("Helvetica-Bold", 13)
    c.drawRightString(180 * mm, y, f"TOTAL: R$ {total:.2f}".replace(".", ","))

    c.setFont("Helvetica-Oblique", 8)
    c.drawString(20 * mm, 15 * mm, "Documento gerado pelo OrçaFácil.")
    c.save()
    return str(caminho)
