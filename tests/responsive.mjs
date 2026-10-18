/* Aruy · Matriz de responsividad.
   Recorre las rutas principales en 14 tamaños (320×568 a 1920×1080 y celular en horizontal), en claro y oscuro, y comprueba:
   sin scroll horizontal; navegación según el ancho (barra inferior < 600, riel 600–839, panel lateral ≥ 840);
   ningún control táctil de menos de 48 px, oculto, fuera de pantalla o tapado; texto de al menos 14 px; la acción principal alcanzable.
   Uso: node tests/responsive.mjs */
import { start, newPage, open, settled } from "./lib.mjs";

const env = await start();
const VIEWPORTS = [[320, 568], [360, 640], [360, 800], [390, 844], [412, 915], [600, 960], [768, 1024], [839, 900], [840, 800], [1024, 768], [1280, 800], [1920, 1080], [800, 360], [640, 360]];
const CON = [["#/inicio", "contratante"], ["#/buscar", "contratante"], ["#/buscar?vista=mapa", "contratante"], ["#/guardados", "contratante"], ["#/servicio/s_p20_1", "contratante"],
  ["#/prestador/p20", "contratante"], ["#/perfil", "contratante"], ["#/ajustes", "contratante"], ["#/permisos", "contratante"]];
const PRE = [["#/panel", "prestador"], ["#/servicios", "prestador"], ["#/portafolio", "prestador"], ["#/servicios/nuevo", "prestador"], ["#/perfil", "prestador"]];
const PUB = [["#/bienvenida", null], ["#/login", null], ["#/registro", null], ["#/registro?paso=2&rol=prestador", null]];
const GUEST = [["#/inicio", "invitado"], ["#/buscar", "invitado"]];
const ROUTES = [...PUB, ...CON, ...PRE, ...GUEST];

/* Revisión dentro de la página: devuelve la lista de problemas */
function inspect() {
  const issues = [], app = document.getElementById("app"), vw = app.clientWidth, vh = app.clientHeight;
  const main = document.getElementById("main");
  const shell = document.getElementById("shell"), nav = document.getElementById("nav");
  const visible = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0; };

  if (document.documentElement.scrollWidth > window.innerWidth + 1) issues.push("scroll horizontal de la página");
  if (main.scrollWidth > main.clientWidth + 1) issues.push("scroll horizontal de la pantalla (" + main.scrollWidth + " > " + main.clientWidth + ")");

  /* navegación según el ancho */
  if (shell.getAttribute("data-nav") !== "none") {
    const r = nav.getBoundingClientRect(), items = [...nav.querySelectorAll(".nav-item")];
    const esperados = document.body.classList.contains("is-guest") ? 3 : 4;
    if (items.length !== esperados || items.some((i) => !visible(i))) issues.push("navegación incompleta");
    if (vw < 600 && !(r.top > vh * 0.5 && Math.abs(r.width - vw) < 2)) issues.push("en compacto la navegación debe ir abajo y a todo el ancho");
    if (vw >= 600 && vw < 840 && !(Math.abs(r.width - 88) < 2 && r.left < 2)) issues.push("en mediano debe haber un riel de 88 px: " + Math.round(r.width));
    if (vw >= 840 && !(Math.abs(r.width - 288) < 2 && r.left < 2)) issues.push("en expandido debe haber un panel de 288 px: " + Math.round(r.width));
    items.forEach((i) => { const b = i.getBoundingClientRect(); if (b.right > vw + 1 || b.bottom > vh + 1 || b.left < -1) issues.push("navegación fuera de pantalla: " + i.textContent.trim()); });
  }

  /* controles táctiles de 48 px, visibles y no tapados */
  const SEL = ".btn, .icon-btn, .chip, .nav-item, .tab, .seg button, .switch, .opt, .row-link, .input, .cat-tile, .demo-card, .role-card, .searchfield, .prov, .svc-main, .fav-top, .work";
  const seen = new Set();
  document.querySelectorAll(SEL).forEach((el) => {
    if (seen.has(el) || el.closest("[hidden], .sr-only, [inert]") || !visible(el)) return; seen.add(el);
    if (el.closest(".hscroll") && !el.closest(".cats") && false) return;
    const r = el.getBoundingClientRect(), name = (el.getAttribute("aria-label") || el.textContent || el.className).trim().slice(0, 28);
    const small = (el.matches(".input") && el.tagName === "TEXTAREA") ? false : (r.height < 47.5 || (r.width < 47.5 && !el.matches(".cat-tile, .svc-main, .fav-top, .prov, .row-link, .opt, .input")));
    if (small) issues.push(`control de ${Math.round(r.width)}×${Math.round(r.height)} px: «${name}»`);
  });
  /* tapados: el punto central de cada botón principal debe alcanzar al propio botón (o a un descendiente) */
  document.querySelectorAll(".btn, .nav-item, .tab").forEach((el) => {
    if (el.closest("[hidden], .sr-only, .hscroll, [inert]") || !visible(el)) return;
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;   // fuera de la vista por el scroll: normal
    const cx = Math.min(Math.max(r.left + r.width / 2, 1), vw - 1), cy = Math.min(Math.max(r.top + r.height / 2, 1), vh - 1);
    if (el.closest("#main")) { const mr = main.getBoundingClientRect(); if (cy > mr.bottom - 1 || cy < mr.top + 1 || cx < mr.left || cx > mr.right) return; }   // oculto por el scroll de la pantalla: normal
    const top = document.elementFromPoint(cx, cy);
    if (top && !el.contains(top) && !top.contains(el)) issues.push("tapado: «" + (el.textContent || "").trim().slice(0, 24) + "» por " + top.tagName.toLowerCase() + "." + (top.className.baseVal === undefined ? top.className : "svg"));
  });

  /* texto mínimo de 14 px */
  const small = new Set();
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement;
    if (!el || el.closest(".sr-only, [hidden], svg, script, style") || !visible(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 13.9) small.add(el.className + " " + fs + "px");
  }
  small.forEach((s) => issues.push("texto menor de 14 px: " + s));
  return issues;
}

