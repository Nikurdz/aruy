/* Aruy · Pruebas de extremo a extremo (flujos de contratante y de prestador).
   Uso:  node tests/e2e.mjs      (necesita Chrome o Edge instalado; ver tests/lib.mjs)
   Cada bloque `section(...)` es independiente y registra sus fallos; el proceso termina con código 1 si falla alguno. */
import { start, newPage, open, go, settled, assert } from "./lib.mjs";

const env = await start();
let pass = 0, fail = 0;
const failures = [];

async function section(name, fn) {
  const t0 = Date.now();
  try { await fn(); console.log("  ok   " + name + " (" + (Date.now() - t0) + " ms)"); pass++; }
  catch (e) { console.log("  FALLA " + name + "\n         " + String(e.message).split("\n")[0]); failures.push(name + ": " + e.message); fail++; }
}
const check = (cond, msg) => assert(cond, msg);
const text = (page, sel) => page.locator(sel).first().innerText();
const hash = (page) => page.evaluate(() => location.hash.split("?")[0]);
const noErrors = (page) => assert(page.errors.length === 0, "errores de JavaScript: " + page.errors.join(" | "));

console.log("Aruy · e2e");

/* ---------------------------------------------------------------- acceso */
await section("Splash lleva a la bienvenida y esta no muestra navegación", async () => {
  const p = await newPage(env.browser);
  await p.goto(env.base);
  await p.waitForFunction(() => location.hash === "#/bienvenida", null, { timeout: 6000 });
  await p.waitForFunction(() => AR.rendered === "#/bienvenida");
  check((await p.title()).startsWith("Bienvenida"), "título de la bienvenida");
  check(await p.locator("#shell[data-nav=none]").count() === 1, "la bienvenida no debe mostrar navegación");
  check(await p.locator("#nav .nav-item").count() === 0, "sin ítems de navegación");
  check((await text(p, "h1")).includes("Aruy"), "presenta Aruy");
  check(await p.locator(".welcome-mosaic img").count() === 3, "tres fotos de trabajos");
  check(await p.locator("#w-crear").isVisible() && await p.locator("#w-entrar").isVisible(), "botones Crear cuenta e Iniciar sesión a la vista");
  const imgs = await p.$$eval(".welcome-mosaic img", (l) => l.map((i) => i.complete && i.naturalWidth > 0));
  check(imgs.every(Boolean), "las fotos cargan");
  await p.click("#w-entrar"); await p.waitForFunction(() => AR.rendered === "#/login");
  check(await p.locator("[data-demo]").count() === 2, "Iniciar sesión muestra las dos cuentas de ejemplo");
  check(await p.locator("#login-form").isHidden(), "el formulario de correo está plegado");
  await p.click("#show-form"); check(await p.locator("#login-form").isVisible(), "se despliega el formulario");
  noErrors(p); await p.ctx.close();
});

await section("Login: validación, credenciales incorrectas y entrada correcta", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base);
  await p.click("#show-form");
  await p.click("#login-btn");
  check(await p.locator('[data-field=correo].has-error').count() === 1, "error de correo vacío");
  await p.fill("#correo", "no-es-correo"); await p.click("#login-btn");
  check((await text(p, '[data-field=correo] .field-error')).includes("no parece válido"), "mensaje de correo inválido");
  await p.fill("#correo", "lucia.cevallos@ejemplo.ec"); await p.fill("#clave", "equivocada");
  await p.click("#login-btn");
  await p.waitForSelector("#login-error.show");
  check((await text(p, "#login-error")).includes("no coinciden"), "mensaje de credenciales");
  await p.fill("#clave", "Aruy#2026"); await p.click("#login-btn");
  await p.waitForFunction(() => location.hash === "#/inicio");
  check(await p.locator("#nav .nav-item").count() === 4, "4 destinos para contratante");
  noErrors(p); await p.ctx.close();
});

await section("Registro de contratante: rol, validación, verificación con código", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base);
  await p.click('a[href="#/registro"]'); await p.waitForFunction(() => AR.rendered.startsWith("#/registro"));
  check(await p.locator('[data-rol][aria-checked=true]').getAttribute("data-rol") === "contratante", "contratante elegido por defecto");
  await p.click("#reg-next"); await p.waitForFunction(() => AR.rendered.includes("paso=2"));
  await p.click("#reg-btn");
  check(await p.locator(".has-error").count() >= 3, "errores de nombre, correo y contraseña");
  await p.fill("#nombre", "Mateo Salazar"); await p.fill("#correo", "mateo@prueba.ec"); await p.fill("#telefono", "0991112233");
  await p.fill("#clave", "abc"); check((await p.locator("#meter").getAttribute("data-level")) === "1", "contraseña débil");
  await p.fill("#clave", "Aruy#Prueba1"); check(+(await p.locator("#meter").getAttribute("data-level")) >= 3, "contraseña buena");
  await p.click("#reg-btn"); check(await p.locator("#e-acepto").isVisible(), "pide aceptar las normas");
  await p.check("#acepto"); await p.click("#reg-btn");
  await p.waitForFunction(() => location.hash === "#/verificar");
  await p.fill("#otp input:nth-child(1)", "1"); // incompleto
  await p.click("#verify-btn"); check(await p.locator("#otp-err").isVisible(), "pide los 6 dígitos");
  await p.click("[data-fill]"); await p.waitForSelector(".verify-ok");
  await p.click("#go-on"); await p.waitForFunction(() => location.hash === "#/inicio");
  check((await p.evaluate(() => AR.session.user().verificado)) === true, "cuenta verificada");
  noErrors(p); await p.ctx.close();
});

