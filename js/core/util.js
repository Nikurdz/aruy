/** Aruy · Utilidades: plantillas con escape automático, formato, texto y geografía. */
(function () {
  /* ---------- Plantillas seguras ----------
     html`...` escapa todo lo que se interpola, salvo texto ya marcado como seguro (otro html`` o raw()). */
  function Safe(s) { this.s = s; }
  Safe.prototype.toString = function () { return this.s; };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function raw(s) { return new Safe(String(s)); }
  function part(v) {
    if (v == null) return "";
    if (v === true) return "true";     // aria-checked="${cond}" necesita el texto true/false; para omitir algo se usa cond ? x : ""
    if (v === false) return "false";
    if (v instanceof Safe) return v.s;
    if (Array.isArray(v)) return v.map(part).join("");
    return esc(v);
  }
  function html(strings) {
    var out = strings[0];
    for (var i = 1; i < arguments.length; i++) out += part(arguments[i]) + strings[i];
    return new Safe(out);
  }

  /* ---------- Números y textos ---------- */
  var money0 = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  var money2 = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var rtf = typeof Intl.RelativeTimeFormat === "function" ? new Intl.RelativeTimeFormat("es", { numeric: "auto" }) : null;
  var oneDec = new Intl.NumberFormat("es-EC", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function money(n) {
    if (n == null) return "";
    return (Math.round(n) === n ? money0 : money2).format(n).replace(/ /g, " ");
  }

  function dist(km) {
    if (km == null) return "";
    if (km < 1) return "a " + Math.max(100, Math.round(km * 10) * 100) + " m";
    return "a " + oneDec.format(km) + " km";
  }

  function rel(ts) {
    var diff = (ts - Date.now()) / 1000, a = Math.abs(diff);
    if (!rtf) return new Date(ts).toLocaleDateString("es-EC");
    if (a < 60) return "hace un momento";
    if (a < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (a < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    if (a < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
    if (a < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month");
    return rtf.format(Math.round(diff / (86400 * 365)), "year");
  }

  function dec1(n) { return oneDec.format(n); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function initials(name) {
    var p = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function firstName(name) { return String(name || "").trim().split(/\s+/)[0] || ""; }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- Pseudoaleatorio determinista (datos de ejemplo estables) ---------- */
  function hash(s) {
    s = String(s); var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = hash(seed) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }

  /* ---------- Geografía ---------- */
  function haversine(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  /* ---------- Misceláneos ---------- */
  function uid(p) { return (p || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(root, type, sel, fn) {
    root.addEventListener(type, function (e) {
      var t = e.target.closest ? e.target.closest(sel) : null;
      if (t && root.contains(t)) fn(e, t);
    });
  }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) { /* sin vibración */ } }
  function reducedMotion() {
    return document.documentElement.getAttribute("data-motion") === "reduce" ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ---------- Validaciones (mensajes en español sencillo, dicen qué falló y cómo arreglarlo) ---------- */
  var validate = {
    nombre: function (raw) {
      var v = String(raw || "").replace(/\s+/g, " ").trim();
      if (!v) return { ok: false, error: "Escribe tu nombre completo." };
      if (v.length < 5 || v.split(" ").length < 2) return { ok: false, error: "Escribe tu nombre y tu apellido. Ejemplo: Lucía Cevallos." };
      if (v.length > 60) return { ok: false, error: "El nombre es muy largo. Usa máximo 60 letras." };
      return { ok: true, value: v };
    },
    correo: function (raw) {
      var v = String(raw || "").trim();
      if (!v) return { ok: false, error: "Escribe tu correo." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { ok: false, error: "Este correo no parece válido. Ejemplo: nombre@correo.com." };
      return { ok: true, value: v };
    },
    /** Celular ecuatoriano: 09XXXXXXXX o +5939XXXXXXXX. Opcional. */
    telefono: function (raw, required) {
      var v = String(raw || "").replace(/[\s\-().]/g, "");
      if (!v) return required ? { ok: false, error: "Escribe tu número de celular." } : { ok: true, value: "" };
      if (/^09\d{8}$/.test(v) || /^\+5939\d{8}$/.test(v)) return { ok: true, value: v };
      return { ok: false, error: "Este número no es válido. Escríbelo así: 0998765432 o +593998765432." };
    },
    password: function (raw) {
      var v = String(raw || "");
      if (!v) return { ok: false, error: "Crea una contraseña.", score: 0 };
      var score = 0;
      if (v.length >= 8) score++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) score++;
      if (v.length < 8) return { ok: false, error: "Usa al menos 8 caracteres.", score: Math.min(score, 1) };
      if (!/\d/.test(v) || !/[A-Za-z]/.test(v)) return { ok: false, error: "Combina letras y números.", score: Math.min(score, 2) };
      return { ok: true, value: v, score: score };
    }
  };

  AR.html = html;
  AR.raw = raw;
  AR.esc = esc;
  /** Convierte HTML seguro, o una lista de ellos, en texto (String(lista) pondría comas entre los elementos). */
  AR.render = part;
  AR.validate = validate;
  AR.u = {
    esc: esc, raw: raw, html: html, money: money, dist: dist, rel: rel, dec1: dec1, plural: plural, norm: norm,
    initials: initials, firstName: firstName, cap: cap, hash: hash, rng: rng, pick: pick, haversine: haversine,
    uid: uid, wait: wait, debounce: debounce, clamp: clamp, $: $, $$: $$, on: on, vibrate: vibrate, reducedMotion: reducedMotion
  };
})();
