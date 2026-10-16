/** Aruy · Sesión y roles (funcionalidades 1, 2, 14, 15, 19).
 *  Guarda el usuario de la sesión en la base local y un token con vencimiento. La autorización por rol vive aquí:
 *  `canOpen(ruta)` decide si un contratante o un prestador puede entrar a una pantalla. */
AR.session = (function () {
  var TTL = 7 * 86400000, subs = [];

  function emit() { subs.slice().forEach(function (fn) { try { fn(); } catch (e) { /* observador */ } }); }

  function current() {
    var s = AR.db.kv.get("sesion", null);
    if (!s) return null;
    if (s.exp < Date.now()) { AR.db.kv.del("sesion"); return null; }
    return AR.db.usuario.get(s.userId);
  }

  function open(res) {
    AR.db.usuario.put(res.user);
    AR.db.kv.set("sesion", { userId: res.user.id, token: res.token, exp: Date.now() + TTL });
    emit();
    return res.user;
  }

  return {
    user: current,
    isLoggedIn: function () { return !!current(); },
    role: function () { var u = current(); return u ? u.rol : null; },
    id: function () { var u = current(); return u ? u.id : null; },
    on: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; },

    /** Ruta de inicio según el rol. */
    home: function () { return AR.session.role() === "prestador" ? "#/panel" : "#/inicio"; },

    login: function (correo, password) { return AR.api.login({ correo: correo, password: password }).then(open); },
    demo: function (rol) {
      var u = AR.seed.usuarios.filter(function (x) { return x.rol === rol; })[0];
      return AR.api.login({ correo: u.correo, password: AR.config.DEMO_PASSWORD }).then(open);
    },
    register: function (data) { return AR.api.registrar(data).then(open); },
    verify: function (codigo) {
      var u = current();
      return AR.api.verificar(u.id, codigo).then(function (user) { AR.db.usuario.put(user); emit(); return user; });
    },
    update: function (user) { AR.db.usuario.put(user); emit(); return user; },
    patch: function (patch) {
      var u = current();
      return AR.api.actualizarPerfil(u.id, patch).then(function (user) { AR.db.usuario.put(user); emit(); return user; });
    },
    logout: function () {
      AR.db.kv.del("sesion");
      emit();
    },
    /** Elimina la cuenta y todos los datos locales de la persona. */
    deleteAccount: function () {
      var u = current(); if (!u) return Promise.resolve();
      return AR.api.eliminarCuenta(u.id).then(function () {
        ["favoritos", "historial", "recientes", "borradores", "bloqueados", "misReportes"].forEach(function (t) {
          var tb = AR.db[t]; tb.where(function (r) { return r.userId === u.id || r.id === u.id; }).forEach(function (r) { tb.remove(r.id); });
        });
        AR.db.usuario.remove(u.id); AR.db.kv.del("sesion");
        return AR.photos.wipe().then(emit);
      });
    },

    /** Autorización por rol (control de acceso). `roles` null = cualquier persona con sesión. */
    allows: function (roles) {
      var u = current(); if (!u) return false;
      return !roles || roles.indexOf(u.rol) >= 0;
    }
  };
})();
