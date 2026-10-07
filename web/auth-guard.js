(function () {
  "use strict";

  window.setTimeout(function () {
    if (window.ORCAFACIL_AUTH_BOOTED) return;

    const status = document.getElementById("authStatus");
    if (!status) return;

    status.textContent =
      "Falha ao carregar a autenticação. Verifique a conexão e recarregue a página.";
    status.dataset.error = "true";
  }, 2500);
})();
