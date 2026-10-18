/** Aruy · Inicio del contratante (Figura 2): catálogo con estados Loading, Success y Error (ServicioUiState). */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views, S = AR.UiState;

  function zoneLabel() {
    var u = AR.session.user(), b = u && AR.catalog.barrio(u.barrio), z = u && AR.catalog.zona(u.ubicacion);
    if (AR.perms.state("ubicacion") === "granted" && AR.db.kv.get("pos", null)) return "Cerca de ti";
    return b ? b.nombre : z ? z.nombre : "Quito";
  }

  /** Hoja para elegir la zona o usar la ubicación del teléfono. */
  function locationSheet(after) {
    var u = AR.session.user(), cur = u.ubicacion;
    var el = AR.sheet.show(html`<div class="stack" style="--gap:12px;padding-top:4px">
      <div><h2 class="t-headline">¿Dónde buscas?</h2><p class="muted">Te mostramos primero lo que está más cerca.</p></div>
      <button type="button" class="btn btn-soft btn-lg btn-block" data-gps>${icon("locate")}Usar mi ubicación</button>
      <div class="opt-list" role="radiogroup" aria-label="Zona de Quito" style="margin-top:0">${AR.catalog.zonas.map(function (z) {
        return html`<button type="button" class="opt" role="radio" aria-checked="${z.id === cur}" data-zona="${z.id}">${icon("pin")}<span class="grow">${z.largo}</span></button>`;
      })}</div></div>`, { label: "Elegir ubicación" });
    el.addEventListener("click", function (e) {
      var z = e.target.closest("[data-zona]"), g = e.target.closest("[data-gps]");
      if (z) {
        AR.db.kv.del("pos"); AR.perms.reset("ubicacion");
        AR.session.patch({ ubicacion: z.getAttribute("data-zona"), barrio: null }).then(function () { AR.sheet.close(); if (after) after(); });
      } else if (g) {
        AR.sheet.close();
        setTimeout(function () { AR.perms.request("ubicacion").then(function (ok) { if (ok && after) after(); }); }, 200);
      }
    });
  }

  V.home = {
    title: "Inicio",
    bar: function () {
      return {
        brand: true,
        actions: [
          { id: "loc", icon: "pin", text: zoneLabel(), label: "Ubicación: " + zoneLabel() + ". Cambiar", onClick: function () { locationSheet(function () { AR.router.refresh(); }); } },
          { id: "refresh", icon: "refresh", label: "Actualizar", onClick: function () { V.home._reload && V.home._reload(true); } }
        ]
      };
    },
    render: function () {
      var u = AR.session.user();
      return html`<div class="page home stack stack-l">
        <header class="greet">
          <h1 class="t-display">${u.guest ? "Hola" : "Hola, " + U.firstName(u.nombre)}</h1>
          <p class="t-body-l muted">¿Qué servicio necesitas hoy?</p>
        </header>
        ${u.guest ? html`<div class="nudge guest-note">${icon("lock")}<p class="t-body-m"><b>Estás explorando sin cuenta.</b> Crea una para ver precios, calificaciones y contactar.</p><a class="btn btn-soft" href="#/registro">Crear cuenta</a></div>` : ""}
        <a class="searchfield" href="#/buscar?foco=1" aria-label="Buscar servicios">${icon("search")}<span>Busca plomero, manicure, limpieza…</span></a>
        <section aria-labelledby="h-cat" class="bleed">
          <div class="section-head pad"><h2 class="t-title-l" id="h-cat">Categorías</h2></div>
          <div class="hscroll cats" role="list">${AR.catalog.categorias.map(function (c) { return html`<div role="listitem">${UI.categoryTile(c)}</div>`; })}</div>
        </section>
        <div id="home-data" aria-live="polite"></div>
      </div>`;
    },
    mount: function (root) {
      var host = root.querySelector("#home-data");

      function sections(list, meta) {
        var disponibles = list.filter(function (s) { return s.disponible && s.prestador.disponible; }).sort(AR.repo.SORT.cercania).slice(0, 8);
        var mejores = list.slice().sort(AR.repo.SORT.rating).slice(0, 5);
        var recientes = AR.repo.listaRecientes().slice(0, 3);
        return html`
          ${meta.offline ? html`<p class="card card--outlined t-body-m">${icon("wifi-off", "ic-s")} No pudimos actualizar. Te mostramos lo último que guardaste.</p>` : ""}
          <section aria-labelledby="h-now" class="bleed">
            <div class="section-head pad"><h2 class="t-title-l" id="h-now">Disponibles ahora cerca de ti</h2><a class="btn btn-text" href="#/buscar?ahora=1">Ver todos</a></div>
            <div class="hscroll">${disponibles.map(UI.serviceCard)}</div>
          </section>
          ${UI.ad(UI.pickAd("", "home"))}
          <section aria-labelledby="h-top">
            <div class="section-head"><h2 class="t-title-l" id="h-top">Mejor valorados</h2><a class="btn btn-text" href="#/buscar?orden=rating">Ver todos</a></div>
            <div class="list-flat">${mejores.map(UI.serviceRow)}</div>
          </section>
          ${recientes.length ? html`<section aria-labelledby="h-rec">
            <div class="section-head"><h2 class="t-title-l" id="h-rec">Vistos recientemente</h2></div>
            <p class="t-body-m muted" style="margin:-4px 0 4px">Guardados en tu teléfono para verlos sin conexión.</p>
            <div class="list-flat">${recientes.map(UI.serviceRow)}</div>
          </section>` : ""}`;
      }

      /* ServicioUiState: Loading → Success | Error; la pantalla se pinta siempre desde la base local */
      function paint(state) {
        UI.paint(host, state, {
          idle: function () { return ""; },
          loading: function () { return UI.loading("Cargando servicios cerca de ti…", html`<section class="bleed"><div class="hscroll">${UI.skelCards(3)}</div></section><div class="list-flat">${UI.skelRows(3)}</div>`); },
          success: function (s) { return s.data.length ? sections(s.data, s.meta) : UI.empty({ art: "tela", title: "Aún no hay servicios", text: "Cuando se publiquen, aparecerán aquí." }); },
          error: function (s) { return UI.errorState(s); }
        });
        host.setAttribute("aria-busy", String(state.kind === "loading"));
      }

      function load(force) {
        return new Promise(function (resolve) {
          AR.repo.cargarCatalogo(function (st) { if (!root.isConnected) return; paint(st); if (st.kind !== "loading") resolve(); }, { force: !!force });
        });
      }
      V.home._reload = function (force) { return load(force); };
      load(false);

      host.addEventListener("click", function (e) {
        if (e.target.closest("[data-retry]")) load(true);
        var f = e.target.closest("[data-fav]");
        if (f) { toggleFav(f); }
      });
      AR.gestures.pullToRefresh(function () { return load(true); });
    },
    unmount: function () { V.home._reload = null; }
  };

  /** Corazón de una tarjeta: guarda o quita de favoritos con «Deshacer». */
  function toggleFav(btn, silent, after) {
    var id = typeof btn === "string" ? btn : btn.getAttribute("data-fav"), p = AR.repo.prestador(id); if (!p) return;
    var on = AR.repo.toggleFavorito(id);
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) {
      b.setAttribute("aria-pressed", String(on)); b.classList.toggle("is-on", on); b.innerHTML = String(icon(on ? "heart-fill" : "heart"));
      b.setAttribute("aria-label", (on ? "Quitar de favoritos a " : "Guardar en favoritos a ") + p.nombre);
    });
    U.vibrate(10);
    if (after) after(on);
    if (!silent) AR.snack.show(on ? "Guardaste a " + p.nombre + " en favoritos." : "Quitaste a " + p.nombre + " de favoritos.", { action: "Deshacer", onAction: function () { toggleFav(id, true, after); } });
    return on;
  }
  AR.favToggle = toggleFav;
  V.home.locationSheet = locationSheet;
  V.home.zoneLabel = zoneLabel;
})();