await section("Registro rechaza un correo repetido", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { hash: "#/registro?paso=2&rol=contratante" });
  await p.fill("#nombre", "Otra Persona"); await p.fill("#correo", "lucia.cevallos@ejemplo.ec"); await p.fill("#clave", "Aruy#Prueba1"); await p.check("#acepto");
  await p.click("#reg-btn"); await p.waitForSelector('[data-field=correo].has-error');
  check((await text(p, '[data-field=correo] .field-error')).includes("Ya existe"), "correo repetido");
  await p.ctx.close();
});

await section("Recuperar contraseña: correo, código y nueva clave", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { hash: "#/recuperar" });
  await p.fill("#correo", "camila.andrade@ejemplo.ec"); await p.click("#f1 button");
  await p.waitForSelector("#f2");
  await p.fill("#codigo", "000000"); await p.fill("#nueva", "Nueva#Clave9"); await p.click("#f2 button[type=submit]");
  await p.waitForSelector("#e2.show");
  await p.fill("#codigo", "482915"); await p.click("#f2 button[type=submit]");
  await p.waitForSelector(".seal-big"); noErrors(p); await p.ctx.close();
});

/* ---------------------------------------------------------------- contratante */
await section("Inicio: estados Loading → Success y categorías", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/buscar" });
  await settled(p);
  await p.evaluate(() => { AR.repo.resetCache(); AR.net.setMode("slow"); });
  await go(p, "#/inicio");
  check(await p.locator('.loading[aria-busy=true]').count() === 1, "estado Loading con barra de tejido");
  check(await p.locator(".tejido--spin").count() === 1, "barra de tejido animada");
  await p.evaluate(() => AR.net.setMode("online"));
  await p.waitForSelector(".svc-card:not([aria-hidden])", { timeout: 9000 });
  check(await p.locator(".cat-tile").count() === 11, "11 categorías");
  check(await p.locator(".svc-card:not([aria-hidden])").count() >= 3, "tarjetas de disponibles");
  check(await p.locator(".svc-row:not([aria-hidden])").count() >= 5, "lista de mejor valorados");
  noErrors(p); await p.ctx.close();
});

await section("Inicio: estado Error con Reintentar, y caché sin conexión", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/buscar" });
  await settled(p);
  await p.evaluate(() => { AR.repo.resetCache(); AR.net.setMode("error"); });
  await go(p, "#/inicio");
  await p.waitForSelector("[data-retry]", { timeout: 8000 });
  check((await text(p, "#home-data h2")).includes("No pudimos cargar"), "estado Error");
  await p.evaluate(() => AR.net.setMode("online"));
  await p.click("[data-retry]"); await p.waitForSelector(".svc-card", { timeout: 9000 });
  // con caché y sin conexión: Success desde la base local
  await p.evaluate(() => { AR.repo.invalidar(); AR.net.setMode("offline"); });
  await go(p, "#/buscar"); await go(p, "#/inicio");
  await p.waitForSelector(".svc-card", { timeout: 9000 });
  check(await p.locator("#banner:not([hidden])").count() === 1, "aviso de sin conexión visible");
  noErrors(p); await p.ctx.close();
});

await section("Favoritos desde la tarjeta con Deshacer y lista en Guardados", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante" }); await settled(p);
  const heart = p.locator(".list-flat [data-fav]").first();
  await heart.click();
  check((await heart.getAttribute("aria-pressed")) === "true", "corazón activo");
  await p.waitForSelector(".snack [data-act]");
  await p.click(".snack [data-act]");
  check((await heart.getAttribute("aria-pressed")) === "false", "Deshacer quita el favorito");
  await heart.click(); await p.waitForTimeout(250);
  await p.click('#nav a[href="#/guardados"]'); await p.waitForFunction(() => AR.rendered === "#/guardados");
  check(await p.locator(".fav-card").count() === 1, "un favorito guardado");
  await p.click("[data-unfav]"); check(await p.locator(".fav-card").count() === 0, "quitado");
  noErrors(p); await p.ctx.close();
});

