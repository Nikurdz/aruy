/** Aruy · Shell de la app: barra superior, navegación adaptable (barra inferior, riel o panel lateral) y aviso de conexión.
 *  El layout cambia por el ancho de .app (container queries en shell.css); aquí solo se rellena el contenido. */
AR.shell = (function () {
  var html = AR.html, icon = AR.icon, U = AR.u;
  var $ = function (id) { return document.getElementById(id); };
  var el = { app: $("app"), shell: $("shell"), nav: $("nav"), column: $("column"), bar: $("appbar"), banner: $("banner"), main: $("main") };

  var NAV = {
    contratante: [
      { id: "inicio", href: "#/inicio", label: "Inicio", icon: "home" },
      { id: "buscar", href: "#/buscar", label: "Buscar", icon: "search" },
      { id: "guardados", href: "#/guardados", label: "Guardados", icon: "heart" },
      { id: "perfil", href: "#/perfil", label: "Perfil", icon: "user" }
    ],
    invitado: [
      { id: "inicio", href: "#/inicio", label: "Inicio", icon: "home" },
      { id: "buscar", href: "#/buscar", label: "Buscar", icon: "search" },
      { id: "cuenta", href: "#/registro", label: "Crear cuenta", icon: "user" }
    ],
    prestador: [
      { id: "panel", href: "#/panel", label: "Panel", icon: "dashboard" },
      { id: "servicios", href: "#/servicios", label: "Servicios", icon: "briefcase" },
      { id: "portafolio", href: "#/portafolio", label: "Portafolio", icon: "image" },
      { id: "perfil", href: "#/perfil", label: "Perfil", icon: "user" }
    ]
  };

  var handlers = {};

  /* ---------- Navegación ---------- */
  function setNav(activeId) {
    var user = AR.session.user();
    if (!user || activeId === null) { el.shell.setAttribute("data-nav", "none"); el.nav.innerHTML = ""; syncSnackOffset(); return; }
    var items = NAV[user.rol] || [];
    el.shell.setAttribute("data-nav", "on");
    el.nav.innerHTML = String(html`
      <div class="nav-brand"><a href="${AR.session.home()}" aria-label="Aruy, ir al inicio" style="display:inline-flex;align-items:center;gap:12px;text-decoration:none;color:inherit">${AR.ui.mark(34)}<span class="wordmark">Aruy</span></a></div>
      <div class="nav-list">${items.map(function (n) {
        return html`<a class="nav-item" href="${n.href}" data-nav="${n.id}" ${n.id === activeId ? html`aria-current="page"` : ""}>
          <span class="nav-ind">${icon(n.id === activeId && n.icon === "heart" ? "heart-fill" : n.icon)}</span><span class="nav-label">${n.label}</span></a>`;
      })}</div>
      <div class="nav-foot"><b>${U.firstName(user.nombre)}</b><br>${user.rol === "prestador" ? "Prestador de servicios" : user.guest ? "Sin cuenta" : "Contratante"}</div>`);
    syncSnackOffset();
  }

  /* ---------- Barra superior ---------- */
  function setBar(d) {
    d = d || {};
    handlers = {};
    el.column.setAttribute("data-bar", d.hidden ? "none" : d.overlay ? "overlay" : "normal");
    if (d.hidden) { el.bar.innerHTML = ""; return; }
    var left = d.back ? html`<button type="button" class="icon-btn" data-back aria-label="${d.backLabel || "Volver"}">${icon("back")}</button>` : "";
    var title = d.brand
      ? html`<a class="appbar-brand" href="${AR.session.home()}" aria-label="Aruy, inicio">${AR.ui.mark(32)}<span class="wordmark">Aruy</span></a>`
      : html`<span class="appbar-title t-title-l" id="page-title">${d.title || ""}</span>`;
    var acts = (d.actions || []).map(function (a) {
      if (a.onClick) handlers[a.id] = a.onClick;
      if (a.text) return html`<button type="button" class="chip" data-act="${a.id}" aria-label="${a.label}">${icon(a.icon, "ic-s")}${a.text}${icon("chevron-down", "ic-s")}</button>`;
      return html`<button type="button" class="icon-btn ${a.on ? "is-on" : ""}" data-act="${a.id}" aria-label="${a.label}" ${a.pressed != null ? html`aria-pressed="${!!a.pressed}"` : ""}>${icon(a.icon)}</button>`;
    });
    el.bar.innerHTML = String(html`${left}${title}${d.brand ? html`<span class="spacer"></span>` : ""}<div class="appbar-actions">${acts}</div>`);
  }

  function patchAction(id, patch) {
    var b = el.bar.querySelector('[data-act="' + id + '"]'); if (!b) return;
    if (patch.icon) b.innerHTML = String(icon(patch.icon));
    if (patch.label) b.setAttribute("aria-label", patch.label);
    if (patch.pressed != null) b.setAttribute("aria-pressed", String(!!patch.pressed));
    if (patch.on != null) b.classList.toggle("is-on", !!patch.on);
  }

  el.bar.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) { AR.router.back(); return; }
    var a = e.target.closest("[data-act]");
    if (a && handlers[a.getAttribute("data-act")]) handlers[a.getAttribute("data-act")](a);
  });

  /* ---------- Aviso de conexión ---------- */
  function syncBanner() {
    var off = !AR.net.online();
    el.banner.hidden = !off;
    el.banner.innerHTML = off ? String(html`${icon("wifi-off", "ic-s")}<span>Sin conexión. Verás lo último que guardaste en tu teléfono.</span>`) : "";
  }
  AR.net.on(syncBanner);

  /* ---------- Avisos sobre la barra de navegación ---------- */
  function syncSnackOffset() {
    var bottom = el.shell.getAttribute("data-nav") !== "none" && el.nav.offsetHeight && el.nav.offsetWidth === el.shell.offsetWidth ? el.nav.offsetHeight : 0;
    el.app.style.setProperty("--snack-bottom", bottom + "px");
  }
  if (window.ResizeObserver) new ResizeObserver(syncSnackOffset).observe(el.app);

  /* ---------- Barra con elevación al desplazar ---------- */
  el.main.addEventListener("scroll", function () { el.bar.setAttribute("data-scrolled", el.main.scrollTop > 4 ? "true" : "false"); }, { passive: true });

  return { el: el, setNav: setNav, setBar: setBar, patchAction: patchAction, syncBanner: syncBanner, syncSnackOffset: syncSnackOffset, NAV: NAV };
})();
