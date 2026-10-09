const STORAGE_KEY = "orcafacil_orcamentos_v1";
const EMPRESA_KEY = "orcafacil_empresa_v1";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  let itens = [];
  let orcamentos = carregarOrcamentos();
  let empresa = carregarEmpresa();

  const config = window.ORCAFACIL_CONFIG;
  let supabaseClient = null;
  try {
    if (config?.SUPABASE_URL && config?.SUPABASE_PUBLISHABLE_KEY && window.supabase?.createClient) {
      supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
  } catch (erro) {
    console.error("OrçaFácil: falha ao inicializar Supabase.", erro);
  }

  let sessaoOnline = null;
  let modoOnline = false;

  function mostrarStatus(texto, erro = false) {
    const elemento = $("appStatus");
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.dataset.error = erro ? "true" : "false";
  }

  async function iniciarNuvem() {
    if (!supabaseClient) return false;
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) return false;
    sessaoOnline = data.session;
    modoOnline = true;
    $("loginBtnTop").textContent = "Sair";
    await carregarDadosNuvem();
    return true;
  }

  async function carregarDadosNuvem() {
    const userId = sessaoOnline.user.id;

    const [{ data: empresaData, error: empresaError },
           { data: clientesData, error: clientesError },
           { data: orcamentosData, error: orcamentosError }] = await Promise.all([
      supabaseClient.from("empresas").select("*").eq("user_id", userId).maybeSingle(),
      supabaseClient.from("clientes").select("*").eq("user_id", userId).order("nome"),
      supabaseClient.from("orcamentos").select("*, clientes(nome, telefone, email, endereco), itens_orcamento(*)").eq("user_id", userId).order("numero", { ascending: false })
    ]);

    if (empresaError || clientesError || orcamentosError) {
      const erro = empresaError || clientesError || orcamentosError;
      console.error("OrçaFácil: falha ao carregar dados online.", erro);
      orcamentos = [];
      empresa = {};
      preencherEmpresa();
      renderHistorico();
      mostrarStatus("Não foi possível sincronizar a conta. Os dados locais não serão usados nesta sessão.", true);
      alert("Não foi possível carregar seus dados online. Nenhum dado local será usado enquanto a conta estiver conectada.");
      return;
    }

    empresa = empresaData ? {
      nome: empresaData.nome,
      documento: empresaData.documento || "",
      telefone: empresaData.telefone || "",
      email: empresaData.email || "",
      endereco: empresaData.endereco || ""
    } : {};

    orcamentos = (orcamentosData || []).map(o => ({
      numero: o.numero,
      titulo: o.titulo || "",
      cliente: o.clientes?.nome || "Cliente",
      telefone: o.clientes?.telefone || "",
      email: o.clientes?.email || "",
      endereco: o.clientes?.endereco || "",
      validade: o.validade_dias,
      pagamento: o.pagamento || "",
      prazo: o.prazo || "",
      garantia: o.garantia || "",
      observacoes: o.observacoes || "",
      data: new Date(o.created_at).toLocaleDateString("pt-BR"),
      itens: (o.itens_orcamento || []).map(i => ({
        descricao: i.descricao,
        quantidade: Number(i.quantidade),
        valorUnitario: Number(i.valor_unitario),
        subtotal: Number(i.subtotal)
      })),
      total: Number(o.total)
    }));

    preencherEmpresa();
    $("numeroPreview").textContent = "#" + proximoNumero();
    renderHistorico();
    mostrarStatus("Conta conectada · dados sincronizados na nuvem.", false);
  }

  async function salvarEmpresaNuvem() {
    const payload = {
      user_id: sessaoOnline.user.id,
      nome: empresa.nome,
      documento: empresa.documento || null,
      telefone: empresa.telefone || null,
      email: empresa.email || null,
      endereco: empresa.endereco || null
    };

    const { error } = await supabaseClient
      .from("empresas")
      .upsert(payload, { onConflict: "user_id" });

    if (error) throw error;
  }

  async function buscarOuCriarClienteNuvem(orcamento) {
    const userId = sessaoOnline.user.id;
    const { data: existentes, error: buscaError } = await supabaseClient
      .from("clientes")
      .select("id,nome,telefone,email,endereco")
      .eq("user_id", userId)
      .eq("nome", orcamento.cliente)
      .limit(1);

    if (buscaError) throw buscaError;
    if (existentes?.length) {
      const cliente = existentes[0];
      const { data: atualizado, error: updateError } = await supabaseClient
        .from("clientes")
        .update({
          telefone: orcamento.telefone || null,
          email: orcamento.email || null,
          endereco: orcamento.endereco || null
        })
        .eq("id", cliente.id)
        .select("id")
        .single();
      if (updateError) throw updateError;
      return atualizado.id;
    }

    const { data: novo, error } = await supabaseClient
      .from("clientes")
      .insert({
        user_id: userId,
        nome: orcamento.cliente,
        telefone: orcamento.telefone || null,
        email: orcamento.email || null,
        endereco: orcamento.endereco || null
      })
      .select("id")
      .single();

    if (error) throw error;
    return novo.id;
  }

  async function salvarOrcamentoNuvem(orcamento) {
    const clienteId = await buscarOuCriarClienteNuvem(orcamento);

    const resultado = await supabaseClient.rpc("criar_orcamento", {
      p_cliente_id: clienteId,
      p_titulo: orcamento.titulo || null,
      p_validade_dias: orcamento.validade,
      p_pagamento: orcamento.pagamento || null,
      p_prazo: orcamento.prazo || null,
      p_garantia: orcamento.garantia || null,
      p_observacoes: orcamento.observacoes || null,
      p_itens: orcamento.itens.map(item => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario
      }))
    });

    if (resultado.error) {
      if (
        resultado.error.code !== "PGRST202" &&
        !String(resultado.error.message || "").toLowerCase().includes("could not find the function")
      ) {
        throw resultado.error;
      }

      // Compatibilidade temporária com projetos que ainda não executaram o schema atualizado.
      const { data: novoOrcamento, error: orcamentoError } = await supabaseClient
        .from("orcamentos")
        .insert({
          user_id: sessaoOnline.user.id,
          cliente_id: clienteId,
          numero: orcamento.numero,
          titulo: orcamento.titulo || null,
          validade_dias: orcamento.validade,
          pagamento: orcamento.pagamento || null,
          prazo: orcamento.prazo || null,
          garantia: orcamento.garantia || null,
          observacoes: orcamento.observacoes || null,
          status: "enviado",
          total: orcamento.total
        })
        .select("id,numero,total")
        .single();

      if (orcamentoError) throw orcamentoError;

      const linhas = orcamento.itens.map(item => ({
        orcamento_id: novoOrcamento.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        subtotal: item.subtotal
      }));

      const { error: itensError } = await supabaseClient
        .from("itens_orcamento")
        .insert(linhas);

      if (itensError) throw itensError;

      return {
        id: novoOrcamento.id,
        numero: Number(novoOrcamento.numero),
        total: Number(novoOrcamento.total)
      };
    }

    const linha = Array.isArray(resultado.data) ? resultado.data[0] : resultado.data;
    if (!linha?.numero) throw new Error("O banco não retornou o número do orçamento.");

    return {
      id: linha.id,
      numero: Number(linha.numero),
      total: Number(linha.total)
    };
  }

  async function excluirOrcamentoNuvem(numero) {
    const { data, error } = await supabaseClient
      .from("orcamentos")
      .select("id")
      .eq("user_id", sessaoOnline.user.id)
      .eq("numero", numero)
      .single();

    if (error) throw error;

    const { error: deleteError } = await supabaseClient
      .from("orcamentos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", sessaoOnline.user.id);

    if (deleteError) throw deleteError;
  }

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

    itens.push({ descricao, quantidade, valorUnitario, subtotal: Math.round(quantidade * valorUnitario * 100) / 100 });
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

  function documentoEmpresa(documento) {
    const digitos = String(documento || "").replace(/\D/g, "");
    if (digitos.length === 11) {
      return "CPF " + digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (digitos.length === 14) {
      return "CNPJ " + digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return documento ? "Documento: " + documento : "";
  }

  function gerarPDF(orcamento) {
    const area = $("printArea");
    const linhas = orcamento.itens.map(item => `
      <tr>
        <td class="print-description">${escapar(item.descricao)}</td>
        <td class="print-quantity">${item.quantidade} × ${moeda(item.valorUnitario)}</td>
        <td class="print-subtotal">${moeda(item.subtotal)}</td>
      </tr>
    `).join("");

    const documento = documentoEmpresa(empresa.documento);
    const contatoEmpresa = [empresa.telefone, empresa.email].filter(Boolean);
    const contatoCliente = [orcamento.telefone, orcamento.email].filter(Boolean);

    area.innerHTML = `
      <div class="print-header">
        <div class="print-brand">
          <span class="print-brand-mark">OF</span>
          <div>
            <div class="print-brand-name">OrçaFácil</div>
            <div class="print-brand-caption">ORVEXA · GESTÃO COMERCIAL</div>
          </div>
        </div>
        <div class="print-document-meta">
          <span class="print-label">ORÇAMENTO</span>
          <strong>#${orcamento.numero}</strong>
          <span class="print-muted">Emitido em ${escapar(orcamento.data)}</span>
        </div>
      </div>

      ${orcamento.titulo ? `<h2 class="print-quote-title">${escapar(orcamento.titulo)}</h2>` : ""}

      <div class="print-parties">
        <section class="print-party">
          <span class="print-label">PRESTADOR</span>
          <strong class="print-party-name">${escapar(empresa.nome || "Prestador de serviço")}</strong>
          ${documento ? `<span class="print-muted">${escapar(documento)}</span>` : ""}
          ${contatoEmpresa.length ? `<span class="print-muted">${escapar(contatoEmpresa.join(" · "))}</span>` : ""}
          ${empresa.endereco ? `<span class="print-muted">${escapar(empresa.endereco)}</span>` : ""}
        </section>
        <section class="print-party">
          <span class="print-label">CLIENTE</span>
          <strong class="print-party-name">${escapar(orcamento.cliente)}</strong>
          ${contatoCliente.length ? `<span class="print-muted">${escapar(contatoCliente.join(" · "))}</span>` : ""}
          ${orcamento.endereco ? `<span class="print-muted">${escapar(orcamento.endereco)}</span>` : ""}
        </section>
      </div>

      <table class="print-items-table">
        <thead><tr><th>Descrição</th><th>Quantidade / Unitário</th><th>Subtotal</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>

      <div class="print-total-card">
        <span>Total do orçamento</span>
        <strong>${moeda(orcamento.total)}</strong>
      </div>

      <div class="print-terms">
        <div class="print-term">
          <span class="print-label">VALIDADE</span>
          <strong>${orcamento.validade} dias</strong>
        </div>
        ${orcamento.pagamento ? `<div class="print-term"><span class="print-label">PAGAMENTO</span><strong>${escapar(orcamento.pagamento)}</strong></div>` : ""}
        ${orcamento.prazo ? `<div class="print-term"><span class="print-label">PRAZO / PERÍODO</span><strong>${escapar(orcamento.prazo)}</strong></div>` : ""}
        ${orcamento.garantia ? `<div class="print-term"><span class="print-label">GARANTIA / CONDIÇÕES</span><strong>${escapar(orcamento.garantia)}</strong></div>` : ""}
      </div>

      ${orcamento.observacoes ? `<div class="print-observations"><span class="print-label">OBSERVAÇÕES</span><p>${escapar(orcamento.observacoes)}</p></div>` : ""}
      <div class="print-footer">
        <span>Obrigado pela oportunidade.</span>
        <strong>Gerado com OrçaFácil · ORVEXA</strong>
      </div>
    `;

    const tituloAnterior = document.title;
    document.title = nomeArquivoPDF(orcamento);
    window.print();
    setTimeout(() => document.title = tituloAnterior, 1000);
  }

  async function criarOrcamento() {
    const cliente = $("cliente").value.trim();
    if (!cliente) { alert("Digite o nome do cliente."); $("cliente").focus(); return; }
    if (!itens.length) { alert("Adicione pelo menos um item."); return; }

    let orcamento = {
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
      total: Math.round(itens.reduce((soma,item) => soma + item.subtotal, 0) * 100) / 100
    };

    const botao = $("gerarBtn");
    botao.disabled = true;
    botao.textContent = modoOnline ? "Salvando..." : "Gerando...";

    try {
      if (modoOnline) {
        const salvo = await salvarOrcamentoNuvem(orcamento);
        await carregarDadosNuvem();
        const atualizado = encontrar(salvo.numero);
        if (atualizado) orcamento = atualizado;
        mostrarStatus("Orçamento salvo na nuvem e pronto para exportar.", false);
      } else {
        orcamentos.unshift(orcamento);
        salvarOrcamentos();
        mostrarStatus("Orçamento salvo neste dispositivo. Entre na sua conta para sincronizar na nuvem.", false);
      }

      gerarPDF(orcamento);
      renderHistorico();
      limparFormulario();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível salvar o orçamento online. Nenhuma alteração local foi feita.");
    } finally {
      botao.disabled = false;
      botao.textContent = "Gerar orçamento em PDF";
    }
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

  $("loginBtnTop").addEventListener("click", async () => {
    if (!supabaseClient) {
      window.location.href = "auth.html";
      return;
    }
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      if (confirm("Você já está conectado. Deseja sair?")) {
        await supabaseClient.auth.signOut();
        $("loginBtnTop").textContent = "Entrar";
        alert("Sessão encerrada.");
      }
    } else {
      window.location.href = "auth.html";
    }
  });

  $("empresaBtn").addEventListener("click", () => { preencherEmpresa(); mostrar("empresa"); });
  $("fecharEmpresaBtn").addEventListener("click", () => mostrar("form"));
  $("navEmpresa").addEventListener("click", () => { preencherEmpresa(); mostrar("empresa"); });
  $("salvarEmpresaBtn").addEventListener("click", async () => {
    const nome = $("empresaNome").value.trim();
    if (!nome) { alert("Digite o nome da empresa ou profissional."); $("empresaNome").focus(); return; }
    empresa = {
      nome,
      documento: $("empresaDocumento").value.trim(),
      telefone: $("empresaTelefone").value.trim(),
      email: $("empresaEmail").value.trim(),
      endereco: $("empresaEndereco").value.trim()
    };

    try {
      if (modoOnline) {
        await salvarEmpresaNuvem();
      } else {
        salvarEmpresa();
      }
      mostrarStatus(modoOnline ? "Dados da empresa salvos na nuvem." : "Dados da empresa salvos neste dispositivo.", false);
      alert(modoOnline ? "Dados da empresa salvos na nuvem." : "Dados da empresa salvos.");
      mostrar("form");
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível salvar os dados da empresa online.");
    }
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

  $("historicoLista").addEventListener("click", async evento => {
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
      try {
        if (modoOnline) {
          await excluirOrcamentoNuvem(orcamento.numero);
          await carregarDadosNuvem();
        } else {
          orcamentos = orcamentos.filter(o => Number(o.numero) !== Number(orcamento.numero));
          salvarOrcamentos();
        }
        renderHistorico();
      } catch (erro) {
        console.error(erro);
        alert("Não foi possível excluir o orçamento.");
      }
    }
  });

  $("valor").addEventListener("keydown", evento => { if (evento.key === "Enter") adicionarItem(); });
  $("descricao").addEventListener("keydown", evento => { if (evento.key === "Enter") $("quantidade").focus(); });

  $("numeroPreview").textContent = "#" + proximoNumero();
  renderItens();

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        sessaoOnline = session;
        modoOnline = true;
        $("loginBtnTop").textContent = "Sair";
        await carregarDadosNuvem();
      } else {
        sessaoOnline = null;
        modoOnline = false;
        orcamentos = carregarOrcamentos();
        empresa = carregarEmpresa();
        preencherEmpresa();
        $("loginBtnTop").textContent = "Entrar";
        limparFormulario();
        renderHistorico();
        mostrarStatus("Modo local: dados ficam neste dispositivo.", false);
      }
    });

    iniciarNuvem().catch(erro => console.error("Falha ao iniciar modo online:", erro));
  }
});