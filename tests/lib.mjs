/* Aruy · Utilidades compartidas por las pruebas: servidor estático, navegador y atajos para entrar con una cuenta de ejemplo.
   Usa playwright-core con el Chrome o Edge instalado (PW_CHANNEL=msedge para cambiar; CHROMIUM_PATH apunta a otro binario). */
import { chromium } from "playwright-core";
import { createServer } from "../tools/serve.mjs";

export async function start(opts = {}) {
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const launch = process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : { channel: process.env.PW_CHANNEL || "chrome" };
  const browser = await chromium.launch({ ...launch, headless: opts.headless !== false });
  return { base, browser, close: async () => { await browser.close(); server.close(); } };
}

/** Crea una página nueva con tamaño, tema y escala de pantalla. Los avisos de consola con error se acumulan en page.errors. */
export async function newPage(browser, o = {}) {
  const ctx = await browser.newContext({
    viewport: { width: o.w || 412, height: o.h || 915 },
    deviceScaleFactor: o.dpr || 1,
    colorScheme: o.dark ? "dark" : "light",
    locale: "es-EC",
    reducedMotion: o.motion ? "no-preference" : "reduce",
    hasTouch: !!o.touch,
    isMobile: !!o.mobile,
    serviceWorkers: o.sw ? "allow" : "block",
    permissions: o.permissions || [],
    geolocation: o.geo || undefined
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|net::ERR/.test(m.text())) page.errors.push("console: " + m.text()); });
  page.ctx = ctx;
  return page;
}

/** Abre la app. `login`: "contratante" | "prestador" | null. Espera a que la ruta termine de pintarse. */
export async function open(page, base, { hash = "", login = null, query = "", expect = "" } = {}) {
  await page.goto(base + "?" + query + "#/login");
  await page.waitForFunction(() => window.AR && AR.rendered);
  if (!login || login === "invitado") await page.evaluate(() => AR.session.logout());   // sin cuenta: empezar limpio aunque la pestaña ya tuviera sesión
  if (login === "invitado") {
    await page.evaluate(() => AR.session.guest());
  } else if (login) {
    await page.evaluate((r) => AR.session.demo(r), login);
    await page.evaluate(() => { AR.repo.invalidar(); });
  }
  await go(page, hash || (login === "prestador" ? "#/panel" : login ? "#/inicio" : "#/login"), expect || undefined);
}

/** Navega por hash y espera a que el router marque la vista como pintada. */
export async function go(page, hash, expect) {
  await page.evaluate((h) => { if (location.hash === h) { AR.rendered = ""; AR.router.render(); } else { AR.rendered = ""; location.hash = h; } }, hash);
  const want = (expect || hash).split("?")[0];
  await page.waitForFunction((h) => AR.rendered && AR.rendered.split("?")[0] === h, want, { timeout: 8000 });
  await page.waitForTimeout(120);
}

/** Espera a que desaparezcan los esqueletos y las barras de carga. */
export async function settled(page, timeout = 8000) {
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"], .loading, .skel-row'), null, { timeout });
  await page.waitForTimeout(150);
}

export function assert(cond, msg) { if (!cond) throw new Error(msg); }
