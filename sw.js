/* Aruy · Service worker mínimo: deja la app disponible sin conexión.
   Estrategia: red primero para los archivos de la app (siempre ves la última versión si hay internet) y caché como respaldo;
   las tipografías de Google se guardan la primera vez. Sube VERSION cuando cambie la lista de archivos. */
const VERSION = "aruy-v1";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "assets/icon.svg",
  "css/tokens.css", "css/base.css", "css/shell.css", "css/components.css", "css/screens.css",
  "js/core/ns.js", "js/core/config.js", "js/core/util.js", "js/core/icons.js", "js/core/art.js", "js/model/uistate.js",
  "js/data/catalog.js", "js/data/seed.js", "js/store/db.js", "js/store/photos.js", "js/core/net.js", "js/store/session.js",
  "js/store/api.js", "js/store/repo.js", "js/ml/labeler.js", "js/core/theme.js", "js/core/a11y.js", "js/core/snackbar.js",
  "js/core/sheet.js", "js/core/perms.js", "js/core/motion.js", "js/core/components.js", "js/core/flows.js", "js/core/shell.js",
  "js/core/gestures.js", "js/views/auth.js", "js/views/home.js", "js/views/buscar.js", "js/views/detalle.js",
  "js/views/guardados.js", "js/views/prestador.js", "js/views/editor.js", "js/views/perfil.js", "js/views/ajustes.js",
  "js/views/sistema.js", "js/core/router.js", "js/core/demo.js", "js/app.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;

  if (fonts) {
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match("index.html"))));
});
