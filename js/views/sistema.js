/** Aruy · Pantallas de sistema: acceso denegado por rol y página no encontrada. */
(function () {
  var html = AR.html, icon = AR.icon, UI = AR.ui, V = AR.views;

  V.denegado = {
    title: "Sin acceso",
    bar: { title: "Sin acceso", back: false },
    render: function () {
      var u = AR.session.user();
      return html`<div class="page page--narrow">${UI.empty({ art: "suelto", title: "Esta pantalla es de otro tipo de cuenta",
        text: u.rol === "prestador" ? "Tu cuenta es de prestador. El catálogo es para quienes contratan." : "Tu cuenta es de contratante. Publicar servicios es para quienes los ofrecen.",
        action: { label: "Volver a mi inicio", href: AR.session.home() } })}</div>`;
    }
  };

  V.noEncontrada = {
    title: "No encontrada",
    bar: { title: "No encontrada", back: true },
    render: function () {
      return html`<div class="page page--narrow">${UI.empty({ art: "suelto", title: "No encontramos esta pantalla", text: "Puede que el enlace esté mal escrito.", action: { label: "Ir al inicio", href: AR.session.home() } })}</div>`;
    }
  };
})();
