function iniciarAutenticacao() {
  const config = window.ORCAFACIL_CONFIG;
  const status = document.getElementById("authStatus");
  const form = document.getElementById("authForm");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  function mensagem(texto, erro = false) {
    status.textContent = texto;
    status.dataset.error = erro ? "true" : "false";
  }

  if (!status || !form || !loginBtn || !signupBtn) {
    console.error("OrçaFácil: elementos da autenticação não foram encontrados.");
    return;
  }

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
      config.SUPABASE_PUBLISHABLE_KEY
    );
  } catch (erro) {
    console.error("OrçaFácil: falha ao inicializar Supabase.", erro);
    mensagem("Falha ao iniciar a autenticação. Verifique a configuração do Supabase.", true);
    return;
  }

  async function redirecionarSeLogado() {
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) window.location.href = "index.html";
    } catch (erro) {
      console.error("OrçaFácil: não foi possível verificar a sessão.", erro);
    }
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    loginBtn.disabled = true;
    signupBtn.disabled = true;
    mensagem("Entrando...");

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        mensagem(error.message || "Não foi possível entrar.", true);
        return;
      }

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
    loginBtn.disabled = true;
    signupBtn.disabled = true;
    mensagem("Criando conta...");

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (!email || password.length < 6) {
      mensagem("Informe um e-mail e uma senha com pelo menos 6 caracteres.", true);
      loginBtn.disabled = false;
      signupBtn.disabled = false;
      return;
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/web/auth.html`
        }
      });

      if (error) {
        mensagem(error.message || "Não foi possível criar a conta.", true);
        return;
      }

      if (data.session) {
        mensagem("Conta criada com sucesso. Entrando...");
        window.location.href = "index.html";
      } else {
        mensagem("Conta criada. Se a confirmação por e-mail estiver ativa, confira sua caixa de entrada antes de entrar.");
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarAutenticacao);
} else {
  iniciarAutenticacao();
}
