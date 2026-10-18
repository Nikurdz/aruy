/* Aruy · Genera las figuras del documento (Pantallas 1 a 5) desde el prototipo real.
   Uso:  node tools/capturar-figuras.mjs        → docs/figuras/figura-N-*.png
   Teléfono de referencia: Pixel 8 (412 × 915 dp, escala 2). Cada figura combina varias capturas con su rótulo. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { start, newPage, open, go, settled } from "../tests/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "figuras");
const RAW = path.join(ROOT, "tests", "_out", "figuras");
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(RAW, { recursive: true });

const env = await start();
const W = 412, H = 915, DPR = 2;

async function shoot(name, { dark = false, login = null, hash = "#/login", steps }) {
  const page = await newPage(env.browser, { w: W, h: H, dpr: DPR, dark, motion: false });
  await open(page, env.base, { login, hash });
  if (steps) await steps(page);
  await page.waitForTimeout(450);
  const file = path.join(RAW, name + ".png");
  await page.screenshot({ path: file });
  await page.ctx.close();
  return file;
}

/* Une capturas en una sola figura: marco de teléfono + rótulo bajo cada una */
async function compose(file, items, { title } = {}) {
  const page = await env.browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const uri = (p) => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
  const phone = (it) => `<figure><div class="phone ${it.dark ? "d" : ""}"><img src="${uri(it.file)}"></div><figcaption>${it.label}</figcaption></figure>`;
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    *{box-sizing:border-box} body{margin:0;background:#fff;font-family:"Segoe UI",system-ui,sans-serif;color:#14173A;display:inline-block}
    .row{display:flex;gap:44px;padding:36px 48px 28px;align-items:flex-start;background:linear-gradient(180deg,#F1F0F9,#fff)}
    figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:16px}
    .phone{width:300px;border-radius:34px;padding:8px;background:#14173A;box-shadow:0 18px 40px rgb(20 23 58 /.28)}
    .phone img{display:block;width:100%;border-radius:27px}
    figcaption{font-size:15px;font-weight:600;color:#3d4060;text-align:center;max-width:300px;line-height:1.3}
  </style><div class="row">${items.map(phone).join("")}</div>`);
  await page.waitForTimeout(300);
  await page.locator(".row").screenshot({ path: file });
  await page.close();
}

console.log("Capturando…");

/* Figura 1 · Bienvenida e inicio de sesión */
const f1a = await shoot("f1-bienvenida", { hash: "#/bienvenida" });
const f1b = await shoot("f1-login", { hash: "#/login" });
const f1c = await shoot("f1-oscuro", { hash: "#/bienvenida", dark: true });
await compose(path.join(OUT, "figura-1-login.png"), [
  { file: f1a, label: "Bienvenida: crear cuenta o iniciar sesión" }, { file: f1b, label: "Iniciar sesión: cuentas de ejemplo" }, { file: f1c, label: "Bienvenida en modo oscuro", dark: true }]);

/* Figura 2 · Home con los tres estados de ServicioUiState */
const f2a = await shoot("f2-loading", { login: "contratante", hash: "#/buscar", steps: async (p) => {
  await settled(p); await p.evaluate(() => { AR.repo.resetCache(); AR.net.setMode("slow"); }); await go(p, "#/inicio"); await p.waitForTimeout(500);
} });
const f2b = await shoot("f2-success", { login: "contratante", hash: "#/inicio", steps: async (p) => { await settled(p); } });
const f2c = await shoot("f2-error", { login: "contratante", hash: "#/buscar", steps: async (p) => {
  await settled(p); await p.evaluate(() => { AR.repo.resetCache(); AR.net.setMode("error"); }); await go(p, "#/inicio"); await p.waitForSelector("[data-retry]", { timeout: 9000 });
} });
await compose(path.join(OUT, "figura-2-home-estados.png"), [
  { file: f2a, label: "Loading: se está consultando la API" }, { file: f2b, label: "Success: servicios desde Room" }, { file: f2c, label: "Error: sin servicios en caché" }]);
const f2d = await shoot("f2-oscuro", { login: "contratante", hash: "#/inicio", dark: true, steps: async (p) => { await settled(p); } });
await compose(path.join(OUT, "figura-2-home-claro-oscuro.png"), [{ file: f2b, label: "Modo claro" }, { file: f2d, label: "Modo oscuro", dark: true }]);

/* Figura 3 · Detalle del servicio */
const d3 = async (p) => { await settled(p); };
const f3a = await shoot("f3-claro", { login: "contratante", hash: "#/servicio/s_p20_1", steps: d3 });
const f3b = await shoot("f3-oscuro", { login: "contratante", hash: "#/servicio/s_p20_1", dark: true, steps: d3 });
await compose(path.join(OUT, "figura-3-detalle.png"), [{ file: f3a, label: "Modo claro" }, { file: f3b, label: "Modo oscuro", dark: true }]);

/* Figura 4 · Publicar servicio con IA: análisis en el teléfono y formulario completado */
const f4a = await shoot("f4-ia", { login: "prestador", hash: "#/servicios/nuevo", steps: async (p) => {
  await p.click("#ed-add"); await p.click("[data-sample=m1]"); await p.waitForSelector("[data-use]", { timeout: 8000 }); await p.waitForTimeout(300);
} });
const f4b = await shoot("f4-form", { login: "prestador", hash: "#/servicios/nuevo", steps: async (p) => {
  await p.click("#ed-add"); await p.click("[data-sample=m1]"); await p.waitForSelector("[data-use]", { timeout: 8000 }); await p.click("[data-use]"); await p.waitForTimeout(300);
  await p.fill("#titulo", "Cambio de tablero y breakers"); await p.fill("#descripcion", "Cambio de tablero eléctrico y breakers con prueba de carga y rotulado de circuitos."); await p.fill("#precio", "35");
  await p.waitForTimeout(700);
} });
await compose(path.join(OUT, "figura-4-publicar-ia.png"), [
  { file: f4a, label: "Etiquetas sugeridas por la IA en el dispositivo" }, { file: f4b, label: "Formulario con categoría sugerida y borrador guardado" }]);

/* Figura 5 · Perfil */
const f5a = await shoot("f5-claro", { login: "prestador", hash: "#/perfil", steps: async (p) => { await p.waitForSelector("#pf-av"); } });
const f5b = await shoot("f5-oscuro", { login: "prestador", hash: "#/perfil", dark: true, steps: async (p) => { await p.waitForSelector("#pf-av"); } });
await compose(path.join(OUT, "figura-5-perfil.png"), [{ file: f5a, label: "Modo claro" }, { file: f5b, label: "Modo oscuro", dark: true }]);

console.log("Listo:", fs.readdirSync(OUT).join(", "));
await env.close();
