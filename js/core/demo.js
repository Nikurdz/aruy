/** Aruy · Panel de demostración (solo con ?demo=1): simular carga lenta, error o falta de conexión, cambiar de cuenta,
 *  reiniciar los datos y probar la vista de teléfono, plegable o tableta. No forma parte del producto. */
(function () {
  if (!AR.config.DEMO) return;
  var html = AR.html, icon = AR.icon, root = document.getElementById("demo-root");

  root.innerHTML = '<button type="button" class="demo-fab" aria-haspopup="dialog">Demo</button>';
  var st = document.createElement("style");
  st.textContent = ".demo-fab{position:fixed;left:8px;top:8px;z-index:90;min-height:36px;padding:0 12px;border:0;border-radius:18px;background:#14173A;color:#fff;font:700 13px var(--font-body);opacity:.78;box-shadow:0 2px 8px rgb(0 0 0 / .3)}.demo-fab:hover,.demo-fab:focus-visible{opacity:1}";
  document.head.appendChild(st);

  function open() {
    var net = AR.net.mode, dev = document.documentElement.getAttribute("data-device") || "";
    var el = AR.sheet.show(html`<div class="stack" style="--gap:18px;padding-top:4px">
      <div><h2 class="t-headline">Panel de demostración</h2><p class="muted t-body-m">Herramientas para presentar el prototipo. No son parte de la app.</p></div>
      <div class="field"><span class="field-label" id="d-net">Conexión</span>${AR.ui.segmented({ name: "net", label: "Conexión", value: net, options: [{ value: "online", label: "Normal" }, { value: "slow", label: "Lenta" }, { value: "error", label: "Error" }, { value: "offline", label: "Sin red" }] })}</div>
      <div class="field"><span class="field-label">Cuenta</span><div class="chips">
        <button type="button" class="chip" data-d="con">Contratante</button><button type="button" class="chip" data-d="pre">Prestador</button><button type="button" class="chip" data-d="out">Cerrar sesión</button></div></div>
      <div class="field"><span class="field-label">Vista de dispositivo (pantallas grandes)</span>${AR.ui.segmented({ name: "dev", label: "Dispositivo", value: dev, options: [{ value: "", label: "Completa" }, { value: "phone", label: "Teléfono" }, { value: "fold", label: "Plegable" }, { value: "tablet", label: "Tableta" }] })}</div>
      <div class="chips"><button type="button" class="btn btn-outlined" data-d="cache">Vaciar caché local</button><button type="button" class="btn btn-danger-text" data-d="reset">Reiniciar todos los datos</button></div>
      <button type="button" class="btn btn-text" data-close>Cerrar</button></div>`, { label: "Panel de demostración" });
    AR.ui.bindSegments(el, "net", function (v) { AR.net.setMode(v); AR.shell.syncBanner(); AR.snack.show({ online: "Conexión normal.", slow: "Conexión lenta: las cargas tardan más.", error: "El servidor fallará en la próxima carga.", offline: "Sin conexión." }[v]); });
    AR.ui.bindSegments(el, "dev", function (v) { if (v) document.documentElement.setAttribute("data-device", v); else document.documentElement.removeAttribute("data-device"); });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-d]"); if (!b) return; var k = b.getAttribute("data-d");
      if (k === "con" || k === "pre") { AR.sheet.close(); AR.session.logout(); AR.session.demo(k === "con" ? "contratante" : "prestador").then(function () { AR.repo.invalidar(); AR.router.go(AR.session.home(), { replace: true }); }); }
      if (k === "out") { AR.sheet.close(); AR.session.logout(); AR.router.go("#/bienvenida", { replace: true }); }
      if (k === "cache") { AR.repo.resetCache(); AR.snack.show("Caché local vaciada."); }
      if (k === "reset") { AR.api._reset(); AR.db.wipe(); AR.photos.wipe().then(function () { try { sessionStorage.clear(); } catch (x) { /* sin sessionStorage */ } location.hash = ""; location.reload(); }); }
    });
  }
  root.firstChild.addEventListener("click", open);
  AR.demo = { open: open };
})();
