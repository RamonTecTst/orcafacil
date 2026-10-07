(function () {
  "use strict";

  window.ORCAFACIL_AUTH_BOOTED = true;

  const config = window.ORCAFACIL_CONFIG;
  const status = document.getElementById("authStatus");
  const form = document.getElementById("authForm");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  function mensagem(texto, erro = false) {
    if (!status) return;
    status.textContent = texto;
    status.dataset.error = erro ? "true" : "false";
  }

  function erroAmigavel(error) {
    const msg = String(error?.message || "");
    const lower = msg.toLowerCase();

    if (lower.includes("rate limit") || lower.includes("too many requests")) {
      return "O limite de envio de e-mails do Supabase foi atingido. Aguarde o limite ser renovado antes de tentar outro cadastro.";
    }

    if (lower.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }

    if (lower.includes("email not confirmed")) {
      return "Confirme seu e-mail antes de entrar.";
    }

    return msg || "Não foi possível concluir a operação.";
  }

  function redirectUrl() {
    return new URL("auth.html", window.location.href).href;
  }

  function mostrarErroDoCallback() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return false;

    const params = new URLSearchParams(hash);
    const descricao = params.get("error_description") || params.get("error");
    if (!descricao) return false;

    mensagem("Falha na confirmação: " + descricao, true);
    return true;
  }

  if (!status || !form || !loginBtn || !signupBtn) {
    console.error("OrçaFácil: elementos da autenticação não foram encontrados.");
    return;
  }

  mensagem("Inicializando autenticação...");

  if (!config?.SUPABASE_URL || !config?.SUPABASE_PUBLISHABLE_KEY) {
    mensagem("Modo online ainda não configurado. Verifique o arquivo config.js.", true);
    return;
  }

  if (!window.supabase?.createClient) {
    mensagem("Não foi possível carregar o módulo de autenticação. Recarregue a página.", true);
    console.error("OrçaFácil: Supabase JS não foi carregado.");
    return;
  }

  let client;

  try {
    client = window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  } catch (erro) {
    console.error("OrçaFácil: falha ao inicializar Supabase.", erro);
    mensagem("Falha ao iniciar a autenticação. Verifique a configuração do Supabase.", true);
    return;
  }

  mensagem("Autenticação pronta.");

  async function redirecionarSeLogado() {
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      if (data.session) {
        mensagem("Sessão encontrada. Abrindo o OrçaFácil...");
        window.setTimeout(() => {
          window.location.href = "index.html";
        }, 250);
        return;
      }

      if (mostrarErroDoCallback()) return;
    } catch (erro) {
      console.error("OrçaFácil: não foi possível verificar a sessão.", erro);
      mensagem("Não foi possível verificar a sessão. Você ainda pode tentar entrar.", true);
    }
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (loginBtn.disabled) return;

    loginBtn.disabled = true;
    signupBtn.disabled = true;
    mensagem("Entrando...");

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        mensagem(erroAmigavel(error), true);
        return;
      }

      mensagem("Login realizado. Abrindo o OrçaFácil...");
      window.location.href = "index.html";
    } catch (erro) {
      console.error("OrçaFácil: erro inesperado no login.", erro);
      mensagem("Erro inesperado ao entrar. Tente novamente.", true);
    } finally {
      loginBtn.disabled = false;
      signupBtn.disabled = false;
    }
  });

  signupBtn.addEventListener("click", async () => {
    if (signupBtn.disabled) return;

    loginBtn.disabled = true;
    signupBtn.disabled = true;
    mensagem("Criando conta...");

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (!email || password.length < 8) {
      mensagem("Informe um e-mail e uma senha com pelo menos 8 caracteres.", true);
      loginBtn.disabled = false;
      signupBtn.disabled = false;
      return;
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl()
        }
      });

      if (error) {
        mensagem(erroAmigavel(error), true);
        return;
      }

      if (data.session) {
        mensagem("Conta criada com sucesso. Entrando...");
        window.location.href = "index.html";
      } else {
        mensagem("Conta criada. Confira seu e-mail para confirmar a conta antes de entrar.");
      }
    } catch (erro) {
      console.error("OrçaFácil: erro inesperado no cadastro.", erro);
      mensagem("Erro inesperado ao criar a conta. Tente novamente.", true);
    } finally {
      loginBtn.disabled = false;
      signupBtn.disabled = false;
    }
  });

  redirecionarSeLogado();
})();
