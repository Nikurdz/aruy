/** Aruy · Base de datos local (equivale a Room).
 *
 *  `AR.db` es la base del dispositivo: la interfaz lee siempre de aquí (fuente única de verdad) y la API solo la actualiza.
 *  Cada «tabla» es un mapa id → fila guardado en localStorage; un DAO mínimo (all, get, put, remove, where…).
 *  La misma fábrica crea la base del «servidor» simulado (ver api.js) con otro prefijo. */
(function () {
  function safeStorage() {
    var mem = {};
    try {
      window.localStorage.setItem("__aruy", "1"); window.localStorage.removeItem("__aruy");
      return {
        persistent: true,
        get: function (k) { return window.localStorage.getItem(k); },
        set: function (k, v) { window.localStorage.setItem(k, v); },
        del: function (k) { window.localStorage.removeItem(k); },
        keys: function () { return Object.keys(window.localStorage); }
      };
    } catch (e) {
      return {
        persistent: false,
        get: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        set: function (k, v) { mem[k] = String(v); },
        del: function (k) { delete mem[k]; },
        keys: function () { return Object.keys(mem); }
      };
    }
  }
  var st = safeStorage();

  function create(prefix) {
    var cache = {}, subs = {};

    function load(t) {
      if (!cache[t]) { try { cache[t] = JSON.parse(st.get(prefix + t) || "{}") || {}; } catch (e) { cache[t] = {}; } }
      return cache[t];
    }
    function save(t) {
      try { st.set(prefix + t, JSON.stringify(cache[t])); } catch (e) { /* sin cuota: se conserva en memoria */ }
      (subs[t] || []).slice().forEach(function (fn) { try { fn(); } catch (e) { /* un observador no rompe a los demás */ } });
    }

    function table(t) {
      return {
        name: t,
        all: function () { return Object.keys(load(t)).map(function (k) { return load(t)[k]; }); },
        get: function (id) { return load(t)[id] || null; },
        put: function (row) { load(t)[row.id] = row; save(t); return row; },
        putAll: function (rows) { var m = load(t); rows.forEach(function (r) { m[r.id] = r; }); save(t); },
        replaceAll: function (rows) { var m = {}; rows.forEach(function (r) { m[r.id] = r; }); cache[t] = m; save(t); },
        remove: function (id) { delete load(t)[id]; save(t); },
        clear: function () { cache[t] = {}; save(t); },
        count: function () { return Object.keys(load(t)).length; },
        where: function (fn) { return this.all().filter(fn); },
        on: function (fn) {
          (subs[t] = subs[t] || []).push(fn);
          return function () { subs[t] = subs[t].filter(function (f) { return f !== fn; }); };
        }
      };
    }

    var tables = {};
    var kv = {
      get: function (k, def) {
        var raw = st.get(prefix + "kv." + k);
        if (raw == null) return def;
        try { return JSON.parse(raw); } catch (e) { return def; }
      },
      set: function (k, v) { try { st.set(prefix + "kv." + k, JSON.stringify(v)); } catch (e) { /* sin cuota */ } },
      del: function (k) { st.del(prefix + "kv." + k); }
    };

    return {
      prefix: prefix,
      table: function (t) { return tables[t] || (tables[t] = table(t)); },
      kv: kv,
      wipe: function () {
        st.keys().filter(function (k) { return k.indexOf(prefix) === 0; }).forEach(function (k) { st.del(k); });
        cache = {};
        Object.keys(tables).forEach(function (t) { (subs[t] || []).forEach(function (fn) { try { fn(); } catch (e) { /* sin acción */ } }); });
      }
    };
  }

  var db = create(AR.config.PREFIX);
  db.create = create;
  db.persistent = st.persistent;

  /* Tablas de la base local (secciones 7.1 del documento) */
  db.servicios = db.table("servicios");            // servicios consultados recientemente (catálogo en caché)
  db.prestadores = db.table("prestadores");        // perfiles de prestadores consultados
  db.resenas = db.table("resenas");                // opiniones en caché
  db.favoritos = db.table("favoritos");            // favoritos del contratante (funcionalidad 11)
  db.historial = db.table("historial");            // historial de contactos (funcionalidad 12)
  db.recientes = db.table("recientes");            // servicios vistos recientemente
  db.borradores = db.table("borradores");          // borrador de servicio en edición
  db.etiquetas = db.table("etiquetas");            // etiquetas sugeridas por la IA de cada foto
  db.bloqueados = db.table("bloqueados");          // personas bloqueadas (funcionalidad 16)
  db.misReportes = db.table("misReportes");        // reportes enviados (funcionalidad 17)
  db.usuario = db.table("usuario");                // usuario de la sesión actual

  AR.db = db;
})();
