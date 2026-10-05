const STORAGE_KEY = "orcafacil_orcamentos_v1";
const EMPRESA_KEY = "orcafacil_empresa_v1";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  let itens = [];
  let orcamentos = carregarOrcamentos();
  let empresa = carregarEmpresa();

  function carregarOrcamentos() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (erro) { return []; }
  }

  function salvarOrcamentos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamentos));
  }

  function carregarEmpresa() {
    try { return JSON.parse(localStorage.getItem(EMPRESA_KEY)) || {}; }
    catch (erro) { return {}; }
  }

  function salvarEmpresa() {
    localStorage.setItem(EMPRESA_KEY, JSON.stringify(empresa));
  }

  function preencherEmpresa() {
    $("empresaNome").value = empresa.nome || "";
    $("empresaDocumento").value = empresa.documento || "";
    $("empresaTelefone").value = empresa.telefone || "";
    $("empresaEmail").value = empresa.email || "";
    $("empresaEndereco").value = empresa.endereco || "";
  }

  function moeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(valor);
  }

  function numeroBR(valor) {
    const texto = String(valor).trim().replace(/\s/g, "");
    if (!texto) return NaN;
    return texto.includes(",") ? Number(texto.replace(/\./g, "").replace(",", ".")) : Number(texto);
  }

  function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto ?? "");
    return div.innerHTML;
  }

  function proximoNumero() {
    if (!orcamentos.length) return 1;
    return Math.max(...orcamentos.map(o => Number(o.numero) || 0)) + 1;
  }

  function nomeArquivoPDF(orcamento) {
    const nomeCliente = String(orcamento.cliente)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const numero = String(orcamento.numero).padStart(3, "0");
    return "Orcamento_" + numero + "_" + (nomeCliente || "Cliente") + "_" + orcamento.data.replace(/\//g, "-");
  }

  function renderItens() {
    const lista = $("itensLista");
    lista.innerHTML = itens.length ? itens.map((item,index) => `
      <div class="item">
        <div>
          <div class="item-name">${escapar(item.descricao)}</div>
          <div class="item-meta">${item.quantidade} × ${moeda(item.valorUnitario)}</div>
        </div>
        <div>
          <div class="item-price">${moeda(item.subtotal)}</div>
          <button class="danger item-remove" data-index="${index}">Remover</button>
        </div>
      </div>`).join("") : '<div class="empty">Nenhum item adicionado.</div>';
    $("total").textContent = moeda(itens.reduce((soma,item) => soma + item.subtotal, 0));
  }

  function adicionarItem() {
    const descricao = $("descricao").value.trim();
    const quantidade = numeroBR($("quantidade").value);
    const valorUnitario = numeroBR($("valor").value);

    if (!descricao) { alert("Digite a descrição do produto ou serviço."); $("descricao").focus(); return; }
    if (!Number.isFinite(quantidade) || quantidade <= 0) { alert("Digite uma quantidade válida."); $("quantidade").focus(); return; }
    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) { alert("Digite um valor válido."); $("valor").focus(); return; }

    itens.push({ descricao, quantidade, valorUnitario, subtotal: quantidade * valorUnitario });
    $("descricao").value = "";
    $("quantidade").value = "1";
    $("valor").value = "";
    renderItens();
    $("descricao").focus();
  }

  function limparFormulario() {
    itens = [];
    ["titulo","cliente","telefone","emailCliente","enderecoCliente","pagamento","prazo","garantia","observacoes","descricao","valor"].forEach(id => { if ($(id)) $(id).value = ""; });
    $("quantidade").value = "1";
    $("validade").value = "7";
    $("numeroPreview").textContent = "#" + proximoNumero();
    renderItens();
  }

  function gerarPDF(orcamento) {
    const area = $("printArea");
    const linhas = orcamento.itens.map(item => `
      <tr><td>${escapar(item.descricao)}</td><td>${item.quantidade} × ${moeda(item.valorUnitario)}</td><td>${moeda(item.subtotal)}</td></tr>
    `).join("");

    area.innerHTML = `
      <h1>${escapar(empresa.nome || "ORÇAFÁCIL")}</h1>
      ${empresa.documento ? `<div class="print-muted">CPF/CNPJ: ${escapar(empresa.documento)}</div>` : ""}
      ${empresa.telefone || empresa.email ? `<div class="print-muted">${escapar([empresa.telefone,empresa.email].filter(Boolean).join(" · "))}</div>` : ""}
      ${empresa.endereco ? `<div class="print-muted">${escapar(empresa.endereco)}</div>` : ""}
      <div class="print-client"><strong>${escapar(orcamento.titulo || "Orçamento")}</strong><br><span class="print-muted">Orçamento #${orcamento.numero} · Data: ${orcamento.data}</span></div>

      <div class="print-client">
        <strong>Cliente:</strong> ${escapar(orcamento.cliente)}
        ${orcamento.telefone ? `<br><span class="print-muted">Telefone: ${escapar(orcamento.telefone)}</span>` : ""}
        ${orcamento.email ? `<br><span class="print-muted">E-mail: ${escapar(orcamento.email)}</span>` : ""}
        ${orcamento.endereco ? `<br><span class="print-muted">Endereço: ${escapar(orcamento.endereco)}</span>` : ""}
      </div>

      <table><thead><tr><th>Descrição</th><th>Quantidade / Unitário</th><th>Subtotal</th></tr></thead><tbody>${linhas}</tbody></table>
      <div class="print-total">TOTAL: ${moeda(orcamento.total)}</div>
      <div class="print-muted" style="margin-top:8px">Validade: ${orcamento.validade} dias</div>
      ${orcamento.pagamento ? `<div class="print-notes"><strong>Forma de pagamento:</strong> ${escapar(orcamento.pagamento)}</div>` : ""}
      ${orcamento.prazo ? `<div class="print-notes"><strong>Prazo de execução:</strong> ${escapar(orcamento.prazo)}</div>` : ""}
      ${orcamento.garantia ? `<div class="print-notes"><strong>Garantia:</strong> ${escapar(orcamento.garantia)}</div>` : ""}
      ${orcamento.observacoes ? `<div class="print-notes"><strong>Observações:</strong><br>${escapar(orcamento.observacoes)}</div>` : ""}
      <div class="print-muted" style="margin-top:30px">Gerado pelo OrçaFácil</div>
    `;

    const tituloAnterior = document.title;
    document.title = nomeArquivoPDF(orcamento);
    window.print();
    setTimeout(() => document.title = tituloAnterior, 1000);
  }

  function criarOrcamento() {
    const cliente = $("cliente").value.trim();
    if (!cliente) { alert("Digite o nome do cliente."); $("cliente").focus(); return; }
    if (!itens.length) { alert("Adicione pelo menos um item."); return; }

    const orcamento = {
      numero: proximoNumero(),
      titulo: $("titulo").value.trim(),
      cliente,
      telefone: $("telefone").value.trim(),
      email: $("emailCliente").value.trim(),
      endereco: $("enderecoCliente").value.trim(),
      validade: Number($("validade").value),
      pagamento: $("pagamento").value.trim(),
      prazo: $("prazo").value.trim(),
      garantia: $("garantia").value.trim(),
      observacoes: $("observacoes").value.trim(),
      data: new Date().toLocaleDateString("pt-BR"),
      itens: JSON.parse(JSON.stringify(itens)),
      total: itens.reduce((soma,item) => soma + item.subtotal, 0)
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
    lista.innerHTML = orcamentos.map(o => `
      <article class="history-card">
        <div class="history-head">
          <div>
            <div class="history-name">#${o.numero} — ${escapar(o.cliente)}</div>
            ${o.titulo ? `<div class="history-date">${escapar(o.titulo)}</div>` : ""}
            <div class="history-date">${o.data} · ${o.itens.length} item(ns)</div>
          </div>
          <div class="history-total">${moeda(o.total)}</div>
        </div>
        <div class="history-actions">
          <button class="secondary" data-action="details" data-number="${o.numero}">Detalhes</button>
          <button class="primary" data-action="pdf" data-number="${o.numero}">PDF</button>
          <button class="danger" data-action="delete" data-number="${o.numero}">Excluir</button>
        </div>
      </article>`).join("");
  }

  function encontrar(numero) { return orcamentos.find(o => Number(o.numero) === Number(numero)); }

  function mostrar(view) {
    $("formView").classList.toggle("hidden", view !== "form");
    $("historicoView").classList.toggle("hidden", view !== "historico");
    $("empresaView").classList.toggle("hidden", view !== "empresa");
    $("navNovo").classList.toggle("nav-active", view === "form");
    $("navHistorico").classList.toggle("nav-active", view === "historico");
    $("navEmpresa").classList.toggle("nav-active", view === "empresa");
    if (view === "historico") renderHistorico();
  }

  $("empresaBtn").addEventListener("click", () => { preencherEmpresa(); mostrar("empresa"); });
  $("fecharEmpresaBtn").addEventListener("click", () => mostrar("form"));
  $("navEmpresa").addEventListener("click", () => { preencherEmpresa(); mostrar("empresa"); });
  $("salvarEmpresaBtn").addEventListener("click", () => {
    const nome = $("empresaNome").value.trim();
    if (!nome) { alert("Digite o nome da empresa ou profissional."); $("empresaNome").focus(); return; }
    empresa = {
      nome,
      documento: $("empresaDocumento").value.trim(),
      telefone: $("empresaTelefone").value.trim(),
      email: $("empresaEmail").value.trim(),
      endereco: $("empresaEndereco").value.trim()
    };
    salvarEmpresa();
    alert("Dados da empresa salvos.");
    mostrar("form");
  });

  $("adicionarBtn").addEventListener("click", adicionarItem);
  $("itensLista").addEventListener("click", evento => {
    const botao = evento.target.closest("[data-index]");
    if (botao) { itens.splice(Number(botao.dataset.index),1); renderItens(); }
  });
  $("gerarBtn").addEventListener("click", criarOrcamento);
  $("novoBtn").addEventListener("click", () => { limparFormulario(); mostrar("form"); });
  $("voltarBtn").addEventListener("click", () => { limparFormulario(); mostrar("form"); });
  $("navNovo").addEventListener("click", () => mostrar("form"));
  $("navHistorico").addEventListener("click", () => mostrar("historico"));

  $("historicoLista").addEventListener("click", evento => {
    const botao = evento.target.closest("[data-action]");
    if (!botao) return;
    const orcamento = encontrar(botao.dataset.number);
    if (!orcamento) return;

    if (botao.dataset.action === "pdf") gerarPDF(orcamento);

    if (botao.dataset.action === "details") {
      const itensTexto = orcamento.itens.map(item => `${item.quantidade} × ${item.descricao} — ${moeda(item.subtotal)}`).join("\n");
      alert("Orçamento #" + orcamento.numero +
        "\n\nTítulo: " + (orcamento.titulo || "Não informado") +
        "\nCliente: " + orcamento.cliente +
        "\nData: " + orcamento.data +
        "\nValidade: " + orcamento.validade + " dias" +
        "\n\n" + itensTexto +
        "\n\nTOTAL: " + moeda(orcamento.total));
    }

    if (botao.dataset.action === "delete") {
      if (!confirm("Excluir o orçamento #" + orcamento.numero + "?")) return;
      orcamentos = orcamentos.filter(o => Number(o.numero) !== Number(orcamento.numero));
      salvarOrcamentos();
      renderHistorico();
    }
  });

  $("valor").addEventListener("keydown", evento => { if (evento.key === "Enter") adicionarItem(); });
  $("descricao").addEventListener("keydown", evento => { if (evento.key === "Enter") $("quantidade").focus(); });

  $("numeroPreview").textContent = "#" + proximoNumero();
  renderItens();
});