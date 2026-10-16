/** Aruy · Hojas inferiores y diálogos (Material 3).
 *  Se pueden arrastrar hacia abajo para cerrar, atrapan el foco, bloquean el fondo (`inert`) y el botón Atrás del sistema las cierra. */
AR.sheet = (function () {
  var root = document.getElementById("sheet-root");
  var open = null;   // { el, opener, release, onClose, pushed }

  function setBackgroundInert(on) {
    var shell = document.getElementById("shell");
    if (on) shell.setAttribute("inert", ""); else shell.removeAttribute("inert");
  }

  function finish(result) {
    if (!open) return;
    var s = open; open = null;
    if (s.release) s.release();
    root.innerHTML = "";
    setBackgroundInert(false);
    if (s.opener && document.contains(s.opener)) s.opener.focus({ preventScroll: true });
    if (s.onClose) s.onClose(result);
  }

  /* history.back() es asíncrono: mientras la hoja termina de cerrarse, los cambios de URL esperan en cola (ver whenIdle) */
  var busy = false, queue = [];
  function settle() { busy = false; var q = queue; queue = []; q.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); }
  window.addEventListener("popstate", function () {
    if (open && open.pushed) { open.pushed = false; finish(); }
    if (busy) settle();
  });

  /**
   * @param {string|AR.Safe} content  contenido HTML (sin la barra de arrastre)
   * @param {{label:string, dialog?:boolean, onClose?:Function}} o
   * @returns {HTMLElement} la hoja
   */
  function show(content, o) {
    o = o || {};
    if (open) { open.pushed = false; var prev = open; open = null; if (prev.release) prev.release(); root.innerHTML = ""; }
    var opener = document.activeElement;
    root.innerHTML = AR.html`<div class="sheet-backdrop" data-backdrop><div class="sheet ${o.dialog ? "is-dialog" : ""}" role="${o.dialog ? "alertdialog" : "dialog"}" aria-modal="true" aria-label="${o.label}" tabindex="-1">${o.dialog ? "" : AR.raw('<div class="sheet-grab" data-grab></div>')}<div class="sheet-body">${AR.raw(String(content))}</div></div></div>`.toString();
    var backdrop = root.firstElementChild, el = backdrop.firstElementChild;
    setBackgroundInert(true);
    open = { el: el, opener: opener, onClose: o.onClose, pushed: false };
    try { history.pushState({ sheet: 1 }, ""); open.pushed = true; } catch (e) { /* sin historial */ }
    open.release = AR.a11y.trap(el);

    backdrop.addEventListener("click", function (e) { if (e.target === backdrop) close(); });
    el.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) close(); });
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); close(); } });
    dragToClose(el, backdrop);

    var first = el.querySelector("[autofocus]") || el.querySelector("input, textarea, select") || el.querySelector("button, a[href]");
    setTimeout(function () { (first && !o.dialog ? first : el).focus({ preventScroll: true }); }, 30);
    AR.a11y.say(o.label);
    return el;
  }

  function close(result) {
    if (!open) return;
    var s = open;
    if (s.pushed) {
      s.pushed = false; open = s; busy = true;
      try { history.back(); } catch (e) { busy = false; }
      finish(result);
      setTimeout(function () { if (busy) settle(); }, 250);
    } else finish(result);
  }

  /** Arrastrar la manija (o el contenido si está al inicio) hacia abajo cierra la hoja. */
  function dragToClose(el, backdrop) {
    var startY = 0, dy = 0, dragging = false, pid = null;
    function start(e) {
      var grab = e.target.closest("[data-grab]");
      if (!grab && !(el.scrollTop <= 0 && e.target.closest(".sheet-body") && !e.target.closest("input, textarea, select, button, a"))) return;
      dragging = true; startY = e.clientY; dy = 0; pid = e.pointerId;
      el.style.transition = "none";
      try { el.setPointerCapture(pid); } catch (x) { /* sin captura */ }
    }
    function move(e) {
      if (!dragging || e.pointerId !== pid) return;
      dy = Math.max(0, e.clientY - startY);
      el.style.transform = "translateY(" + dy + "px)";
      backdrop.style.background = "rgb(10 12 36 / " + (0.52 * (1 - Math.min(1, dy / 400))).toFixed(2) + ")";
    }
    function end(e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      el.style.transition = "transform .22s cubic-bezier(.2,0,0,1)";
      if (dy > 110) { el.style.transform = "translateY(110%)"; setTimeout(function () { close(); }, 160); }
      else { el.style.transform = ""; backdrop.style.background = ""; }
    }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  /** Cierra la hoja sin tocar el historial (se usa cuando la navegación ya cambió de pantalla). */
  function dismiss() { if (!open) return; open.pushed = false; finish(); }

  /** Ejecuta fn cuando la hoja ya terminó de quitar su entrada del historial (o enseguida si no hay ninguna pendiente). */
  function whenIdle(fn) { if (busy) queue.push(fn); else fn(); }

  return { show: show, close: close, dismiss: dismiss, whenIdle: whenIdle, isOpen: function () { return !!open; }, el: function () { return open && open.el; } };
})();