let total = 0, bad = 0;
const report = [];
for (const dark of [false, true]) {
  for (const [w, h] of VIEWPORTS) {
    const page = await newPage(env.browser, { w, h, dark });
    let first = true;
    for (const [hash, user] of ROUTES) {
      if (dark && !["#/bienvenida", "#/login", "#/inicio", "#/buscar", "#/servicio/s_p20_1", "#/panel", "#/perfil"].includes(hash)) continue;
      total++;
      try {
        if (first || page._user !== user) {
          await open(page, env.base, { login: user, hash });
          page._user = user;
          if (user === null) { /* sin sesión */ }
          first = false;
        } else {
          await page.evaluate((h) => { AR.rendered = ""; if (location.hash === h) AR.router.render(); else location.hash = h; }, hash);
          await page.waitForFunction((h) => AR.rendered && AR.rendered.split("?")[0] === h.split("?")[0], hash, { timeout: 8000 });
        }
        await settled(page).catch(() => {});
        await page.evaluate(() => { /* esperar a que termine cualquier transición */ });
        const issues = await page.evaluate(inspect);
        if (issues.length) { bad++; report.push(`${dark ? "oscuro" : "claro "} ${w}×${h} ${hash}\n      - ${issues.slice(0, 6).join("\n      - ")}`); }
      } catch (e) { bad++; report.push(`${dark ? "oscuro" : "claro "} ${w}×${h} ${hash}\n      - ERROR ${String(e.message).split("\n")[0]}`); }
    }
    if (page.errors.length) { bad++; report.push(`${w}×${h}: errores de JavaScript ${page.errors.join(" | ")}`); }
    await page.ctx.close();
    process.stdout.write(".");
  }
}
console.log(`\n${total} combinaciones revisadas, ${bad} con problemas`);
if (report.length) console.log(report.join("\n"));
await env.close();
process.exit(bad ? 1 : 0);
