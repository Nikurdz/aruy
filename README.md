# Aruy · Prototipo de interfaz móvil

Prototipo **solo frontend** (HTML, CSS y JavaScript puros, sin build ni dependencias de ejecución) de **Aruy**, la app que conecta a prestadores de servicios con quienes los necesitan en Quito. Parte del documento `Proyecto_v1.docx` (Programación Móvil, PUCE): sus 19 funcionalidades, los estados `ServicioUiState` y `UsuarioUiState`, el componente de IA en el dispositivo, la persistencia local con Room y el consumo de una API REST, Material Design 3, modo oscuro y accesibilidad.

La app real será Kotlin + Jetpack Compose; este prototipo sirve para **diseñar, probar y mostrar la interfaz** antes de programarla.

## Cómo verlo

- Abre `index.html` con doble clic (funciona con `file://`), o levanta el servidor de desarrollo: `node tools/serve.mjs` → http://127.0.0.1:5173/
- En el teléfono: sirve la carpeta por la red local y abre la dirección; con http(s) la app se puede **instalar** y abrir **sin conexión**.
- La primera pantalla presenta Aruy y pregunta si quieres **crear cuenta** o **iniciar sesión**; también puedes **explorar sin cuenta**. En «Iniciar sesión» hay dos cuentas de ejemplo (contratante y prestadora) y, aparte, el formulario con correo. Contraseña de ambas: `Aruy#2026`. El código de verificación de prueba es `482915` y la pantalla lo muestra rotulado como tal.
- Agrega `?demo=1` a la dirección para mostrar el **panel de demostración**: conexión lenta, con error o sin red, cambiar de cuenta, reiniciar los datos y la **vista de teléfono, plegable o tableta** en pantallas grandes.

## Qué hay de cada funcionalidad del documento

| # | Funcionalidad | Dónde |
|---|---|---|
| 1 | Registro, inicio de sesión y recuperación | `#/bienvenida`, `#/login`, `#/registro`, `#/recuperar` |
| 2 | Roles | Elección de rol al registrarse; menú y rutas distintas por rol (`#/acceso-denegado` si se entra a lo ajeno) |
| 3 | Gestión de perfil | `#/perfil`, `#/perfil/editar` (foto, nombre, celular, barrio, bio y experiencia) |
| 4 | Publicación de servicios | `#/servicios`, `#/servicios/nuevo`, editar y eliminar con «Deshacer» |
| 5 | Portafolio | `#/portafolio` y fotos del servicio, con análisis de IA |
| 6 | Búsqueda y filtros | `#/buscar` (texto, categoría, zona, calificación, disponibilidad, verificación, precio, distancia) |
| 7 | Geolocalización | Permiso real del navegador o zona manual; distancias; mapa esquemático de Quito |
| 8 | Contacto por WhatsApp | Hoja con el mensaje editable; se registra en el historial (no escribe a nadie) |
| 9 | Calificaciones y comentarios | Opiniones en el detalle; solo puede calificar quien contactó al prestador |
| 10 | Recomendaciones | Botón «Recomendar» y contador en el perfil |
| 11 | Favoritos | Corazón en tarjetas y detalle; `#/guardados` |
| 12 | Historial de contactos | `#/guardados?tab=historial` |
| 13 | Disponibilidad | Interruptor en el panel y el perfil; se refleja en el catálogo |
| 14 | Verificación | Código de 6 dígitos, sello de cuenta verificada; publicar exige cuenta verificada |
| 15 | Protección de datos | `#/privacidad`, contraseñas con hash y sal, control por rol, descarga de datos |
| 16 | Reportes y bloqueo | Reportar servicio o perfil; bloquear y desbloquear (`#/bloqueados`) |
| 17 | Moderación | `#/reportes` con estados Recibido, En revisión y Resuelto; servicios «En revisión»; `#/normas` |
| 18 | Permisos | Explicación previa y manejo de denegado para ubicación, cámara y galería (`#/permisos`) |
| 19 | Cerrar sesión y eliminar cuenta | `#/perfil`, `#/eliminar` (se confirma escribiendo ELIMINAR) |

Las cinco pantallas del bosquejo (Figuras 1 a 5 del documento) son **Login**, **Home**, **Detalle del servicio**, **Publicar servicio con IA** y **Perfil**.

## Invitado, anuncios y fotos

- **Modo invitado** («Explorar sin cuenta»): se recorren Inicio y Buscar (categorías, filtros, mapa) con foto, título y categoría. El **nombre, la calificación y el precio se difuminan** con texto de relleno (los datos reales no llegan a la pantalla). Tocar un servicio, un perfil o un corazón abre «Crea tu cuenta para ver los detalles»; al entrar se vuelve a lo que se quería abrir. El detalle, favoritos, perfil y el resto exigen cuenta (verificada o no). Es un bloqueo de interfaz: el prototipo no tiene servidor.
- **Anuncios de auspiciantes** (ficticios, sin marcas reales): una tarjeta compacta rotulada **«Auspiciado»** en Inicio y después del 4.º resultado de Buscar, más una línea «Con el apoyo de…» en la bienvenida. Se ocultan con la «×», explican por qué se ven («¿Por qué veo esto?») y nunca aparecen en el detalle, el editor, el login ni el contacto. No cambian el orden de los resultados.
- **Fotos de trabajos:** fotografías libres de Unsplash en `assets/trabajos/` (2 a 4 por categoría, ver `CREDITOS.md`). Son **ilustrativas**: no son de los prestadores de ejemplo, que son ficticios. Si falta una foto se usa la ilustración de tejido de `js/core/art.js`.

