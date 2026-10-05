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

function carregarJsPDF() {
  if (window.jspdf) return Promise.resolve(true);

  return new Promise(resolve => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";
    script.onload = () => resolve(!!window.jspdf);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
function proximoNumero() { return state.orcamentos.length ? Math.max(...state.orcamentos.map(o => o.numero)) + 1 : 1; }
function hoje() { return new Date().toLocaleDateString("pt-BR"); }
function esc(texto) {
  return String(texto).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
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

async function criarOrcamento() {
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
  const pdfDisponivel = await carregarJsPDF();
  if (pdfDisponivel) {
    gerarPDF(orcamento);
  } else {
    alert("O orçamento foi salvo, mas o PDF não pôde ser carregado. Tente novamente com internet ativa.");
  }
  renderHistorico();
  limparFormulario();
}

function gerarPDF(orcamento) {
  if (!window.jspdf) return alert("A biblioteca de PDF ainda não carregou. Verifique a internet e tente novamente.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(20);
  doc.setFont(undefined,"bold");
  doc.text("ORCAFACIL",20,y);
  y += 9;
  doc.setFontSize(10);
  doc.setFont(undefined,"normal");
  doc.text("Orcamento #" + orcamento.numero,20,y);
  doc.text("Data: " + orcamento.data,140,y);

  y += 14;
  doc.setFontSize(12);
  doc.setFont(undefined,"bold");
  doc.text("Cliente",20,y);
  y += 7;
  doc.setFont(undefined,"normal");
  doc.text(orcamento.cliente,20,y);
  if (orcamento.telefone) { y += 6; doc.text("Telefone: " + orcamento.telefone,20,y); }

  y += 13;
  doc.setFont(undefined,"bold");
  doc.text("Itens",20,y);
  y += 7;
  doc.setFontSize(10);

  orcamento.itens.forEach(item => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont(undefined,"normal");
    const descricao = item.descricao.length > 65 ? item.descricao.slice(0,62) + "..." : item.descricao;
    doc.text(descricao,20,y);
    doc.text(item.quantidade + " x " + moeda(item.valorUnitario),120,y);
    doc.text(moeda(item.subtotal),170,y);
    y += 7;
  });

  y += 5;
  doc.setFontSize(13);
  doc.setFont(undefined,"bold");
  doc.text("TOTAL: " + moeda(orcamento.total),120,y);
  y += 12;
  doc.setFontSize(10);
  doc.setFont(undefined,"normal");
  doc.text("Validade: " + orcamento.validade + " dias",20,y);

  if (orcamento.observacoes) {
    y += 8;
    doc.setFont(undefined,"bold");
    doc.text("Observacoes:",20,y);
    y += 6;
    doc.setFont(undefined,"normal");
    doc.text(doc.splitTextToSize(orcamento.observacoes,170),20,y);
  }

  doc.setFontSize(8);
  doc.text("Gerado pelo OrçaFácil",20,285);
  doc.save("orcamento_" + orcamento.numero + ".pdf");
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