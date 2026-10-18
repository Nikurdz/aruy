/* Aruy · Pruebas de accesibilidad (sección 10.3 del documento).
   Contraste WCAG AA en claro y oscuro, nombre accesible en controles e imágenes (el «contentDescription» de Compose), un solo h1 por pantalla,
   foco visible con teclado y texto al 200 % sin perder contenido ni crear scroll horizontal.
   Uso: node tests/a11y.mjs */
import { start, newPage, open, go, settled } from "./lib.mjs";

const env = await start();
const ROUTES = [["#/bienvenida", null], ["#/login", null], ["#/registro", null], ["#/registro?paso=2&rol=contratante", null], ["#/inicio", "contratante"], ["#/buscar", "contratante"], ["#/buscar?vista=mapa", "contratante"],
  ["#/servicio/s_p20_1", "contratante"], ["#/prestador/p20", "contratante"], ["#/guardados", "contratante"], ["#/guardados?tab=historial", "contratante"], ["#/perfil", "contratante"],
  ["#/ajustes", "contratante"], ["#/permisos", "contratante"], ["#/privacidad", "contratante"], ["#/normas", "contratante"], ["#/reportes", "contratante"], ["#/eliminar", "contratante"],
  ["#/inicio", "invitado"], ["#/buscar", "invitado"], ["#/panel", "prestador"], ["#/servicios", "prestador"], ["#/portafolio", "prestador"], ["#/servicios/nuevo", "prestador"], ["#/perfil/editar", "prestador"]];

/* ---- Revisión dentro de la página ---- */
function inspect() {
  const issues = [], main = document.getElementById("main");
  const visible = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0 && cs.opacity !== "0"; };

  /* color con transparencia → [r,g,b,a] (acepta rgb(), rgba() y color(srgb …) que devuelve Chrome para color-mix) */
  const parse = (s) => {
    let m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = s.match(/^color\(srgb ([^)]+)\)$/);
    if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(parseFloat); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
    return null;
  };
  const over = (top, bottom) => { const a = top[3] + bottom[3] * (1 - top[3]); return a === 0 ? [0, 0, 0, 0] : [0, 1, 2].map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a).concat([a]); };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const bgOf = (el) => {
    let layers = [], n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none" && /gradient/.test(cs.backgroundImage) && !n.matches(".cta-bar, .editor-foot, .search-top, .tabs--sticky")) return null;   // degradados decorativos: no se miden
      if (n.querySelector && n.matches("img, .media") ) return null;
      const c = parse(cs.backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
      n = n.parentElement;
    }
    let base = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };

  /* 1. contraste del texto */
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode; if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el || seen.has(el) || el.closest(".sr-only, [hidden], svg, script, style, [inert], .splash, #demo-root, .demo-fab") || !visible(el)) continue;
    if (el.closest("#main") === null && el.closest("#nav, #appbar, #banner, #sheet-root, #snack-root") === null) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const fg0 = parse(cs.color); if (!fg0) continue;
    const bg = bgOf(el); if (!bg) continue;
    let fg = fg0; if (fg0[3] < 1) fg = over(fg0, bg);
    const fs = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700, large = fs >= 24 || (fs >= 18.66 && bold);
    const need = large ? 3 : 4.5, r = ratio(fg, bg);
    if (r < need - 0.01 && !el.closest("[disabled], [aria-disabled='true']")) issues.push(`contraste ${r.toFixed(2)}:1 < ${need} en «${n.textContent.trim().slice(0, 26)}» (${el.className.toString().slice(0, 30)})`);
  }

  /* 2. nombre accesible */
  const nameOf = (el) => {
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    const lb = el.getAttribute("aria-labelledby"); if (lb) return lb.split(" ").map((i) => (document.getElementById(i) || {}).textContent || "").join(" ").trim();
    if (el.id) { const l = document.querySelector('label[for="' + el.id + '"]'); if (l) return l.textContent; }
    if (el.closest("label")) return el.closest("label").textContent;
    if (el.getAttribute("title")) return el.getAttribute("title");
    return el.textContent.replace(/\s+/g, " ").trim();
  };
  document.querySelectorAll("button, a[href], [role=switch], [role=radio], [role=tab], input:not([type=hidden]), select, textarea, [role=button]").forEach((el) => {
    if (el.closest("[hidden], [inert], .demo-fab, #demo-root") || !visible(el)) return;
    if (!nameOf(el).trim()) issues.push("sin nombre accesible: <" + el.tagName.toLowerCase() + " class=\"" + el.className + "\">");
  });
  document.querySelectorAll("img").forEach((el) => { if (!el.hasAttribute("alt")) issues.push("imagen sin alt: " + (el.getAttribute("src") || "").slice(0, 40)); });
  document.querySelectorAll("svg:not([aria-hidden])").forEach((el) => { if (!el.closest("[aria-label], [role=img]") && !el.querySelector("title") && el.closest("#app")) issues.push("svg sin texto alternativo ni aria-hidden"); });

  /* 3. estructura */
  const h1s = [...main.querySelectorAll("h1")].filter((h) => !h.closest("[hidden]"));
  if (h1s.length !== 1) issues.push("debe haber un h1 y hay " + h1s.length);
  if (document.documentElement.lang !== "es-EC") issues.push("html lang debe ser es-EC");
  if (!document.querySelector("main")) issues.push("falta <main>");
  const ids = {}; document.querySelectorAll("[id]").forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; });
  Object.keys(ids).filter((k) => ids[k] > 1).forEach((k) => issues.push("id repetido: " + k));
  return issues;
}

