# CLAUDE.md

Guía para Claude Code en este proyecto. Idioma del producto, comentarios y commits: español. Equipo: Basantes Villagomez Alisson, Chushig Chushig Gloria, Moreno Meza Karol y Tapia Orellana David (Programación Móvil, PUCE).

## Qué es

Prototipo web estático (**HTML, CSS y JavaScript puros**, sin build ni dependencias de ejecución) de Aruy, la app móvil de servicios descrita en `Proyecto_v1.docx`. Se abre con `index.html` (funciona con `file://`) o con `node tools/serve.mjs`. El README tiene la tabla de funcionalidades, qué es simulado y cómo correr las pruebas. No hay backend: todo lo «remoto» se simula en `js/store/api.js`.

## Comandos

- `npm install` (solo `playwright-core`), `npm test` (e2e + responsive + a11y), o cada suite por separado.
- `node tools/shot.mjs "#/inicio" nombre --user contratante --dark --dpr 2` → `tests/_out/nombre.png` para revisar una pantalla.
- `node tools/revisar.mjs <grupo>` junta varias pantallas en una hoja (`acceso`, `ajustes`, `varios`, `prestador`, `oscuro`, `ancho`, `texto`).
- `node tools/capturar-figuras.mjs` y `python tools/insertar-figuras.py` regeneran las figuras y `docs/Proyecto_v2.docx`.
- No hay linter ni formateador. Para aislar una prueba, comenta las otras `section(...)` de `tests/e2e.mjs`.

## Arquitectura

- **Scripts clásicos en orden fijo** (`index.html`), todo en `window.AR`. Un archivo nuevo se agrega a `index.html` y a `CORE` de `sw.js` (sube `VERSION` si cambia la lista).
- **Capas que espejan el documento:** `AR.db` (Room: lo único que lee la interfaz) ← `AR.repo` ← `AR.api` (Retrofit: latencia, errores, sin red). `AR.UiState` replica las sealed class; úsalo con `match` exhaustivo.
- **Plantillas:** `AR.html\`...\`` escapa todo lo interpolado salvo otro `html` o `AR.raw()`. Un `true`/`false` se escribe como texto (sirve para `aria-checked="${cond}"`); para omitir algo usa `cond ? x : ""`. Para convertir una lista de `html` en texto usa `AR.render(lista)`, **nunca `String(lista)`** (mete comas).
- **Router (`js/core/router.js`):** rutas, roles y pestaña activa en la tabla `ROUTES`. Una vista es `{title, bar(ctx), nav, render(ctx), mount(root, ctx), unmount()}`. `mount` recibe un contenedor propio por pantalla: usa `root.isConnected` en callbacks asíncronos y `AR.router.refresh()` para repintar sin animación. Cambiar de pestaña reemplaza la entrada del historial. Las pruebas esperan `AR.rendered === location.hash`.
- **Hojas (`AR.sheet`)** agregan una entrada al historial para que Atrás las cierre. `history.back()` es asíncrono: el router y `replaceQuiet` esperan con `AR.sheet.whenIdle`. Si una hoja lleva a otra pantalla, usa `AR.router.go`, no cambies `location.hash` a mano.
- **Layout adaptable con container queries sobre `.app`** (no con media queries de ancho), para que funcione también en la vista de dispositivo. La pantalla desplaza dentro de `#main`, no el documento.
- **Roles:** `AR.session.allows(roles)`; contratante y prestador ven menús y rutas distintos. Publicar un servicio exige cuenta verificada.

## Convenciones no obvias

- Controles táctiles de al menos 48 px (`--tap`) y texto de 14 px o más: `tests/responsive.mjs` falla si no. Los interruptores tienen área de 48 px con la pista dibujada en `::before`.
- Todo control o imagen necesita nombre accesible; un solo `h1` por pantalla (el router agrega uno `sr-only` si la vista no trae).
- Colores solo por roles de `css/tokens.css` (`light-dark()`); no uses hex en las pantallas. El contraste AA lo comprueba `tests/a11y.mjs` en ambos temas.
- El **tejido** (banda de rombos) se usa solo en la entrada, la carga/análisis de IA y el sello de verificado. No lo uses como decoración.
- Nada de emoji como íconos: glifos propios en `js/core/icons.js`. Las fotos de ejemplo son ilustraciones de `js/core/art.js`.
- Un elemento `position: absolute` (p. ej. `.sr-only`) dentro de un carrusel ensancha la pantalla si el carrusel no es `position: relative`.
- Prototipo seguro: los prestadores de ejemplo no tienen teléfono; «Abrir WhatsApp» solo registra el contacto.
- Sin etiquetas en mayúsculas, sin cadenas «A · B · C», sin numeración salvo secuencias reales (el registro). Textos en español de Ecuador, tuteo, oraciones en minúscula, verbos claros.