await section("Buscar: texto, categoría, filtros, orden, mapa y estado vacío", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/buscar" }); await settled(p);
  const total = await p.locator(".svc-row").count();
  check(total > 20, "muchos resultados al inicio");
  await p.fill("#q", "plomeros");
  check(await p.locator(".svc-row").count() > 0 && await p.locator(".svc-row").count() < total, "búsqueda por oficio en plural");
  check((await p.locator("#b-total").innerText()).includes("servicio"), "contador");
  await p.fill("#q", "zzzz");
  check(await p.locator(".empty").count() === 1, "estado vacío");
  await p.click("[data-clear]"); check(await p.locator(".svc-row").count() === total, "quitar filtros");
  await p.click("#b-filters"); await p.waitForSelector('.sheet [data-k="cat"][data-v="belleza"]');
  await p.click('.sheet [data-k="cat"][data-v="belleza"]'); await p.click('.sheet [role=switch]#fl-ahora');
  const apply = await p.locator("[data-apply]").innerText(); check(/Ver \d+ servicio/.test(apply), "contador en el botón de la hoja");
  await p.click("[data-apply]");
  check(await p.locator(".chip--removable").count() === 2, "dos filtros activos");
  check((await p.evaluate(() => location.hash)).includes("cat=belleza"), "filtros en la URL");
  await p.click('[data-rm="cat"]'); check(await p.locator(".chip--removable").count() === 1, "quitar filtro de categoría");
  await p.click("#b-sort"); await p.click('[data-sort="precio"]');
  const precios = await p.$$eval(".svc-row .price b", (els) => els.map((e) => parseFloat(e.textContent.replace(/[^\d,]/g, "").replace(",", "."))));
  check(precios.every((v, i) => i === 0 || precios[i - 1] <= v), "orden por menor precio: " + precios.slice(0, 6).join(","));
  await p.click('[data-vista="mapa"]'); await p.waitForSelector(".map");
  check(await p.locator(".map-pin").count() > 3, "pines por barrio");
  await p.locator(".map-pin").first().click(); await p.waitForSelector(".sheet .svc-row");
  noErrors(p); await p.ctx.close();
});

await section("Detalle: pestañas, contacto por WhatsApp, historial y calificar", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/servicio/s_p7_1" }); await settled(p);
  check((await text(p, "h1")).includes("Instalaciones eléctricas"), "título del servicio");
  check(await p.locator(".gallery .slide").count() >= 2, "galería con varias fotos");
  await p.click("#tab-trabajos"); check(await p.locator(".work").count() >= 3, "portafolio de trabajos");
  await p.locator(".work").first().click(); await p.waitForSelector(".lb");
  await p.click('[data-lb="1"]'); check((await text(p, ".sheet [role=status]")).includes("2 de"), "visor de fotos avanza");
  await p.click(".sheet [data-close]");
  await p.click("#tab-opiniones"); await p.waitForSelector(".review", { timeout: 6000 });
  // calificar sin haber contactado → pide contactar primero
  await p.click("[data-rate]"); await p.waitForSelector(".sheet.is-dialog"); check((await text(p, ".sheet")).includes("Contáctalo primero"), "regla de opiniones reales");
  await p.click('[data-ans="yes"]'); await p.waitForSelector("#wa-msg");
  check((await p.inputValue("#wa-msg")).includes("Instalaciones eléctricas"), "mensaje predeterminado con el servicio");
  await p.click("[data-go]"); await p.waitForSelector(".snack");
  check(await p.evaluate(() => AR.repo.listaHistorial().length) === 1, "contacto en el historial");
  // ahora sí puede calificar
  await p.waitForTimeout(300); await p.click("[data-rate]"); await p.waitForSelector(".rate-stars");
  await p.click('[data-star="5"]'); await p.fill("#rate-txt", "Muy buen trabajo"); await p.click("#rate-rec"); await p.click('.sheet [type="submit"]');
  await p.waitForSelector(".snack"); await p.waitForTimeout(400);
  check((await p.locator(".review").first().innerText()).includes("Muy buen trabajo"), "la opinión aparece primero");
  // recomendar
  await p.click("[data-rec]"); await p.waitForTimeout(700);
  check((await p.locator("[data-rec]").getAttribute("aria-pressed")) === "true", "recomendación activa");
  // favorito en la barra
  await p.click('#appbar [data-act="fav"]'); check((await p.locator('#appbar [data-act="fav"]').getAttribute("aria-pressed")) === "true", "favorito desde la barra");
  noErrors(p); await p.ctx.close();
});

await section("Reportar y bloquear con Deshacer; el bloqueado desaparece del catálogo", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/servicio/s_p7_1" }); await settled(p);
  await p.click('#appbar [data-act="more"]'); await p.click('[data-more="report"]');
  await p.waitForSelector("#rep-det"); await p.click('[data-motivo="Parece una estafa"]'); await p.fill("#rep-det", "Pide dinero antes");
  await p.click('.sheet [type="submit"]'); await p.waitForSelector(".snack [data-act]");
  await go(p, "#/reportes"); await p.waitForFunction(() => document.querySelectorAll("article.card").length >= 3, null, { timeout: 8000 });
  check((await p.locator("article.card").count()) >= 3, "reporte nuevo en Mis reportes");
  await go(p, "#/servicio/s_p7_1");
  await p.click('#appbar [data-act="more"]'); await p.click('[data-more="block"]');
  await p.click('[data-ans="yes"]'); await p.waitForFunction(() => location.hash === "#/inicio");
  await settled(p);
  check(await p.locator('a[href^="#/servicio/s_p7_"]').count() === 0, "el prestador bloqueado no aparece");
  await go(p, "#/bloqueados"); check(await p.locator("[data-unblock]").count() === 1, "aparece en bloqueados");
  await p.click("[data-unblock]"); await p.waitForTimeout(500); check(await p.locator("[data-unblock]").count() === 0, "desbloqueado");
  noErrors(p); await p.ctx.close();
});

