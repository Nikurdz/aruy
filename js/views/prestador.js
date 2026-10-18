/** Aruy · Herramientas del prestador: panel (disponibilidad y métricas), mis servicios y portafolio de trabajos.
 *  Funcionalidades 4, 5 y 13. */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views, S = AR.UiState;

  function ensureProfile(root, render) {
    /* Carga el perfil propio desde la base local o la API (UiState) y llama a render(prestador, servicios) */
    var host = root.querySelector("#pr-data");
    AR.repo.cargarMiPerfil(function (st) {
      if (!root.isConnected) return;
      UI.paint(host, st, {
        idle: function () { return ""; },
        loading: function () { return UI.loading("Cargando tu perfil…", html`<div class="stack">${[1, 2, 3].map(function () { return html`<div class="skel" style="height:88px;border-radius:16px"></div>`; })}</div>`); },
        success: function (s) { return render(s.data.prestador, s.data.servicios, s.meta); },
        error: function (s) { return UI.errorState(s); }
      });
      if (st.kind === "success") root.dispatchEvent(new CustomEvent("pr:ready", { detail: st.data }));
    });
  }

  /* ---------- Panel ---------- */
  V.panel = {
    title: "Panel",
    bar: { title: "Panel" },
    render: function () {
      var u = AR.session.user();
      return html`<div class="page stack stack-l">
        <header><h1 class="t-display">Hola, ${U.firstName(u.nombre)}</h1><p class="t-body-l muted">Así va tu perfil esta semana.</p></header>
        <div id="pr-data" class="stack stack-l" aria-live="polite"></div></div>`;
    },
    mount: function (root) {
      var host = root.querySelector("#pr-data");
      function draw(p, servicios, meta) {
        var u = AR.session.user(), pasos = [
          { ok: !!u.fotoPerfil, t: "Agrega tu foto de perfil", href: "#/perfil/editar" },
          { ok: !!u.verificado, t: "Verifica tu cuenta", href: "#/verificar" },
          { ok: servicios.length > 0, t: "Publica tu primer servicio", href: "#/servicios/nuevo" },
          { ok: (p.portafolio || []).length >= 3, t: "Sube 3 fotos de tus trabajos", href: "#/portafolio" }
        ], hechos = pasos.filter(function (x) { return x.ok; }).length;
        return html`
          <section class="card avail-card ${p.disponible ? "is-on" : ""}" aria-labelledby="av-t">
            ${UI.switchRow({ id: "av", label: p.disponible ? "Recibiendo solicitudes" : "No recibes solicitudes", desc: p.disponible ? "Apareces como «Disponible ahora» en las búsquedas." : "Los clientes verán que no estás disponible por ahora.", checked: p.disponible })}
          </section>
          <section aria-labelledby="m-t"><h2 class="t-title-l" id="m-t">Esta semana</h2>
            <dl class="metrics" id="metrics">${[["Visitas a tu perfil", "—"], ["Contactos por WhatsApp", "—"], ["Guardado en favoritos", "—"], ["Valoración", p.rating != null ? U.dec1(p.rating) : "Nueva"]].map(function (m, i) {
              return html`<div class="metric"><dt class="t-body-m muted">${m[0]}</dt><dd class="t-display" data-m="${i}">${m[1]}</dd></div>`;
            })}</dl></section>
          ${hechos < 4 ? html`<section class="card" aria-labelledby="c-t"><div class="row-flex" style="justify-content:space-between"><h2 class="t-title-l" id="c-t">Completa tu perfil</h2><span class="pill pill--info">${hechos} de 4</span></div>
            <div class="stepper" style="--n:4;margin:12px 0" aria-hidden="true">${pasos.map(function (x) { return html`<i class="${x.ok ? "done" : ""}"></i>`; })}</div>
            <ul class="todo">${pasos.map(function (x) { return html`<li>${x.ok ? html`<span class="todo-ok">${icon("check", "ic-s")}<span class="sr-only">Hecho:</span> ${x.t}</span>` : html`<a class="row-link" href="${x.href}">${icon("plus", "lead")}<span class="grow">${x.t}</span>${icon("chevron-right", "lead")}</a>`}</li>`; })}</ul></section>` : ""}
          <section aria-labelledby="s-t"><div class="section-head"><h2 class="t-title-l" id="s-t">Tus servicios</h2><a class="btn btn-text" href="#/servicios">Ver todos</a></div>
            <div class="list-flat" style="margin-top:8px">${servicios.length ? servicios.slice(0, 3).map(function (s) { return svcOwn(s); }) : html`<p class="muted">Aún no publicas ningún servicio.</p>`}</div></section>`;
      }
      host.innerHTML = "";
      ensureProfile(root, draw);

      root.addEventListener("pr:ready", function () {
        AR.api.metricas(AR.repo.miPrestadorId()).then(function (m) {
          if (!root.isConnected) return;
          [m.vistas, m.contactos, m.guardados].forEach(function (v, i) { var el = root.querySelector('[data-m="' + i + '"]'); if (el) el.textContent = v; });
        }).catch(function () { /* sin métricas por ahora */ });
      });

      UI.bindSwitches(root, function (id, on, btn) {
        if (id !== "av") return;
        AR.repo.setDisponible(on).then(function () {
          btn.closest(".card").classList.toggle("is-on", on);
          btn.closest(".switch-row").querySelector(".t-title-m").textContent = on ? "Recibiendo solicitudes" : "No recibes solicitudes";
          btn.closest(".switch-row").querySelector(".t-body-m").textContent = on ? "Apareces como «Disponible ahora» en las búsquedas." : "Los clientes verán que no estás disponible por ahora.";
          AR.snack.show(on ? "Ahora apareces como disponible." : "Pausaste tus solicitudes.");
          U.vibrate(12);
        }).catch(function (e) { btn.setAttribute("aria-checked", String(!on)); AR.snack.show(e.message); });
      });
    }
  };

  function svcOwn(s) {
    return html`<article class="svc-row own">
      <a class="svc-main" href="#/servicios/${s.id}/editar" aria-label="Editar ${s.titulo}">
        <span class="media svc-thumb" style="--ar:1">${AR.photoImg(s.fotos[0] || ("art:" + s.categoria + ":" + s.id), "Foto ilustrativa: " + s.titulo, "", 240, 240)}</span>
        <span class="svc-text"><b class="svc-title clamp-1">${s.titulo}</b>
          <span class="svc-meta">${s.estado === "en_revision" ? html`<span class="pill pill--warn">En revisión</span>` : html`<span class="pill pill--ok">Publicado</span>`}${s.disponible ? "" : html`<span class="pill">Pausado</span>`}</span>
          <span class="svc-foot">${UI.price(s)}</span></span>
      </a>
      <button type="button" class="icon-btn" data-del="${s.id}" aria-label="Eliminar ${s.titulo}">${icon("trash")}</button>
    </article>`;
  }

  /* ---------- Mis servicios ---------- */
  V.misServicios = {
    title: "Mis servicios",
    bar: { title: "Mis servicios" },
    render: function () {
      return html`<div class="page stack"><div id="pr-data" class="stack" aria-live="polite"></div>
        <a class="fab" href="#/servicios/nuevo">${icon("plus")}Nuevo servicio</a></div>`;
    },
    mount: function (root) {
      var host = root.querySelector("#pr-data");
      function draw(p, servicios) {
        var draft = AR.repo.getBorrador();
        var lista = servicios.length ? html`<div class="list-flat">${servicios.map(svcOwn)}</div>` : (draft ? "" : UI.empty({ art: "tela", title: "Aún no publicas servicios", text: "Cuéntales a tus futuros clientes qué haces, cuánto cobras y muéstrales tu trabajo.", action: { label: "Publicar mi primer servicio", href: "#/servicios/nuevo" } }));
        return html`${draft ? html`<a class="card card--accent draft-card" href="#/servicios/nuevo"><span class="row-flex">${icon("edit")}<span><b class="t-title-m">Borrador sin publicar</b><span class="t-body-m" style="display:block">${draft.titulo || "Servicio sin título"}. Guardado ${U.rel(draft.ts)}.</span></span></span>${icon("chevron-right")}</a>` : ""}
          ${lista}`;
      }
      ensureProfile(root, draw);
      host.addEventListener("click", function (e) {
        if (e.target.closest("[data-retry]")) return AR.router.refresh();
        var d = e.target.closest("[data-del]"); if (!d) return;
        var s = AR.db.servicios.get(d.getAttribute("data-del")); if (!s) return;
        UI.confirm({ title: "¿Eliminar «" + s.titulo + "»?", text: "Dejará de aparecer en las búsquedas. Podrás deshacerlo unos segundos.", ok: "Eliminar", danger: true }).then(function (yes) {
          if (!yes) return;
          AR.repo.eliminarServicio(s).then(function () {
            AR.router.refresh();
            AR.snack.show("Servicio eliminado.", { action: "Deshacer", onAction: function () { AR.repo.restaurarServicio(s).then(function () { AR.router.refresh(); }); } });
          }).catch(function (er) { AR.snack.show(er.message); });
        });
      });
    }
  };

  /* ---------- Portafolio (funcionalidad 5) ---------- */
  V.portafolio = {
    title: "Portafolio",
    bar: { title: "Portafolio" },
    render: function () {
      return html`<div class="page stack"><header><h1 class="sr-only">Portafolio de trabajos</h1><p class="t-body-l muted measure">Las fotos de tus trabajos generan confianza. Cada una se analiza en tu teléfono y te sugiere una categoría.</p></header>
        <div id="pr-data" class="stack" aria-live="polite"></div></div>`;
    },
    mount: function (root) {
      var fotos = [];
      function paint() {
        var grid = root.querySelector("#port-grid"); if (!grid) return;
        grid.innerHTML = String(html`${fotos.map(function (u, i) {
          var et = AR.db.etiquetas.get(u);
          return html`<figure class="port-item"><span class="media" style="--ar:1">${AR.photoImg(u, "Foto de tu portafolio " + (i + 1) + (et && et.categoria ? ": " + AR.catalog.cat(et.categoria).nombre : ""), "", 360, 360)}</span>
            ${et && et.categoria ? html`<figcaption class="port-cat">${AR.catalog.cat(et.categoria).corto}</figcaption>` : ""}
            <button type="button" class="icon-btn port-x" data-rm="${i}" aria-label="Quitar foto ${i + 1}">${icon("close", "ic-s")}</button></figure>`;
        })}${fotos.length < AR.config.MAX_PHOTOS ? html`<button type="button" class="port-add" id="port-add">${icon("plus", "ic-l")}<span class="t-label-l">Agregar foto</span></button>` : ""}`);
        AR.photos.hydrate(grid);
        root.querySelector("#port-count").textContent = U.plural(fotos.length, "foto", "fotos") + " de " + AR.config.MAX_PHOTOS;
      }
      function save(next, msg, undo) {
        var prev = fotos; fotos = next; paint();
        AR.repo.guardarPortafolio(next).then(function () { if (msg) AR.snack.show(msg, undo ? { action: "Deshacer", onAction: function () { save(prev, "Foto restaurada."); } } : null); }).catch(function (e) { fotos = prev; paint(); AR.snack.show(e.message); });
      }
      root.addEventListener("pr:ready", paint);   // antes de pedir el perfil: la caché responde de inmediato
      ensureProfile(root, function (p) {
        fotos = (p.portafolio || []).slice();
        return html`<div class="row-flex" style="justify-content:space-between"><h2 class="t-title-l">Tus trabajos</h2><span class="pill pill--info" id="port-count"></span></div>
          <div class="port-grid" id="port-grid"></div>`;
      });
      root.addEventListener("click", function (e) {
        if (e.target.closest("[data-retry]")) return AR.router.refresh();
        if (e.target.closest("#port-add")) {
          AR.flows.addPhoto({ onDone: function (r) { save(fotos.concat([r.uri]), "Foto agregada a tu portafolio" + (r.categoria ? " (" + AR.catalog.cat(r.categoria).corto + ")" : "") + "."); } });
          return;
        }
        var x = e.target.closest("[data-rm]"); if (x) { var i = +x.getAttribute("data-rm"), uri = fotos[i]; save(fotos.filter(function (_, k) { return k !== i; }), "Quitaste la foto.", true); }
      });
    }
  };
})();
