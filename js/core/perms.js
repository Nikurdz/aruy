/** Aruy · Permisos de ubicación, cámara y galería (funcionalidad 18).
 *
 *  Cada permiso se pide solo cuando hace falta y siempre con una explicación previa («rationale»), como recomienda el documento.
 *  En el navegador, la cámara y la galería no necesitan permiso de la app (las gestiona el selector del sistema); aun así se explica
 *  qué se hará y se respeta la elección de la persona. La ubicación sí usa la API real de geolocalización. */
AR.perms = (function () {
  var ITEMS = {
    ubicacion: {
      nombre: "Ubicación", icono: "pin", titulo: "¿Permitir tu ubicación?",
      motivo: "La usamos para mostrarte primero a quienes están cerca de ti.",
      puntos: ["Solo se usa cuando buscas o abres el catálogo.", "No se comparte con los prestadores.", "Puedes quitar el permiso cuando quieras."],
      si: "Permitir ubicación", alt: "Elegir mi zona",
      sinPermiso: "Sin ubicación te mostramos los servicios de la zona que elegiste."
    },
    camara: {
      nombre: "Cámara", icono: "camera", titulo: "¿Permitir la cámara?",
      motivo: "Para tomar fotos de tus trabajos y de tu perfil.",
      puntos: ["Solo se abre cuando tocas «Tomar foto».", "La foto se analiza en tu teléfono y no sale de él hasta que publiques.", "Puedes quitar el permiso cuando quieras."],
      si: "Permitir cámara", alt: "Elegir de la galería",
      sinPermiso: "Sin la cámara puedes elegir fotos de tu galería."
    },
    galeria: {
      nombre: "Galería", icono: "image", titulo: "¿Elegir fotos de tu galería?",
      motivo: "Para subir fotos de trabajos que ya tienes.",
      puntos: ["Tú eliges cada foto; Aruy no ve el resto de tu galería.", "La foto se comprime y se analiza en tu teléfono.", "Puedes quitar el permiso cuando quieras."],
      si: "Elegir fotos", alt: "Ahora no",
      sinPermiso: "Sin la galería puedes tomar fotos con la cámara."
    }
  };

  function state(k) { return AR.db.kv.get("perm." + k, "ask"); }
  function set(k, v) { AR.db.kv.set("perm." + k, v); }

  function getPosition() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) return resolve({ ok: false, code: 2 });
      var done = false;
      var to = setTimeout(function () { if (!done) { done = true; resolve({ ok: false, code: 3 }); } }, 7000);
      navigator.geolocation.getCurrentPosition(function (p) {
        if (done) return; done = true; clearTimeout(to); resolve({ ok: true, lat: p.coords.latitude, lng: p.coords.longitude });
      }, function (e) { if (done) return; done = true; clearTimeout(to); resolve({ ok: false, code: e.code }); }, { enableHighAccuracy: false, timeout: 6500, maximumAge: 600000 });
    });
  }

  function rationale(k) {
    var it = ITEMS[k];
    return new Promise(function (resolve) {
      var answered = false;
      var el = AR.sheet.show(AR.html`
        <div class="stack" style="--gap:16px;padding-top:4px">
          <span class="perm-ic">${AR.icon(it.icono, "ic-l")}</span>
          <div><h2 class="t-headline">${it.titulo}</h2><p class="muted" style="margin-top:6px">${it.motivo}</p></div>
          <ul class="perm-points">${it.puntos.map(function (t) { return AR.html`<li>${AR.icon("check", "ic-s")}<span>${t}</span></li>`; })}</ul>
          <div class="sheet-actions" style="margin-top:4px">
            <button type="button" class="btn btn-filled btn-lg" data-ans="yes">${it.si}</button>
            <button type="button" class="btn btn-text" data-ans="no">Ahora no</button>
          </div>
        </div>`, { label: it.titulo, onClose: function () { if (!answered) { answered = true; resolve(false); } } });
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-ans]"); if (!b || answered) return;
        answered = true; var yes = b.getAttribute("data-ans") === "yes";
        AR.sheet.close(); resolve(yes);
      });
    });
  }

  /** Pide el permiso si hace falta. Resuelve true si se puede continuar. */
  function request(k) {
    var cur = state(k);
    if (cur === "granted") return Promise.resolve(true);
    if (cur === "denied") {
      AR.snack.show(ITEMS[k].sinPermiso, { action: "Cambiar", onAction: function () { location.hash = "#/permisos"; } });
      return Promise.resolve(false);
    }
    return rationale(k).then(function (yes) {
      if (!yes) { set(k, "denied"); AR.snack.show(ITEMS[k].sinPermiso); return false; }
      if (k !== "ubicacion") { set(k, "granted"); return true; }
      return getPosition().then(function (r) {
        if (r.ok) { AR.db.kv.set("pos", { lat: r.lat, lng: r.lng, ts: Date.now(), fuente: "gps" }); set(k, "granted"); return true; }
        if (r.code === 1) { set(k, "denied"); AR.snack.show(ITEMS[k].sinPermiso); return false; }
        set(k, "granted"); AR.db.kv.del("pos");
        AR.snack.show("No pudimos obtener tu ubicación exacta. Usamos tu zona por ahora.");
        return true;
      });
    });
  }

  return {
    items: ITEMS, state: state, set: set, request: request,
    reset: function (k) { set(k, "ask"); if (k === "ubicacion") AR.db.kv.del("pos"); },
    revoke: function (k) { set(k, "denied"); if (k === "ubicacion") AR.db.kv.del("pos"); }
  };
})();
