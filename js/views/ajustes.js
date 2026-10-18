/** Aruy · Ajustes, permisos (18), privacidad (15), bloqueados (16), reportes (17), normas y eliminar cuenta (19). */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views;

  /* ---------- Ajustes: apariencia ---------- */
  V.ajustes = {
    title: "Ajustes",
    bar: { title: "Ajustes", back: true },
    nav: false,
    render: function () {
      var t = AR.theme.get("tema", "system"), tx = AR.theme.get("texto", "normal"), mo = AR.theme.get("movimiento", "system");
      return html`<div class="page page--narrow stack stack-l">
        <section class="stack" aria-labelledby="a-tema"><h2 class="t-title-l" id="a-tema">Tema</h2>
          ${UI.segmented({ name: "tema", label: "Tema de la app", value: t, options: [{ value: "system", label: "Sistema" }, { value: "light", label: "Claro", icon: "sun" }, { value: "dark", label: "Oscuro", icon: "moon" }] })}
          <p class="t-body-m muted">«Sistema» sigue el modo claro u oscuro de tu teléfono.</p></section>
        <section class="stack" aria-labelledby="a-txt"><h2 class="t-title-l" id="a-txt">Tamaño del texto</h2>
          ${UI.segmented({ name: "texto", label: "Tamaño del texto", value: tx, options: [{ value: "normal", label: "Normal" }, { value: "large", label: "Grande" }, { value: "xlarge", label: "Muy grande" }] })}
          <div class="card card--outlined"><p class="t-body-l">Así se verá el texto en toda la app. Los botones y áreas táctiles también crecen.</p></div></section>
        <section aria-labelledby="a-mov"><h2 class="t-title-l" id="a-mov" style="margin-bottom:4px">Movimiento</h2>
          ${UI.switchRow({ id: "mov", label: "Reducir animaciones", desc: "Quita deslizamientos y transiciones. Aruy también respeta el ajuste de tu teléfono.", checked: mo === "reduce" })}</section>
        <section aria-labelledby="a-dat"><h2 class="t-title-l" id="a-dat" style="margin-bottom:8px">Datos guardados</h2>
          <div class="list-card"><button type="button" class="row-link" id="clear-cache">${icon("refresh", "lead")}<span class="grow"><b>Borrar datos en caché</b><span class="sub" style="display:block">Vuelve a descargar servicios y perfiles. No borra tus favoritos.</span></span></button></div></section>
      </div>`;
    },
    mount: function (root) {
      UI.bindSegments(root, "tema", function (v) { AR.theme.set("tema", v); });
      UI.bindSegments(root, "texto", function (v) { AR.theme.set("texto", v); AR.shell.syncSnackOffset(); });
      UI.bindSwitches(root, function (id, on) { if (id === "mov") AR.theme.set("movimiento", on ? "reduce" : "system"); });
      root.querySelector("#clear-cache").addEventListener("click", function () { AR.repo.resetCache(); AR.snack.show("Listo. La próxima vez se descargan de nuevo."); });
    }
  };

  /* ---------- Permisos (funcionalidad 18) ---------- */
  V.permisos = {
    title: "Permisos",
    bar: { title: "Permisos", back: true },
    nav: false,
    render: function () {
      return html`<div class="page page--narrow stack stack-l">
        <p class="t-body-l muted measure">Aruy pide cada permiso solo cuando lo necesita y siempre te explica para qué. Aquí puedes revisarlos.</p>
        <div class="stack" id="perm-list">${Object.keys(AR.perms.items).map(function (k) { return permCard(k); })}</div></div>`;
    },
    mount: function (root) {
      root.addEventListener("click", function (e) {
        var b = e.target.closest("[data-perm]"); if (!b) return; var k = b.getAttribute("data-perm"), act = b.getAttribute("data-act");
        if (act === "revoke") { AR.perms.revoke(k); AR.snack.show("Quitaste el permiso de " + AR.perms.items[k].nombre.toLowerCase() + "."); }
        else if (act === "reset") { AR.perms.reset(k); AR.snack.show("Se volverá a preguntar cuando lo necesites."); }
        else if (act === "allow") { AR.perms.reset(k); AR.perms.request(k).then(function () { redraw(); }); return; }
        redraw();
      });
      function redraw() { root.querySelector("#perm-list").innerHTML = AR.render(Object.keys(AR.perms.items).map(function (k) { return permCard(k); })); }
    }
  };

  function permCard(k) {
    var it = AR.perms.items[k], st = AR.perms.state(k);
    return html`<article class="card perm-card">
      <div class="row-flex" style="align-items:flex-start"><span class="perm-ic">${icon(it.icono, "ic-l")}</span>
        <div class="stack stack-s" style="flex:1"><div class="row-flex" style="justify-content:space-between;flex-wrap:wrap"><h2 class="t-title-l">${it.nombre}</h2>
          ${st === "granted" ? html`<span class="pill pill--ok">Permitido</span>` : st === "denied" ? html`<span class="pill pill--err">No permitido</span>` : html`<span class="pill">Se pide al usarlo</span>`}</div>
          <p class="t-body-m muted">${it.motivo}</p></div></div>
      <div class="fav-actions" style="margin-top:12px">
        ${st === "granted" ? html`<button type="button" class="btn btn-outlined" data-perm="${k}" data-act="revoke">Quitar permiso</button>` : html`<button type="button" class="btn btn-soft" data-perm="${k}" data-act="allow">Permitir</button>`}
        ${st === "denied" ? html`<button type="button" class="btn btn-text" data-perm="${k}" data-act="reset">Volver a preguntar</button>` : ""}</div>
    </article>`;
  }

  /* ---------- Privacidad y datos (funcionalidad 15) ---------- */
  V.privacidad = {
    title: "Mis datos y privacidad",
    bar: { title: "Mis datos y privacidad", back: true },
    nav: false,
    render: function () {
      var u = AR.session.user();
      var guardados = [
        ["Tu cuenta", "Nombre, correo y rol. Tu contraseña se guarda cifrada (con hash y sal), nunca en texto."],
        ["En este teléfono", "Favoritos, historial de contactos, servicios vistos y tu borrador. Puedes borrarlos cuando quieras."],
        ["Tus fotos", "Se comprimen y quedan en tu teléfono. Las que publicas se muestran en tu perfil."],
        ["Tu ubicación", "Solo se usa para ordenar por distancia. No se comparte con los prestadores."]
      ];
      return html`<div class="page page--narrow stack stack-l">
        <section class="card card--accent stack stack-s"><div class="row-flex">${icon("shield-check", "ic-l")}<h2 class="t-title-l">Tu información es tuya</h2></div>
          <p class="t-body-l">Aruy guarda lo mínimo y te deja decidir qué compartir. Los prestadores solo ven lo que publicas en tu perfil.</p></section>
        <ul class="facts facts--lg">${guardados.map(function (g) { return html`<li>${icon("check-circle", "ic-s")}<span><b>${g[0]}</b>${g[1]}</span></li>`; })}</ul>
        <section class="stack stack-s"><h2 class="t-title-l">Acceso por rol</h2>
          <p class="t-body-l">Tu cuenta es de <b>${u.rol === "prestador" ? "prestador" : "contratante"}</b>: ${u.rol === "prestador" ? "puedes publicar servicios y portafolio, pero no ves el catálogo de otros." : "puedes buscar, guardar y contactar, pero no publicar servicios."} Cada rol solo accede a lo que le corresponde.</p></section>
        <div class="stack stack-s">
          <button type="button" class="btn btn-outlined btn-block" id="export">${icon("download", "ic-s")}Descargar mis datos</button>
          <a class="btn btn-text btn-block" href="#/permisos">Revisar permisos</a>
          <a class="btn btn-danger-text btn-block" href="#/eliminar">Eliminar mi cuenta y mis datos</a></div>
      </div>`;
    },
    mount: function (root) {
      root.querySelector("#export").addEventListener("click", function () {
        var u = AR.session.user(), data = { exportado: new Date().toISOString(), cuenta: { nombre: u.nombre, correo: u.correo, rol: u.rol, ubicacion: u.ubicacion, verificado: u.verificado },
          favoritos: AR.repo.listaFavoritos().map(function (x) { return x.prestador.nombre; }), contactos: AR.repo.listaHistorial().map(function (x) { return { prestador: x.prestador.nombre, cuando: new Date(x.h.ts).toISOString() }; }) };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "mis-datos-aruy.json"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); AR.snack.show("Descargamos tus datos en un archivo.");
      });
    }
  };

  /* ---------- Bloqueados (funcionalidad 16) ---------- */
  V.bloqueados = {
    title: "Personas bloqueadas",
    bar: { title: "Personas bloqueadas", back: true },
    nav: false,
    render: function () { return html`<div class="page page--narrow stack" id="bl"></div>`; },
    mount: function (root) {
      var host = root.querySelector("#bl");
      function paint() {
        var list = AR.repo.listaBloqueados();
        host.innerHTML = String(list.length ? html`<p class="t-body-l muted measure">No ves sus servicios ni su perfil. Puedes desbloquearlas cuando quieras.</p><div class="list-card">${list.map(function (b) {
          return html`<div class="row-link">${UI.avatar({ nombre: b.nombre })}<span class="grow"><b>${b.nombre}</b><span class="sub" style="display:block">Bloqueada ${U.rel(b.ts)}</span></span><button type="button" class="btn btn-outlined" data-unblock="${b.prestadorId}" aria-label="Desbloquear a ${b.nombre}">Desbloquear</button></div>`;
        })}</div>` : UI.empty({ art: "nudo", title: "No has bloqueado a nadie", text: "Si alguien te incomoda, puedes bloquearlo desde su perfil." }));
      }
      paint();
      host.addEventListener("click", function (e) {
        var b = e.target.closest("[data-unblock]"); if (!b) return;
        var id = b.getAttribute("data-unblock"), row = AR.db.bloqueados.get(AR.session.id() + ":" + id);
        AR.repo.bloquear({ id: id, nombre: row ? row.nombre : "" }, false).then(function () { paint(); AR.snack.show("Desbloqueaste a " + (row ? row.nombre : "esta persona") + "."); }).catch(function (er) { AR.snack.show(er.message); });
      });
    }
  };

  /* ---------- Mis reportes (funcionalidad 17) ---------- */
  var ESTADOS = { recibido: ["Recibido", "pill--info"], en_revision: ["En revisión", "pill--warn"], resuelto: ["Resuelto", "pill--ok"] };
  V.reportes = {
    title: "Mis reportes",
    bar: { title: "Mis reportes", back: true },
    nav: false,
    render: function () { return html`<div class="page page--narrow stack" id="rp"></div>`; },
    mount: function (root) {
      var host = root.querySelector("#rp");
      function paint(st) {
        UI.paint(host, st, {
          idle: function () { return ""; },
          loading: function () { return UI.loading("Cargando tus reportes…", html`<div class="skel" style="height:96px;border-radius:16px"></div>`); },
          success: function (s) {
            return s.data.length ? html`<p class="t-body-l muted measure">El equipo de Aruy revisa cada reporte. Aquí ves en qué estado está.</p><div class="stack">${s.data.map(function (r) {
              var e = ESTADOS[r.estado] || ESTADOS.recibido;
              return html`<article class="card stack stack-s"><div class="row-flex" style="justify-content:space-between;align-items:flex-start"><b class="t-title-m">${r.objetivo}</b><span class="pill ${e[1].replace("pill ", "")}">${e[0]}</span></div>
                <p class="t-body-m muted">Motivo: ${r.motivo}. ${U.rel(r.creadoEn)}.</p>${r.detalle ? html`<p class="t-body-m">«${r.detalle}»</p>` : ""}
                ${r.resolucion ? html`<p class="card card--ok t-body-m">${r.resolucion}</p>` : ""}</article>`;
            })}</div>` : UI.empty({ art: "nudo", title: "No has hecho reportes", text: "Si ves algo que no cumple las normas, puedes reportarlo desde el perfil o el servicio.", action: { label: "Ver las normas", href: "#/normas" } });
          },
          error: function (s) { return UI.errorState(s); }
        });
      }
      AR.repo.cargarReportes(paint);
      host.addEventListener("click", function (e) { if (e.target.closest("[data-retry]")) AR.repo.cargarReportes(paint); });
    }
  };

  /* ---------- Normas de la comunidad ---------- */
  V.normas = {
    title: "Normas de la comunidad",
    bar: { title: "Normas de la comunidad", back: true },
    nav: false,
    render: function () {
      var normas = [
        ["Usa fotos propias", "Solo publica fotos de trabajos que hiciste tú. Las fotos de otras personas se retiran."],
        ["Di la verdad", "Tu experiencia, precios y disponibilidad deben ser reales."],
        ["Trato respetuoso", "No se permiten insultos, acoso ni contenido ofensivo."],
        ["Sin pagos por adelantado sospechosos", "Desconfía de quien pide dinero antes de conocerte. Reporta si pasa."],
        ["Opiniones honestas", "Solo puedes calificar a quien contactaste. Las opiniones falsas se eliminan."]
      ];
      return html`<div class="page page--narrow stack stack-l">
        <p class="t-body-l muted measure">Estas normas nos ayudan a que Aruy sea un lugar seguro para quien contrata y para quien trabaja.</p>
        <ul class="facts facts--lg">${normas.map(function (n) { return html`<li>${icon("check-circle", "ic-s")}<span><b>${n[0]}</b>${n[1]}</span></li>`; })}</ul>
        <section class="card stack stack-s"><h2 class="t-title-l">Cómo revisamos los reportes</h2>
          <ol class="steps"><li><b>Recibido.</b> Guardamos tu reporte al instante.</li><li><b>En revisión.</b> El equipo mira las fotos y la información.</li><li><b>Resuelto.</b> Retiramos el contenido o cerramos el caso, y te avisamos.</li></ol>
          <p class="t-body-m muted">Mientras se revisa, el contenido puede seguir visible con la marca «En revisión».</p></section>
        <a class="btn btn-outlined btn-block" href="#/reportes">Ver mis reportes</a></div>`;
    }
  };

  /* ---------- Eliminar cuenta (funcionalidad 19) ---------- */
  V.eliminar = {
    title: "Eliminar cuenta",
    bar: { title: "Eliminar cuenta", back: true },
    nav: false,
    render: function () {
      var u = AR.session.user();
      return html`<div class="page page--narrow stack stack-l">
        <section class="card card--err stack stack-s"><div class="row-flex">${icon("alert", "ic-l")}<h1 class="t-title-l">Esto no se puede deshacer</h1></div>
          <p class="t-body-l">Se eliminarán tu cuenta y tus datos personales${u.rol === "prestador" ? ", tus servicios, tu portafolio y tu perfil público" : ", tus favoritos y tu historial de contactos"}.</p></section>
        <ul class="facts"><li>${icon("check-circle", "ic-s")}<span><b>Se borra</b>Cuenta, foto de perfil, favoritos, historial, borradores y fotos de este teléfono.</span></li>
          <li>${icon("info", "ic-s")}<span><b>Puede quedar</b>Reportes que hiciste, sin tu nombre, para proteger a la comunidad.</span></li></ul>
        <form class="stack" id="del-form" novalidate>
          ${UI.field({ id: "confirmar", label: "Para confirmar, escribe ELIMINAR", autocomplete: "off", placeholder: "ELIMINAR", spellcheck: false })}
          <button type="submit" class="btn btn-danger btn-lg btn-block" id="del-btn">Eliminar mi cuenta</button>
          <a class="btn btn-text btn-block" href="#/perfil">Mejor no</a></form></div>`;
    },
    mount: function (root) {
      var form = root.querySelector("#del-form");
      form.confirmar.addEventListener("input", function () { UI.setError(root, "confirmar", ""); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (form.confirmar.value.trim().toUpperCase() !== "ELIMINAR") { UI.setError(root, "confirmar", "Escribe la palabra ELIMINAR para continuar."); return form.confirmar.focus(); }
        var b = root.querySelector("#del-btn"); b.disabled = true; b.textContent = "Eliminando…";
        AR.session.deleteAccount().then(function () { AR.router.go("#/bienvenida", { replace: true }); AR.snack.show("Eliminamos tu cuenta y tus datos."); })
          .catch(function (er) { b.disabled = false; b.textContent = "Eliminar mi cuenta"; AR.snack.show(er.message || "No pudimos eliminar tu cuenta."); });
      });
    }
  };
})();
