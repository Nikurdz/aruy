/** Aruy · Tema (Sistema / Claro / Oscuro), tamaño de texto y reducción de movimiento. Se aplica antes de pintar para evitar parpadeos. */
AR.theme = (function () {
  var root = document.documentElement;
  var metas = {
    light: document.querySelector('meta[name="theme-color"][media*="light"]'),
    dark: document.querySelector('meta[name="theme-color"][media*="dark"]')
  };

  function pref(k, def) { return AR.db.kv.get("pref." + k, def); }

  function sync() {
    var t = pref("tema", "system"), text = pref("texto", "normal"), mo = pref("movimiento", "system");
    if (t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    if (text === "normal") root.removeAttribute("data-text"); else root.setAttribute("data-text", text);
    if (mo === "reduce") root.setAttribute("data-motion", "reduce"); else root.removeAttribute("data-motion");
    var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var c = dark ? "#101331" : "#F7F6FC";
    if (metas.light) metas.light.setAttribute("content", t === "system" ? "#F7F6FC" : c);
    if (metas.dark) metas.dark.setAttribute("content", t === "system" ? "#101331" : c);
  }

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(sync);
  }
  sync();

  return {
    get: pref,
    set: function (k, v) { AR.db.kv.set("pref." + k, v); sync(); },
    isDark: function () { return getComputedStyle(root).colorScheme === "dark" || root.getAttribute("data-theme") === "dark" || (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches); },
    sync: sync
  };
})();