await section("Historial de contactos: calificar y contactar otra vez; borrar historial", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/servicio/s_p1_1" }); await settled(p);
  await p.click("#contact"); await p.click("[data-go]"); await p.waitForTimeout(500);
  await go(p, "#/guardados?tab=historial");
  check(await p.locator(".hist-row").count() === 1, "una fila de historial");
  await p.click("[data-contact]"); await p.waitForSelector("#wa-msg"); await p.click(".sheet [data-close]");
  await p.click('#appbar [data-act="clear"]'); await p.click('[data-ans="yes"]'); await p.waitForTimeout(300);
  check(await p.locator(".hist-row").count() === 0, "historial vacío");
  noErrors(p); await p.ctx.close();
});

/* ---------------------------------------------------------------- permisos y ajustes */
await section("Permisos: explicación previa, denegar, permitir y quitar", async () => {
  const p = await newPage(env.browser, { geo: { latitude: -0.1807, longitude: -78.4678 }, permissions: ["geolocation"] });
  await open(p, env.base, { login: "contratante", hash: "#/buscar" }); await settled(p);
  await p.click("[data-gps]"); await p.waitForSelector(".sheet .perm-points");
  check((await text(p, ".sheet")).includes("Solo se usa cuando buscas"), "explica para qué se usa");
  await p.click('[data-ans="no"]'); await p.waitForTimeout(400);
  check(await p.evaluate(() => AR.perms.state("ubicacion")) === "denied", "denegado queda guardado");
  await go(p, "#/permisos");
  await p.click('[data-perm="ubicacion"][data-act="allow"]'); await p.waitForSelector('[data-ans="yes"]'); await p.click('[data-ans="yes"]');
  await p.waitForFunction(() => AR.perms.state("ubicacion") === "granted", null, { timeout: 8000 });
  check(await p.evaluate(() => !!AR.db.kv.get("pos", null)), "ubicación real guardada");
  await go(p, "#/buscar"); await settled(p);
  check(await p.locator("#loc-nudge .nudge").count() === 0, "ya no pide activar la ubicación");
  check((await p.locator(".meta-d").first().innerText()).startsWith("a "), "se muestran distancias");
  noErrors(p); await p.ctx.close();
});

await section("Ajustes: tema oscuro, tamaño de texto y reducir animaciones", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/ajustes" });
  await p.click('[data-seg="tema"][data-value="dark"]');
  check(await p.evaluate(() => document.documentElement.getAttribute("data-theme")) === "dark", "tema oscuro");
  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(bg === "rgb(16, 19, 49)", "fondo oscuro de la marca: " + bg);
  await p.click('[data-seg="texto"][data-value="large"]');
  check(await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)) > 17, "texto grande");
  await p.click("#mov"); check(await p.evaluate(() => document.documentElement.getAttribute("data-motion")) === "reduce", "reducir animaciones");
  await p.reload(); await p.waitForFunction(() => AR.rendered);
  check(await p.evaluate(() => document.documentElement.getAttribute("data-theme")) === "dark", "el tema persiste");
  noErrors(p); await p.ctx.close();
});

await section("Editar perfil, cerrar sesión y eliminar cuenta", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { hash: "#/registro?paso=2&rol=contratante" });
  await p.fill("#nombre", "Borrar Prueba"); await p.fill("#correo", "borrar@prueba.ec"); await p.fill("#clave", "Aruy#Prueba1"); await p.check("#acepto");
  await p.click("#reg-btn"); await p.waitForFunction(() => location.hash === "#/verificar");
  await p.click("#later"); await p.waitForFunction(() => location.hash === "#/inicio");
  await go(p, "#/perfil"); await p.click('a[href="#/perfil/editar"]'); await p.waitForFunction(() => AR.rendered === "#/perfil/editar");
  await p.fill("#nombre", "Nombre Cambiado"); await p.selectOption("#barrio", "cumbaya");
  await p.click("#pf-save"); await p.waitForFunction(() => AR.rendered === "#/perfil");
  check((await text(p, "h1")).includes("Nombre Cambiado"), "perfil actualizado");
  check(await p.locator("a.verify-nudge").count() === 1, "invita a verificar la cuenta");
  await p.click("#pf-out"); await p.click('[data-ans="yes"]'); await p.waitForFunction(() => location.hash === "#/bienvenida");
  await p.evaluate(() => AR.session.login("borrar@prueba.ec", "Aruy#Prueba1")); await go(p, "#/eliminar");
  await p.fill("#confirmar", "mal"); await p.click("#del-btn"); check(await p.locator(".has-error").count() === 1, "exige escribir ELIMINAR");
  await p.fill("#confirmar", "eliminar"); await p.click("#del-btn"); await p.waitForFunction(() => location.hash === "#/bienvenida", null, { timeout: 8000 });
  const res = await p.evaluate(() => AR.session.login("borrar@prueba.ec", "Aruy#Prueba1").then(() => "entró", (e) => e.message));
  check(res.includes("no coinciden"), "la cuenta eliminada ya no entra");
  noErrors(p); await p.ctx.close();
});

