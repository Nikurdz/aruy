/** Aruy · Gestos: volver con deslizamiento desde el borde (atrás predictivo) y jalar para actualizar. */
AR.gestures = (function () {
  var main = document.getElementById("main"), app = document.getElementById("app");

  /* ---------- Atrás predictivo ----------
     La pantalla se encoge y sigue al dedo; al soltar pasado cierto punto vuelve, si no regresa a su lugar. */
  (function backSwipe() {
    var EDGE = 26, sx = 0, sy = 0, dx = 0, active = false, decided = false, id = null;

    app.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "touch" || !AR.router.canGoBack() || AR.sheet.isOpen()) return;
      var r = app.getBoundingClientRect();
      if (e.clientX - r.left > EDGE) return;
      sx = e.clientX; sy = e.clientY; dx = 0; active = true; decided = false; id = e.pointerId;
    });
    app.addEventListener("pointermove", function (e) {
      if (!active || e.pointerId !== id) return;
      dx = e.clientX - sx;
      var dy = e.clientY - sy;
      if (!decided) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { active = false; return; }
        if (dx > 10) { decided = true; try { app.setPointerCapture(id); } catch (x) { /* sin captura */ } main.style.transition = "none"; }
        else return;
      }
      var w = app.clientWidth, p = AR.u.clamp(dx / (w * 0.6), 0, 1);
      main.style.transform = "translateX(" + (dx * 0.5).toFixed(1) + "px) scale(" + (1 - 0.07 * p).toFixed(3) + ")";
      main.style.borderRadius = Math.round(28 * p) + "px";
      main.style.boxShadow = "0 0 40px rgb(10 12 36 / " + (0.3 * p).toFixed(2) + ")";
    });
    function end(e) {
      if (!active || (e && e.pointerId !== id)) return;
      var was = decided; active = false; decided = false;
      if (!was) return;
      var w = app.clientWidth, commit = dx > w * 0.32;
      main.style.transition = "transform .2s cubic-bezier(.2,0,0,1), border-radius .2s, box-shadow .2s";
      if (commit) {
        main.style.transform = "translateX(" + w + "px) scale(.9)";
        setTimeout(function () { reset(); AR.router.back({ silent: true }); }, 160);
      } else reset();
    }
    function reset() { main.style.transition = ""; main.style.transform = ""; main.style.borderRadius = ""; main.style.boxShadow = ""; }
    app.addEventListener("pointerup", end);
    app.addEventListener("pointercancel", end);
  })();

  /* ---------- Jalar para actualizar ---------- */
  var ptr = null;
  function pullToRefresh(onRefresh) {
    release();
    var ind = document.createElement("div");
    ind.className = "ptr"; ind.setAttribute("aria-hidden", "true");
    ind.innerHTML = String(AR.html`<span class="ptr-ic">${AR.icon("refresh")}</span>`);
    main.parentNode.insertBefore(ind, main);
    var startY = 0, pull = 0, tracking = false, busy = false, TH = 72;

    function ts(e) { if (busy || main.scrollTop > 0) return; startY = e.touches[0].clientY; tracking = true; pull = 0; }
    function tm(e) {
      if (!tracking) return;
      var dy = e.touches[0].clientY - startY;
      if (dy <= 0) { pull = 0; ind.style.setProperty("--p", 0); return; }
      if (main.scrollTop > 0) { tracking = false; return; }
      pull = Math.min(dy * 0.5, TH * 1.4);
      ind.style.setProperty("--p", (pull / TH).toFixed(2));
      ind.style.setProperty("--y", pull + "px");
      ind.classList.add("show");
    }
    function te() {
      if (!tracking) return; tracking = false;
      if (pull >= TH) {
        busy = true; ind.classList.add("busy"); ind.style.setProperty("--y", TH * 0.8 + "px");
        Promise.resolve(onRefresh()).catch(function () { /* el error se muestra en la vista */ }).then(function () {
          setTimeout(function () { busy = false; ind.classList.remove("busy", "show"); ind.style.setProperty("--y", "0px"); ind.style.setProperty("--p", 0); }, 350);
        });
      } else { ind.classList.remove("show"); ind.style.setProperty("--y", "0px"); ind.style.setProperty("--p", 0); }
    }
    main.addEventListener("touchstart", ts, { passive: true });
    main.addEventListener("touchmove", tm, { passive: true });
    main.addEventListener("touchend", te);
    main.addEventListener("touchcancel", te);
    ptr = { ind: ind, ts: ts, tm: tm, te: te };
  }
  function release() {
    if (!ptr) return;
    main.removeEventListener("touchstart", ptr.ts); main.removeEventListener("touchmove", ptr.tm);
    main.removeEventListener("touchend", ptr.te); main.removeEventListener("touchcancel", ptr.te);
    if (ptr.ind.parentNode) ptr.ind.parentNode.removeChild(ptr.ind);
    ptr = null;
  }

  return { pullToRefresh: pullToRefresh, release: release };
})();
