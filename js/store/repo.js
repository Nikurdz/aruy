/** Aruy · Repositorios (capa de datos).
 *
 *  Regla del documento (sección 7): la interfaz lee SIEMPRE de la base local y la API solo la actualiza.
 *  Cada carga emite estados `UiState` (Loading → Success | Error). Si falla la red pero hay caché local, se muestra la caché
 *  como Success con `meta.offline`; solo es Error cuando no hay nada guardado que mostrar. */
AR.repo = (function () {
  var db = AR.db, U = AR.u, S = AR.UiState;
  var lastSync = 0, SYNC_TTL = 60000;

  function uid() { return AR.session.id() || "anon"; }
  function key(id) { return uid() + ":" + id; }

  /* ---------- Lecturas desde la base local ---------- */
  function blockedIds() { var u = uid(); return db.bloqueados.where(function (b) { return b.userId === u; }).map(function (b) { return b.prestadorId; }); }

  function puntoUsuario() {
    var pos = db.kv.get("pos", null);
    if (pos && AR.perms && AR.perms.state("ubicacion") === "granted") return { lat: pos.lat, lng: pos.lng, fuente: pos.fuente || "gps" };
    var user = AR.session.user();
    var p = AR.catalog.punto(user && user.ubicacion, user && user.barrio);
    return { lat: p.lat, lng: p.lng, fuente: "zona" };
  }

  function join(s, ref) {
    var p = db.prestadores.get(s.prestadorId); if (!p) return null;
    return Object.assign({}, s, { prestador: p, dist: ref ? U.haversine(ref, p) : null });
  }

  function visibles() {
    var ref = puntoUsuario(), bl = blockedIds();
    return db.servicios.all().filter(function (s) { return s.estado !== "borrador" && bl.indexOf(s.prestadorId) < 0; })
      .map(function (s) { return join(s, ref); }).filter(Boolean);
  }

  var SORT = {
    cercania: function (a, b) { return (a.dist || 99) - (b.dist || 99); },
    rating: function (a, b) { return ((b.prestador.rating || 0) - (a.prestador.rating || 0)) || (b.prestador.nResenas - a.prestador.nResenas); },
    precio: function (a, b) { return (a.precioReferencial == null ? 1e9 : a.precioReferencial) - (b.precioReferencial == null ? 1e9 : b.precioReferencial); },
    recomendados: function (a, b) { return b.prestador.nRecomendaciones - a.prestador.nRecomendaciones; }
  };

  function haystack(s) {
    var p = s.prestador, b = AR.catalog.barrio(p.barrio);
    return U.norm([s.titulo, s.descripcion, p.nombre, p.oficio, AR.catalog.cat(s.categoria).nombre, b ? b.nombre : "", AR.catalog.zona(p.zona).largo, p.servicios.join(" ")].join(" "));
  }
  function stems(t) {
    var out = [t];
    if (t.length > 3 && /s$/.test(t)) out.push(t.slice(0, -1));
    var last = out[out.length - 1];
    if (last.length > 4 && /[aeo]$/.test(last)) out.push(last.slice(0, -1));
    return out;
  }

  /** Búsqueda y filtrado (funcionalidad 6): nombre/texto, categoría, zona, calificación, disponibilidad, verificación y precio. */
  function buscar(f) {
    f = f || {};
    var tokens = U.norm(f.q).split(/\s+/).filter(Boolean);
    var list = visibles().filter(function (s) {
      var p = s.prestador;
      if (f.cat && s.categoria !== f.cat) return false;
      if (f.zona && p.zona !== f.zona) return false;
      if (f.min && (p.rating || 0) < f.min) return false;
      if (f.ahora && !(s.disponible && p.disponible)) return false;
      if (f.verificados && !p.verificado) return false;
      if (f.maxPrecio && s.precioReferencial != null && s.precioReferencial > f.maxPrecio) return false;
      if (f.maxKm && s.dist != null && s.dist > f.maxKm) return false;
      if (tokens.length) { var h = haystack(s); return tokens.every(function (t) { return stems(t).some(function (x) { return h.indexOf(x) >= 0; }); }); }
      return true;
    });
    list.sort(SORT[f.orden] || SORT.cercania);
    return list;
  }

  /* ---------- Cargas con estados de interfaz ---------- */
  function cargarCatalogo(cb, opts) {
    opts = opts || {};
    var have = db.servicios.count() > 0, fresh = Date.now() - lastSync < SYNC_TTL;
    if (have && !opts.force) {
      cb(S.success(visibles(), { cache: true }));
      if (fresh) return;
    } else cb(S.loading({ refresh: have }));
    AR.api.catalogo().then(function (data) {
      db.prestadores.replaceAll(data.prestadores); db.servicios.replaceAll(data.servicios);
      lastSync = Date.now();
      cb(S.success(visibles(), { fresh: true }));
    }).catch(function (err) {
      if (db.servicios.count() > 0) cb(S.success(visibles(), { offline: true, error: err.message, code: err.code }));
      else cb(S.error(err.message, { code: err.code }));
    });
  }

  function cargarPrestador(id, cb) {
    var cached = db.prestadores.get(id);
    if (cached) cb(S.success({ prestador: cached, servicios: serviciosDe(id) }, { cache: true }));
    else cb(S.loading());
    AR.api.prestador(id).then(function (d) {
      db.prestadores.put(d.prestador); db.servicios.putAll(d.servicios);
      cb(S.success({ prestador: d.prestador, servicios: serviciosDe(id) }, { fresh: true }));
    }).catch(function (err) {
      if (cached) cb(S.success({ prestador: cached, servicios: serviciosDe(id) }, { offline: true, error: err.message }));
      else cb(S.error(err.message, { code: err.code }));
    });
  }

  function cargarResenas(prestadorId, cb) {
    var cached = db.resenas.where(function (r) { return r.prestadorId === prestadorId; }).sort(function (a, b) { return b.fecha - a.fecha; });
    if (cached.length) cb(S.success(cached, { cache: true })); else cb(S.loading());
    AR.api.resenas(prestadorId).then(function (rs) {
      cached.forEach(function (r) { db.resenas.remove(r.id); });
      db.resenas.putAll(rs);
      cb(S.success(rs, { fresh: true }));
    }).catch(function (err) {
      if (cached.length) cb(S.success(cached, { offline: true })); else cb(S.error(err.message, { code: err.code }));
    });
  }

  function serviciosDe(prestadorId) {
    var ref = puntoUsuario();
    return db.servicios.where(function (s) { return s.prestadorId === prestadorId && s.estado !== "borrador"; }).map(function (s) { return join(s, ref); }).filter(Boolean);
  }

  function servicio(id) { var s = db.servicios.get(id); return s ? join(s, puntoUsuario()) : null; }

  /* ---------- Favoritos (11), historial (12), vistos recientemente, bloqueos ---------- */
  function esFavorito(prestadorId) { return !!db.favoritos.get(key(prestadorId)); }
  function toggleFavorito(prestadorId) {
    var k = key(prestadorId);
    if (db.favoritos.get(k)) { db.favoritos.remove(k); return false; }
    db.favoritos.put({ id: k, userId: uid(), prestadorId: prestadorId, ts: Date.now() });
    return true;
  }
  function listaFavoritos() {
    var u = uid(), ref = puntoUsuario();
    return db.favoritos.where(function (f) { return f.userId === u; }).sort(function (a, b) { return b.ts - a.ts; }).map(function (f) {
      var p = db.prestadores.get(f.prestadorId); if (!p) return null;
      var s = serviciosDe(p.id)[0] || null;
      return { fav: f, prestador: p, servicio: s, dist: U.haversine(ref, p) };
    }).filter(Boolean);
  }

  function registrarContacto(d) {
    var e = { id: U.uid("h"), userId: uid(), prestadorId: d.prestadorId, servicioId: d.servicioId || null, mensaje: d.mensaje, ts: Date.now() };
    db.historial.put(e); return e;
  }
  function listaHistorial() {
    var u = uid();
    return db.historial.where(function (h) { return h.userId === u; }).sort(function (a, b) { return b.ts - a.ts; }).map(function (h) {
      return { h: h, prestador: db.prestadores.get(h.prestadorId), servicio: h.servicioId ? db.servicios.get(h.servicioId) : null };
    }).filter(function (x) { return x.prestador; });
  }
  function haContactado(prestadorId) { var u = uid(); return db.historial.where(function (h) { return h.userId === u && h.prestadorId === prestadorId; }).length > 0; }

  function marcarVisto(servicioId, prestadorId) {
    db.recientes.put({ id: key(servicioId), userId: uid(), servicioId: servicioId, prestadorId: prestadorId, ts: Date.now() });
    db.prestadores.get(prestadorId); // el perfil ya queda en caché al abrir el detalle (perfiles consultados)
    var u = uid(), all = db.recientes.where(function (r) { return r.userId === u; }).sort(function (a, b) { return b.ts - a.ts; });
    all.slice(12).forEach(function (r) { db.recientes.remove(r.id); });
  }
  function listaRecientes() {
    var u = uid(), ref = puntoUsuario(), bl = blockedIds();
    return db.recientes.where(function (r) { return r.userId === u; }).sort(function (a, b) { return b.ts - a.ts; })
      .map(function (r) { var s = db.servicios.get(r.servicioId); return s && bl.indexOf(s.prestadorId) < 0 ? join(s, ref) : null; }).filter(Boolean);
  }

  function esBloqueado(prestadorId) { return blockedIds().indexOf(prestadorId) >= 0; }
  function listaBloqueados() { var u = uid(); return db.bloqueados.where(function (b) { return b.userId === u; }).sort(function (a, b) { return b.ts - a.ts; }); }

  /* ---------- Borrador del editor de servicios (se conserva si el sistema cierra la app) ---------- */
  function getBorrador() { return db.borradores.get(uid()); }
  function setBorrador(d) { d.id = uid(); d.userId = uid(); d.ts = Date.now(); return db.borradores.put(d); }
  function delBorrador() { db.borradores.remove(uid()); }

  /* ---------- Acciones que pasan por la API ---------- */
  function enviarResena(d) {
    var u = AR.session.user();
    return AR.api.crearResena({ prestadorId: d.prestadorId, usuarioId: u.id, autor: U.firstName(u.nombre) + " " + (u.nombre.split(" ").pop()[0] || "") + ".", rating: d.rating, comentario: d.comentario, recomienda: d.recomienda })
      .then(function (r) { db.resenas.put(r.resena); db.prestadores.put(r.prestador); return r; });
  }
  function misRecomendaciones() { var u = uid(); return db.kv.get("recs." + u, []); }
  function esRecomendado(prestadorId) { return misRecomendaciones().indexOf(prestadorId) >= 0; }
  function toggleRecomendacion(prestadorId) {
    var cur = esRecomendado(prestadorId), next = !cur, u = uid();
    var arr = misRecomendaciones().filter(function (x) { return x !== prestadorId; }); if (next) arr.push(prestadorId);
    db.kv.set("recs." + u, arr);
    return AR.api.recomendar({ usuarioId: u, prestadorId: prestadorId, valor: next }).then(function (r) { db.prestadores.put(r.prestador); return r; })
      .catch(function (e) { db.kv.set("recs." + u, misRecomendaciones().filter(function (x) { return x !== prestadorId; }).concat(cur ? [prestadorId] : [])); throw e; });
  }
  function reportar(d) {
    return AR.api.reportar(Object.assign({ usuarioId: uid() }, d)).then(function (r) { db.misReportes.put(Object.assign({ userId: uid() }, r)); return r; });
  }
  function cargarReportes(cb) {
    var u = uid(), cached = db.misReportes.where(function (r) { return r.userId === u; });
    if (cached.length) cb(S.success(cached.sort(function (a, b) { return b.creadoEn - a.creadoEn; }), { cache: true })); else cb(S.loading());
    AR.api.misReportes(u).then(function (rs) {
      rs.forEach(function (r) { db.misReportes.put(Object.assign({ userId: u }, r)); });
      cb(S.success(rs, { fresh: true }));
    }).catch(function (err) { if (cached.length) cb(S.success(cached, { offline: true })); else cb(S.error(err.message)); });
  }
  function bloquear(prestador, valor) {
    var u = uid(), k = key(prestador.id);
    if (valor) db.bloqueados.put({ id: k, userId: u, prestadorId: prestador.id, nombre: prestador.nombre, ts: Date.now() }); else db.bloqueados.remove(k);
    return AR.api.bloquear({ usuarioId: u, prestadorId: prestador.id, nombre: prestador.nombre, valor: valor }).catch(function (e) {
      if (valor) db.bloqueados.remove(k); else db.bloqueados.put({ id: k, userId: u, prestadorId: prestador.id, nombre: prestador.nombre, ts: Date.now() });
      throw e;
    });
  }

  /* ---------- Prestador ---------- */
  function miPrestadorId() { var u = AR.session.user(); return u && u.prestadorId; }
  function miPrestador() { var id = miPrestadorId(); return id ? db.prestadores.get(id) : null; }
  function cargarMiPerfil(cb) {
    var id = miPrestadorId(); if (!id) { cb(S.error("Esta cuenta no tiene perfil de prestador.")); return; }
    cargarPrestador(id, cb);
  }
  function guardarServicio(s) {
    return AR.api.guardarServicio(s).then(function (row) { db.servicios.put(row); var p = db.prestadores.get(row.prestadorId); if (p && p.servicios.indexOf(row.titulo) < 0) { p.servicios = p.servicios.concat([row.titulo]); db.prestadores.put(p); } return row; });
  }
  function eliminarServicio(s) {
    db.servicios.remove(s.id);
    return AR.api.eliminarServicio(s.id).catch(function (e) { db.servicios.put(s); throw e; });
  }
  function restaurarServicio(s) { db.servicios.put(s); return AR.api.restaurarServicio(s); }
  function setDisponible(valor) {
    var p = miPrestador(); if (!p) return Promise.reject(new Error("Sin perfil"));
    var prev = p.disponible; p.disponible = valor; db.prestadores.put(p);
    db.servicios.where(function (s) { return s.prestadorId === p.id; }).forEach(function (s) { s.disponible = valor; db.servicios.put(s); });
    return AR.api.setDisponible(p.id, valor).catch(function (e) { p.disponible = prev; db.prestadores.put(p); throw e; });
  }
  function guardarPortafolio(fotos) {
    var p = miPrestador(); if (!p) return Promise.reject(new Error("Sin perfil"));
    var prev = p.portafolio; p.portafolio = fotos; db.prestadores.put(p);
    return AR.api.guardarPortafolio(p.id, fotos).catch(function (e) { p.portafolio = prev; db.prestadores.put(p); throw e; });
  }
  function actualizarPrestador(patch) {
    return AR.session.patch(patch).then(function (user) {
      var p = db.prestadores.get(user.prestadorId); if (p) { Object.keys(patch).forEach(function (k) { if (["nombre", "bio", "anios", "modalidad", "categoria", "fotoPerfil"].indexOf(k) >= 0) p[k] = patch[k]; }); if (patch.barrio) { var b = AR.catalog.barrio(patch.barrio); p.barrio = patch.barrio; p.zona = b.zona; p.lat = b.lat; p.lng = b.lng; } db.prestadores.put(p); }
      return user;
    });
  }

  return {
    puntoUsuario: puntoUsuario, visibles: visibles, buscar: buscar, servicio: servicio, serviciosDe: serviciosDe, SORT: SORT,
    prestador: function (id) { return db.prestadores.get(id); },
    cargarCatalogo: cargarCatalogo, cargarPrestador: cargarPrestador, cargarResenas: cargarResenas, cargarReportes: cargarReportes, cargarMiPerfil: cargarMiPerfil,
    esFavorito: esFavorito, toggleFavorito: toggleFavorito, listaFavoritos: listaFavoritos,
    registrarContacto: registrarContacto, listaHistorial: listaHistorial, haContactado: haContactado,
    marcarVisto: marcarVisto, listaRecientes: listaRecientes,
    esBloqueado: esBloqueado, listaBloqueados: listaBloqueados, bloquear: bloquear,
    getBorrador: getBorrador, setBorrador: setBorrador, delBorrador: delBorrador,
    enviarResena: enviarResena, esRecomendado: esRecomendado, toggleRecomendacion: toggleRecomendacion, reportar: reportar,
    miPrestadorId: miPrestadorId, miPrestador: miPrestador, guardarServicio: guardarServicio, eliminarServicio: eliminarServicio, restaurarServicio: restaurarServicio,
    setDisponible: setDisponible, guardarPortafolio: guardarPortafolio, actualizarPrestador: actualizarPrestador,
    invalidar: function () { lastSync = 0; },
    resetCache: function () { ["servicios", "prestadores", "resenas"].forEach(function (t) { db[t].clear(); }); lastSync = 0; }
  };
})();
