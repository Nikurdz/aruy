/** Aruy · Buscar (funcionalidades 6 y 7): texto, categoría, zona, calificación, disponibilidad, verificación, precio y distancia.
 *  Lista o mapa de zonas. Los filtros viven en la URL, así sobreviven a rotar la pantalla y se pueden compartir. */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views, S = AR.UiState;

  var SORTS = [
    { v: "cercania", l: "Más cerca", sub: "Primero quienes están a menos distancia" },
    { v: "rating", l: "Mejor calificación", sub: "Las mejores opiniones primero" },
    { v: "precio", l: "Menor precio", sub: "Desde el precio referencial más bajo" },
    { v: "recomendados", l: "Más recomendados", sub: "Los que más personas recomiendan" }
  ];
  var MINS = [{ v: 0, l: "Todas" }, { v: 4, l: "4 o más" }, { v: 4.5, l: "4,5 o más" }];

  function parse(q) {
    var f = { q: q.q || "", cat: "", zona: "", min: 0, ahora: false, verificados: false, maxPrecio: 0, maxKm: 0, orden: "cercania", vista: "lista" };
    if (q.cat && AR.catalog.categorias.some(function (c) { return c.id === q.cat; })) f.cat = q.cat;
    if (q.zona && AR.catalog.zona(q.zona)) f.zona = q.zona;
    if (q.min) f.min = parseFloat(q.min) || 0;
    f.ahora = q.ahora === "1"; f.verificados = q.ver === "1";
    f.maxPrecio = parseInt(q.precio, 10) || 0; f.maxKm = parseInt(q.km, 10) || 0;
    if (q.orden && SORTS.some(function (s) { return s.v === q.orden; })) f.orden = q.orden;
    if (q.vista === "mapa") f.vista = "mapa";
    return f;
  }
  function serialize(f) {
    var p = new URLSearchParams();
    if (f.q) p.set("q", f.q); if (f.cat) p.set("cat", f.cat); if (f.zona) p.set("zona", f.zona); if (f.min) p.set("min", f.min);
    if (f.ahora) p.set("ahora", "1"); if (f.verificados) p.set("ver", "1"); if (f.maxPrecio) p.set("precio", f.maxPrecio); if (f.maxKm) p.set("km", f.maxKm);
    if (f.orden !== "cercania") p.set("orden", f.orden); if (f.vista === "mapa") p.set("vista", "mapa");
    var s = p.toString(); return "#/buscar" + (s ? "?" + s : "");
  }
  function activeFilters(f) {
    var a = [];
    if (f.cat) a.push({ k: "cat", l: AR.catalog.cat(f.cat).nombre });
    if (f.zona) a.push({ k: "zona", l: AR.catalog.zona(f.zona).largo });
    if (f.min) a.push({ k: "min", l: "Calificación " + (f.min === 4.5 ? "4,5" : f.min) + " o más" });
    if (f.ahora) a.push({ k: "ahora", l: "Disponible ahora" });
    if (f.verificados) a.push({ k: "verificados", l: "Cuenta verificada" });
    if (f.maxPrecio) a.push({ k: "maxPrecio", l: "Hasta " + U.money(f.maxPrecio) });
    if (f.maxKm) a.push({ k: "maxKm", l: "A menos de " + f.maxKm + " km" });
    return a;
  }

  /* ---------- Mapa esquemático de Quito (sin mapas externos: funciona sin conexión) ---------- */
  var MAP = { w: 320, h: 560, latN: -0.075, latS: -0.335, lngW: -78.585, lngE: -78.375 };
  function proj(lat, lng) {
    return { x: Math.round(((lng - MAP.lngW) / (MAP.lngE - MAP.lngW)) * MAP.w), y: Math.round(((MAP.latN - lat) / (MAP.latN - MAP.latS)) * MAP.h) };
  }
  function mapHtml(list, ref) {
    var byBarrio = {};
    list.forEach(function (s) { (byBarrio[s.prestador.barrio] = byBarrio[s.prestador.barrio] || []).push(s); });
    var pins = Object.keys(byBarrio).map(function (k) {
      var b = AR.catalog.barrio(k), p = proj(b.lat, b.lng), n = byBarrio[k].length;
      return html`<g class="map-pin" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" data-barrio="${k}" aria-label="${b.nombre}: ${U.plural(n, "servicio", "servicios")}">
        <circle r="${15 + Math.min(n, 6)}" class="halo"/><circle r="${12 + Math.min(n, 5)}" class="dotp"/><text y="5" text-anchor="middle">${n}</text></g>`;
    });
    var me = proj(ref.lat, ref.lng);
    var labels = AR.catalog.zonas.map(function (z) { var p = proj(z.lat, z.lng); return html`<text class="map-zone" x="${p.x}" y="${p.y - 26}" text-anchor="middle">${z.nombre}</text>`; });
    return html`<div class="map-wrap"><svg class="map" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="Mapa esquemático de Quito con los servicios agrupados por barrio">
      <path class="map-city" d="M120 20c40-10 78 14 86 54 10 46-20 70-8 120 10 44 40 60 38 110-2 60-46 70-70 112-22 38-70 60-96 36-30-28-6-70-4-110 2-42-34-70-26-130 6-44 6-70 36-110 12-16 24-72 44-82z"/>
      <path class="map-line" d="M70 150h150M60 290h160M70 430h130" />
      ${labels}${pins}
      <g class="map-me" transform="translate(${me.x} ${me.y})"><circle r="16" class="ring"/><circle r="7" class="core"/><title>Tu ubicación</title></g>
    </svg></div>`;
  }

  V.buscar = {
    title: "Buscar",
    bar: { title: "Buscar" },
    render: function (ctx) {
      var f = parse(ctx.query);
      return html`<div class="page search stack" id="search-page">
        <div class="search-top">
          <div class="searchbox">${icon("search")}<label class="sr-only" for="q">Buscar servicios</label>
            <input class="input" id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="Servicio, oficio o nombre" value="${f.q}">
            <button type="button" class="icon-btn" id="q-clear" aria-label="Borrar búsqueda" ${f.q ? "" : raw("hidden")}>${icon("close")}</button></div>
          <div class="toolbar">
            <div class="toolbar-chips hscroll hscroll--flush">
              <button type="button" class="chip" id="b-filters" aria-haspopup="dialog">${icon("sliders", "ic-s")}Filtros<span class="count" id="b-count" hidden></span></button>
              <button type="button" class="chip" id="b-sort" aria-haspopup="dialog">${icon("sort", "ic-s")}<span id="b-sort-l">Más cerca</span></button>
            </div>
            <div class="seg seg--icons" role="radiogroup" aria-label="Ver resultados como">
              <button type="button" role="radio" aria-checked="${f.vista === "lista"}" data-vista="lista" aria-label="Lista">${icon("list", "ic-s")}</button>
              <button type="button" role="radio" aria-checked="${f.vista === "mapa"}" data-vista="mapa" aria-label="Mapa">${icon("map", "ic-s")}</button>
            </div>
          </div>
          <div class="chips" id="b-active"></div>
        </div>
        <div id="loc-nudge"></div>
        <p class="t-label-m muted" id="b-total" role="status" aria-live="polite"></p>
        <div id="b-results" aria-live="polite"></div>
      </div>`;
    },
    mount: function (root, ctx) {
      var f = parse(ctx.query), $ = function (s) { return root.querySelector(s); };
      var results = $("#b-results"), ready = false;

      function nudge() {
        var granted = AR.perms.state("ubicacion") === "granted";
        $("#loc-nudge").innerHTML = granted ? "" : String(html`<div class="nudge">${icon("locate")}<p class="t-body-m"><b>Mira quién está más cerca.</b> Activa tu ubicación para ordenar por distancia.</p><button type="button" class="btn btn-soft" data-gps>Activar</button></div>`);
      }

      function update() {
        if (!ready) return;
        var ref = AR.repo.puntoUsuario(), list = AR.repo.buscar(f), act = activeFilters(f);
        AR.router.replaceQuiet(serialize(f));
        $("#b-total").textContent = list.length === 1 ? "1 servicio" : list.length + " servicios";
        $("#b-sort-l").textContent = SORTS.filter(function (s) { return s.v === f.orden; })[0].l;
        var badge = $("#b-count"); badge.hidden = !act.length; badge.textContent = act.length;
        $("#b-active").innerHTML = AR.render(act.map(function (a) {
          return html`<button type="button" class="chip chip--removable" data-rm="${a.k}" aria-label="Quitar filtro: ${a.l}">${a.l}${icon("close", "ic-s")}</button>`;
        }));
        U.$$("[data-vista]", root).forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-vista") === f.vista)); });
        if (!list.length) {
          results.innerHTML = String(UI.empty({ art: "tela", title: "No encontramos servicios", text: "Prueba con otra palabra, otra zona o quita algún filtro.", action: act.length || f.q ? { label: "Quitar filtros", attr: "data-clear" } : null }));
        } else if (f.vista === "mapa") {
          results.innerHTML = String(mapHtml(list, ref));
        } else {
          results.innerHTML = String(html`<div class="list-flat">${list.map(UI.serviceRow)}</div>`);
        }
        AR.photos.hydrate(results);
      }

      /* ServicioUiState también aquí: se busca sobre la base local ya cargada */
      function load(force) {
        AR.repo.cargarCatalogo(function (st) {
          if (!root.isConnected) return;
          UI.paint(results, st, {
            idle: function () { return ""; },
            loading: function () { return UI.loading("Buscando servicios…", html`<div class="list-flat">${UI.skelRows(4)}</div>`); },
            success: function () { ready = true; update(); return results.innerHTML; },
            error: function (s) { return UI.errorState(s); }
          });
        }, { force: !!force });
      }

      var input = $("#q");
      input.addEventListener("input", function () { f.q = input.value; $("#q-clear").hidden = !f.q; update(); });
      $("#q-clear").addEventListener("click", function () { input.value = ""; f.q = ""; $("#q-clear").hidden = true; update(); input.focus(); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") input.blur(); });

      root.addEventListener("click", function (e) {
        var t;
        if ((t = e.target.closest("[data-rm]"))) { var k = t.getAttribute("data-rm"); f[k] = typeof f[k] === "boolean" ? false : (k === "min" || k === "maxPrecio" || k === "maxKm") ? 0 : ""; return update(); }
        if (e.target.closest("[data-clear]")) { f.q = ""; input.value = ""; f.cat = f.zona = ""; f.min = f.maxPrecio = f.maxKm = 0; f.ahora = f.verificados = false; return update(); }
        if ((t = e.target.closest("[data-vista]"))) { f.vista = t.getAttribute("data-vista"); return update(); }
        if (e.target.closest("[data-retry]")) return load(true);
        if (e.target.closest("[data-gps]")) { AR.perms.request("ubicacion").then(function (ok) { if (ok) { nudge(); update(); } }); return; }
        if ((t = e.target.closest("[data-fav]"))) { return AR.favToggle(t); }
        if ((t = e.target.closest("[data-barrio]"))) {
          var b = AR.catalog.barrio(t.getAttribute("data-barrio")), items = AR.repo.buscar(f).filter(function (s) { return s.prestador.barrio === t.getAttribute("data-barrio"); });
          var sh = AR.sheet.show(html`<div class="stack" style="--gap:8px;padding-top:4px"><h2 class="t-headline">${b.nombre}</h2><p class="muted">${U.plural(items.length, "servicio", "servicios")} en este barrio</p><div class="list-flat">${items.map(UI.serviceRow)}</div></div>`, { label: b.nombre });
          AR.photos.hydrate(sh); sh.addEventListener("click", function (ev) { if (ev.target.closest("a")) AR.sheet.dismiss(); });
        }
      });
      root.addEventListener("keydown", function (e) { var p = e.target.closest && e.target.closest("[data-barrio]"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); p.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });

      /* Hojas: filtros y orden */
      $("#b-sort").addEventListener("click", function () {
        var el = AR.sheet.show(html`<div class="stack" style="--gap:8px;padding-top:4px"><h2 class="t-headline">Ordenar por</h2>
          <div class="opt-list" role="radiogroup" aria-label="Ordenar por" style="margin-top:4px">${SORTS.map(function (s) {
            return html`<button type="button" class="opt" role="radio" aria-checked="${s.v === f.orden}" data-sort="${s.v}"><span class="grow">${s.l}<span class="sub">${s.sub}</span></span></button>`;
          })}</div></div>`, { label: "Ordenar" });
        el.addEventListener("click", function (e) { var b = e.target.closest("[data-sort]"); if (b) { f.orden = b.getAttribute("data-sort"); AR.sheet.close(); update(); } });
      });
      $("#b-filters").addEventListener("click", function () { filtersSheet(f, update); });

      nudge(); load(false);
      if (ctx.query.foco === "1") setTimeout(function () { input.focus(); }, 60);
      AR.gestures.pullToRefresh(function () { return new Promise(function (r) { load(true); setTimeout(r, 900); }); });
    }
  };

  function filtersSheet(f, update) {
    var draft = Object.assign({}, f);
    function body() {
      var n = AR.repo.buscar(draft).length;
      return html`<form class="stack" style="--gap:18px;padding-top:4px" novalidate>
        <div class="row-flex"><h2 class="t-headline grow" style="flex:1">Filtros</h2><button type="button" class="btn btn-text" data-reset>Limpiar</button></div>
        <div class="field"><span class="field-label" id="fl-cat">Categoría</span><div class="chips" role="radiogroup" aria-labelledby="fl-cat">
          <button type="button" class="chip" role="radio" aria-checked="${!draft.cat}" data-k="cat" data-v="">Todas</button>
          ${AR.catalog.categorias.map(function (c) { return html`<button type="button" class="chip" role="radio" aria-checked="${draft.cat === c.id}" data-k="cat" data-v="${c.id}">${c.corto}</button>`; })}</div></div>
        <div class="field"><span class="field-label" id="fl-zona">Zona</span><div class="chips" role="radiogroup" aria-labelledby="fl-zona">
          <button type="button" class="chip" role="radio" aria-checked="${!draft.zona}" data-k="zona" data-v="">Todas</button>
          ${AR.catalog.zonas.map(function (z) { return html`<button type="button" class="chip" role="radio" aria-checked="${draft.zona === z.id}" data-k="zona" data-v="${z.id}">${z.nombre}</button>`; })}</div></div>
        <div class="field"><span class="field-label" id="fl-min">Calificación</span><div class="chips" role="radiogroup" aria-labelledby="fl-min">
          ${MINS.map(function (m) { return html`<button type="button" class="chip" role="radio" aria-checked="${draft.min === m.v}" data-k="min" data-v="${m.v}">${m.l}</button>`; })}</div></div>
        ${UI.switchRow({ id: "fl-ahora", label: "Solo disponibles ahora", checked: draft.ahora })}
        ${UI.switchRow({ id: "fl-ver", label: "Solo cuentas verificadas", desc: "Confirmaron su correo o celular.", checked: draft.verificados })}
        <div class="field"><label for="fl-precio">Precio máximo: <b id="fl-precio-v">${draft.maxPrecio ? U.money(draft.maxPrecio) : "sin límite"}</b></label>
          <input type="range" id="fl-precio" min="10" max="100" step="5" value="${draft.maxPrecio || 100}"></div>
        <div class="field"><label for="fl-km">Distancia máxima: <b id="fl-km-v">${draft.maxKm ? draft.maxKm + " km" : "sin límite"}</b></label>
          <input type="range" id="fl-km" min="1" max="30" step="1" value="${draft.maxKm || 30}"></div>
        <div class="sheet-actions" style="margin-top:0"><button type="button" class="btn btn-filled btn-lg" data-apply>${n === 1 ? "Ver 1 servicio" : "Ver " + n + " servicios"}</button></div>
      </form>`;
    }
    var el = AR.sheet.show(body(), { label: "Filtros de búsqueda" });
    function redraw(focusSel) {
      var sc = el.scrollTop; el.querySelector(".sheet-body").innerHTML = String(body()); el.scrollTop = sc;
      var t = focusSel && el.querySelector(focusSel); if (t) t.focus({ preventScroll: true });
    }
    el.addEventListener("click", function (e) {
      var c = e.target.closest("[data-k]");
      if (c) { var k = c.getAttribute("data-k"), v = c.getAttribute("data-v"); draft[k] = k === "min" ? parseFloat(v) : v; return redraw('[data-k="' + k + '"][data-v="' + v + '"]'); }
      var sw = e.target.closest('[role="switch"]');
      if (sw) { var on = sw.getAttribute("aria-checked") !== "true"; if (sw.id === "fl-ahora") draft.ahora = on; if (sw.id === "fl-ver") draft.verificados = on; return redraw("#" + sw.id); }
      if (e.target.closest("[data-reset]")) { draft = Object.assign(draft, { cat: "", zona: "", min: 0, ahora: false, verificados: false, maxPrecio: 0, maxKm: 0 }); return redraw(); }
      if (e.target.closest("[data-apply]")) { Object.assign(f, draft); AR.sheet.close(); update(); }
    });
    el.addEventListener("input", function (e) {
      if (e.target.id === "fl-precio") { var v = +e.target.value; draft.maxPrecio = v >= 100 ? 0 : v; el.querySelector("#fl-precio-v").textContent = draft.maxPrecio ? U.money(v) : "sin límite"; apply(); }
      if (e.target.id === "fl-km") { var k = +e.target.value; draft.maxKm = k >= 30 ? 0 : k; el.querySelector("#fl-km-v").textContent = draft.maxKm ? k + " km" : "sin límite"; apply(); }
    });
    function apply() { var n = AR.repo.buscar(draft).length; el.querySelector("[data-apply]").textContent = n === 1 ? "Ver 1 servicio" : "Ver " + n + " servicios"; }
  }
})();
