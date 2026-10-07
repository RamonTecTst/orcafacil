document.addEventListener("DOMContentLoaded", () => {
  const config = window.ORCAFACIL_CONFIG;
  const status = document.getElementById("authStatus");
  const form = document.getElementById("authForm");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  function mensagem(texto, erro = false) {
    status.textContent = texto;
    status.dataset.error = erro ? "true" : "false";
  }

  if (!config?.SUPABASE_URL || !config?.SUPABASE_PUBLISHABLE_KEY || !window.supabase) {
    mensagem("Modo online ainda não configurado. Crie o projeto Supabase e o arquivo config.js. Você pode continuar usando o modo local.", false);
    loginBtn.disabled = true;
    signupBtn.disabled = true;
    return;
  }

  const client = window.supabase.createClient(
    config.SUPABASE_URL,
    config.SUPABASE_PUBLISHABLE_KEY
  );

  async function redirecionarSeLogado() {
    const { data } = await client.auth.getSession();
    if (data.session) window.location.href = "index.html";
  }

  redirecionarSeLogado();

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    loginBtn.disabled = true;
    signupBtn.disabled = true;
    mensagem("Entrando...");

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    const { error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      mensagem(error.message || "Não foi possível entrar.", true);
      loginBtn.disabled = false;
      signupBtn.disabled = false;
      return;
    }

    window.location.href = "index.html";
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

    const { error } = await client.auth.signUp({ email, password });

    if (error) {
      mensagem(error.message || "Não foi possível criar a conta.", true);
    } else {
      mensagem("Conta criada. Se a confirmação por e-mail estiver ativa, confira sua caixa de entrada antes de entrar.");
    }

    loginBtn.disabled = false;
    signupBtn.disabled = false;
  });
});