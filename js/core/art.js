/** Aruy · Ilustraciones de reemplazo.
   Las fotos de los prestadores de ejemplo son composiciones geométricas de tejido (aguayo) generadas en el navegador:
   no hay fotografías de terceros ni imágenes de IA. Sirven de respaldo cuando un servicio no tiene foto real (assets/trabajos). */
(function () {
  var SCHEMES = [
    { bg: "#2B3990", b1: "#1F2A75", b2: "#B0235B", acc: "#F2B52E", glyph: "#FFFFFF" },
    { bg: "#B0235B", b1: "#8E1B49", b2: "#14173A", acc: "#F2B52E", glyph: "#FFFFFF" },
    { bg: "#14173A", b1: "#2B3990", b2: "#0B7A5C", acc: "#F2B52E", glyph: "#FFFFFF" },
    { bg: "#0B7A5C", b1: "#09614A", b2: "#14173A", acc: "#F7F6FC", glyph: "#FFFFFF" },
    { bg: "#F2B52E", b1: "#D99A12", b2: "#2B3990", acc: "#B0235B", glyph: "#14173A" },
    { bg: "#E6E5F5", b1: "#C6C9EE", b2: "#2B3990", acc: "#B0235B", glyph: "#2B3990" }
  ];
  var DIAMOND = "M4 1h1v1H4zM3 2h3v1H3zM2 3h5v1H2zM1 4h7v1H1zM2 5h5v1H2zM3 6h3v1H3zM4 7h1v1H4z";
  var CORE = "M4 3h1v1H4zM3 4h3v1H3zM4 5h1v1H4z";
  var cache = {};

  function make(cat, seed, w, h) {
    var r = AR.u.rng(cat + "|" + seed), s = SCHEMES[Math.floor(r() * SCHEMES.length)];
    var glyph = AR.icons.paths["c-" + cat] || AR.icons.paths["c-otros"];
    var unit = Math.round(h / 8.3);
    var y1 = Math.round(h * (0.12 + r() * 0.12)), y2 = Math.round(h * (0.62 + r() * 0.16));
    var gx = r() > 0.5 ? w * 0.56 : w * 0.06, gy = h * 0.22, gs = h / 24 * 0.62;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice">' +
      '<defs><pattern id="d" width="' + unit + '" height="' + unit + '" patternUnits="userSpaceOnUse"><g transform="scale(' + (unit / 9) + ')"><path d="' + DIAMOND + '" fill="' + s.acc + '"/><path d="' + CORE + '" fill="' + s.b2 + '"/></g></pattern></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="' + s.bg + '"/>' +
      '<rect y="' + y1 + '" width="' + w + '" height="' + unit + '" fill="url(#d)"/>' +
      '<rect y="' + (y1 + unit) + '" width="' + w + '" height="' + Math.round(unit * 0.35) + '" fill="' + s.b1 + '"/>' +
      '<rect y="' + y2 + '" width="' + w + '" height="' + Math.round(unit * 0.9) + '" fill="' + s.b1 + '"/>' +
      '<rect y="' + (y2 + unit * 0.9) + '" width="' + w + '" height="' + unit + '" fill="url(#d)"/>' +
      '<g transform="translate(' + gx.toFixed(1) + ' ' + gy.toFixed(1) + ') scale(' + gs.toFixed(2) + ')" fill="none" stroke="' + s.glyph + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".92">' + glyph + '</g>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /** URL de la ilustración de ejemplo para una categoría y una semilla (estable entre cargas). */
  function photo(cat, seed, w, h) {
    w = w || 400; h = h || 300;
    var k = cat + "|" + seed + "|" + w + "x" + h;
    return cache[k] || (cache[k] = make(cat, seed, w, h));
  }

  AR.art = { photo: photo, schemes: SCHEMES };
})();
