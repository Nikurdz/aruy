/** Aruy · Flujos reutilizables en hojas: contactar por WhatsApp, calificar, reportar, bloquear, compartir y agregar fotos con IA. */
AR.flows = (function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u;

  /* ---------- Contactar por WhatsApp (funcionalidad 8) ---------- */
  function defaultMessage(p, s) {
    return "Hola " + U.firstName(p.nombre) + ", vi " + (s ? "tu servicio «" + s.titulo + "»" : "tu perfil") + " en Aruy y me gustaría saber si tienes disponibilidad. ¿Me ayudas con una cotización?";
  }

  function contact(p, s) {
    var msg = defaultMessage(p, s);
    var el = AR.sheet.show(html`<div class="stack" style="--gap:14px;padding-top:4px">
      <div class="row-flex">${AR.ui.avatar(p, "avatar-l")}<div><h2 class="t-headline">Contactar a ${U.firstName(p.nombre)}</h2><p class="muted">${p.oficio}</p></div></div>
      ${p.disponible ? "" : html`<p class="card card--warn t-body-m">${U.firstName(p.nombre)} no está recibiendo solicitudes ahora. Puedes dejarle tu mensaje y te responderá cuando vuelva.</p>`}
      <div class="field"><label for="wa-msg">Tu mensaje</label><textarea class="input" id="wa-msg" rows="4" maxlength="400">${msg}</textarea></div>
      <p class="card card--outlined t-body-m">${icon("info", "ic-s")} Es un prototipo: no se envía ningún mensaje real. En la app, este botón abre WhatsApp con tu mensaje ya escrito.</p>
      <div class="sheet-actions" style="margin-top:0">
        <button type="button" class="btn btn-wa btn-lg" data-go>${icon("chat")}Abrir WhatsApp</button>
        <button type="button" class="btn btn-outlined" data-copy>${icon("copy")}Copiar mensaje</button>
        <button type="button" class="btn btn-text" data-close>Ahora no</button>
      </div></div>`, { label: "Contactar a " + p.nombre });
    el.querySelector("[data-go]").addEventListener("click", function () {
      var text = el.querySelector("#wa-msg").value.trim() || msg;
      AR.repo.registrarContacto({ prestadorId: p.id, servicioId: s && s.id, mensaje: text });
      AR.sheet.close();
      setTimeout(function () {
        AR.snack.show("Abrimos WhatsApp con tu mensaje. Quedó en tu historial.", { action: "Ver historial", onAction: function () { location.hash = "#/guardados?tab=historial"; } });
      }, 150);
      U.vibrate(12);
    });
    el.querySelector("[data-copy]").addEventListener("click", function () {
      copy(el.querySelector("#wa-msg").value, "Mensaje copiado");
    });
  }

  function copy(text, ok) {
    function done() { AR.snack.show(ok); }
    function fallback() {
      var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) { /* sin portapapeles */ } document.body.removeChild(t); done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  function share(title, text) {
    var url = location.href;
    if (navigator.share) { navigator.share({ title: title, text: text, url: url }).catch(function () { /* cancelado */ }); return; }
    copy(url, "Enlace copiado");
  }

  /* ---------- Calificar y comentar (funciones 9 y 10) ---------- */
  function rate(p, onDone) {
    var value = 0;
    var el = AR.sheet.show(html`<form class="stack" style="--gap:14px;padding-top:4px" novalidate>
      <div><h2 class="t-headline">¿Cómo te fue con ${U.firstName(p.nombre)}?</h2><p class="muted">Tu opinión ayuda a otras personas a elegir.</p></div>
      <div class="rate-stars" role="radiogroup" aria-label="Calificación">${[1, 2, 3, 4, 5].map(function (n) {
        return html`<button type="button" class="icon-btn rate-star" role="radio" aria-checked="false" data-star="${n}" aria-label="${n} ${n === 1 ? "estrella" : "estrellas"}">${icon("star-o")}</button>`;
      })}</div>
      <p class="field-error" id="rate-err" role="alert">${icon("alert", "ic-s")}<span>Elige cuántas estrellas le das.</span></p>
      ${AR.ui.field({ id: "rate-txt", label: "Comentario", optional: true, textarea: true, rows: 4, maxlength: 300, placeholder: "Cuenta cómo fue el trabajo: puntualidad, trato, resultado…" })}
      ${AR.ui.switchRow({ id: "rate-rec", label: "Lo recomiendo", desc: "Aparecerá en su perfil como recomendación.", checked: false })}
      <div class="sheet-actions" style="margin-top:0">
        <button type="submit" class="btn btn-filled btn-lg">Publicar opinión</button>
        <button type="button" class="btn btn-text" data-close>Cancelar</button>
      </div></form>`, { label: "Calificar a " + p.nombre });
    var stars = el.querySelectorAll("[data-star]");
    function paintStars() {
      stars.forEach(function (b) {
        var n = +b.getAttribute("data-star"), on = n <= value;
        b.setAttribute("aria-checked", String(n === value)); b.classList.toggle("is-star-on", on);
        b.innerHTML = String(icon(on ? "star" : "star-o"));
      });
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-star]");
      if (b) { value = +b.getAttribute("data-star"); paintStars(); el.querySelector("#rate-err").style.display = "none"; U.vibrate(8); }
    });
    AR.ui.bindSwitches(el);
    el.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!value) { var er = el.querySelector("#rate-err"); er.style.display = "flex"; stars[0].focus(); return; }
      var btn = el.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = "Publicando…";
      AR.repo.enviarResena({ prestadorId: p.id, rating: value, comentario: el.querySelector("#rate-txt").value.trim(), recomienda: el.querySelector("#rate-rec").getAttribute("aria-checked") === "true" })
        .then(function (r) { AR.sheet.close(); AR.snack.show("Opinión publicada. ¡Gracias!"); if (onDone) onDone(r); })
        .catch(function (err) { btn.disabled = false; btn.textContent = "Publicar opinión"; AR.snack.show(err.message || "No pudimos publicar tu opinión."); });
    });
  }

  /* ---------- Reportar (funcionalidades 16 y 17) ---------- */
  var MOTIVOS = [
    ["Las fotos no son suyas", "Parecen sacadas de otro lugar o de otra persona."],
    ["Contenido inapropiado", "Fotos o textos ofensivos o que no corresponden."],
    ["Parece una estafa", "Pide pagos por adelantado o datos sensibles."],
    ["Información falsa", "Datos, precios o experiencia que no son reales."],
    ["Otro motivo", ""]
  ];

  function report(o) {
    var motivo = MOTIVOS[0][0];
    var el = AR.sheet.show(html`<form class="stack" style="--gap:12px;padding-top:4px" novalidate>
      <div><h2 class="t-headline">Reportar ${o.objetivo}</h2><p class="muted">El equipo de Aruy lo revisará. La otra persona no sabrá quién reportó.</p></div>
      <div class="opt-list" role="radiogroup" aria-label="Motivo del reporte">${MOTIVOS.map(function (m, i) {
        return html`<button type="button" class="opt" role="radio" aria-checked="${i === 0}" data-motivo="${m[0]}"><span class="grow">${m[0]}${m[1] ? html`<span class="sub">${m[1]}</span>` : ""}</span></button>`;
      })}</div>
      ${AR.ui.field({ id: "rep-det", label: "Cuéntanos más", optional: true, textarea: true, rows: 3, maxlength: 240 })}
      <div class="sheet-actions" style="margin-top:0">
        <button type="submit" class="btn btn-filled btn-lg">Enviar reporte</button>
        <button type="button" class="btn btn-text" data-close>Cancelar</button>
      </div></form>`, { label: "Reportar " + o.objetivo });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-motivo]"); if (!b) return;
      el.querySelectorAll("[data-motivo]").forEach(function (x) { x.setAttribute("aria-checked", "false"); });
      b.setAttribute("aria-checked", "true"); motivo = b.getAttribute("data-motivo");
    });
    el.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = el.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = "Enviando…";
      AR.repo.reportar({ tipo: o.tipo, objetivoId: o.objetivoId, objetivo: o.objetivo, motivo: motivo, detalle: el.querySelector("#rep-det").value.trim() })
        .then(function () { AR.sheet.close(); AR.snack.show("Reporte enviado. Lo revisaremos pronto.", { action: "Ver mis reportes", onAction: function () { location.hash = "#/reportes"; } }); })
        .catch(function (err) { btn.disabled = false; btn.textContent = "Enviar reporte"; AR.snack.show(err.message); });
    });
  }

  /* ---------- Bloquear ---------- */
  function block(p, after) {
    AR.ui.confirm({ title: "¿Bloquear a " + p.nombre + "?", text: "Dejarás de ver sus servicios y su perfil. Puedes desbloquearla desde tu perfil cuando quieras.", ok: "Bloquear", danger: true }).then(function (yes) {
      if (!yes) return;
      AR.repo.bloquear(p, true).then(function () {
        AR.snack.show("Bloqueaste a " + p.nombre + ".", { action: "Deshacer", onAction: function () { AR.repo.bloquear(p, false); if (after) after(false); } });
        if (after) after(true);
      }).catch(function (e) { AR.snack.show(e.message); });
    });
  }

  /* ---------- Agregar foto con etiquetas de IA (sección 6) ---------- */
  function addPhoto(o) {
    o = o || {};
    var el = AR.sheet.show(chooser(), { label: "Agregar foto" });
    var body = el.querySelector(".sheet-body");
    var input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.hidden = true; el.appendChild(input);

    function chooser() {
      return html`<div class="stack" style="--gap:14px;padding-top:4px">
        <div><h2 class="t-headline">Agregar foto</h2><p class="muted">Aruy la analiza en tu teléfono y te sugiere una categoría. Tú decides.</p></div>
        <div class="opt-list" style="margin-top:0">
          <button type="button" class="opt" data-src="camara">${icon("camera")}<span class="grow">Tomar foto<span class="sub">Usa la cámara de tu teléfono</span></span></button>
          <button type="button" class="opt" data-src="galeria">${icon("image")}<span class="grow">Elegir de la galería<span class="sub">Tú eliges cada foto</span></span></button>
        </div>
        <div><b class="t-title-m">O prueba con una foto de ejemplo</b>
          <div class="samples">${AR.photos.muestras.map(function (m) {
            return html`<button type="button" class="sample" data-sample="${m.id}" aria-label="Foto de ejemplo: ${m.nombre}"><span class="media" style="--ar:1">${AR.photoImg(m.uri, "", "", 200, 200)}</span><span class="t-label-m clamp-2">${m.nombre}</span></button>`;
          })}</div></div>
        <button type="button" class="btn btn-text" data-close>Cancelar</button></div>`;
    }

    function analyzing(thumb) {
      body.innerHTML = String(html`<div class="stack" style="--gap:16px;padding-top:4px" aria-live="polite">
        <div class="analyze"><span class="media" style="--ar:1">${thumb}</span>
          <div class="stack stack-s"><h2 class="t-title-l">Analizando en tu teléfono</h2><p class="muted t-body-m">Buscando etiquetas en la foto…</p></div></div>
        <div class="tejido tejido--lg tejido--spin" role="progressbar" aria-label="Analizando la foto"></div>
        <p class="t-body-m muted">${icon("shield-check", "ic-s")} La foto no sale de tu teléfono mientras se analiza.</p></div>`);
      AR.photos.hydrate(body);
    }

    function result(ctx) {
      var res = ctx.res, good = AR.ml.confiables(res), cat = res.categoria ? AR.catalog.cat(res.categoria) : null;
      body.innerHTML = String(html`<div class="stack" style="--gap:14px;padding-top:4px">
        <div class="analyze"><span class="media" style="--ar:1">${ctx.thumb}</span>
          <div class="stack stack-s"><h2 class="t-title-l">${res.trabajo ? "Etiquetas sugeridas" : "No parece un trabajo"}</h2>
            ${ctx.info ? html`<p class="muted t-body-m">${icon("check-circle", "ic-s")} Optimizada: ${ctx.info}</p>` : ""}</div></div>
        ${res.trabajo
          ? html`<ul class="chips ml-tags" aria-label="Etiquetas con confianza alta">${good.map(function (t) {
            return html`<li class="pill pill--info" aria-label="${t.texto}, confianza ${Math.round(t.confianza * 100)} por ciento">${icon("tag", "ic-s")}${t.texto}<span class="conf">${Math.round(t.confianza * 100)} %</span></li>`;
          })}</ul>
          <div class="card card--accent stack stack-s"><b class="t-title-m">Categoría sugerida</b>
            <div class="row-flex">${icon("c-" + cat.id, "ic-l")}<span class="t-title-l">${cat.nombre}</span></div>
            <p class="t-body-m">Se propone por las etiquetas de herramientas e instalaciones de la foto. Confírmala o elige otra.</p></div>
          <div class="sheet-actions" style="margin-top:0">
            <button type="button" class="btn btn-filled btn-lg" data-use="${cat.id}">Usar «${cat.corto}»</button>
            <button type="button" class="btn btn-outlined" data-other>Elegir otra categoría</button></div>`
          : html`<div class="card card--warn stack stack-s"><b class="t-title-m">Esta foto no parece mostrar un trabajo</b>
              <p class="t-body-m">Para que los clientes confíen, usa fotos de trabajos reales. Puedes usarla igual o elegir otra.</p></div>
            <div class="sheet-actions" style="margin-top:0">
              <button type="button" class="btn btn-filled btn-lg" data-again>Elegir otra foto</button>
              <button type="button" class="btn btn-outlined" data-force>Usarla igual</button></div>`}
        <p class="t-body-m muted">${icon("sparkles", "ic-s")} Simulación de ML Kit Image Labeling. En la app real corre en el teléfono, sin internet.</p>
        <button type="button" class="btn btn-text" data-close>Cancelar</button></div>`);
      AR.photos.hydrate(body);
    }

    function pickCategory(ctx) {
      body.innerHTML = String(html`<div class="stack" style="--gap:12px;padding-top:4px"><h2 class="t-headline">Elige la categoría</h2>
        <div class="opt-list" style="margin-top:0">${AR.catalog.categorias.map(function (c) {
          return html`<button type="button" class="opt" role="radio" aria-checked="${c.id === (ctx.res.categoria || o.categoriaActual)}" data-use="${c.id}">${icon("c-" + c.id)}<span class="grow">${c.nombre}</span></button>`;
        })}</div></div>`);
    }

    function finish(ctx, cat) {
      var save = ctx.blob ? AR.photos.save(ctx.blob) : Promise.resolve(ctx.uri);
      save.then(function (uri) {
        var tags = AR.ml.confiables(ctx.res);
        AR.db.etiquetas.put({ id: uri, uri: uri, etiquetas: tags, categoria: cat, ts: Date.now() });
        AR.sheet.close();
        if (o.onDone) o.onDone({ uri: uri, categoria: cat, etiquetas: tags });
      });
    }

    function analyze(src) {
      var thumb = src.canvas ? raw('<img alt="Vista previa de la foto elegida" src="' + src.canvas.toDataURL("image/jpeg", 0.6) + '">') : AR.photoImg(src.uri, "Vista previa de la foto elegida", "", 240, 240);
      analyzing(thumb);
      AR.ml.label({ nombre: src.nombre, cat: src.cat, canvas: src.canvas }).then(function (res) {
        if (!AR.sheet.isOpen()) return;
        var ctx = { res: res, thumb: thumb, uri: src.uri, blob: src.blob, info: src.info };
        result(ctx);
        el.onclick = function (e) {
          var t;
          if ((t = e.target.closest("[data-use]"))) return finish(ctx, t.getAttribute("data-use"));
          if (e.target.closest("[data-other]")) return pickCategory(ctx);
          if (e.target.closest("[data-force]")) return finish(ctx, o.categoriaActual || "otros");
          if (e.target.closest("[data-again]")) { body.innerHTML = String(chooser()); AR.photos.hydrate(body); }
        };
      });
    }

    input.addEventListener("change", function () {
      var f = input.files && input.files[0]; input.value = "";
      if (!f) return;
      if (!/^image\//.test(f.type)) { AR.snack.show("Ese archivo no es una imagen. Elige una foto."); return; }
      analyzing(raw(""));
      AR.photos.compress(f).then(function (c) {
        analyze({ nombre: f.name, blob: c.blob, canvas: c.canvas, info: AR.photos.sizeLabel(c.before) + " → " + AR.photos.sizeLabel(c.after) });
      }).catch(function (err) { body.innerHTML = String(chooser()); AR.snack.show(err.message || "No pudimos abrir esa foto."); });
    });

    el.addEventListener("click", function (e) {
      var s = e.target.closest("[data-src]");
      if (s) {
        var kind = s.getAttribute("data-src");
        AR.perms.request(kind === "camara" ? "camara" : "galeria").then(function (ok) {
          if (!ok) return;
          if (kind === "camara") input.setAttribute("capture", "environment"); else input.removeAttribute("capture");
          input.click();
        });
        return;
      }
      var m = e.target.closest("[data-sample]");
      if (m) {
        var sample = AR.photos.muestras.filter(function (x) { return x.id === m.getAttribute("data-sample"); })[0];
        analyze({ nombre: sample.nombre, cat: sample.cat, uri: sample.uri });
      }
    });
    return el;
  }

  return { contact: contact, rate: rate, report: report, block: block, share: share, copy: copy, addPhoto: addPhoto, defaultMessage: defaultMessage };
})();