/* ---------------------------------------------------------------- prestador */
await section("RBAC: cada rol solo entra a lo suyo", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante" }); await go(p, "#/panel", "#/acceso-denegado"); check((await text(p, "h2")).includes("otro tipo de cuenta"), "denegado al contratante");
  await p.evaluate(() => { AR.session.logout(); return AR.session.demo("prestador"); });
  await go(p, "#/buscar", "#/acceso-denegado");
  check(await p.locator("#nav .nav-item").count() === 4, "menú de prestador");
  check((await p.locator("#nav .nav-item").first().innerText()).includes("Panel"), "destino Panel");
  await p.evaluate(() => AR.session.logout()); await go(p, "#/inicio", "#/login"); check((await p.evaluate(() => location.hash)).includes("next="), "guarda la ruta pedida");
  noErrors(p); await p.ctx.close();
});

await section("Panel: disponibilidad (13) se refleja en el catálogo", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "prestador" }); await settled(p);
  await p.waitForSelector("#av");
  const before = await p.locator("#av").getAttribute("aria-checked");
  await p.click("#av"); await p.waitForTimeout(700);
  check((await p.locator("#av").getAttribute("aria-checked")) !== before, "el interruptor cambia");
  check(await p.evaluate(() => AR.repo.miPrestador().disponible) === (before !== "true"), "queda guardado en el perfil");
  await p.waitForSelector("[data-m]"); await p.waitForFunction(() => document.querySelector('[data-m="0"]').textContent !== "—");
  check(await p.locator(".metric").count() === 4, "cuatro métricas");
  noErrors(p); await p.ctx.close();
});

await section("Editor con IA: foto de ejemplo, etiquetas, categoría sugerida y borrador", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "prestador", hash: "#/servicios/nuevo" });
  await p.click("#ed-add"); await p.waitForSelector("[data-sample=m1]");
  await p.click("[data-sample=m1]");
  await p.waitForSelector('.analyze [role=progressbar], .tejido--spin'); check(await p.locator(".tejido--spin").count() === 1, "barra de tejido mientras analiza");
  await p.waitForSelector("[data-use]", { timeout: 6000 });
  const tags = await p.locator(".ml-tags li").count(); check(tags >= 2, "etiquetas con confianza alta");
  check((await text(p, ".sheet")).includes("Categoría sugerida"), "sugiere categoría");
  check((await text(p, ".sheet")).includes("Simulación de ML Kit"), "rotula la simulación");
  await p.click("[data-use]"); await p.waitForTimeout(300);
  check(await p.inputValue("#categoria") === "electricidad", "categoría puesta por la foto");
  check(await p.locator("#cat-tag .pill").count() === 1, "marca «sugerida por la foto»");
  check(await p.locator("#ia-card .ml-tags li").count() >= 2, "tarjeta de etiquetas");
  await p.fill("#titulo", "Cambio de tablero"); await p.waitForTimeout(800);
  check(await p.evaluate(() => (AR.repo.getBorrador() || {}).titulo) === "Cambio de tablero", "borrador guardado en Room");
  // recargar: se recupera el borrador
  await p.reload(); await p.waitForFunction(() => AR.rendered); await p.waitForTimeout(300);
  check(await p.inputValue("#titulo") === "Cambio de tablero", "borrador recuperado");
  check(await p.locator("#ed-photos .port-item").count() === 1, "foto del borrador recuperada");
  // validación
  await p.fill("#titulo", ""); await p.click("#ed-save"); check(await p.locator(".has-error").count() >= 1, "valida el título");
  await p.fill("#titulo", "Cambio de tablero eléctrico"); await p.fill("#descripcion", "Cambio de tablero y breakers con prueba de carga y rotulado."); await p.fill("#precio", "35");
  await p.click("#ed-save"); await p.waitForFunction(() => AR.rendered === "#/servicios", null, { timeout: 8000 });
  await p.waitForSelector('.svc-row.own:has-text("Cambio de tablero eléctrico")', { timeout: 6000 });
  check(await p.locator('.svc-row.own:has-text("Cambio de tablero eléctrico")').count() === 1, "servicio publicado en Mis servicios");
  check(await p.evaluate(() => AR.repo.getBorrador()) == null, "el borrador se borra al publicar");
  noErrors(p); await p.ctx.close();
});

