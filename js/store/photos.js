/** Aruy · Fotos.
 *
 *  Siguiendo las recomendaciones del documento, las fotos NO van dentro de la base de datos: se comprimen y se guardan
 *  aparte (IndexedDB) y las entidades solo conservan su URI:
 *    "idb:<id>"           foto subida por la persona (cámara o galería)
 *    "foto:<cat>:<n>"      foto libre de trabajo (assets/trabajos/<cat>-<n>.jpg, ver CREDITOS.md)
 *    "art:<cat>:<semilla>" ilustración de tejido generada en el navegador (respaldo) */
AR.photos = (function () {
  var DB_NAME = "aruy-fotos", STORE = "fotos";
  var memFallback = {}, urlCache = {}, dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(STORE, { keyPath: "id" }); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      } catch (e) { reject(e); }
    }).catch(function () { return null; });
    return dbp;
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      if (!db) { var r0 = fn(null); return r0 && r0.result !== undefined ? r0.result : undefined; }
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode), s = t.objectStore(STORE), r = fn(s);
        t.oncomplete = function () { resolve(r && r.result !== undefined ? r.result : undefined); };
        t.onerror = function () { reject(t.error); };
      });
    });
  }

  function sizeLabel(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
    return AR.u.dec1(bytes / 1048576) + " MB";
  }

  /** Reduce la foto a un lado máximo y la recodifica como JPEG. Devuelve { blob, w, h, before, after }. */
  function compress(file) {
    var max = AR.config.PHOTO_MAX_SIDE, q = AR.config.PHOTO_QUALITY;
    function draw(src, sw, sh) {
      var k = Math.min(1, max / Math.max(sw, sh)), w = Math.round(sw * k), h = Math.round(sh * k);
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(src, 0, 0, w, h);
      return new Promise(function (resolve, reject) {
        c.toBlob(function (b) { b ? resolve({ blob: b, w: w, h: h, before: file.size, after: b.size, canvas: c }) : reject(new Error("No se pudo procesar la foto.")); }, "image/jpeg", q);
      });
    }
    if (window.createImageBitmap) {
      return createImageBitmap(file).then(function (bm) { return draw(bm, bm.width, bm.height); });
    }
    return new Promise(function (resolve, reject) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () { draw(img, img.naturalWidth, img.naturalHeight).then(resolve, reject); URL.revokeObjectURL(u); };
      img.onerror = function () { URL.revokeObjectURL(u); reject(new Error("Este archivo no parece una imagen.")); };
      img.src = u;
    });
  }

  function save(blob) {
    var id = AR.u.uid("f");
    return tx("readwrite", function (s) {
      if (!s) { memFallback[id] = blob; return null; }
      return s.put({ id: id, blob: blob, creadoEn: Date.now() });
    }).then(function () { return "idb:" + id; });
  }

  function getBlob(uri) {
    var id = uri.slice(4);
    return tx("readonly", function (s) { return s ? s.get(id) : { result: memFallback[id] ? { blob: memFallback[id] } : undefined }; })
      .then(function (row) { return row ? row.blob : null; });
  }

  /** URL síncrona para ilustraciones de ejemplo; las fotos subidas se resuelven con hydrate(). */
  function srcSync(uri, w, h) {
    if (!uri) return "";
    if (uri.indexOf("foto:") === 0) { var f = uri.split(":"); return "assets/trabajos/" + f[1] + "-" + f[2] + ".jpg"; }
    if (uri.indexOf("art:") === 0) { var p = uri.split(":"); return AR.art.photo(p[1], p.slice(2).join(":"), w, h); }
    if (uri.indexOf("idb:") === 0) return urlCache[uri] || "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    return uri;
  }

  function url(uri) {
    if (!uri || uri.indexOf("idb:") !== 0) return Promise.resolve(srcSync(uri));
    if (urlCache[uri]) return Promise.resolve(urlCache[uri]);
    return getBlob(uri).then(function (b) { if (!b) return ""; return (urlCache[uri] = URL.createObjectURL(b)); });
  }

  /** Completa los <img data-uri="idb:..."> de un contenedor. */
  function hydrate(root) {
    AR.u.$$("img[data-uri^='idb:']", root).forEach(function (img) {
      url(img.getAttribute("data-uri")).then(function (u) { if (u && img.isConnected) img.src = u; });
    });
  }

  function remove(uri) {
    if (!uri || uri.indexOf("idb:") !== 0) return Promise.resolve();
    delete urlCache[uri];
    var id = uri.slice(4);
    return tx("readwrite", function (s) { if (!s) { delete memFallback[id]; return null; } return s.delete(id); });
  }

  function wipe() { urlCache = {}; memFallback = {}; return tx("readwrite", function (s) { return s ? s.clear() : null; }); }

  /** Fotos de trabajos para probar sin cámara ni galería (el análisis conoce su contenido). */
  var MUESTRAS = [
    { id: "m1", cat: "electricidad", nombre: "Tablero eléctrico", uri: "foto:electricidad:1" },
    { id: "m2", cat: "plomeria", nombre: "Reparación de sifón", uri: "foto:plomeria:1" },
    { id: "m3", cat: "pintura", nombre: "Pared pintada", uri: "foto:pintura:1" },
    { id: "m4", cat: "belleza", nombre: "Manicure", uri: "foto:belleza:1" },
    { id: "m5", cat: "carpinteria", nombre: "Corte de madera", uri: "foto:carpinteria:1" },
    { id: "m6", cat: "limpieza", nombre: "Limpieza profunda", uri: "foto:limpieza:2" }
  ];

  return { compress: compress, save: save, url: url, srcSync: srcSync, hydrate: hydrate, remove: remove, wipe: wipe, sizeLabel: sizeLabel, muestras: MUESTRAS };
})();

/** <img> de una foto del catálogo o subida. alt obligatorio (equivale al contentDescription de Compose). */
AR.photoImg = function (uri, alt, cls, w, h) {
  var u = uri || "";
  return AR.html`<img class="${cls || ""}" src="${AR.photos.srcSync(u, w, h)}" ${u.indexOf("idb:") === 0 ? AR.html`data-uri="${u}"` : ""} alt="${alt || ""}" loading="lazy" decoding="async" draggable="false">`;
};
