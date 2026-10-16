/* Aruy · Hoja de revisión visual: captura varias pantallas y las junta en una sola imagen (tests/_out/revisar-<grupo>.png).
   Uso:  node tools/revisar.mjs <grupo>     grupos: acceso, ajustes, varios, prestador, oscuro, ancho, texto */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { start, newPage, open, go, settled } from "../tests/lib.mjs";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../tests/_out");
fs.mkdirSync(OUT, { recursive: true });
const grupo = process.argv[2] || "acceso";

const S = (hash, extra = {}) => ({ hash, ...extra });
const GRUPOS = {
  acceso: [
    S("#/splash", { label: "splash", wait: 2200, nologin: true }), S("#/login", { label: "login" }), S("#/registro", { label: "registro 1" }),
    S("#/registro?paso=2&rol=prestador", { label: "registro 2" }), S("#/recuperar", { label: "recuperar" })],
  ajustes: [
    S("#/ajustes", { user: "contratante", label: "ajustes" }), S("#/permisos", { user: "contratante", label: "permisos" }),
    S("#/privacidad", { user: "contratante", label: "privacidad" }), S("#/normas", { user: "contratante", label: "normas" }), S("#/eliminar", { user: "contratante", label: "eliminar" })],
  varios: [
    S("#/reportes", { user: "contratante", label: "reportes" }), S("#/bloqueados", { user: "contratante", label: "bloqueados" }),
    S("#/guardados?tab=historial", { user: "contratante", label: "historial" }), S("#/prestador/p20", { user: "contratante", label: "perfil público" }),
    S("#/panel", { user: "contratante", label: "denegado", expect: "#/acceso-denegado" })],
  prestador: [
    S("#/panel", { user: "prestador", label: "panel" }), S("#/servicios", { user: "prestador", label: "servicios" }), S("#/portafolio", { user: "prestador", label: "portafolio" }),
    S("#/servicios/s_p13_1/editar", { user: "prestador", label: "editar" }), S("#/perfil/editar", { user: "prestador", label: "editar perfil" })],
  oscuro: [
    S("#/login", { dark: true, label: "login" }), S("#/inicio", { user: "contratante", dark: true, label: "inicio" }), S("#/buscar", { user: "contratante", dark: true, label: "buscar" }),
    S("#/servicio/s_p20_1", { user: "contratante", dark: true, label: "detalle" }), S("#/panel", { user: "prestador", dark: true, label: "panel" })],
  ancho: [
    S("#/inicio", { user: "contratante", w: 700, h: 900, label: "inicio 700" }), S("#/servicio/s_p20_1", { user: "contratante", w: 700, h: 900, label: "detalle 700" }),
    S("#/inicio", { user: "contratante", w: 1180, h: 800, label: "inicio 1180" }), S("#/servicio/s_p20_1", { user: "contratante", w: 1180, h: 800, label: "detalle 1180" }),
    S("#/buscar", { user: "contratante", w: 800, h: 360, label: "buscar horizontal" })],
  texto: [
    S("#/inicio", { user: "contratante", texto: "xlarge", label: "inicio 131%" }), S("#/buscar", { user: "contratante", texto: "xlarge", label: "buscar 131%" }),
    S("#/servicio/s_p20_1", { user: "contratante", texto: "xlarge", label: "detalle 131%" }), S("#/login", { texto: "xlarge", label: "login 131%" }), S("#/perfil", { user: "prestador", texto: "xlarge", label: "perfil 131%" })]
};

const env = await start();
const items = GRUPOS[grupo]; if (!items) { console.log("Grupos:", Object.keys(GRUPOS).join(", ")); process.exit(1); }
const files = [];
for (const [i, it] of items.entries()) {
  const page = await newPage(env.browser, { w: it.w || 412, h: it.h || 915, dark: it.dark, dpr: 1, motion: it.wait ? true : false });
  await open(page, env.base, { login: it.nologin ? null : it.user || null, hash: it.hash, expect: it.expect });
  if (it.texto) { await page.evaluate((t) => AR.theme.set("texto", t), it.texto); await page.waitForTimeout(200); }
  if (!it.wait) await settled(page).catch(() => {});
  await page.waitForTimeout(it.wait || 500);
  const f = path.join(OUT, `rv-${grupo}-${i}.png`); await page.screenshot({ path: f }); files.push({ f, label: it.label, w: it.w || 412, h: it.h || 915 });
  if (page.errors.length) console.log(it.label, "ERRORES:", page.errors.join(" | "));
  await page.ctx.close();
}
const sheet = await env.browser.newPage({ viewport: { width: 1000, height: 600 } });
const uri = (p) => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
await sheet.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#888;font:600 14px system-ui;color:#fff;display:inline-block}.r{display:flex;gap:12px;padding:12px;align-items:flex-start}figure{margin:0;display:flex;flex-direction:column;gap:6px}img{display:block;border:1px solid #222;background:#fff}</style>
<div class="r">${files.map((x) => `<figure><img src="${uri(x.f)}" style="width:${Math.round(x.w * 0.62)}px"><figcaption>${x.label}</figcaption></figure>`).join("")}</div>`);
await sheet.waitForTimeout(300);
await sheet.locator(".r").screenshot({ path: path.join(OUT, `revisar-${grupo}.png`) });
console.log("->", path.join(OUT, `revisar-${grupo}.png`));
await env.close();
