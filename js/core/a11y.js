/** Aruy · Accesibilidad: anuncios para lectores de pantalla (TalkBack), foco al cambiar de pantalla y trampa de foco en hojas. */
AR.a11y = (function () {
  var live = document.createElement("div");
  live.className = "sr-only"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return {
    /** Anuncia un mensaje sin moverle el foco a nadie. */
    say: function (msg) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 60); },

    /** Al cambiar de pantalla el foco va al título (h1) para que el lector lo lea primero. */
    focusTitle: function (root) {
      var h = root.querySelector("h1") || root;
      if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    },

    focusable: function (root) {
      return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    },

    /** Mantiene el foco dentro de una hoja; devuelve una función para soltarlo. */
    trap: function (root) {
      function onKey(e) {
        if (e.key !== "Tab") return;
        var f = AR.a11y.focusable(root); if (!f.length) { e.preventDefault(); return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      root.addEventListener("keydown", onKey);
      return function () { root.removeEventListener("keydown", onKey); };
    }
  };
})();
