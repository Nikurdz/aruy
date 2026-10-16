/** Aruy · Router por hash con guardas de sesión y de rol, direcciones de transición y restauración del desplazamiento.
 *
 *  Una vista es { title, bar(ctx), tab, render(ctx) → HTML, mount(root, ctx), unmount() }.
 *  Rutas, roles y pestaña activa se declaran en la tabla de abajo. Roles null = cualquier persona con sesión. */
AR.router = (function () {
  var V = AR.views, S = AR.session;
  var CON = ["contratante"], PRE = ["prestador"];

  var ROUTES = [
    { path: "/splash", view: "splash", public: true },
    { path: "/login", view: "login", public: true },
    { path: "/registro", view: "registro", public: true },
    { path: "/recuperar", view: "recuperar", public: true },
    { path: "/verificar", view: "verificar" },
    { path: "/inicio", view: "home", roles: CON, tab: "inicio", root: true },
    { path: "/buscar", view: "buscar", roles: CON, tab: "buscar", root: true },
    { path: "/guardados", view: "guardados", roles: CON, tab: "guardados", root: true },
    { path: "/servicio/:id", view: "detalle", roles: null, tab: "inicio" },
    { path: "/prestador/:id", view: "prestadorPublico", roles: null, tab: "inicio" },
    { path: "/panel", view: "panel", roles: PRE, tab: "panel", root: true },
    { path: "/servicios", view: "misServicios", roles: PRE, tab: "servicios", root: true },
    { path: "/servicios/nuevo", view: "editor", roles: PRE, tab: "servicios" },
    { path: "/servicios/:id/editar", view: "editor", roles: PRE, tab: "servicios" },
    { path: "/portafolio", view: "portafolio", roles: PRE, tab: "portafolio", root: true },
    { path: "/perfil", view: "perfil", roles: null, tab: "perfil", root: true },
    { path: "/perfil/editar", view: "editarPerfil", roles: null, tab: "perfil" },
    { path: "/ajustes", view: "ajustes", roles: null, tab: "perfil" },
    { path: "/permisos", view: "permisos", roles: null, tab: "perfil" },
    { path: "/privacidad", view: "privacidad", roles: null, tab: "perfil" },
    { path: "/bloqueados", view: "bloqueados", roles: CON, tab: "perfil" },
    { path: "/reportes", view: "reportes", roles: null, tab: "perfil" },
    { path: "/normas", view: "normas", roles: null, tab: "perfil" },
    { path: "/eliminar", view: "eliminar", roles: null, tab: "perfil" },
    { path: "/acceso-denegado", view: "denegado", roles: null }
  ].map(function (r) {
    var keys = [], re = r.path.replace(/:([a-z]+)/g, function (_, k) { keys.push(k); return "([^/]+)"; });
    r.re = new RegExp("^" + re + "$"); r.keys = keys; return r;
  });

  var stack = [], scrollPos = {}, current = null, ctx = null, replaceNext = false, silentNext = false, first = true;

  function parse(hash) {
    var raw = (hash || location.hash).replace(/^#/, "") || "/";
    var i = raw.indexOf("?"), path = i < 0 ? raw : raw.slice(0, i), q = {};
    if (i >= 0) new URLSearchParams(raw.slice(i + 1)).forEach(function (v, k) { q[k] = v; });
    return { path: path, query: q, hash: "#" + raw };
  }

  function match(path) {
    for (var i = 0; i < ROUTES.length; i++) {
      var m = ROUTES[i].re.exec(path);
      if (m) { var params = {}; ROUTES[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); }); return { route: ROUTES[i], params: params }; }
    }
    return null;
  }

  function go(hash, o) {
    o = o || {};
    AR.sheet.whenIdle(function () {
      if (o.replace) replaceNext = true;
      if (hash === location.hash) { replaceNext = false; render(); return; }
      if (o.replace) location.replace(hash); else location.hash = hash;
    });
  }

  function home() { return S.isLoggedIn() ? S.home() : "#/login"; }

  function back(o) {
    if (o && o.silent) silentNext = true;
    AR.sheet.whenIdle(function () { if (stack.length > 1) history.back(); else go(home(), { replace: true }); });
  }

  function direction(from, to, popped, replaced) {
    if (!from) return "none";
    if (popped) return "pop";
    if (from.route.root && to.route.root && replaced) return "tab";
    if (replaced) return "tab";
    return "push";
  }

  function render() {
    var loc = parse(), hit = match(loc.path), user = S.user();

    /* Entrada y guardas */
    if (loc.path === "/" || !hit) return go(user ? S.home() : "#/login", { replace: true });
    var route = hit.route;
    if (route.public && user && route.view !== "splash") return go(S.home(), { replace: true });
    if (!route.public && !user) return go("#/login?next=" + encodeURIComponent(loc.hash), { replace: true });
    if (!route.public && route.roles && route.roles.indexOf(user.rol) < 0) return go("#/acceso-denegado", { replace: true });

    var view = V[route.view];
    if (!view) view = V.noEncontrada;

    /* Pila de navegación para saber si es avanzar, volver o cambiar de pestaña */
    var popped = false, replaced = replaceNext;
    if (stack.length >= 2 && stack[stack.length - 2] === loc.hash && !replaced) { stack.pop(); popped = true; }
    else if (replaced && stack.length) stack[stack.length - 1] = loc.hash;
    else if (stack[stack.length - 1] !== loc.hash) stack.push(loc.hash);
    replaceNext = false;

    var next = { path: loc.path, hash: loc.hash, params: hit.params, query: loc.query, route: route, view: view };
    var dir = direction(current, next, popped, replaced);
    if (first) dir = "none";
    if (silentNext) { dir = "none"; silentNext = false; }
    first = false;

    if (current) scrollPos[current.hash] = AR.shell.el.main.scrollTop;
    var prev = current, prevView = prev && prev.view;

    var hero = null;
    if (dir === "push" && next.route.view === "detalle" && router._hero) hero = { id: router._hero.id, fromEl: router._hero.el };
    if (dir === "pop" && prev && prev.route.view === "detalle") hero = { id: prev.params.id };
    router._hero = null;

    AR.motion.run(dir, function () {
      if (prevView && prevView.unmount) { try { prevView.unmount(); } catch (e) { console.error(e); } }
      AR.gestures.release();
      AR.sheet.dismiss();
      current = next; ctx = next;
      var main = AR.shell.el.main;
      var barDesc = typeof view.bar === "function" ? view.bar(ctx) : view.bar;
      AR.shell.setBar(barDesc);
      AR.shell.setNav(view.nav === false || route.public || (!user.verificado && route.view === "verificar") ? null : route.tab || "");
      /* Cada pantalla vive en su propio contenedor: al navegar se descarta con sus eventos, y `root.isConnected` dice si la vista sigue activa */
      var wrap = document.createElement("div");
      wrap.className = "view"; wrap.style.display = "contents";
      wrap.innerHTML = String(view.render(ctx));
      /* Toda pantalla tiene exactamente un h1 (la barra superior no lo es): si la vista no trae uno, se agrega uno solo para lectores de pantalla */
      if (!wrap.querySelector("h1")) wrap.insertAdjacentHTML("afterbegin", '<h1 class="sr-only" tabindex="-1">' + AR.esc((barDesc && barDesc.title) || "Aruy") + "</h1>");
      main.replaceChildren(wrap);
      AR.photos.hydrate(wrap);
      document.title = ((typeof view.title === "function" ? view.title(ctx) : view.title) || "Aruy") + " · Aruy";
      main.scrollTop = popped ? (scrollPos[loc.hash] || 0) : 0;
      AR.shell.el.bar.setAttribute("data-scrolled", main.scrollTop > 4 ? "true" : "false");
      if (view.mount) { try { view.mount(wrap, ctx); } catch (e) { console.error(e); } }
      AR.shell.syncBanner();
      if (dir !== "none" || user) AR.a11y.focusTitle(wrap);
      AR.rendered = loc.hash;
    }, hero || {});
  }

  var router = {
    ROUTES: ROUTES, go: go, back: back, parse: parse, render: render,
    canGoBack: function () { return stack.length > 1; },
    /** Vuelve a pintar la pantalla actual sin animación y conservando el desplazamiento (cuando llegan datos nuevos). */
    refresh: function () {
      var main = AR.shell.el.main, top = main.scrollTop;
      silentNext = true; render(); main.scrollTop = top;
    },
    current: function () { return ctx; },
    /** Reemplaza el hash sin recargar la vista (p. ej. filtros en la URL). */
    replaceQuiet: function (hash) {
      AR.sheet.whenIdle(function () {
        try { history.replaceState(history.state, "", location.pathname + location.search + hash); stack[stack.length - 1] = hash; if (current) current.hash = hash; AR.rendered = hash; } catch (e) { /* sin historial */ }
      });
    },
    start: function () {
      window.addEventListener("hashchange", render);
      /* Elemento compartido: se recuerda la foto de la tarjeta tocada */
      document.getElementById("main").addEventListener("click", function (e) {
        var a = e.target.closest("[data-hero-id]");
        if (a) router._hero = { id: a.getAttribute("data-hero-id"), el: a.querySelector("[data-hero]") };
      }, true);
      /* Cambiar de pestaña reemplaza la entrada del historial, como la barra de navegación de Android */
      document.getElementById("nav").addEventListener("click", function (e) {
        var a = e.target.closest("a.nav-item"); if (!a) return;
        e.preventDefault();
        var href = a.getAttribute("href");
        if (href === location.hash) { AR.shell.el.main.scrollTo({ top: 0, behavior: AR.u.reducedMotion() ? "auto" : "smooth" }); return; }
        go(href, { replace: true });
      });
      render();
    }
  };
  return router;
})();
