(function () {
  "use strict";

  window.setTimeout(function () {
    if (window.ORCAFACIL_APP_BOOTED) return;

    const status = document.getElementById("appStatus");
    if (!status) return;

    status.textContent = "Falha ao carregar o aplicativo. Recarregue a página.";
    status.dataset.error = "true";
  }, 2500);
})();
