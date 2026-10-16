/* Aruy · Captura una ruta para revisarla a ojo.
   Uso:  node tools/shot.mjs "#/inicio" nombre [--w 412] [--h 915] [--dark] [--user contratante|prestador] [--dpr 2] [--full]
   Guarda en tests/_out/<nombre>.png */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { start, newPage, open, settled } from "../tests/lib.mjs";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : args[i + 1]; };
const has = (n) => args.includes("--" + n);
const hash = args[0] || "#/login", name = args[1] || "shot";
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../tests/_out");
fs.mkdirSync(out, { recursive: true });

const env = await start();
const page = await newPage(env.browser, { w: +flag("w", 412), h: +flag("h", 915), dark: has("dark"), dpr: +flag("dpr", 1) });
await open(page, env.base, { login: flag("user", null), hash, query: flag("q", "") });
if (!has("nowait")) await settled(page).catch(() => {});
await page.waitForTimeout(+flag("wait", 400));
if (flag("click")) { await page.click(flag("click")); await page.waitForTimeout(500); }
await page.screenshot({ path: path.join(out, name + ".png"), fullPage: false });
if (has("full")) {
  const h = await page.evaluate(() => document.getElementById("main").scrollHeight + 200);
  await page.setViewportSize({ width: +flag("w", 412), height: Math.min(h, 3000) });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, name + "-full.png") });
}
console.log("errores:", page.errors.length ? page.errors.join("\n") : "ninguno", "->", path.join(out, name + ".png"));
await env.close();