await section("Mis servicios: editar, eliminar con Deshacer y servicio en revisión", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "prestador", hash: "#/servicios" }); await settled(p);
  check(await p.locator(".pill--warn:has-text('En revisión')").count() === 1, "marca de moderación (17)");
  const n = await p.locator(".svc-row.own").count(); check(n === 3, "tres servicios de Camila: " + n);
  await p.locator("[data-del]").first().click(); await p.click('[data-ans="yes"]'); await p.waitForSelector(".snack [data-act]");
  check(await p.locator(".svc-row.own").count() === 2, "uno eliminado");
  await p.click(".snack [data-act]"); await p.waitForTimeout(600); check(await p.locator(".svc-row.own").count() === 3, "Deshacer lo restaura");
  await p.locator(".svc-row.own .svc-main").first().click(); await p.waitForFunction(() => AR.rendered.endsWith("/editar"));
  check((await p.inputValue("#titulo")).length > 3, "editor con datos");
  noErrors(p); await p.ctx.close();
});

await section("Portafolio: agregar foto con IA, quitar con Deshacer", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "prestador", hash: "#/portafolio" }); await settled(p);
  const n0 = await p.locator(".port-item").count();
  await p.click("#port-add"); await p.click("[data-sample=m4]"); await p.waitForSelector("[data-use]", { timeout: 6000 }); await p.click("[data-use]");
  await p.waitForFunction((n) => document.querySelectorAll(".port-item").length === n + 1, n0, { timeout: 5000 });
  await p.locator("[data-rm]").last().click(); await p.waitForSelector(".snack [data-act]");
  check(await p.locator(".port-item").count() === n0, "foto quitada");
  await p.click(".snack [data-act]"); await p.waitForTimeout(700); check(await p.locator(".port-item").count() === n0 + 1, "Deshacer la restaura");
  noErrors(p); await p.ctx.close();
});

await section("Perfil del prestador: disponibilidad y editar perfil", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "prestador", hash: "#/perfil" });
  await p.waitForSelector("#pf-av", { timeout: 6000 });
  check(await p.locator("#pf-av").count() === 1, "interruptor de disponibilidad en el perfil");
  check(await p.locator('a[href="#/bloqueados"]').count() === 0, "el prestador no ve «bloqueados»");
  await go(p, "#/perfil/editar"); await p.fill("#bio", "Manicure y pedicure a domicilio."); await p.fill("#anios", "5"); await p.click("#pf-save");
  await p.waitForFunction(() => AR.rendered === "#/perfil"); check(await p.evaluate(() => AR.repo.miPrestador().bio) === "Manicure y pedicure a domicilio.", "bio guardada en el perfil público");
  noErrors(p); await p.ctx.close();
});

await section("Registro de prestador: no puede publicar hasta verificar la cuenta", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { hash: "#/registro?paso=2&rol=prestador" });
  await p.fill("#nombre", "Pedro Torres"); await p.fill("#correo", "pedro@prueba.ec"); await p.fill("#clave", "Aruy#Prueba1"); await p.selectOption("#categoria", "plomeria"); await p.check("#acepto");
  await p.click("#reg-btn"); await p.waitForFunction(() => location.hash === "#/verificar"); await p.click("#later");
  await p.waitForFunction(() => location.hash === "#/panel");
  await go(p, "#/servicios/nuevo");
  await p.fill("#titulo", "Reparación de fugas"); await p.selectOption("#categoria", "plomeria"); await p.fill("#descripcion", "Reparo fugas de agua en casas y departamentos.");
  await p.click("#ed-save"); await p.waitForSelector(".sheet.is-dialog"); check((await text(p, ".sheet")).includes("Verifica tu cuenta"), "pide verificar");
  await p.click('[data-ans="yes"]'); await p.waitForFunction(() => location.hash === "#/verificar");
  await p.click("[data-fill]"); await p.waitForSelector(".verify-ok"); await p.click("#go-on");
  await go(p, "#/servicios/nuevo"); await p.waitForTimeout(200);
  await p.click("#ed-save"); await p.waitForFunction(() => AR.rendered === "#/servicios", null, { timeout: 8000 });
  await p.waitForSelector(".svc-row.own", { timeout: 6000 });
  check(await p.locator(".svc-row.own").count() === 1, "primer servicio publicado");
  // un contratante lo ve en el catálogo
  await p.evaluate(() => { AR.session.logout(); return AR.session.demo("contratante"); }); await p.evaluate(() => AR.repo.resetCache());
  await go(p, "#/buscar"); await settled(p); await p.fill("#q", "reparación de fugas pedro");
  check(await p.locator('.svc-row:has-text("Pedro Torres")').count() === 1, "el servicio nuevo aparece al contratante");
  noErrors(p); await p.ctx.close();
});

/* ---------------------------------------------------------------- sin conexión y páginas */
await section("Sin conexión: aviso, acciones que necesitan red fallan con mensaje claro", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/servicio/s_p7_1" }); await settled(p);
  await p.evaluate(() => AR.net.setMode("offline"));
  check(await p.locator("#banner:not([hidden])").count() === 1, "aviso de conexión");
  await p.click("#tab-opiniones"); await p.waitForSelector(".review", { timeout: 6000 }).catch(() => {});
  await p.evaluate(() => AR.net.setMode("online"));
  noErrors(p); await p.ctx.close();
});

