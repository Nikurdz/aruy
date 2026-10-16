/** Aruy · Conectividad.
 *  Modo real (navigator.onLine) más un modo simulado para la demostración: "slow", "error" u "offline" (?demo=1). */
AR.net = (function () {
  var KEY = "aruy.net", subs = [];
  var mode = "online";
  try { mode = sessionStorage.getItem(KEY) || "online"; } catch (e) { /* sin sessionStorage */ }

  function emit() { subs.slice().forEach(function (fn) { try { fn(api.online()); } catch (e) { /* observador */ } }); }

  var api = {
    get mode() { return mode; },
    setMode: function (m) {
      mode = m;
      try { sessionStorage.setItem(KEY, m); } catch (e) { /* sin sessionStorage */ }
      emit();
    },
    /** ¿Hay conexión? false si el sistema o la demostración dicen que no. */
    online: function () { return mode !== "offline" && navigator.onLine !== false; },
    on: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }
  };

  window.addEventListener("online", emit);
  window.addEventListener("offline", emit);
  return api;
})();
