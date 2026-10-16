/** Aruy · Componentes de interfaz compartidos (cada uno devuelve HTML seguro). */
AR.ui = (function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u;

  /* ---------- Piezas pequeñas ---------- */
  function avatar(e, cls) {
    var tone = U.hash(e.nombre || "?") % 5;
    return html`<span class="avatar ${cls || ""}" data-tone="${tone}" aria-hidden="true">${e.fotoPerfil ? AR.photoImg(e.fotoPerfil, "", "", 160, 160) : U.initials(e.nombre)}</span>`;
  }

  function rating(p) {
    if (p.rating == null) return html`<span class="pill pill--info">Nuevo en Aruy</span>`;
    var txt = U.dec1(p.rating) + " de 5, " + U.plural(p.nResenas, "opinión", "opiniones");
    return html`<span class="rating" role="img" aria-label="${txt}">${icon("star")}${U.dec1(p.rating)}<span class="n">(${p.nResenas})</span></span>`;
  }

  function stars(n, label) {
    var out = [];
    for (var i = 1; i <= 5; i++) out.push(html`${icon(i <= Math.round(n) ? "star" : "star", i <= Math.round(n) ? "" : "off")}`);
    return html`<span class="stars" role="img" aria-label="${label || n + " de 5"}">${out}</span>`;
  }

  function verified(p) {
    return p.verificado ? html`<span class="verified" title="Cuenta verificada"><svg class="seal" aria-hidden="true"><use href="#i-sello"/></svg><span class="sr-only">Cuenta verificada</span></span>` : "";
  }

  function avail(p) {
    return p.disponible
      ? html`<span class="avail"><i class="dot" aria-hidden="true"></i>Disponible ahora</span>`
      : html`<span class="avail off"><i class="dot dot--off" aria-hidden="true"></i>No recibe solicitudes</span>`;
  }

  function price(s) {
    return s.precioReferencial == null ? html`<span class="muted">Precio a convenir</span>` : html`<span class="price"><b>Desde ${U.money(s.precioReferencial)}</b> <span class="unit">${s.unidad || ""}</span></span>`;
  }

  function heart(prestadorId, on, name) {
    return html`<button type="button" class="icon-btn fav ${on ? "is-on" : ""}" data-fav="${prestadorId}" aria-pressed="${on}" aria-label="${on ? "Quitar de favoritos a " : "Guardar en favoritos a "}${name}">${icon(on ? "heart-fill" : "heart")}</button>`;
  }

  /* ---------- Servicios ---------- */
  function serviceRow(s) {
    var p = s.prestador, fav = AR.repo.esFavorito(p.id), cat = AR.catalog.cat(s.categoria);
    var label = s.titulo + ", " + p.nombre + (p.rating != null ? ", " + U.dec1(p.rating) + " de 5" : "") + (s.precioReferencial != null ? ", desde " + U.money(s.precioReferencial) : "");
    return html`<article class="svc-row">
      <a class="svc-main" href="#/servicio/${s.id}" data-hero-id="${s.id}" aria-label="${label}">
        <span class="media svc-thumb" data-hero="${s.id}" style="--ar:1">${AR.photoImg(s.fotos[0] || ("art:" + s.categoria + ":" + s.id), "Foto de ejemplo de " + s.titulo, "", 240, 240)}</span>
        <span class="svc-text">
          <b class="svc-title clamp-1">${s.titulo}</b>
          <span class="svc-by"><span class="clamp-1">${p.nombre}</span>${verified(p)}</span>
          <span class="svc-meta">${rating(p)}${s.dist != null ? html`<span class="meta-d">${icon("pin", "ic-s")}${U.dist(s.dist)}</span>` : ""}</span>
          <span class="svc-foot">${price(s)}${s.estado === "en_revision" ? "" : ""}</span>
        </span>
      </a>
      ${heart(p.id, fav, p.nombre)}
    </article>`;
  }

  function serviceCard(s) {
    var p = s.prestador;
    return html`<a class="svc-card" href="#/servicio/${s.id}" data-hero-id="${s.id}" aria-label="${s.titulo}, ${p.nombre}, desde ${U.money(s.precioReferencial)}">
      <span class="media" data-hero="${s.id}">${AR.photoImg(s.fotos[0] || ("art:" + s.categoria + ":" + s.id), "Foto de ejemplo de " + s.titulo, "", 480, 360)}
        <span class="media-chip">${avail(p)}</span></span>
      <b class="clamp-2 svc-card-title">${s.titulo}</b>
      <span class="svc-by"><span class="clamp-1">${p.nombre}</span>${verified(p)}</span>
      <span class="svc-meta">${rating(p)}${s.dist != null ? html`<span class="meta-d">${icon("pin", "ic-s")}${U.dist(s.dist)}</span>` : ""}</span>
    </a>`;
  }

  function categoryTile(c) {
    return html`<a class="cat-tile" href="#/buscar?cat=${c.id}"><span class="cat-ic">${icon("c-" + c.id, "ic-l")}</span><span class="cat-name">${c.corto}</span></a>`;
  }

  /* ---------- Estados de interfaz ---------- */
  var ARTS = {
    suelto: '<svg viewBox="0 0 112 112" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" aria-hidden="true"><path d="M10 84h20M40 84h20M70 84h8" opacity=".55"/><path d="M10 62h20M40 62h20M70 62h12" opacity=".55"/><path d="M10 40h20M40 40h20" opacity=".55"/><path d="M78 84c14 0 20-8 16-18s-18-4-16-20c1.500-12 12-14 18-8" stroke="var(--c-secondary)"/><circle cx="96" cy="38" r="4" fill="var(--c-secondary)" stroke="none"/></svg>',
    tela: '<svg viewBox="0 0 112 112" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" aria-hidden="true"><path d="M14 30h84M14 50h84M14 70h50M14 90h84" opacity=".5"/><path d="M30 14v84M50 14v84M70 14v50M90 14v84" opacity=".5"/><rect x="66" y="66" width="28" height="28" rx="4" stroke="var(--c-secondary)" stroke-dasharray="3 7"/></svg>',
    nudo: '<svg viewBox="0 0 112 112" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 90 82 32"/><path d="M82 32l8-8a8 8 0 0 1 11 11l-8 8z" fill="currentColor" fill-opacity=".14"/><path d="M92 28c14 14 10 38-14 50s-48 8-62-6" stroke="var(--c-secondary)" stroke-dasharray="1 12"/></svg>'
  };

  function art(kind) { return raw(ARTS[kind] || ARTS.tela); }

  function empty(o) {
    return html`<div class="empty">
      <span class="art">${art(o.art || "tela")}</span>
      <h2 class="t-title-l">${o.title}</h2>
      ${o.text ? html`<p class="t-body-l">${o.text}</p>` : ""}
      ${o.action ? (o.action.href
        ? html`<a class="btn btn-filled" href="${o.action.href}">${o.action.label}</a>`
        : html`<button type="button" class="btn btn-filled" ${o.action.attr ? raw(o.action.attr) : ""}>${o.action.label}</button>`) : ""}
    </div>`;
  }

  function errorState(st, retry) {
    var offline = st.meta && st.meta.code === "SIN_CONEXION";
    return html`<div class="empty" role="alert">
      <span class="art">${art("suelto")}</span>
      <h2 class="t-title-l">${offline ? "Sin conexión" : "No pudimos cargar"}</h2>
      <p class="t-body-l">${st.mensaje}</p>
      <button type="button" class="btn btn-filled" data-retry>${icon("refresh")}${retry || "Reintentar"}</button>
    </div>`;
  }

  function loading(label, body) {
    return html`<div class="loading" role="status" aria-live="polite" aria-busy="true">
      <div class="loading-label"><span class="sr-only">${label}</span><span aria-hidden="true">${label}</span></div>
      <div class="tejido tejido--spin" aria-hidden="true"></div>
      ${body || ""}
    </div>`;
  }

  function skelRows(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(html`<div class="svc-row skel-row" aria-hidden="true"><span class="skel" style="width:72px;height:72px;border-radius:12px"></span><span class="svc-text"><span class="skel" style="height:16px;width:70%"></span><span class="skel" style="height:14px;width:45%"></span><span class="skel" style="height:14px;width:60%"></span></span></div>`);
    return out;
  }
  function skelCards(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(html`<div class="svc-card" aria-hidden="true"><span class="skel" style="aspect-ratio:4/3;border-radius:12px"></span><span class="skel" style="height:16px;width:80%"></span><span class="skel" style="height:14px;width:50%"></span></div>`);
    return out;
  }

  /** Pinta un UiState en un contenedor con `when` exhaustivo. */
  function paint(el, state, cases) {
    var out = AR.UiState.match(state, cases);
    el.innerHTML = Array.isArray(out) ? AR.render(out) : String(out);
    AR.photos.hydrate(el);
  }

  /* ---------- Formularios ---------- */
  function field(o) {
    var id = o.id, describedBy = [o.hint ? "h-" + id : "", "e-" + id].filter(Boolean).join(" ");
    var tag = o.textarea ? "textarea" : "input";
    var attrs = html`id="${id}" name="${o.name || id}" class="input" ${o.type ? html`type="${o.type}"` : ""} ${o.placeholder ? html`placeholder="${o.placeholder}"` : ""} ${o.autocomplete ? html`autocomplete="${o.autocomplete}"` : html`autocomplete="off"`} ${o.inputmode ? html`inputmode="${o.inputmode}"` : ""} ${o.enterkeyhint ? html`enterkeyhint="${o.enterkeyhint}"` : ""} ${o.maxlength ? html`maxlength="${o.maxlength}"` : ""} ${o.required ? raw("required") : ""} aria-describedby="${describedBy}" ${o.autofocus ? raw("autofocus") : ""} ${o.spellcheck === false ? raw('spellcheck="false" autocapitalize="none"') : ""}`;
    var control = o.textarea
      ? html`<textarea ${attrs} rows="${o.rows || 4}">${o.value || ""}</textarea>`
      : html`<input ${attrs} value="${o.value || ""}">`;
    return html`<div class="field" data-field="${id}">
      <label for="${id}">${o.label}${o.optional ? html` <span class="opt-tag">(opcional)</span>` : ""}</label>
      <div class="input-wrap ${o.lead ? "has-lead" : ""} ${o.trail ? "has-trail" : ""}">
        ${o.lead ? html`<span class="lead-ic">${icon(o.lead)}</span>` : ""}
        ${o.prefix ? html`<span class="prefix" aria-hidden="true">${o.prefix}</span>` : ""}
        ${control}
        ${o.trail ? html`<button type="button" class="icon-btn trail" data-trail="${id}" aria-label="${o.trail.label}">${icon(o.trail.icon)}</button>` : ""}
      </div>
      ${o.hint ? html`<p class="field-hint" id="h-${id}">${o.hint}</p>` : ""}
      <p class="field-error" id="e-${id}" role="alert">${icon("alert", "ic-s")}<span></span></p>
    </div>`;
  }

  function setError(root, id, msg) {
    var f = root.querySelector('[data-field="' + id + '"]'); if (!f) return;
    var inp = f.querySelector(".input");
    f.classList.toggle("has-error", !!msg);
    f.querySelector(".field-error span").textContent = msg || "";
    if (inp) { if (msg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid"); }
  }

  function switchRow(o) {
    return html`<div class="switch-row">
      <div class="grow"><b id="${o.id}-l" class="t-title-m">${o.label}</b>${o.desc ? html`<p class="muted t-body-m" id="${o.id}-d">${o.desc}</p>` : ""}</div>
      <button type="button" role="switch" class="switch" id="${o.id}" aria-checked="${!!o.checked}" aria-labelledby="${o.id}-l" ${o.desc ? html`aria-describedby="${o.id}-d"` : ""}></button>
    </div>`;
  }

  function segmented(o) {
    return html`<div class="seg" role="radiogroup" aria-label="${o.label}">${o.options.map(function (op) {
      return html`<button type="button" role="radio" aria-checked="${String(op.value) === String(o.value)}" data-seg="${o.name}" data-value="${op.value}">${op.icon ? icon(op.icon, "ic-s") : ""}${op.label}</button>`;
    })}</div>`;
  }

  function bindSwitches(root, fn) {
    U.on(root, "click", '[role="switch"]', function (e, b) {
      var on = b.getAttribute("aria-checked") !== "true";
      b.setAttribute("aria-checked", String(on)); if (fn) fn(b.id, on, b);
    });
  }

  function bindSegments(root, name, fn) {
    U.on(root, "click", '[data-seg="' + name + '"]', function (e, b) {
      root.querySelectorAll('[data-seg="' + name + '"]').forEach(function (x) { x.setAttribute("aria-checked", "false"); });
      b.setAttribute("aria-checked", "true"); fn(b.getAttribute("data-value"), b);
    });
  }

  /** Alterna la visibilidad de una contraseña. */
  function bindPasswordToggle(root, id) {
    var input = root.querySelector("#" + id), btn = root.querySelector('[data-trail="' + id + '"]'); if (!input || !btn) return;
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
      btn.innerHTML = String(icon(show ? "eye-off" : "eye"));
    });
  }

  /** Diálogo de confirmación. Resuelve true/false. */
  function confirm(o) {
    return new Promise(function (resolve) {
      var done = false;
      var el = AR.sheet.show(html`<div class="stack" style="--gap:12px;padding-top:24px">
        <h2 class="t-headline">${o.title}</h2>
        ${o.text ? html`<p class="t-body-l muted">${o.text}</p>` : ""}
        <div class="sheet-actions" style="margin-top:8px">
          <button type="button" class="btn ${o.danger ? "btn-danger" : "btn-filled"} btn-lg" data-ans="yes">${o.ok || "Aceptar"}</button>
          <button type="button" class="btn btn-text" data-ans="no">${o.cancel || "Cancelar"}</button>
        </div></div>`, { label: o.title, dialog: true, onClose: function () { if (!done) { done = true; resolve(false); } } });
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-ans]"); if (!b || done) return;
        done = true; AR.sheet.close(); resolve(b.getAttribute("data-ans") === "yes");
      });
    });
  }

  /** Marca de Aruy: «A» tejida con la barra cosida. */
  function mark(size) {
    return raw('<svg class="brand-mark" width="' + (size || 32) + '" height="' + (size || 32) + '" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20 12 4l7 16" stroke-width="3.2"/><path d="M8.9 14.5h6.2" stroke="var(--c-secondary)" stroke-width="2.2" stroke-linecap="butt" stroke-dasharray="1.4 1"/></svg>');
  }

  return {
    avatar: avatar, rating: rating, stars: stars, verified: verified, avail: avail, price: price, heart: heart,
    serviceRow: serviceRow, serviceCard: serviceCard, categoryTile: categoryTile,
    art: art, empty: empty, errorState: errorState, loading: loading, skelRows: skelRows, skelCards: skelCards, paint: paint,
    field: field, setError: setError, switchRow: switchRow, segmented: segmented, bindSwitches: bindSwitches, bindSegments: bindSegments,
    bindPasswordToggle: bindPasswordToggle, confirm: confirm, mark: mark
  };
})();
