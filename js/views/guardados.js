/** Aruy · Guardados: favoritos (funcionalidad 11) e historial de contactos (funcionalidad 12). Todo viene de la base local. */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views;

  function favCard(x) {
    var p = x.prestador, s = x.servicio;
    return html`<article class="fav-card">
      <a class="fav-top" href="#/prestador/${p.id}" aria-label="Ver perfil de ${p.nombre}">${UI.avatar(p, "avatar-l")}
        <span class="fav-t"><b class="t-title-l clamp-1">${p.nombre}</b><span class="muted clamp-1">${p.oficio}</span>
          <span class="row-flex" style="flex-wrap:wrap;--gap:6px 12px">${UI.rating(p)}${UI.avail(p)}</span></span></a>
      ${s ? html`<a class="fav-svc" href="#/servicio/${s.id}"><span class="t-body-m clamp-1"><b>${s.titulo}</b></span>${UI.price(s)}</a>` : ""}
      <div class="fav-actions"><button type="button" class="btn btn-wa" data-contact="${p.id}">${icon("chat", "ic-s")}Contactar</button>
        <button type="button" class="btn btn-outlined" data-unfav="${p.id}" aria-label="Quitar de favoritos a ${p.nombre}">${icon("heart-fill", "ic-s")}Quitar</button></div>
    </article>`;
  }

  function histRow(x) {
    var p = x.prestador, h = x.h;
    return html`<article class="hist-row">
      <div class="row-flex" style="align-items:flex-start">${UI.avatar(p)}
        <div class="stack stack-s" style="min-width:0;flex:1"><div class="row-flex" style="justify-content:space-between;align-items:baseline"><b class="clamp-1">${p.nombre}</b><span class="t-body-m muted nowrap">${U.rel(h.ts)}</span></div>
          <p class="t-body-m muted clamp-1">${x.servicio ? x.servicio.titulo : p.oficio}</p>
          <p class="hist-msg t-body-m clamp-2">«${h.mensaje}»</p></div></div>
      <div class="fav-actions"><button type="button" class="btn btn-tonal" data-rate="${p.id}">${icon("star-o", "ic-s")}Calificar</button>
        <button type="button" class="btn btn-wa" data-contact="${p.id}" data-svc="${x.servicio ? x.servicio.id : ""}">${icon("chat", "ic-s")}Contactar otra vez</button></div>
    </article>`;
  }

  V.guardados = {
    title: "Guardados",
    bar: function (ctx) {
      var tab = ctx.query.tab === "historial" ? "historial" : "favoritos";
      return { title: "Guardados", actions: tab === "historial" ? [{ id: "clear", icon: "trash", label: "Borrar historial de contactos", onClick: function () { V.guardados._clear && V.guardados._clear(); } }] : [] };
    },
    render: function (ctx) {
      var tab = ctx.query.tab === "historial" ? "historial" : "favoritos";
      return html`<div class="page stack" id="saved">
        <div class="tabs tabs--sticky" role="tablist" aria-label="Guardados">
          <button type="button" class="tab" role="tab" id="t-fav" aria-selected="${tab === "favoritos"}" aria-controls="saved-body" data-t="favoritos">Favoritos</button>
          <button type="button" class="tab" role="tab" id="t-hist" aria-selected="${tab === "historial"}" aria-controls="saved-body" data-t="historial">Contactados</button>
        </div>
        <div id="saved-body" role="tabpanel" tabindex="0"></div>
      </div>`;
    },
    mount: function (root, ctx) {
      var tab = ctx.query.tab === "historial" ? "historial" : "favoritos", body = root.querySelector("#saved-body");

      function paint() {
        if (tab === "favoritos") {
          var favs = AR.repo.listaFavoritos();
          body.innerHTML = String(favs.length ? html`<div class="stack">${favs.map(favCard)}</div>` : UI.empty({ art: "nudo", title: "Aún no guardas a nadie", text: "Toca el corazón en un servicio para encontrarlo rápido más tarde, incluso sin conexión.", action: { label: "Buscar servicios", href: "#/buscar" } }));
        } else {
          var hist = AR.repo.listaHistorial();
          body.innerHTML = String(hist.length ? html`<p class="t-body-m muted" style="margin-bottom:8px">Los últimos prestadores que contactaste desde Aruy.</p><div class="stack">${hist.map(histRow)}</div>` : UI.empty({ art: "tela", title: "Todavía no contactaste a nadie", text: "Cuando escribas por WhatsApp a un prestador, aparecerá aquí para que lo califiques.", action: { label: "Buscar servicios", href: "#/buscar" } }));
        }
        U.$$(".tab", root).forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-t") === tab)); });
        body.setAttribute("aria-labelledby", tab === "favoritos" ? "t-fav" : "t-hist");
        AR.photos.hydrate(body);
        AR.shell.setBar(V.guardados.bar({ query: { tab: tab } }));
      }
      paint();

      root.querySelector(".tabs").addEventListener("click", function (e) {
        var b = e.target.closest("[data-t]"); if (!b) return; tab = b.getAttribute("data-t");
        AR.router.replaceQuiet("#/guardados" + (tab === "historial" ? "?tab=historial" : "")); paint();
      });

      body.addEventListener("click", function (e) {
        var t;
        if ((t = e.target.closest("[data-unfav]"))) {
          var id = t.getAttribute("data-unfav"), p = AR.repo.prestador(id);
          AR.repo.toggleFavorito(id); paint();
          AR.snack.show("Quitaste a " + p.nombre + " de favoritos.", { action: "Deshacer", onAction: function () { AR.repo.toggleFavorito(id); if (root.isConnected) paint(); } });
        } else if ((t = e.target.closest("[data-contact]"))) {
          var pr = AR.repo.prestador(t.getAttribute("data-contact")), sid = t.getAttribute("data-svc");
          AR.flows.contact(pr, (sid && AR.repo.servicio(sid)) || AR.repo.serviciosDe(pr.id)[0] || null);
        } else if ((t = e.target.closest("[data-rate]"))) {
          AR.flows.rate(AR.repo.prestador(t.getAttribute("data-rate")), function () { if (root.isConnected) paint(); });
        }
      });

      V.guardados._clear = function () {
        AR.ui.confirm({ title: "¿Borrar el historial?", text: "Se borra la lista de prestadores que contactaste desde este teléfono. Tus opiniones no cambian.", ok: "Borrar historial", danger: true }).then(function (yes) {
          if (!yes) return; var u = AR.session.id();
          AR.db.historial.where(function (h) { return h.userId === u; }).forEach(function (h) { AR.db.historial.remove(h.id); });
          paint(); AR.snack.show("Historial borrado.");
        });
      };
    },
    unmount: function () { V.guardados._clear = null; }
  };
})();