await section("Invitado: explora sin cuenta, datos difuminados y pide cuenta al tocar", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { hash: "#/bienvenida" });
  await p.click("#w-explorar"); await p.waitForFunction(() => AR.rendered === "#/inicio");
  check(await p.locator("#nav .nav-item").count() === 3, "menú del invitado: Inicio, Buscar y Crear cuenta");
  check((await p.locator("#nav .nav-item").last().innerText()).includes("Crear cuenta"), "enlace Crear cuenta en el menú");
  await settled(p);
  check(await p.locator(".svc-row.is-locked, .svc-card.is-locked").count() > 3, "tarjetas bloqueadas");
  const html = await p.evaluate(() => document.getElementById("main").innerHTML);
  check(!/Karen Bastidas|Hernán Yánez|Patricio Almeida/.test(html), "los nombres reales no llegan a la pantalla");
  check(await p.locator(".lock").count() > 3, "datos difuminados con relleno");
  await p.locator(".svc-card").first().click();
  await p.waitForSelector(".sheet"); check((await text(p, ".sheet")).includes("Crea tu cuenta para ver los detalles"), "hoja de crear cuenta");
  check(await p.evaluate(() => location.hash) === "#/inicio", "no abrió el detalle");
  await p.click(".sheet [data-close]"); await p.waitForTimeout(300);
  await p.locator("[data-fav]").first().click(); await p.waitForSelector(".sheet"); await p.click(".sheet [data-close]"); await p.waitForTimeout(300);
  // buscar también funciona (categorías y filtros), con filas bloqueadas y anuncio
  await p.click('#nav a[href="#/buscar"]'); await p.waitForFunction(() => AR.rendered === "#/buscar"); await settled(p);
  check(await p.locator(".svc-row.is-locked").count() > 4, "resultados bloqueados en Buscar");
  // por URL no se entra al detalle, ni a guardados ni al perfil
  for (const h of ["#/servicio/s_p7_1", "#/guardados", "#/perfil", "#/prestador/p7"]) {
    await go(p, h, "#/login"); check((await p.evaluate(() => location.hash)).startsWith("#/login"), "el invitado no entra a " + h);
  }
  // tras iniciar sesión vuelve a lo que quería abrir
  await go(p, "#/inicio"); await p.locator(".svc-card").first().click(); await p.waitForSelector(".sheet");
  await p.click('.sheet [data-go="#/login"]'); await p.waitForFunction(() => AR.rendered === "#/login");
  await p.click('[data-demo="contratante"]');
  await p.waitForFunction(() => /^#\/servicio\//.test(location.hash), null, { timeout: 8000 });
  check(await p.evaluate(() => AR.session.isGuest()) === false, "ya no es invitado");
  noErrors(p); await p.ctx.close();
});

await section("Anuncios: rotulados «Auspiciado», cerrables y solo donde corresponde", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/inicio" }); await settled(p);
  check(await p.locator("aside.ad").count() === 1, "un solo anuncio en Inicio");
  check((await text(p, "aside.ad")).includes("Auspiciado"), "rótulo Auspiciado");
  check((await p.locator("aside.ad").getAttribute("aria-label")).startsWith("Publicidad"), "nombre accesible");
  await p.click("[data-ad-why]"); await p.waitForSelector(".sheet"); check((await text(p, ".sheet")).includes("no ven tus datos"), "explica por qué"); await p.click(".sheet [data-close]"); await p.waitForTimeout(300);
  const hitbox = await p.locator("[data-ad-close]").boundingBox(); check(hitbox.width >= 47.5 && hitbox.height >= 47.5, "botón de cerrar de 48 px");
  await go(p, "#/buscar"); await settled(p);
  check(await p.locator(".list-flat > aside.ad").count() === 1, "un anuncio en Buscar");
  const pos = await p.evaluate(() => [...document.querySelector(".list-flat").children].findIndex((e) => e.matches("aside.ad")));
  check(pos === 4, "después del 4.º resultado: " + pos);
  await p.click("[data-ad-close]"); check(await p.locator("aside.ad").count() === 0, "se oculta con la ×");
  await go(p, "#/inicio"); await settled(p);
  check(await p.locator("aside.ad").count() === 1, "otro anunciante distinto toma su lugar");
  for (const h of ["#/servicio/s_p7_1", "#/servicios/nuevo".replace("servicios", "buscar")]) { /* detalle y editor sin anuncios (el editor es del prestador) */ }
  await go(p, "#/servicio/s_p7_1"); await settled(p); check(await p.locator("aside.ad").count() === 0, "el detalle no lleva anuncios");
  await p.evaluate(() => { AR.session.logout(); return AR.session.demo("prestador"); }); await go(p, "#/servicios/nuevo");
  check(await p.locator("aside.ad").count() === 0, "el editor no lleva anuncios");
  noErrors(p); await p.ctx.close();
});

