/** Aruy · API REST simulada (equivale a Retrofit + Neon).
 *
 *  Es la única parte que «habla con el servidor». El servidor es una segunda base local con otro prefijo, así los datos
 *  creados por la persona (cuentas, servicios, opiniones, reportes) sobreviven a recargar, como si estuvieran en la nube.
 *  Cada llamada tarda como una red real y puede fallar: sin conexión, error del servidor o conexión lenta (net.js). */
AR.api = (function () {
  var srv = AR.db.create("aruy.srv.");
  var T = {
    usuarios: srv.table("usuarios"), prestadores: srv.table("prestadores"), servicios: srv.table("servicios"),
    resenas: srv.table("resenas"), recomendaciones: srv.table("recomendaciones"), reportes: srv.table("reportes"), bloqueos: srv.table("bloqueos")
  };

  function ApiError(code, mensaje) { this.code = code; this.message = mensaje; this.name = "ApiError"; }
  ApiError.prototype = Object.create(Error.prototype);

  var clone = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };

  function seedIfNeeded() {
    if (srv.kv.get("seeded")) return;
    T.prestadores.putAll(clone(AR.seed.prestadores));
    T.servicios.putAll(clone(AR.seed.servicios));
    T.usuarios.putAll(clone(AR.seed.usuarios));
    var res = [];
    AR.seed.prestadores.forEach(function (p) { res = res.concat(AR.seed.resenas(p)); });
    T.resenas.putAll(res);
    /* Reportes de ejemplo de la cuenta de la persona que contrata */
    T.reportes.putAll([
      { id: "rp_1", usuarioId: "u_demo_contratante", tipo: "resena", objetivo: "Opinión sin relación con el servicio", motivo: "Contenido inapropiado", detalle: "", creadoEn: Date.now() - 6 * 86400000, estado: "resuelto", resolucion: "Retiramos la opinión porque incumplía las normas." },
      { id: "rp_2", usuarioId: "u_demo_contratante", tipo: "prestador", objetivo: "Perfil con fotos de otra persona", motivo: "Las fotos no son suyas", detalle: "Parecen sacadas de internet.", creadoEn: Date.now() - 3600000, estado: "en_revision" }
    ]);
    srv.kv.set("seeded", 1);
  }
  seedIfNeeded();

  /** Simula la red: latencia, lentitud, sin conexión y error del servidor. */
  function call(fn, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      var L = AR.config.LATENCY, d = opts.fast ? 180 : L.min + Math.random() * (L.max - L.min);
      if (AR.net.mode === "slow") d += 2600;
      setTimeout(function () {
        if (!AR.net.online()) return reject(new ApiError("SIN_CONEXION", "No tienes conexión a internet."));
        if (AR.net.mode === "error") return reject(new ApiError("SERVIDOR", "No pudimos conectar con el servidor. Inténtalo de nuevo en un momento."));
        try { resolve(clone(fn())); } catch (e) { reject(e instanceof ApiError ? e : new ApiError("SERVIDOR", e.message || "Ocurrió un problema.")); }
      }, d);
    });
  }

  /* ---------- Contraseñas: nunca se guardan en claro (hash con sal) ---------- */
  function sha(pw, salt) {
    var data = new TextEncoder().encode(salt + ":" + pw);
    if (window.crypto && window.crypto.subtle) {
      return window.crypto.subtle.digest("SHA-256", data).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      });
    }
    return Promise.resolve("w" + AR.u.hash(salt + pw).toString(16)); // respaldo si el contexto no es seguro
  }

  function publicUser(u) { var c = clone(u); delete c.hash; delete c.salt; return c; }
  function token() { return AR.u.uid("tk"); }
  function findByMail(correo) { var c = AR.u.norm(correo).trim(); return T.usuarios.all().filter(function (u) { return u.correo.toLowerCase() === c; })[0] || null; }

  function estadoReporte(r) {
    if (r.estado === "resuelto" || r.estado === "en_revision") return r;
    var age = Date.now() - r.creadoEn;
    var x = clone(r);
    if (age > 4 * 60000) { x.estado = "resuelto"; x.resolucion = "Revisamos el caso y tomamos las medidas necesarias. Gracias por avisar."; }
    else if (age > 15000) x.estado = "en_revision";
    return x;
  }

  function recalc(prestadorId) {
    var p = T.prestadores.get(prestadorId); if (!p) return;
    var rs = T.resenas.where(function (r) { return r.prestadorId === prestadorId; });
    if (rs.length) {
      var base = p.nResenasBase != null ? p.nResenasBase : (p.nResenasBase = p.nResenas);
      var extra = rs.filter(function (r) { return r.nueva; });
      if (extra.length) {
        var sum = p.rating * base + extra.reduce(function (a, r) { return a + r.rating; }, 0);
        p.rating = Math.round((sum / (base + extra.length)) * 10) / 10;
        p.nResenas = base + extra.length;
      }
    }
    p.nRecomendaciones = Math.max(0, (p.nRecomendacionesBase != null ? p.nRecomendacionesBase : (p.nRecomendacionesBase = p.nRecomendaciones)) +
      T.recomendaciones.where(function (r) { return r.prestadorId === prestadorId; }).length);
    T.prestadores.put(p);
  }

  return {
    ApiError: ApiError,

    /* ===== Cuenta (funcionalidades 1, 2, 14, 19) ===== */
    registrar: function (d) {
      return sha(d.password, d.correo).then(function (hash) {
        return call(function () {
          if (findByMail(d.correo)) throw new ApiError("CORREO_EN_USO", "Ya existe una cuenta con este correo. Prueba iniciar sesión.");
          var id = AR.u.uid("u");
          var user = { id: id, nombre: d.nombre, correo: d.correo.trim(), telefono: d.telefono || null, rol: d.rol, fotoPerfil: null, ubicacion: d.zona || "norte", barrio: d.barrio || null,
            verificado: false, creadoEn: Date.now(), hash: hash, salt: d.correo };
          if (d.rol === "prestador") {
            var b = AR.catalog.barrio(d.barrio) || AR.catalog.barrio("carolina");
            user.prestadorId = "pp_" + id;
            T.prestadores.put({ id: user.prestadorId, usuarioId: id, nombre: d.nombre, oficio: AR.catalog.cat(d.categoria || "otros").nombre, categoria: d.categoria || "otros",
              zona: b.zona, barrio: d.barrio || "carolina", lat: b.lat, lng: b.lng, modalidad: ["domicilio"], anios: 0, rating: null, trabajos: 0, nResenas: 0, nRecomendaciones: 0,
              verificado: false, disponible: true, bio: "", servicios: [], portafolio: [], estado: "activo" });
          }
          T.usuarios.put(user);
          return { user: publicUser(user), token: token() };
        });
      });
    },

    login: function (d) {
      return call(function () {
        var u = findByMail(d.correo);
        if (!u) throw new ApiError("CREDENCIALES", "El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.");
        return u;
      }).then(function (u) {
        if (u.demo && d.password === AR.config.DEMO_PASSWORD) return { user: publicUser(T.usuarios.get(u.id)), token: token() };
        if (u.demo) throw new ApiError("CREDENCIALES", "El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.");
        return sha(d.password, u.salt).then(function (hash) {
          if (hash !== u.hash) throw new ApiError("CREDENCIALES", "El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.");
          return { user: publicUser(u), token: token() };
        });
      });
    },

    verificar: function (userId, codigo) {
      return call(function () {
        if (String(codigo) !== AR.config.TEST_CODE) throw new ApiError("CODIGO", "Ese código no es el correcto. Revísalo o pide uno nuevo.");
        var u = T.usuarios.get(userId); if (!u) throw new ApiError("NO_EXISTE", "No encontramos tu cuenta.");
        u.verificado = true; T.usuarios.put(u);
        if (u.prestadorId) { var p = T.prestadores.get(u.prestadorId); if (p) { p.verificado = true; T.prestadores.put(p); } }
        return publicUser(u);
      });
    },
    reenviarCodigo: function () { return call(function () { return { ok: true }; }, { fast: true }); },

    /** Misma respuesta exista o no el correo (no revela qué cuentas existen). */
    recuperar: function (correo) { return call(function () { return { ok: true, existe: !!findByMail(correo) }; }); },
    restablecer: function (d) {
      return sha(d.password, d.correo).then(function (hash) {
        return call(function () {
          if (String(d.codigo) !== AR.config.TEST_CODE) throw new ApiError("CODIGO", "Ese código no es el correcto. Revísalo o pide uno nuevo.");
          var u = findByMail(d.correo); if (!u) throw new ApiError("CODIGO", "Ese código no es el correcto. Revísalo o pide uno nuevo.");
          if (u.demo) return { ok: true };
          u.hash = hash; u.salt = d.correo; T.usuarios.put(u); return { ok: true };
        });
      });
    },

    actualizarPerfil: function (userId, patch) {
      return call(function () {
        var u = T.usuarios.get(userId); if (!u) throw new ApiError("NO_EXISTE", "No encontramos tu cuenta.");
        Object.keys(patch).forEach(function (k) { u[k] = patch[k]; });
        T.usuarios.put(u);
        if (u.prestadorId) {
          var p = T.prestadores.get(u.prestadorId);
          if (p) {
            if (patch.nombre) p.nombre = patch.nombre;
            if (patch.bio != null) p.bio = patch.bio;
            if (patch.barrio) { var b = AR.catalog.barrio(patch.barrio); p.barrio = patch.barrio; p.zona = b.zona; p.lat = b.lat; p.lng = b.lng; u.ubicacion = b.zona; T.usuarios.put(u); }
            if (patch.fotoPerfil !== undefined) p.fotoPerfil = patch.fotoPerfil;
            if (patch.modalidad) p.modalidad = patch.modalidad;
            if (patch.anios != null) p.anios = patch.anios;
            if (patch.categoria) { p.categoria = patch.categoria; p.oficio = AR.catalog.cat(patch.categoria).nombre; }
            T.prestadores.put(p);
          }
        }
        return publicUser(u);
      });
    },

    eliminarCuenta: function (userId) {
      return call(function () {
        var u = T.usuarios.get(userId); if (!u) return { ok: true };
        if (u.prestadorId && !u.demo) {
          T.servicios.where(function (s) { return s.prestadorId === u.prestadorId; }).forEach(function (s) { T.servicios.remove(s.id); });
          T.prestadores.remove(u.prestadorId);
        }
        if (!u.demo) T.usuarios.remove(userId);
        T.reportes.where(function (r) { return r.usuarioId === userId; }).forEach(function (r) { T.reportes.remove(r.id); });
        T.bloqueos.where(function (r) { return r.usuarioId === userId; }).forEach(function (r) { T.bloqueos.remove(r.id); });
        return { ok: true };
      });
    },

    /* ===== Catálogo (funcionalidades 6, 7) ===== */
    catalogo: function () {
      return call(function () {
        return {
          prestadores: T.prestadores.all().filter(function (p) { return p.estado !== "suspendido"; }),
          servicios: T.servicios.all().filter(function (s) { return s.estado !== "borrador"; })
        };
      });
    },
    prestador: function (id) {
      return call(function () {
        var p = T.prestadores.get(id); if (!p) throw new ApiError("NO_EXISTE", "Este perfil ya no está disponible.");
        return { prestador: p, servicios: T.servicios.where(function (s) { return s.prestadorId === id && s.estado !== "borrador"; }) };
      });
    },
    resenas: function (prestadorId) {
      return call(function () {
        return T.resenas.where(function (r) { return r.prestadorId === prestadorId; }).sort(function (a, b) { return b.fecha - a.fecha; });
      }, { fast: true });
    },

    /* ===== Opiniones, recomendaciones, reportes y bloqueos (funcionalidades 9, 10, 16, 17) ===== */
    crearResena: function (d) {
      return call(function () {
        var r = { id: AR.u.uid("r"), prestadorId: d.prestadorId, usuarioId: d.usuarioId, autor: d.autor, rating: d.rating, comentario: d.comentario, recomienda: !!d.recomienda, fecha: Date.now(), nueva: true };
        T.resenas.put(r); recalc(d.prestadorId);
        return { resena: r, prestador: T.prestadores.get(d.prestadorId) };
      });
    },
    recomendar: function (d) {
      return call(function () {
        var key = d.usuarioId + ":" + d.prestadorId;
        if (d.valor) T.recomendaciones.put({ id: key, usuarioId: d.usuarioId, prestadorId: d.prestadorId }); else T.recomendaciones.remove(key);
        recalc(d.prestadorId);
        return { prestador: T.prestadores.get(d.prestadorId), valor: !!d.valor };
      }, { fast: true });
    },
    recomendaciones: function (usuarioId) { return call(function () { return T.recomendaciones.where(function (r) { return r.usuarioId === usuarioId; }); }, { fast: true }); },
    reportar: function (d) {
      return call(function () {
        var r = { id: AR.u.uid("rp"), usuarioId: d.usuarioId, tipo: d.tipo, objetivoId: d.objetivoId, objetivo: d.objetivo, motivo: d.motivo, detalle: d.detalle || "", creadoEn: Date.now(), estado: "recibido" };
        T.reportes.put(r); return r;
      });
    },
    misReportes: function (usuarioId) {
      return call(function () { return T.reportes.where(function (r) { return r.usuarioId === usuarioId; }).map(estadoReporte).sort(function (a, b) { return b.creadoEn - a.creadoEn; }); }, { fast: true });
    },
    bloquear: function (d) {
      return call(function () {
        var key = d.usuarioId + ":" + d.prestadorId;
        if (d.valor) T.bloqueos.put({ id: key, usuarioId: d.usuarioId, prestadorId: d.prestadorId, nombre: d.nombre, creadoEn: Date.now() }); else T.bloqueos.remove(key);
        return { valor: !!d.valor };
      }, { fast: true });
    },
    bloqueos: function (usuarioId) { return call(function () { return T.bloqueos.where(function (r) { return r.usuarioId === usuarioId; }); }, { fast: true }); },

    /* ===== Servicios del prestador (funcionalidades 4, 5, 13) ===== */
    guardarServicio: function (s) {
      return call(function () {
        var row = clone(s); if (!row.id) { row.id = AR.u.uid("s"); row.creadoEn = Date.now(); }
        var old = T.servicios.get(row.id);
        if (old && old.estado === "en_revision" && row.estado === "publicado") row.estado = "en_revision";
        T.servicios.put(row);
        var p = T.prestadores.get(row.prestadorId);
        if (p && row.estado !== "borrador") {
          if (p.servicios.indexOf(row.titulo) < 0) p.servicios = p.servicios.concat([row.titulo]);
          T.prestadores.put(p);
        }
        return row;
      });
    },
    eliminarServicio: function (id) { return call(function () { T.servicios.remove(id); return { ok: true }; }, { fast: true }); },
    restaurarServicio: function (s) { return call(function () { T.servicios.put(clone(s)); return s; }, { fast: true }); },
    guardarPortafolio: function (prestadorId, fotos) {
      return call(function () { var p = T.prestadores.get(prestadorId); if (!p) throw new ApiError("NO_EXISTE", "No encontramos tu perfil."); p.portafolio = fotos; T.prestadores.put(p); return p; }, { fast: true });
    },
    setDisponible: function (prestadorId, valor) {
      return call(function () {
        var p = T.prestadores.get(prestadorId); if (!p) throw new ApiError("NO_EXISTE", "No encontramos tu perfil.");
        p.disponible = !!valor; T.prestadores.put(p);
        T.servicios.where(function (s) { return s.prestadorId === prestadorId; }).forEach(function (s) { s.disponible = !!valor; T.servicios.put(s); });
        return p;
      }, { fast: true });
    },

    /** Métricas del panel del prestador (de ejemplo, estables por prestador). */
    metricas: function (prestadorId) {
      return call(function () {
        var r = AR.u.rng("met" + prestadorId), p = T.prestadores.get(prestadorId) || {};
        var extra = srv.kv.get("met." + prestadorId, { vistas: 0, contactos: 0 });
        return { vistas: 18 + Math.round(r() * 60) + extra.vistas, contactos: 3 + Math.round(r() * 14) + extra.contactos, guardados: 2 + Math.round(r() * 9), rating: p.rating, resenas: p.nResenas || 0, recomendaciones: p.nRecomendaciones || 0 };
      }, { fast: true });
    },

    /** Para la demostración: vuelve la «nube» al estado inicial. */
    _reset: function () { srv.wipe(); seedIfNeeded(); }
  };
})();
