/** Aruy · Arranque: decide la primera pantalla y enciende el router. */
(function () {
  var h = location.hash;
  if (!h || h === "#" || h === "#/") {
    var seen = false;
    try { seen = sessionStorage.getItem("aruy.splash") === "1"; } catch (e) { /* sin sessionStorage */ }
    location.replace(AR.session.isLoggedIn() ? AR.session.home() : (seen ? AR.session.entry() : "#/splash"));
  }
  AR.router.start();

  /* Instalable y con caché de la app cuando se sirve por http(s). En file:// no se registra y todo funciona igual. */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () { /* sin service worker */ }); });
  }
})();
