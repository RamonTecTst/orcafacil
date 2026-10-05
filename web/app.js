const STORAGE_KEY = "orcafacil_orcamentos_v1";
const state = { itens: [], orcamentos: carregarOrcamentos() };
const $ = id => document.getElementById(id);

function carregarOrcamentos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function salvarOrcamentos() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.orcamentos)); }
function moeda(valor) { return new Intl.NumberFormat("pt-BR", {style:"currency",currency:"BRL"}).format(valor); }

function numeroBR(valor) {
  const texto = String(valor).trim().replace(/\s/g, "");
  if (!texto) return NaN;

  // Aceita 150,50 e também 1.250,50.
  if (texto.includes(",")) {
    return Number(texto.replace(/\./g, "").replace(",", "."));
  }

  return Number(texto);
}

function proximoNumero() {
  return state.orcamentos.length
    ? Math.max(...state.orcamentos.map(o => o.numero)) + 1
    : 1;
}

function hoje() {
  return new Date().toLocaleDateString("pt-BR");
}

function esc(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderItens() {
  const lista = $("itensLista");
  if (!state.itens.length) {
    lista.innerHTML = '<div class="empty">Nenhum item adicionado.</div>';
  } else {
    lista.innerHTML = state.itens.map((item,index) =>
      '<div class="item"><div><div class="item-name">' + esc(item.descricao) +
      '</div><div class="item-meta">' + item.quantidade + ' × ' + moeda(item.valorUnitario) +
      '</div></div><div><div class="item-price">' + moeda(item.subtotal) +
      '</div><button class="danger item-remove" onclick="removerItem(' + index + ')">Remover</button></div></div>'
    ).join("");
  }
  $("total").textContent = moeda(state.itens.reduce((s,item) => s + item.subtotal, 0));
}

function adicionarItem() {
  const descricao = $("descricao").value.trim();
  const quantidade = numeroBR($("quantidade").value);
  const valorUnitario = numeroBR($("valor").value);

  if (!descricao) return alert("Digite a descrição do serviço.");
  if (!quantidade || quantidade <= 0 || Number.isNaN(quantidade)) return alert("Digite uma quantidade válida.");
  if (Number.isNaN(valorUnitario) || valorUnitario < 0) return alert("Digite um valor válido.");

  state.itens.push({descricao, quantidade, valorUnitario, subtotal: quantidade * valorUnitario});
  $("descricao").value = "";
  $("quantidade").value = "1";
  $("valor").value = "";
  $("descricao").focus();
  renderItens();
}

function removerItem(index) { state.itens.splice(index,1); renderItens(); }

function limparFormulario() {
  state.itens = [];
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

function criarOrcamento() {
  const cliente = $("cliente").value.trim();
  const telefone = $("telefone").value.trim();
  const validade = Number($("validade").value);
  const observacoes = $("observacoes").value.trim();

  if (!cliente) return alert("Digite o nome do cliente.");
  if (!state.itens.length) return alert("Adicione pelo menos um item.");

  const orcamento = {
    numero: proximoNumero(), cliente, telefone, validade, observacoes, data: hoje(),
    itens: JSON.parse(JSON.stringify(state.itens)),
    total: state.itens.reduce((s,item) => s + item.subtotal, 0)
  };

  state.orcamentos.unshift(orcamento);
  salvarOrcamentos();
  gerarPDF(orcamento);
  renderHistorico();
  limparFormulario();
}

function gerarPDF(orcamento) {
  const area = $("printArea");

  const linhas = orcamento.itens.map(item =>
    '<tr>' +
      '<td>' + esc(item.descricao) + '</td>' +
      '<td>' + item.quantidade + ' × ' + moeda(item.valorUnitario) + '</td>' +
      '<td>' + moeda(item.subtotal) + '</td>' +
    '</tr>'
  ).join("");

  area.innerHTML =
    '<h1>ORÇAFÁCIL</h1>' +
    '<div class="print-muted">Orçamento #' + orcamento.numero + ' · Data: ' + orcamento.data + '</div>' +
    '<div class="print-client">' +
      '<strong>Cliente:</strong> ' + esc(orcamento.cliente) +
      (orcamento.telefone ? '<br><span class="print-muted">Telefone: ' + esc(orcamento.telefone) + '</span>' : '') +
    '</div>' +
    '<table><thead><tr><th>Descrição</th><th>Quantidade / Unitário</th><th>Subtotal</th></tr></thead>' +
    '<tbody>' + linhas + '</tbody></table>' +
    '<div class="print-total">TOTAL: ' + moeda(orcamento.total) + '</div>' +
    '<div class="print-muted" style="margin-top:8px">Validade: ' + orcamento.validade + ' dias</div>' +
    (orcamento.observacoes ? '<div class="print-notes"><strong>Observações:</strong>\n' + esc(orcamento.observacoes) + '</div>' : '') +
    '<div class="print-muted" style="margin-top:30px">Gerado pelo OrçaFácil</div>';

  window.print();
}

function renderHistorico() {
  const lista = $("historicoLista");
  if (!state.orcamentos.length) {
    lista.innerHTML = '<div class="card empty">Nenhum orçamento criado ainda.</div>';
    return;
  }

  lista.innerHTML = state.orcamentos.map(o =>
    '<article class="history-card"><div class="history-head"><div><div class="history-name">#' +
    o.numero + ' — ' + esc(o.cliente) + '</div><div class="history-date">' + o.data + ' · ' +
    o.itens.length + ' item(ns)</div></div><div class="history-total">' + moeda(o.total) +
    '</div></div><div class="history-actions"><button class="secondary" onclick="verOrcamento(' +
    o.numero + ')">Detalhes</button><button class="primary" onclick="baixarPDF(' +
    o.numero + ')">PDF</button><button class="danger" onclick="excluirOrcamento(' +
    o.numero + ')">Excluir</button></div></article>'
  ).join("");
}

function verOrcamento(numero) {
  const o = state.orcamentos.find(item => item.numero === numero);
  if (!o) return;
  const itens = o.itens.map(item => item.quantidade + " × " + item.descricao + " — " + moeda(item.subtotal)).join("\n");
  alert("Orçamento #" + o.numero + "\n\nCliente: " + o.cliente + "\nData: " + o.data +
    "\nValidade: " + o.validade + " dias\n\n" + itens + "\n\nTOTAL: " + moeda(o.total));
}
function baixarPDF(numero) { const o = state.orcamentos.find(item => item.numero === numero); if (o) gerarPDF(o); }
function excluirOrcamento(numero) {
  const o = state.orcamentos.find(item => item.numero === numero);
  if (!o || !confirm("Excluir o orçamento #" + numero + " de " + o.cliente + "?")) return;
  state.orcamentos = state.orcamentos.filter(item => item.numero !== numero);
  salvarOrcamentos();
  renderHistorico();
}
function mostrar(view) {
  $("formView").classList.toggle("hidden", view !== "form");
  $("historicoView").classList.toggle("hidden", view !== "historico");
  $("navNovo").classList.toggle("nav-active", view === "form");
  $("navHistorico").classList.toggle("nav-active", view === "historico");
  if (view === "historico") renderHistorico();
}

$("adicionarBtn").addEventListener("click", adicionarItem);
$("gerarBtn").addEventListener("click", criarOrcamento);
$("novoBtn").addEventListener("click", () => { limparFormulario(); mostrar("form"); });
$("voltarBtn").addEventListener("click", () => { limparFormulario(); mostrar("form"); });
$("navNovo").addEventListener("click", () => mostrar("form"));
$("navHistorico").addEventListener("click", () => mostrar("historico"));
$("valor").addEventListener("keydown", e => { if (e.key === "Enter") adicionarItem(); });
$("descricao").addEventListener("keydown", e => { if (e.key === "Enter") $("quantidade").focus(); });
$("numeroPreview").textContent = "#" + proximoNumero();
renderItens();