/** Aruy · Detalle del servicio (Figura 3) y perfil público del prestador.
 *  Portafolio con fotos, opiniones y recomendaciones, disponibilidad, favoritos, contacto por WhatsApp, reportar y bloquear.
 *  Funcionalidades 5, 8, 9, 10, 11, 13 y 16. */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views, S = AR.UiState;

  function tabKey(id) { return "aruy.tab." + id; }
  function getTab(id) { try { return sessionStorage.getItem(tabKey(id)) || "servicio"; } catch (e) { return "servicio"; } }
  function setTab(id, t) { try { sessionStorage.setItem(tabKey(id), t); } catch (e) { /* sin sessionStorage */ } }

  function photoUris(s, p) {
    var own = (s && s.fotos) || [], extra = (p.portafolio || []).filter(function (u) { return own.indexOf(u) < 0; });
    return own.concat(extra);
  }

  function modalidad(p) {
    var m = p.modalidad || [];
    return m.length > 1 ? "A domicilio y en su local" : m[0] === "local" ? "En su local" : "A domicilio";
  }

  /* ---------- Opiniones ---------- */
  function reviewCard(r) {
    return html`<article class="review">
      ${UI.avatar({ nombre: r.autor }, "avatar-s")}
      <div class="review-main"><div class="row-flex" style="--gap:8px;flex-wrap:wrap"><b>${r.autor}</b>${UI.stars(r.rating, r.rating + " de 5 estrellas")}<span class="t-body-m muted">${U.rel(r.fecha)}</span></div>
        ${r.comentario ? html`<p class="t-body-l">${r.comentario}</p>` : ""}
        ${r.recomienda ? html`<span class="pill pill--ok">${icon("thumb-up", "ic-s")}Lo recomienda</span>` : ""}</div>
    </article>`;
  }

  function reviewsPanel(root, p, reload, svc) {
    var host = root.querySelector("#tab-body");
    function head(list) {
      var rec = AR.repo.esRecomendado(p.id);
      return html`<div class="rev-sum">
        <div class="rev-score"><span class="t-display">${p.rating != null ? U.dec1(p.rating) : "—"}</span>${p.rating != null ? UI.stars(p.rating, U.dec1(p.rating) + " de 5") : ""}<span class="t-body-m muted">${U.plural(p.nResenas || 0, "opinión", "opiniones")}</span></div>
        <div class="stack stack-s">
          <button type="button" class="btn ${rec ? "btn-soft" : "btn-outlined"}" data-rec aria-pressed="${rec}">${icon("thumb-up", "ic-s")}${rec ? "Lo recomiendas" : "Recomendar"}</button>
          <p class="t-body-m muted" id="rec-n">${U.plural(p.nRecomendaciones || 0, "persona lo recomienda", "personas lo recomiendan")}</p>
        </div></div>
        <button type="button" class="btn btn-filled btn-block" data-rate>${icon("edit", "ic-s")}Escribir una opinión</button>
        <div class="stack" id="rev-list">${list.map(reviewCard)}</div>`;
    }
    function paint(st) {
      UI.paint(host, st, {
        idle: function () { return ""; },
        loading: function () { return UI.loading("Cargando opiniones…", html`<div class="stack">${[1, 2].map(function () { return html`<div class="skel" style="height:84px;border-radius:16px"></div>`; })}</div>`); },
        success: function (s) { return s.data.length ? head(s.data) : html`${head([])}${UI.empty({ art: "nudo", title: "Aún no hay opiniones", text: "Sé la primera persona en contar cómo le fue." })}`; },
        error: function (s) { return UI.errorState(s); }
      });
    }
    AR.repo.cargarResenas(p.id, paint);
    host.onclick = function (e) {
      if (e.target.closest("[data-retry]")) return AR.repo.cargarResenas(p.id, paint);
      if (e.target.closest("[data-rec]")) {
        AR.repo.toggleRecomendacion(p.id).then(function (r) { p = r.prestador || p; AR.snack.show(r.valor ? "Recomendaste a " + U.firstName(p.nombre) + "." : "Quitaste tu recomendación."); AR.repo.cargarResenas(p.id, paint); })
          .catch(function (er) { AR.snack.show(er.message); AR.repo.cargarResenas(p.id, paint); });
        return;
      }
      if (e.target.closest("[data-rate]")) {
        if (!AR.repo.haContactado(p.id)) {
          AR.ui.confirm({ title: "Contáctalo primero", text: "Para cuidar que las opiniones sean reales, solo puedes calificar a quien contactaste desde Aruy.", ok: "Contactar ahora", cancel: "Entendido" }).then(function (yes) { if (yes) setTimeout(function () { AR.flows.contact(p, svc || AR.repo.serviciosDe(p.id)[0] || null); }, 200); });
          return;
        }
        AR.flows.rate(p, function (r) { p = r.prestador; reload(); AR.repo.cargarResenas(p.id, paint); });
      }
    };
  }

  /* ---------- Trabajos (portafolio) ---------- */
  function worksPanel(p, uris) {
    if (!uris.length) return UI.empty({ art: "tela", title: "Todavía no hay fotos", text: U.firstName(p.nombre) + " aún no subió fotos de sus trabajos." });
    return html`<div class="works" role="list">${uris.map(function (u, i) {
      return html`<button type="button" class="work" role="listitem" data-work="${i}" aria-label="Ver foto ${i + 1} de ${uris.length}"><span class="media" style="--ar:1">${AR.photoImg(u, "Foto ilustrativa del trabajo " + (i + 1) + " de " + p.nombre, "", 320, 320)}</span></button>`;
    })}</div><p class="t-body-m muted" style="margin-top:12px">${icon("info", "ic-s")} Son fotos ilustrativas de trabajos, no del prestador.</p>`;
  }

  function lightbox(uris, start, p) {
    var i = start;
    function body() {
      return html`<div class="stack" style="--gap:12px;padding-top:4px">
        <div class="lb"><span class="media" style="--ar:4/3">${AR.photoImg(uris[i], "Foto ilustrativa del trabajo " + (i + 1) + " de " + p.nombre, "", 900, 675)}</span></div>
        <div class="row-flex" style="justify-content:space-between">
          <button type="button" class="icon-btn icon-btn--tonal" data-lb="-1" aria-label="Foto anterior" ${i === 0 ? raw("disabled") : ""}>${icon("back")}</button>
          <span class="t-title-m" role="status">${i + 1} de ${uris.length}</span>
          <button type="button" class="icon-btn icon-btn--tonal" data-lb="1" aria-label="Foto siguiente" ${i === uris.length - 1 ? raw("disabled") : ""}>${icon("forward")}</button>
        </div><button type="button" class="btn btn-text" data-close>Cerrar</button></div>`;
    }
    var el = AR.sheet.show(body(), { label: "Foto del trabajo de " + p.nombre });
    function redraw() { el.querySelector(".sheet-body").innerHTML = String(body()); AR.photos.hydrate(el); }
    AR.photos.hydrate(el);
    el.addEventListener("click", function (e) { var b = e.target.closest("[data-lb]"); if (b && !b.disabled) { i = U.clamp(i + (+b.getAttribute("data-lb")), 0, uris.length - 1); redraw(); } });
    el.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" && i < uris.length - 1) { i++; redraw(); } if (e.key === "ArrowLeft" && i > 0) { i--; redraw(); } });
  }

  /* ---------- Menú de más acciones ---------- */
  function moreSheet(p, s) {
    var el = AR.sheet.show(html`<div class="stack" style="--gap:6px;padding-top:4px"><h2 class="t-headline">Más opciones</h2>
      <div class="list-card" style="margin-top:8px">
        <button type="button" class="row-link" data-more="report">${icon("flag", "lead")}<span class="grow"><b>Reportar ${s ? "este servicio" : "este perfil"}</b><span class="sub">Fotos falsas, estafa o contenido inapropiado</span></span></button>
        <button type="button" class="row-link danger" data-more="block">${icon("block", "lead")}<span class="grow"><b>Bloquear a ${U.firstName(p.nombre)}</b><span class="sub">Dejarás de ver sus servicios</span></span></button>
      </div><button type="button" class="btn btn-text" data-close>Cancelar</button></div>`, { label: "Más opciones" });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-more]"); if (!b) return;
      AR.sheet.close();
      setTimeout(function () {
        if (b.getAttribute("data-more") === "report") AR.flows.report({ tipo: s ? "servicio" : "prestador", objetivoId: s ? s.id : p.id, objetivo: s ? "el servicio «" + s.titulo + "»" : "a " + p.nombre });
        else AR.flows.block(p, function (blocked) { if (blocked) AR.router.go("#/inicio", { replace: true }); });
      }, 220);
    });
  }

  /* ---------- Detalle del servicio ---------- */
  V.detalle = {
    title: function (ctx) { var s = AR.repo.servicio(ctx.params.id); return s ? s.titulo : "Servicio"; },
    bar: function (ctx) {
      var s = AR.repo.servicio(ctx.params.id), p = s && s.prestador, fav = p && AR.repo.esFavorito(p.id);
      return {
        back: true, overlay: true, title: s ? s.titulo : "Servicio",
        actions: s ? [
          { id: "share", icon: "share", label: "Compartir este servicio", onClick: function () { AR.flows.share(s.titulo + " · " + p.nombre, "Mira este servicio en Aruy"); } },
          { id: "fav", icon: fav ? "heart-fill" : "heart", on: fav, pressed: fav, label: fav ? "Quitar de favoritos a " + p.nombre : "Guardar en favoritos a " + p.nombre, onClick: function (btn) {
            AR.favToggle(p.id, false, function (on) { AR.shell.patchAction("fav", { icon: on ? "heart-fill" : "heart", on: on, pressed: on, label: on ? "Quitar de favoritos a " + p.nombre : "Guardar en favoritos a " + p.nombre }); });
          } },
          { id: "more", icon: "more-vert", label: "Más opciones", onClick: function () { moreSheet(p, s); } }
        ] : []
      };
    },
    render: function (ctx) {
      var s = AR.repo.servicio(ctx.params.id);
      if (!s) return html`<div class="page page--narrow" id="detail-load">${UI.loading("Abriendo el servicio…")}</div>`;
      return V.detalle.body(s, ctx);
    },
    body: function (s, ctx) {
      var p = s.prestador, uris = photoUris(s, p), mine = AR.session.user().prestadorId === p.id;
      var gallery = uris.length
        ? html`<div class="gallery" role="region" aria-label="Fotos del servicio, desliza para ver más" tabindex="0" id="gallery">${uris.map(function (u, i) {
          return html`<span class="media slide" ${i === 0 ? raw('data-hero="' + U.esc(s.id) + '"') : ""} style="--ar:4/3">${AR.photoImg(u, "Foto ilustrativa " + (i + 1) + " de " + uris.length + ": " + s.titulo, "", 900, 675)}</span>`;
        })}</div><span class="gallery-count" id="gal-count" aria-hidden="true">1 / ${uris.length}</span><span class="gallery-note">Foto ilustrativa</span>`
        : html`<div class="gallery"><span class="media slide" data-hero="${s.id}" style="--ar:4/3">${AR.photoImg("art:" + s.categoria + ":" + s.id, "Foto ilustrativa: " + s.titulo, "", 900, 675)}</span></div><span class="gallery-note">Foto ilustrativa</span>`;
      var tab = getTab(s.id);
      return html`<article class="detail" data-id="${s.id}">
        <div class="gallery-wrap">${gallery}</div>
        <div class="page detail-body stack">
          ${s.estado === "en_revision" && mine ? html`<p class="card card--warn t-body-m"><b>En revisión.</b> ${s.motivoRevision}</p>` : ""}
          <header class="stack stack-s">
            <h1 class="t-headline">${s.titulo}</h1>
            <p class="price-l">${s.precioReferencial != null ? html`<b class="t-display" style="font-size:1.75rem">Desde ${U.money(s.precioReferencial)}</b> <span class="muted">${s.unidad}</span>` : html`<b class="t-title-l">Precio a convenir</b>`}</p>
            <div class="row-flex" style="flex-wrap:wrap;--gap:8px 14px">${UI.rating(p)}${UI.avail(p)}${p.verificado ? html`<span class="verified"><svg class="seal" aria-hidden="true"><use href="#i-sello"/></svg>Cuenta verificada</span>` : ""}</div>
            <p class="meta-line">${icon("pin", "ic-s")}${AR.catalog.barrio(p.barrio).nombre}, ${AR.catalog.zona(p.zona).largo}${s.dist != null ? html` <span class="muted">(${U.dist(s.dist)})</span>` : ""}</p>
          </header>
          <a class="prov" href="#/prestador/${p.id}">${UI.avatar(p, "avatar-l")}<span class="prov-t"><b class="t-title-l">${p.nombre}</b><span class="muted">${p.oficio}${p.anios ? ", " + U.plural(p.anios, "año", "años") + " de experiencia" : ""}</span></span>${icon("chevron-right", "prov-go")}</a>
          <div class="tabs" role="tablist" aria-label="Información del servicio">
            ${[["servicio", "Servicio"], ["trabajos", "Trabajos"], ["opiniones", "Opiniones"]].map(function (t) {
              return html`<button type="button" class="tab" role="tab" id="tab-${t[0]}" aria-selected="${tab === t[0]}" aria-controls="tab-body" data-tab="${t[0]}" tabindex="${tab === t[0] ? 0 : -1}">${t[1]}</button>`;
            })}</div>
          <div id="tab-body" role="tabpanel" aria-labelledby="tab-${tab}" tabindex="0" class="tabpanel"></div>
        </div>
        <div class="cta-bar" id="cta-bar"></div>
      </article>`;
    },
    mount: function (root, ctx) {
      var id = ctx.params.id;
      if (!AR.repo.servicio(id)) {
        /* Enlace directo con la caché vacía: se carga el catálogo primero */
        AR.repo.cargarCatalogo(function (st) {
          if (!root.isConnected) return;
          if (st.kind === "success") {
            var s = AR.repo.servicio(id);
            if (s) { AR.router.refresh(); } else { root.innerHTML = String(UI.empty({ art: "suelto", title: "No encontramos este servicio", text: "Puede que ya no esté disponible.", action: { label: "Ir al inicio", href: "#/inicio" } })); }
          } else if (st.kind === "error") { root.innerHTML = String(UI.errorState(st)); root.addEventListener("click", function (e) { if (e.target.closest("[data-retry]")) AR.router.refresh(); }); }
        });
        return;
      }
      var s = AR.repo.servicio(id), p = s.prestador, uris = photoUris(s, p), body = root.querySelector("#tab-body");
      AR.repo.marcarVisto(s.id, p.id);
      AR.repo.cargarPrestador(p.id, function (st) { if (st.kind === "success" && st.meta.fresh && root.isConnected) { /* el perfil quedó actualizado en la caché */ } });

      var cta = root.querySelector("#cta-bar");
      cta.innerHTML = String(html`<button type="button" class="btn btn-wa btn-lg btn-block" id="contact">${icon("chat")}Contactar por WhatsApp</button>${p.disponible ? "" : html`<p class="t-body-m cta-note">${U.firstName(p.nombre)} no recibe solicitudes ahora. Puedes dejarle un mensaje.</p>`}`);
      root.querySelector("#contact").addEventListener("click", function () { AR.flows.contact(p, s); });

      function showTab(t) {
        setTab(id, t);
        U.$$("[data-tab]", root).forEach(function (b) { var on = b.getAttribute("data-tab") === t; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
        body.setAttribute("aria-labelledby", "tab-" + t);
        body.onclick = null;
        if (t === "servicio") {
          var otros = (p.servicios || []).filter(function (n) { return n !== s.titulo; });
          body.innerHTML = String(html`<div class="stack">
            <section><h2 class="t-title-l">Sobre este servicio</h2><p class="t-body-l measure" style="margin-top:6px">${s.descripcion}</p></section>
            <ul class="facts">
              <li>${icon("home", "ic-s")}<span><b>Modalidad</b>${modalidad(p)}</span></li>
              <li>${icon("check-circle", "ic-s")}<span><b>Trabajos realizados</b>${p.trabajos ? p.trabajos : "Recién empieza en Aruy"}</span></li>
              <li>${icon("clock", "ic-s")}<span><b>Experiencia</b>${p.anios ? U.plural(p.anios, "año", "años") : "Recién empieza"}</span></li>
            </ul>
            ${p.bio ? html`<section><h2 class="t-title-l">Sobre ${U.firstName(p.nombre)}</h2><p class="t-body-l measure" style="margin-top:6px">${p.bio}</p></section>` : ""}
            ${otros.length ? html`<section><h2 class="t-title-l">También ofrece</h2><ul class="chips" style="margin-top:8px">${otros.map(function (n) { return html`<li class="pill pill--info">${n}</li>`; })}</ul></section>` : ""}
          </div>`);
        } else if (t === "trabajos") {
          body.innerHTML = String(worksPanel(p, uris)); AR.photos.hydrate(body);
          body.onclick = function (e) { var w = e.target.closest("[data-work]"); if (w) lightbox(uris, +w.getAttribute("data-work"), p); };
        } else {
          body.innerHTML = ""; reviewsPanel(root, p, function () { /* el encabezado se vuelve a pintar con la lista */ }, s);
        }
      }
      showTab(getTab(id));
      var tabs = root.querySelector(".tabs");
      tabs.addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) showTab(b.getAttribute("data-tab")); });
      tabs.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var list = U.$$("[data-tab]", root), i = list.indexOf(document.activeElement); if (i < 0) return;
        var n = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length]; n.focus(); showTab(n.getAttribute("data-tab"));
      });

      /* Contador de fotos */
      var g = root.querySelector("#gallery"), cnt = root.querySelector("#gal-count");
      if (g && cnt) g.addEventListener("scroll", U.debounce(function () { cnt.textContent = (Math.round(g.scrollLeft / g.clientWidth) + 1) + " / " + uris.length; }, 40), { passive: true });
    }
  };

  /* ---------- Perfil público del prestador ---------- */
  V.prestadorPublico = {
    title: function (ctx) { var p = AR.repo.prestador(ctx.params.id); return p ? p.nombre : "Perfil"; },
    bar: function (ctx) {
      var p = AR.repo.prestador(ctx.params.id);
      return { back: true, title: p ? U.firstName(p.nombre) : "Perfil", actions: p ? [{ id: "more", icon: "more-vert", label: "Más opciones", onClick: function () { moreSheet(p, null); } }] : [] };
    },
    render: function (ctx) {
      var p = AR.repo.prestador(ctx.params.id);
      if (!p) return html`<div class="page page--narrow" id="pp">${UI.loading("Abriendo el perfil…")}</div>`;
      var fav = AR.repo.esFavorito(p.id);
      return html`<div class="page stack stack-l" id="pp">
        <header class="pp-head">${UI.avatar(p, "avatar-xl")}
          <div class="stack stack-s"><h1 class="t-headline">${p.nombre}</h1><p class="muted">${p.oficio}</p>
            <div class="row-flex" style="flex-wrap:wrap;--gap:8px 14px">${UI.rating(p)}${UI.avail(p)}${p.verificado ? html`<span class="verified"><svg class="seal" aria-hidden="true"><use href="#i-sello"/></svg>Cuenta verificada</span>` : ""}</div>
            <p class="meta-line">${icon("pin", "ic-s")}${AR.catalog.barrio(p.barrio).nombre}, ${AR.catalog.zona(p.zona).largo}</p></div></header>
        ${p.bio ? html`<p class="t-body-l measure">${p.bio}</p>` : ""}
        <div class="row-flex"><button type="button" class="btn btn-wa btn-lg" id="pp-contact" style="flex:1">${icon("chat")}Contactar por WhatsApp</button>${UI.heart(p.id, fav, p.nombre)}</div>
        <section><h2 class="t-title-l">Servicios</h2><div class="list-flat" id="pp-list" style="margin-top:8px"></div></section>
        <section><h2 class="t-title-l">Trabajos</h2><div id="pp-works" style="margin-top:8px"></div></section>
        <section><h2 class="t-title-l">Opiniones</h2><div id="tab-body" style="margin-top:8px"></div></section>
      </div>`;
    },
    mount: function (root, ctx) {
      var id = ctx.params.id, p = AR.repo.prestador(id);
      if (!p) {
        AR.repo.cargarCatalogo(function (st) { if (st.kind === "success" && root.isConnected) { if (AR.repo.prestador(id)) AR.router.refresh(); else root.innerHTML = String(UI.empty({ art: "suelto", title: "No encontramos este perfil", action: { label: "Ir al inicio", href: "#/inicio" } })); } else if (st.kind === "error") root.innerHTML = String(UI.errorState(st)); });
        return;
      }
      AR.repo.cargarPrestador(id, function (st) {
        if (st.kind !== "success" || !root.isConnected) return;
        var list = st.data.servicios, uris = (st.data.prestador.portafolio || []);
        root.querySelector("#pp-list").innerHTML = AR.render(list.length ? list.map(UI.serviceRow) : html`<p class="muted">Aún no publicó servicios.</p>`);
        var w = root.querySelector("#pp-works"); w.innerHTML = String(worksPanel(st.data.prestador, uris)); AR.photos.hydrate(root);
        w.onclick = function (e) { var b = e.target.closest("[data-work]"); if (b) lightbox(uris, +b.getAttribute("data-work"), p); };
      });
      reviewsPanel(root, p, function () { });
      root.querySelector("#pp-contact").addEventListener("click", function () { AR.flows.contact(p, AR.repo.serviciosDe(p.id)[0] || null); });
      root.addEventListener("click", function (e) { var f = e.target.closest("[data-fav]"); if (f) AR.favToggle(f); });
    }
  };
})();
