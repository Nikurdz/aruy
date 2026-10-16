/** Aruy · Publicar servicio con IA (Figura 4): fotos con etiquetas sugeridas en el dispositivo, categoría, precio y disponibilidad.
 *  El borrador se guarda solo en la base local (Room) para no perder lo escrito si el sistema cierra la app. Funcionalidades 4, 5 y 13. */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views;
  var UNIDADES = ["por visita", "por trabajo", "por hora", "por sesión", "por servicio", "por jornada", "por ambiente"];

  V.editor = {
    title: function (ctx) { return ctx.params.id ? "Editar servicio" : "Nuevo servicio"; },
    bar: function (ctx) { return { title: ctx.params.id ? "Editar servicio" : "Nuevo servicio", back: true }; },
    nav: false,
    render: function (ctx) {
      var editing = !!ctx.params.id;
      if (editing && !AR.db.servicios.get(ctx.params.id)) return html`<div class="page page--narrow" id="ed-load">${UI.loading("Cargando tu servicio…")}</div>`;
      var cats = AR.catalog.categorias.map(function (c) { return html`<option value="${c.id}">${c.nombre}</option>`; });
      return html`<form class="page page--narrow editor stack stack-l" id="ed" novalidate>
        <section class="stack stack-s" aria-labelledby="ph-t">
          <div class="row-flex" style="justify-content:space-between"><h2 class="t-title-l" id="ph-t">Fotos de tu trabajo</h2><span class="pill pill--info" id="ph-n">0 de ${AR.config.MAX_PHOTOS}</span></div>
          <div class="port-grid" id="ed-photos"></div>
          <p class="t-body-m muted">${icon("sparkles", "ic-s")} Aruy analiza cada foto en tu teléfono y te sugiere una categoría. Tú decides.</p>
          <div id="ia-card"></div>
        </section>
        ${UI.field({ id: "titulo", label: "Título del servicio", maxlength: 60, placeholder: "Ejemplo: Instalación de breakers y luminarias", enterkeyhint: "next" })}
        <div class="field" data-field="categoria"><label for="categoria">Categoría <span id="cat-tag"></span></label>
          <select class="input" id="categoria" name="categoria"><option value="">Elige una categoría</option>${cats}</select>
          <p class="field-error" id="e-categoria" role="alert">${icon("alert", "ic-s")}<span></span></p></div>
        <div class="field" data-field="descripcion"><label for="descripcion">Descripción</label>
          <textarea class="input" id="descripcion" name="descripcion" rows="5" maxlength="500" placeholder="Cuenta qué incluye, cómo trabajas y en qué zonas atiendes." aria-describedby="e-descripcion"></textarea>
          <span class="field-counter" id="desc-n" aria-hidden="true">0 / 500</span>
          <p class="field-error" id="e-descripcion" role="alert">${icon("alert", "ic-s")}<span></span></p></div>
        <div class="price-row">
          ${UI.field({ id: "precio", label: "Precio referencial", optional: true, inputmode: "decimal", prefix: "$", placeholder: "15", maxlength: 6, hint: "Es una guía; lo acuerdas por WhatsApp." })}
          <div class="field"><label for="unidad">Se cobra</label><select class="input" id="unidad" name="unidad">${UNIDADES.map(function (u) { return html`<option>${u}</option>`; })}</select></div>
        </div>
        ${UI.switchRow({ id: "disp", label: "Disponible para nuevas solicitudes", desc: "Si lo pausas, el servicio sigue visible pero se marca como no disponible.", checked: true })}
        <div class="editor-foot">
          <p class="draft-state t-body-m muted" id="draft-state" role="status">${editing ? "" : "El borrador se guarda solo."}</p>
          <div class="cta-bar" style="position:static;padding:0"><button type="submit" class="btn btn-filled btn-lg btn-block" id="ed-save">${editing ? "Guardar cambios" : "Publicar servicio"}</button></div>
          ${editing ? html`<button type="button" class="btn btn-danger-text btn-block" id="ed-del">${icon("trash", "ic-s")}Eliminar servicio</button>` : ""}
        </div>
      </form>`;
    },
    mount: function (root, ctx) {
      var editing = !!ctx.params.id, form = root.querySelector("#ed"), me = AR.session.user();
      var existing = editing ? AR.db.servicios.get(ctx.params.id) : null;
      if (editing && !form) {
        /* enlace directo con la caché vacía: se carga el perfil propio y luego se abre el editor */
        AR.repo.cargarMiPerfil(function (st) {
          if (!root.isConnected) return;
          if (st.kind === "success") { if (AR.db.servicios.get(ctx.params.id)) AR.router.refresh(); else AR.router.go("#/servicios", { replace: true }); }
          else if (st.kind === "error") { root.innerHTML = String(UI.errorState(st)); root.querySelector("[data-retry]").addEventListener("click", function () { AR.router.refresh(); }); }
        });
        return;
      }
      if (editing && (!existing || existing.prestadorId !== me.prestadorId)) { AR.router.go("#/servicios", { replace: true }); return; }

      var state = { fotos: [], ia: null, catSugerida: false };
      var src = existing || AR.repo.getBorrador();
      if (src) {
        form.titulo.value = src.titulo || ""; form.descripcion.value = src.descripcion || ""; form.categoria.value = src.categoria || "";
        form.precio.value = src.precioReferencial != null ? src.precioReferencial : (src.precio || ""); if (src.unidad) form.unidad.value = src.unidad;
        form.disp.setAttribute("aria-checked", String(src.disponible !== false));
        state.fotos = (src.fotos || []).slice(); state.ia = src.ia || null; state.catSugerida = !!src.catSugerida;
      }
      if (!editing && src) AR.snack.show("Recuperamos tu borrador.");
      var $ = function (s) { return root.querySelector(s); };

      function paintPhotos() {
        var grid = $("#ed-photos");
        grid.innerHTML = String(html`${state.fotos.map(function (u, i) {
          var et = AR.db.etiquetas.get(u);
          return html`<figure class="port-item"><span class="media" style="--ar:1">${AR.photoImg(u, "Foto " + (i + 1) + " del servicio", "", 360, 360)}</span>
            ${et && et.categoria ? html`<figcaption class="port-cat">${AR.catalog.cat(et.categoria).corto}</figcaption>` : ""}
            <button type="button" class="icon-btn port-x" data-rm="${i}" aria-label="Quitar foto ${i + 1}">${icon("close", "ic-s")}</button></figure>`;
        })}${state.fotos.length < AR.config.MAX_PHOTOS ? html`<button type="button" class="port-add" id="ed-add">${icon("camera", "ic-l")}<span class="t-label-l">${state.fotos.length ? "Otra foto" : "Agregar foto"}</span></button>` : ""}`);
        AR.photos.hydrate(grid);
        $("#ph-n").textContent = state.fotos.length + " de " + AR.config.MAX_PHOTOS;
        $("#cat-tag").innerHTML = state.catSugerida && form.categoria.value ? String(html`<span class="pill pill--pink">${icon("sparkles", "ic-s")}Sugerida por la foto</span>`) : "";
        var ia = state.ia;
        $("#ia-card").innerHTML = ia && ia.etiquetas && ia.etiquetas.length ? String(html`<div class="card card--accent stack stack-s">
          <b class="t-title-m">${icon("sparkles", "ic-s")} Etiquetas de tu última foto</b>
          <ul class="chips ml-tags" aria-label="Etiquetas sugeridas">${ia.etiquetas.map(function (t) { return html`<li class="pill pill--info">${t.texto}<span class="conf">${Math.round(t.confianza * 100)} %</span></li>`; })}</ul>
          <p class="t-body-m">Simulación de ML Kit. En la app, el análisis ocurre en tu teléfono y funciona sin internet.</p></div>`) : "";
      }

      function collect() {
        return {
          titulo: form.titulo.value.trim(), descripcion: form.descripcion.value.trim(), categoria: form.categoria.value,
          precio: form.precio.value.trim(), unidad: form.unidad.value, disponible: form.disp.getAttribute("aria-checked") === "true",
          fotos: state.fotos, ia: state.ia, catSugerida: state.catSugerida
        };
      }
      var stamp = $("#draft-state");
      var save = U.debounce(function () {
        if (editing) return;
        var d = collect();
        if (!d.titulo && !d.descripcion && !d.fotos.length && !d.categoria && !d.precio) { AR.repo.delBorrador(); stamp.textContent = "El borrador se guarda solo."; return; }
        AR.repo.setBorrador(d); stamp.innerHTML = String(html`${icon("check", "ic-s")} Borrador guardado en tu teléfono`);
      }, 500);

      form.addEventListener("input", function (e) {
        if (e.target.id === "descripcion") $("#desc-n").textContent = e.target.value.length + " / 500";
        if (e.target.id === "categoria") state.catSugerida = false;
        if (["titulo", "descripcion", "categoria"].indexOf(e.target.id) >= 0) UI.setError(root, e.target.id, "");
        if (e.target.id === "categoria") paintPhotos();
        save();
      });
      UI.bindSwitches(root, function () { save(); });
      $("#desc-n").textContent = form.descripcion.value.length + " / 500";
      paintPhotos();

      root.addEventListener("click", function (e) {
        if (e.target.closest("#ed-add")) {
          AR.flows.addPhoto({ categoriaActual: form.categoria.value, onDone: function (r) {
            state.fotos.push(r.uri); state.ia = { etiquetas: r.etiquetas, categoria: r.categoria };
            if (!form.categoria.value && r.categoria) { form.categoria.value = r.categoria; state.catSugerida = true; UI.setError(root, "categoria", ""); }
            else if (r.categoria && r.categoria !== form.categoria.value) { AR.snack.show("La foto sugiere «" + AR.catalog.cat(r.categoria).corto + "». Puedes cambiar la categoría cuando quieras."); }
            paintPhotos(); save(); U.vibrate(12);
          } });
          return;
        }
        var x = e.target.closest("[data-rm]");
        if (x) { var i = +x.getAttribute("data-rm"), uri = state.fotos[i]; state.fotos.splice(i, 1); paintPhotos(); save(); AR.snack.show("Quitaste la foto.", { action: "Deshacer", onAction: function () { state.fotos.splice(i, 0, uri); paintPhotos(); save(); } }); }
        if (e.target.closest("#ed-del")) {
          UI.confirm({ title: "¿Eliminar este servicio?", text: "Dejará de aparecer en las búsquedas.", ok: "Eliminar", danger: true }).then(function (yes) {
            if (yes) AR.repo.eliminarServicio(existing).then(function () { AR.snack.show("Servicio eliminado."); AR.router.go("#/servicios", { replace: true }); }).catch(function (er) { AR.snack.show(er.message); });
          });
        }
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var d = collect(), bad = null;
        if (d.titulo.length < 4) { UI.setError(root, "titulo", "Escribe un título de al menos 4 letras."); bad = bad || form.titulo; } else UI.setError(root, "titulo", "");
        if (!d.categoria) { UI.setError(root, "categoria", "Elige la categoría del servicio."); bad = bad || form.categoria; } else UI.setError(root, "categoria", "");
        if (d.descripcion.length < 20) { UI.setError(root, "descripcion", "Cuenta un poco más: escribe al menos 20 letras."); bad = bad || form.descripcion; } else UI.setError(root, "descripcion", "");
        var precio = null;
        if (d.precio) { precio = parseFloat(d.precio.replace(",", ".")); if (!(precio > 0 && precio < 10000)) { UI.setError(root, "precio", "Escribe un precio válido. Ejemplo: 15 o 12,50."); bad = bad || form.precio; } else UI.setError(root, "precio", ""); }
        if (bad) return bad.focus();
        if (!me.verificado) {
          UI.confirm({ title: "Verifica tu cuenta para publicar", text: "Así las personas saben que eres real. Tu borrador queda guardado.", ok: "Verificar ahora", cancel: "Más tarde" }).then(function (yes) { if (yes) AR.router.go("#/verificar"); });
          return;
        }
        var btn = $("#ed-save"); btn.disabled = true; btn.textContent = editing ? "Guardando…" : "Publicando…";
        var row = Object.assign({}, existing || {}, {
          prestadorId: me.prestadorId, titulo: d.titulo, descripcion: d.descripcion, categoria: d.categoria, precioReferencial: precio, unidad: d.unidad,
          fotos: d.fotos, disponible: d.disponible, estado: existing ? existing.estado : "publicado"
        });
        AR.repo.guardarServicio(row).then(function () {
          if (!editing) AR.repo.delBorrador();
          AR.snack.show(editing ? "Cambios guardados." : "Servicio publicado.");
          AR.router.go("#/servicios", { replace: true });
        }).catch(function (er) { btn.disabled = false; btn.textContent = editing ? "Guardar cambios" : "Publicar servicio"; AR.snack.show(er.message || "No pudimos guardar el servicio."); });
      });
    }
  };
})();