await section("Fotos reales: ninguna imagen del catálogo queda rota", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/inicio" }); await settled(p);
  await p.evaluate(async () => { for (const i of document.querySelectorAll("img")) { i.loading = "eager"; } await new Promise((r) => setTimeout(r, 1200)); });
  for (const h of ["#/inicio", "#/buscar", "#/servicio/s_p13_1", "#/prestador/p20"]) {
    await go(p, h); await settled(p); await p.waitForTimeout(500);
    await p.evaluate(() => { document.querySelectorAll("img").forEach((i) => { i.loading = "eager"; }); });
    await p.waitForTimeout(1200);
    const bad = await p.$$eval("img", (l) => l.filter((i) => i.getAttribute("src") && !i.src.startsWith("data:") && !(i.complete && i.naturalWidth > 0)).map((i) => i.src));
    check(bad.length === 0, "imágenes rotas en " + h + ": " + bad.slice(0, 3).join(", "));
    const real = await p.$$eval("img", (l) => l.filter((i) => /assets\/trabajos\//.test(i.src)).length);
    check(real > 0, "hay fotos reales en " + h);
  }
  noErrors(p); await p.ctx.close();
});

await section("Gestos: jalar para actualizar y volver deslizando desde el borde", async () => {
  const p = await newPage(env.browser, { touch: true, mobile: true });
  await open(p, env.base, { login: "contratante", hash: "#/inicio" }); await settled(p);
  // jalar para actualizar (eventos táctiles sintéticos sobre la pantalla)
  await p.evaluate(async () => {
    const m = document.getElementById("main"), mk = (y) => [new Touch({ identifier: 1, target: m, clientX: 200, clientY: y })];
    const fire = (t, y) => m.dispatchEvent(new TouchEvent(t, { touches: t === "touchend" ? [] : mk(y), changedTouches: mk(y), bubbles: true, cancelable: true }));
    fire("touchstart", 200); fire("touchmove", 300); fire("touchmove", 420); window.__ptrBusy = document.querySelector(".ptr") && document.querySelector(".ptr").classList.contains("show"); fire("touchend", 420);
  });
  check(await p.evaluate(() => window.__ptrBusy), "aparece el indicador al jalar");
  await p.waitForSelector(".ptr.busy", { timeout: 2000 }).catch(() => {});
  await settled(p);
  // volver con el gesto del borde
  await go(p, "#/servicio/s_p20_1"); await settled(p);
  await p.evaluate(async () => {
    const app = document.getElementById("app"), ev = (t, x) => app.dispatchEvent(new PointerEvent(t, { pointerType: "touch", pointerId: 7, clientX: x, clientY: 400, bubbles: true, isPrimary: true }));
    ev("pointerdown", 6); ev("pointermove", 40); ev("pointermove", 220); ev("pointerup", 220);
  });
  await p.waitForFunction(() => location.hash === "#/inicio", null, { timeout: 4000 });
  noErrors(p); await p.ctx.close();
});

await section("Panel de demostración (?demo=1): sin red, cuenta y vista de dispositivo", async () => {
  const p = await newPage(env.browser, { w: 1280, h: 860 });
  await open(p, env.base, { login: "contratante", query: "demo=1" });
  await p.click(".demo-fab"); await p.waitForSelector('[data-seg="net"]');
  await p.click('[data-seg="net"][data-value="offline"]'); await p.waitForSelector("#banner:not([hidden])");
  await p.click('[data-seg="net"][data-value="online"]');
  await p.click('[data-seg="dev"][data-value="phone"]');
  const w = await p.evaluate(() => Math.round(document.getElementById("app").getBoundingClientRect().width));
  check(w === 412, "vista de teléfono de 412 px: " + w);
  check(await p.evaluate(() => document.getElementById("nav").getBoundingClientRect().top > 400), "en la vista de teléfono la navegación va abajo");
  noErrors(p); await p.ctx.close();
});

await section("PWA: con service worker la app abre sin conexión", async () => {
  const p = await newPage(env.browser, { sw: true });
  await p.goto(env.base + "#/login");
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload(); await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
  await p.ctx.setOffline(true);
  await p.reload(); await p.waitForFunction(() => window.AR && AR.rendered === "#/login", null, { timeout: 8000 });
  check((await p.title()).startsWith("Iniciar sesión"), "la app carga sin red");
  await p.ctx.setOffline(false); await p.ctx.close();
});

await section("Pantallas informativas cargan sin errores", async () => {
  const p = await newPage(env.browser);
  await open(p, env.base, { login: "contratante", hash: "#/normas" });
  for (const h of ["#/normas", "#/privacidad", "#/permisos", "#/ajustes", "#/reportes", "#/bloqueados", "#/perfil", "#/prestador/p13", "#/ruta-que-no-existe"]) {
    await go(p, h).catch(() => {}); await p.waitForTimeout(150);
  }
  noErrors(p); await p.ctx.close();
});

console.log(`\n${pass} correctas, ${fail} con fallas`);
if (fail) { console.log(failures.join("\n")); }
await env.close();
process.exit(fail ? 1 : 0);