## Qué es real y qué está simulado

| En la app real | En este prototipo |
|---|---|
| Room (SQLite) como fuente única de la verdad | `AR.db` sobre localStorage: la interfaz **siempre lee de aquí**; la API solo la actualiza |
| Retrofit + API REST (Neon) | `AR.api`: segunda base local con latencia, errores, lentitud y modo sin conexión |
| `ServicioUiState` / `UsuarioUiState` | `AR.UiState` (idle, loading, success, error) con `match` exhaustivo, como un `when` |
| ML Kit Image Labeling en el dispositivo | `AR.ml`: **simulación** (etiquetas con confianza, categoría sugerida y confirmación) |
| Fotos como URI, comprimidas | IndexedDB; se comprimen (≤ 1280 px, JPEG 0,8) y las entidades solo guardan `idb:<id>` |
| ViewModel + rememberSaveable | El estado vive en el store, no en el DOM; borradores y pestañas sobreviven a rotar la pantalla |
| Atrás predictivo, NavigationSuiteScaffold | Gesto de borde con escala; barra inferior, riel o panel lateral según el ancho |
| Abrir WhatsApp | Hoja que muestra el mensaje y lo registra: **no se envía nada real** |

Los 33 prestadores, sus servicios, opiniones y auspiciantes son ficticios. Las fotos de trabajos son fotografías libres de Unsplash rotuladas «Foto ilustrativa»; no hay imágenes generadas por IA.

## Diseño

- **Concepto: el hilo que une a dos personas.** Identidad andina propia (añil, grana de cochinilla y maíz) sobre la estructura de Material 3. Superficie fría, no crema; el modo oscuro usa añil noche, no negro.
- **Lo memorable: el tejido.** Una banda de rombos escalonados que aparece solo donde cumple una función: la entrada, el indicador de carga y de análisis de IA, y el sello de cuenta verificada.
- **Tipografía:** Bricolage Grotesque (títulos) y Atkinson Hyperlegible Next (texto), por Google Fonts; sin red cae a la tipografía del sistema.
- **Accesibilidad:** áreas táctiles de 48 px, texto de 14 px o más, contraste AA en ambos temas, nombre accesible en todo control e imagen, foco visible, un `h1` por pantalla, tamaño de texto (Normal, Grande, Muy grande) y reducción de animaciones.
- **Adaptable:** compacto < 600 px (barra inferior), mediano 600–839 (riel), expandido ≥ 840 (panel lateral y listas en dos columnas). Los cambios usan *container queries* sobre `.app`.
- **Móvil:** `100dvh`, áreas seguras, teclado que no tapa los botones, jalar para actualizar, hojas arrastrables, `View Transitions` entre pantallas (la foto de la tarjeta crece hasta la portada del detalle) y vibración suave.

## Estructura

```
index.html · manifest.webmanifest · sw.js
css/    tokens · base · shell · components · screens
js/core/    ns, config, util, icons, art, net, theme, a11y, snackbar, sheet, perms, motion, components, flows, shell, gestures, router, demo
js/model/   uistate
js/data/    catalog, seed
js/store/   db (Room), photos (IndexedDB), session, api (Retrofit), repo
js/ml/      labeler (ML Kit simulado)
js/views/   una vista por pantalla
assets/     icon.svg y trabajos/ (fotos libres + CREDITOS.md)
tests/      e2e · responsive · a11y
tools/      serve · capturar-figuras · insertar-figuras.py · revisar · shot
docs/       figuras/ y Proyecto_v2.docx (con las figuras insertadas)
```

Scripts clásicos en orden fijo (`index.html`), todo cuelga de `window.AR`. Un archivo JS nuevo se agrega a mano a `index.html` **y** a la lista `CORE` de `sw.js`.

## Pruebas

Requieren Node 18+ y un Chrome o Edge instalado. Dependencia de desarrollo: `playwright-core` (`npm install`). `PW_CHANNEL=msedge` o `CHROMIUM_PATH=…` cambian el navegador.

```bash
npm test                  # las tres suites
npm run test:e2e          # 30 flujos: bienvenida, invitado, anuncios, acceso, estados de carga, búsqueda, detalle, contacto, opiniones, reportes, permisos, editor con IA, roles, sin conexión, gestos, PWA
npm run test:responsive   # 14 tamaños × rutas × claro y oscuro: sin scroll horizontal, navegación según el ancho, controles ≥ 48 px, texto ≥ 14 px
npm run test:a11y         # contraste AA, nombres accesibles, un h1, foco con teclado y texto al 200 %
```

## Figuras del documento

```bash
node tools/capturar-figuras.mjs      # docs/figuras/figura-N-*.png (Pixel 8, 412 × 915 dp, escala 2)
python tools/insertar-figuras.py     # lee Proyecto_v1.docx y escribe docs/Proyecto_v2.docx
```

El original no se modifica. Cada «Pantalla N» recibe un texto que cita la figura, el pie «Figura N. …» con el formato de «Tabla 1» del documento, la imagen y una nota. El archivo pide a Word actualizar la tabla de contenido al abrirlo (los números de página cambian).

## Límites conocidos

- La IA de fotos y la verificación son simulaciones; no hay servidor ni mensajes reales.
- El mapa es un esquema de Quito, sin teselas externas, para que funcione sin conexión.
- Las fotos de trabajos pesan ~3,7 MB (se cargan bajo demanda).
- Las tipografías vienen de Google Fonts; sin red se usa la del sistema.
- El service worker solo se registra con http(s); en `file://` la app funciona igual pero sin instalación.
