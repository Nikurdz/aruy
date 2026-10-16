/** Aruy · Movimiento entre pantallas con View Transitions.
 *  Solo se anima lo que responde a una acción de la persona: avanzar (desliza), volver (desliza al revés), cambiar de pestaña (se disuelve)
 *  y, al abrir un servicio, la foto de la tarjeta crece hasta ser la portada del detalle (elemento compartido «hero»). */
AR.motion = (function () {
  var root = document.documentElement;

  function name(el, v) { if (el) el.style.viewTransitionName = v || ""; }

  /**
   * @param {"push"|"pop"|"tab"|"none"} dir
   * @param {Function} update   cambia el DOM
   * @param {{hero?:string, fromEl?:Element}=} o   hero: id del elemento compartido
   */
  function run(dir, update, o) {
    o = o || {};
    var can = typeof document.startViewTransition === "function" && dir !== "none" && !AR.u.reducedMotion() && !document.hidden;
    if (!can) { update(); return Promise.resolve(); }

    var screen = document.getElementById("main");
    var from = null;
    if (o.hero) {
      from = o.fromEl || screen.querySelector('[data-hero="' + CSS.escape(o.hero) + '"]');
      if (from) name(from, "hero");
    }
    root.setAttribute("data-dir", dir);
    var t;
    try {
      t = document.startViewTransition(function () {
        name(from, "");
        update();
        if (o.hero) {
          var to = document.getElementById("main").querySelector('[data-hero="' + CSS.escape(o.hero) + '"]');
          if (to) name(to, "hero");
        }
      });
    } catch (e) { update(); root.removeAttribute("data-dir"); return Promise.resolve(); }
    var clean = function () {
      root.removeAttribute("data-dir");
      Array.prototype.forEach.call(document.querySelectorAll("[data-hero]"), function (el) { name(el, ""); });
    };
    return t.finished.then(clean, clean);
  }

  return { run: run };
})();
