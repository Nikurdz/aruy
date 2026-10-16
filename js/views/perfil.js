/** Aruy · Perfil (Figura 5) y editar perfil. Funcionalidades 3, 13, 15, 18 y 19. */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views;

  function permPill(k) {
    var st = AR.perms.state(k);
    return st === "granted" ? html`<span class="pill pill--ok">Permitido</span>` : st === "denied" ? html`<span class="pill pill--err">No permitido</span>` : html`<span class="pill">Se pide al usarlo</span>`;
  }

  function rowLink(href, ic, title, sub, trail) {
    return html`<a class="row-link" href="${href}">${icon(ic, "lead")}<span class="grow"><b>${title}</b>${sub ? html`<span class="sub" style="display:block">${sub}</span>` : ""}</span>${trail || icon("chevron-right", "lead")}</a>`;
  }

  V.perfil = {
    title: "Perfil",
    bar: { title: "Perfil", actions: [{ id: "set", icon: "settings", label: "Ajustes", onClick: function () { AR.router.go("#/ajustes"); } }] },
    render: function () {
      var u = AR.session.user(), z = AR.catalog.zona(u.ubicacion), b = AR.catalog.barrio(u.barrio), pre = u.rol === "prestador", p = pre ? AR.repo.miPrestador() : null;
      var theme = AR.theme.get("tema", "system");
      return html`<div class="page page--narrow stack stack-l">
        <section class="prof-head" aria-labelledby="pf-name">
          <button type="button" class="avatar-edit" id="pf-photo" aria-label="Cambiar foto de perfil">${UI.avatar(u, "avatar-xl")}<span class="avatar-cam">${icon("camera", "ic-s")}</span></button>
          <div class="stack stack-s"><h1 class="t-headline" id="pf-name">${u.nombre}</h1>
            <p class="muted">${u.correo}</p>
            <div class="row-flex" style="flex-wrap:wrap;--gap:8px">
              <span class="pill pill--info">${icon(pre ? "briefcase" : "search", "ic-s")}${pre ? "Prestador" : "Contratante"}</span>
              ${u.verificado ? html`<span class="pill pill--ok"><svg class="seal" aria-hidden="true" style="width:16px;height:16px"><use href="#i-sello"/></svg>Verificada</span>` : ""}
              <span class="pill">${icon("pin", "ic-s")}${b ? b.nombre : z.nombre}</span></div></div>
        </section>
        ${u.verificado ? "" : html`<a class="card card--warn verify-nudge" href="#/verificar">${icon("shield-check", "ic-l")}<span><b class="t-title-m">Verifica tu cuenta</b><span class="t-body-m" style="display:block">Confirma tu correo o celular para generar confianza${pre ? " y poder publicar servicios" : ""}.</span></span>${icon("chevron-right")}</a>`}
        ${pre && p ? html`<section class="card"><div class="switch-row" style="min-height:0;padding:0"><div class="grow"><b class="t-title-m">${p.disponible ? "Recibiendo solicitudes" : "No recibes solicitudes"}</b><p class="muted t-body-m">Disponibilidad de tus servicios</p></div>
          <button type="button" role="switch" class="switch" id="pf-av" aria-checked="${p.disponible}" aria-label="Recibir solicitudes"></button></div></section>` : ""}
        <section aria-labelledby="g-cuenta"><h2 class="t-title-m muted" id="g-cuenta" style="margin:0 0 8px 4px">Cuenta</h2>
          <div class="list-card">
            ${rowLink("#/perfil/editar", "edit", "Editar perfil", pre ? "Nombre, descripción, zona y experiencia" : "Nombre, celular y zona")}
            ${rowLink("#/ajustes", "settings", "Ajustes", "Tema " + (theme === "system" ? "del sistema" : theme === "dark" ? "oscuro" : "claro") + ", tamaño de texto y animaciones")}
          </div></section>
        <section aria-labelledby="g-priv"><h2 class="t-title-m muted" id="g-priv" style="margin:0 0 8px 4px">Privacidad y seguridad</h2>
          <div class="list-card">
            ${rowLink("#/permisos", "lock", "Permisos", "Ubicación, cámara y galería", "")}
            ${rowLink("#/privacidad", "shield-check", "Mis datos y privacidad", "Qué guardamos y cómo protegerlo")}
            ${pre ? "" : rowLink("#/bloqueados", "block", "Personas bloqueadas", U.plural(AR.repo.listaBloqueados().length, "bloqueada", "bloqueadas"))}
            ${rowLink("#/reportes", "flag", "Mis reportes", "Estado de lo que reportaste")}
            ${rowLink("#/normas", "rule", "Normas de la comunidad", "Cómo cuidamos Aruy entre todos")}
          </div></section>
        <section aria-labelledby="g-ses"><h2 class="t-title-m muted" id="g-ses" style="margin:0 0 8px 4px">Sesión</h2>
          <div class="list-card">
            <button type="button" class="row-link" id="pf-out">${icon("logout", "lead")}<span class="grow"><b>Cerrar sesión</b></span></button>
            <a class="row-link danger" href="#/eliminar">${icon("trash", "lead")}<span class="grow"><b>Eliminar mi cuenta</b><span class="sub" style="display:block">Borra tu cuenta y tus datos</span></span></a>
          </div></section>
        <p class="t-body-m muted" style="text-align:center">Aruy ${AR.config.VERSION}. Prototipo de interfaz.</p>
      </div>`;
    },
    mount: function (root) {
      if (AR.session.role() === "prestador" && !AR.repo.miPrestador()) {
        /* entrada directa al perfil con la caché vacía: se carga el perfil público y se vuelve a pintar */
        AR.repo.cargarMiPerfil(function (st) { if (st.kind === "success" && root.isConnected && AR.repo.miPrestador()) AR.router.refresh(); });
      }
      root.querySelector("#pf-out").addEventListener("click", function () {
        UI.confirm({ title: "¿Cerrar sesión?", text: "Tus favoritos y tu historial se quedan guardados en este teléfono.", ok: "Cerrar sesión" }).then(function (yes) {
          if (!yes) return; AR.session.logout(); AR.router.go("#/login", { replace: true });
        });
      });
      root.querySelector("#pf-photo").addEventListener("click", function () { changePhoto(); });
      UI.bindSwitches(root, function (id, on, btn) {
        if (id !== "pf-av") return;
        AR.repo.setDisponible(on).then(function () {
          var t = btn.closest(".switch-row"); t.querySelector(".t-title-m").textContent = on ? "Recibiendo solicitudes" : "No recibes solicitudes";
          AR.snack.show(on ? "Ahora apareces como disponible." : "Pausaste tus solicitudes.");
        }).catch(function (e) { btn.setAttribute("aria-checked", String(!on)); AR.snack.show(e.message); });
      });
    }
  };

  function changePhoto() {
    var el = AR.sheet.show(html`<div class="stack" style="--gap:12px;padding-top:4px"><h2 class="t-headline">Foto de perfil</h2>
      <div class="opt-list" style="margin-top:0">
        <button type="button" class="opt" data-src="camara">${icon("camera")}<span class="grow">Tomar foto</span></button>
        <button type="button" class="opt" data-src="galeria">${icon("image")}<span class="grow">Elegir de la galería</span></button>
        ${AR.session.user().fotoPerfil ? html`<button type="button" class="opt" data-src="quitar">${icon("trash")}<span class="grow">Quitar foto</span></button>` : ""}
      </div><button type="button" class="btn btn-text" data-close>Cancelar</button></div>`, { label: "Foto de perfil" });
    var input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.hidden = true; el.appendChild(input);
    function apply(val) {
      var old = AR.session.user().fotoPerfil;
      var done = function () { AR.sheet.close(); AR.router.refresh(); AR.snack.show(val ? "Foto de perfil actualizada." : "Quitaste tu foto de perfil."); if (old && old.indexOf("idb:") === 0) AR.photos.remove(old); };
      (AR.session.user().rol === "prestador" ? AR.repo.actualizarPrestador({ fotoPerfil: val }) : AR.session.patch({ fotoPerfil: val })).then(done).catch(function (e) { AR.snack.show(e.message); });
    }
    input.addEventListener("change", function () {
      var f = input.files && input.files[0]; input.value = ""; if (!f) return;
      AR.photos.compress(f).then(function (c) { return AR.photos.save(c.blob); }).then(apply).catch(function (e) { AR.snack.show(e.message || "No pudimos usar esa foto."); });
    });
    el.addEventListener("click", function (e) {
      var s = e.target.closest("[data-src]"); if (!s) return; var k = s.getAttribute("data-src");
      if (k === "quitar") return apply(null);
      AR.perms.request(k === "camara" ? "camara" : "galeria").then(function (ok) { if (!ok) return; if (k === "camara") input.setAttribute("capture", "user"); else input.removeAttribute("capture"); input.click(); });
    });
  }

  /* ---------- Editar perfil (funcionalidad 3) ---------- */
  V.editarPerfil = {
    title: "Editar perfil",
    bar: { title: "Editar perfil", back: true },
    nav: false,
    render: function () {
      var u = AR.session.user(), pre = u.rol === "prestador", p = pre ? AR.repo.miPrestador() : null;
      var barrios = Object.keys(AR.catalog.barrios).map(function (k) { var b = AR.catalog.barrios[k]; return html`<option value="${k}" ${u.barrio === k ? raw("selected") : ""}>${b.nombre}, ${AR.catalog.zona(b.zona).nombre}</option>`; });
      return html`<form class="page page--narrow stack stack-l" id="pf-form" novalidate>
        <p class="form-error" id="pf-error" role="alert">${icon("alert", "ic-s")}<span></span></p>
        ${UI.field({ id: "nombre", label: "Nombre completo", value: u.nombre, autocomplete: "name", maxlength: 60 })}
        ${UI.field({ id: "telefono", label: "Celular", optional: true, value: u.telefono || "", type: "tel", inputmode: "tel", autocomplete: "tel", placeholder: "0998765432" })}
        <div class="field"><label for="barrio">Barrio donde estás</label><select class="input" id="barrio" name="barrio"><option value="">Solo mi zona (${AR.catalog.zona(u.ubicacion).nombre})</option>${barrios}</select>
          <p class="field-hint">Se usa para calcular distancias. No se muestra la dirección exacta.</p></div>
        ${pre && p ? html`
          ${UI.field({ id: "bio", label: "Sobre ti", optional: true, textarea: true, rows: 4, maxlength: 280, value: p.bio, placeholder: "Cuéntales a los clientes cómo trabajas." })}
          ${UI.field({ id: "anios", label: "Años de experiencia", inputmode: "numeric", value: p.anios || "", maxlength: 2, placeholder: "5" })}
          <div class="field"><span class="field-label" id="mod-l">Dónde atiendes</span><div class="chips" role="group" aria-labelledby="mod-l">
            <button type="button" class="chip" aria-pressed="${p.modalidad.indexOf("domicilio") >= 0}" data-mod="domicilio">A domicilio</button>
            <button type="button" class="chip" aria-pressed="${p.modalidad.indexOf("local") >= 0}" data-mod="local">En mi local</button></div></div>` : ""}
        <button type="submit" class="btn btn-filled btn-lg btn-block" id="pf-save">Guardar cambios</button>
      </form>`;
    },
    mount: function (root) {
      var form = root.querySelector("#pf-form"), u = AR.session.user(), pre = u.rol === "prestador", err = root.querySelector("#pf-error");
      U.on(root, "click", "[data-mod]", function (e, b) { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var n = AR.validate.nombre(form.nombre.value), t = AR.validate.telefono(form.telefono.value);
        UI.setError(root, "nombre", n.ok ? "" : n.error); UI.setError(root, "telefono", t.ok ? "" : t.error);
        if (!n.ok) return form.nombre.focus(); if (!t.ok) return form.telefono.focus();
        var patch = { nombre: n.value, telefono: t.value || null, barrio: form.barrio.value || null };
        if (form.barrio.value) patch.ubicacion = AR.catalog.barrio(form.barrio.value).zona;
        if (pre) {
          var anios = parseInt(form.anios.value, 10);
          if (form.anios.value && !(anios >= 0 && anios <= 70)) { UI.setError(root, "anios", "Escribe un número entre 0 y 70."); return form.anios.focus(); }
          patch.bio = form.bio.value.trim(); patch.anios = isNaN(anios) ? 0 : anios;
          patch.modalidad = U.$$("[data-mod]", root).filter(function (b) { return b.getAttribute("aria-pressed") === "true"; }).map(function (b) { return b.getAttribute("data-mod"); });
          if (!patch.modalidad.length) patch.modalidad = ["domicilio"];
        }
        var btn = root.querySelector("#pf-save"); btn.disabled = true; btn.textContent = "Guardando…";
        (pre ? AR.repo.actualizarPrestador(patch) : AR.session.patch(patch)).then(function () {
          AR.snack.show("Cambios guardados."); AR.router.back();
        }).catch(function (er) { btn.disabled = false; btn.textContent = "Guardar cambios"; err.querySelector("span").textContent = er.message || "No pudimos guardar."; err.classList.add("show"); });
      });
    }
  };
})();