let total = 0, bad = 0; const report = [];
for (const dark of [false, true]) {
  const page = await newPage(env.browser, { w: 412, h: 915, dark });
  let user = "?";
  for (const [hash, u] of ROUTES) {
    total++;
    try {
      if (u !== user) { await open(page, env.base, { login: u, hash }); user = u; } else { await go(page, hash); }
      await settled(page).catch(() => {});
      await page.waitForTimeout(250);
      const issues = await page.evaluate(inspect);
      if (issues.length) { bad++; report.push(`${dark ? "oscuro" : "claro "} ${hash}\n      - ${[...new Set(issues)].slice(0, 6).join("\n      - ")}`); }
    } catch (e) { bad++; report.push(`${dark ? "oscuro" : "claro "} ${hash}\n      - ERROR ${String(e.message).split("\n")[0]}`); }
  }
  await page.ctx.close(); process.stdout.write(".");
}

/* 4. foco visible con teclado: se recorren los primeros controles con Tab */
{
  const page = await newPage(env.browser, { w: 412, h: 915 });
  for (const [hash, u] of [["#/login", null], ["#/inicio", "contratante"], ["#/servicio/s_p20_1", "contratante"]]) {
    total++;
    await open(page, env.base, { login: u, hash }); await settled(page).catch(() => {});
    const misses = [];
    await page.evaluate(() => document.body.focus());
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el), outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2, ring = cs.boxShadow !== "none";
        return { ok: outline || ring, name: (el.getAttribute("aria-label") || el.textContent || el.id).trim().slice(0, 24) };
      });
      if (r && !r.ok) misses.push(r.name);
    }
    if (misses.length) { bad++; report.push(`foco ${hash}\n      - sin indicador de foco: ${misses.join(", ")}`); }
  }
  await page.ctx.close(); process.stdout.write(".");
}

/* 5. texto al 200 %: sin scroll horizontal y con los botones principales visibles */
{
  const page = await newPage(env.browser, { w: 360, h: 800 });
  await open(page, env.base, { login: "contratante", hash: "#/inicio" });
  await page.addStyleTag({ content: "html{font-size:200% !important}" });
  for (const hash of ["#/inicio", "#/buscar", "#/servicio/s_p20_1", "#/perfil", "#/ajustes"]) {
    total++;
    await go(page, hash); await settled(page).catch(() => {}); await page.waitForTimeout(250);
    const r = await page.evaluate(() => { const m = document.getElementById("main"); return { sw: m.scrollWidth, cw: m.clientWidth, nav: [...document.querySelectorAll(".nav-item")].map((n) => n.getBoundingClientRect().right <= innerWidth + 1) }; });
    if (r.sw > r.cw + 1 || r.nav.includes(false)) { bad++; report.push(`texto 200% ${hash}\n      - scroll horizontal ${r.sw}>${r.cw} o navegación fuera de pantalla`); }
  }
  await page.ctx.close(); process.stdout.write(".");
}

console.log(`\n${total} comprobaciones, ${bad} con problemas`);
if (report.length) console.log(report.join("\n"));
await env.close();
process.exit(bad ? 1 : 0);
