const STORAGE_KEY = "orcafacil_orcamentos_v1";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  let itens = [];
  let orcamentos = carregarOrcamentos();

  function carregarOrcamentos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (erro) {
      return [];
    }
  }

  function salvarOrcamentos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamentos));
  }

  function moeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor);
  }

  function numeroBR(valor) {
    const texto = String(valor).trim().replace(/\s/g, "");
    if (!texto) return NaN;

    if (texto.includes(",")) {
      return Number(texto.replace(/\./g, "").replace(",", "."));
    }

    return Number(texto);
  }

  function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto);
    return div.innerHTML;
  }

  function proximoNumero() {
    if (!orcamentos.length) return 1;
    return Math.max(...orcamentos.map((o) => Number(o.numero) || 0)) + 1;
  }

  function renderItens() {
    const lista = $("itensLista");

    if (!itens.length) {
      lista.innerHTML = '<div class="empty">Nenhum item adicionado.</div>';
    } else {
      lista.innerHTML = itens.map((item, index) => `
        <div class="item">
          <div>
            <div class="item-name">${escapar(item.descricao)}</div>
            <div class="item-meta">${item.quantidade} × ${moeda(item.valorUnitario)}</div>
          </div>
          <div>
            <div class="item-price">${moeda(item.subtotal)}</div>
            <button class="danger item-remove" data-index="${index}">Remover</button>
          </div>
        </div>
      `).join("");
    }

    const total = itens.reduce((soma, item) => soma + item.subtotal, 0);
    $("total").textContent = moeda(total);
  }

  function adicionarItem() {
    const descricao = $("descricao").value.trim();
    const quantidade = numeroBR($("quantidade").value);
    const valorUnitario = numeroBR($("valor").value);

    if (!descricao) {
      alert("Digite a descrição do produto ou serviço.");
      $("descricao").focus();
      return;
    }

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      alert("Digite uma quantidade válida.");
      $("quantidade").focus();
      return;
    }

    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
      alert("Digite um valor válido.");
      $("valor").focus();
      return;
    }

    itens.push({
      descricao,
      quantidade,
      valorUnitario,
      subtotal: quantidade * valorUnitario
    });

    $("descricao").value = "";
    $("quantidade").value = "1";
    $("valor").value = "";

    renderItens();
    $("descricao").focus();
  }

  function removerItem(index) {
    itens.splice(index, 1);
    renderItens();
  }

  function limparFormulario() {
    itens = [];
    $("cliente").value = "";
    $("telefone").value = "";
    $("validade").value = "7";
    $("observacoes").value = "";
    $("descricao").value = "";
    $("quantidade").value = "1";
    $("valor").value = "";
    $("numeroPreview").textContent = "#" + proximoNumero();
    renderItens();
  }

  function nomeArquivoPDF(orcamento) {
    const nomeCliente = String(orcamento.cliente)
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const dataArquivo = orcamento.data.replace(/\\//g, "-");
    const numero = String(orcamento.numero).padStart(3, "0");

    return "Orcamento_" + numero + "_" + (nomeCliente || "Cliente") + "_" + dataArquivo;
  }

  function gerarPDF(orcamento) {
    const area = $("printArea");

    const linhas = orcamento.itens.map((item) => `
      <tr>
        <td>${escapar(item.descricao)}</td>
        <td>${item.quantidade} × ${moeda(item.valorUnitario)}</td>
        <td>${moeda(item.subtotal)}</td>
      </tr>
    `).join("");

    area.innerHTML = `
      <h1>ORÇAFÁCIL</h1>
      <div class="print-muted">Orçamento #${orcamento.numero} · Data: ${orcamento.data}</div>

      <div class="print-client">
        <strong>Cliente:</strong> ${escapar(orcamento.cliente)}
        ${orcamento.telefone ? `<br><span class="print-muted">Telefone: ${escapar(orcamento.telefone)}</span>` : ""}
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Quantidade / Unitário</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>

      <div class="print-total">TOTAL: ${moeda(orcamento.total)}</div>
      <div class="print-muted" style="margin-top:8px">Validade: ${orcamento.validade} dias</div>

      ${orcamento.observacoes
        ? `<div class="print-notes"><strong>Observações:</strong><br>${escapar(orcamento.observacoes)}</div>`
        : ""}

      <div class="print-muted" style="margin-top:30px">Gerado pelo OrçaFácil</div>
    `;

    const tituloAnterior = document.title;
    document.title = nomeArquivoPDF(orcamento);
    window.print();

    setTimeout(() => {
      document.title = tituloAnterior;
    }, 1000);
  }

  function criarOrcamento() {
    const cliente = $("cliente").value.trim();

    if (!cliente) {
      alert("Digite o nome do cliente.");
      $("cliente").focus();
      return;
    }

    if (!itens.length) {
      alert("Adicione pelo menos um item.");
      return;
    }

    const orcamento = {
      numero: proximoNumero(),
      cliente,
      telefone: $("telefone").value.trim(),
      validade: Number($("validade").value),
      observacoes: $("observacoes").value.trim(),
      data: new Date().toLocaleDateString("pt-BR"),
      itens: JSON.parse(JSON.stringify(itens)),
      total: itens.reduce((soma, item) => soma + item.subtotal, 0)
    };

    orcamentos.unshift(orcamento);
    salvarOrcamentos();

    gerarPDF(orcamento);
    renderHistorico();
  }

  function renderHistorico() {
    const lista = $("historicoLista");

    if (!orcamentos.length) {
      lista.innerHTML = '<div class="card empty">Nenhum orçamento criado ainda.</div>';
      return;
    }

    lista.innerHTML = orcamentos.map((o) => `
      <article class="history-card">
        <div class="history-head">
          <div>
            <div class="history-name">#${o.numero} — ${escapar(o.cliente)}</div>
            <div class="history-date">${o.data} · ${o.itens.length} item(ns)</div>
          </div>
          <div class="history-total">${moeda(o.total)}</div>
        </div>

        <div class="history-actions">
          <button class="secondary" data-action="details" data-number="${o.numero}">Detalhes</button>
          <button class="primary" data-action="pdf" data-number="${o.numero}">PDF</button>
          <button class="danger" data-action="delete" data-number="${o.numero}">Excluir</button>
        </div>
      </article>
    `).join("");
  }

  function encontrar(numero) {
    return orcamentos.find((o) => Number(o.numero) === Number(numero));
  }

  function mostrar(view) {
    $("formView").classList.toggle("hidden", view !== "form");
    $("historicoView").classList.toggle("hidden", view !== "historico");
    $("navNovo").classList.toggle("nav-active", view === "form");
    $("navHistorico").classList.toggle("nav-active", view === "historico");

    if (view === "historico") renderHistorico();
  }

  $("adicionarBtn").addEventListener("click", adicionarItem);

  $("itensLista").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-index]");
    if (botao) removerItem(Number(botao.dataset.index));
  });

  $("gerarBtn").addEventListener("click", criarOrcamento);

  $("novoBtn").addEventListener("click", () => {
    limparFormulario();
    mostrar("form");
  });

  $("voltarBtn").addEventListener("click", () => {
    limparFormulario();
    mostrar("form");
  });

  $("navNovo").addEventListener("click", () => mostrar("form"));
  $("navHistorico").addEventListener("click", () => mostrar("historico"));

  $("historicoLista").addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-action]");
    if (!botao) return;

    const orcamento = encontrar(botao.dataset.number);
    if (!orcamento) return;

    if (botao.dataset.action === "pdf") {
      gerarPDF(orcamento);
    }

    if (botao.dataset.action === "details") {
      const itensTexto = orcamento.itens
        .map((item) => `${item.quantidade} × ${item.descricao} — ${moeda(item.subtotal)}`)
        .join("\n");

      alert(
        "Orçamento #" + orcamento.numero +
        "\n\nCliente: " + orcamento.cliente +
        "\nData: " + orcamento.data +
        "\nValidade: " + orcamento.validade + " dias" +
        "\n\n" + itensTexto +
        "\n\nTOTAL: " + moeda(orcamento.total)
      );
    }

    if (botao.dataset.action === "delete") {
      if (!confirm("Excluir o orçamento #" + orcamento.numero + "?")) return;

      orcamentos = orcamentos.filter((o) => Number(o.numero) !== Number(orcamento.numero));
      salvarOrcamentos();
      renderHistorico();
    }
  });

  $("valor").addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") adicionarItem();
  });

  $("descricao").addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") $("quantidade").focus();
  });

  $("numeroPreview").textContent = "#" + proximoNumero();
  renderItens();
});