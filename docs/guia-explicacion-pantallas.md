# Aruy · Explicación rápida de las pantallas

## 1. Bienvenida y login
- La primera pantalla presenta Aruy en pocas líneas, con fotos de trabajos, y pregunta: **Crear cuenta** o **Iniciar sesión**. También permite **Explorar sin cuenta**.
- **Iniciar sesión** muestra primero las **cuentas de ejemplo** (Lucía, contratante; Camila, manicurista) y, aparte, el formulario de correo y contraseña.
- Al registrarse se elige el **rol**: contratante o prestador. Cada rol ve herramientas distintas.
- Se confirma la cuenta con un **código de 6 dígitos** (en el prototipo es de prueba).
- El botón cambia según el estado: listo, cargando, éxito o error con mensaje claro.
- La contraseña se guarda cifrada, nunca en texto.
- **Sin cuenta (invitado):** ve Inicio y Buscar con foto, título y categoría; nombre, precio y calificación salen difuminados. Al tocar un servicio, un perfil o un corazón se pide crear cuenta (verificada o no).

## 2. Perfil
- Muestra foto, nombre, rol, cuenta verificada y zona.
- El prestador tiene un interruptor de **disponibilidad**: si lo apaga, sus servicios aparecen como "no recibe solicitudes".
- Desde aquí se editan los datos, se revisan los **permisos** (ubicación, cámara, galería) y la privacidad, y se ven los reportes y las normas.
- Permite **cerrar sesión** y **eliminar la cuenta** con todos sus datos.

## 3. Home
- Saludo, buscador y 11 categorías de servicios.
- "Disponibles ahora cerca de ti": prestadores disponibles, los más cercanos primero.
- "Mejor valorados" y "Vistos recientemente" (se guardan en el teléfono y se ven sin internet).
- Entre las secciones hay un **anuncio de un auspiciante**, siempre marcado "Auspiciado", discreto y que se puede cerrar con la ×.
- El corazón guarda al prestador en **favoritos**.
- La ubicación se elige por zona o con el GPS del teléfono.

## 4. Home / estados
- **Loading:** se están pidiendo los datos; se ve una barra de tejido en movimiento y cuadros grises.
- **Success:** se muestra el catálogo.
- **Error:** falla la red y no hay nada guardado; hay un botón **Reintentar**.
- Regla clave: la pantalla siempre lee de la base local del teléfono. Si falla la red pero hay datos guardados, se muestran con un aviso de "sin conexión", sin error.

## 5. Detalle
- Galería de fotos de trabajos (fotos ilustrativas reales), precio referencial, calificación, disponibilidad y sello de cuenta verificada.
- Tres pestañas: **Servicio**, **Trabajos** (portafolio) y **Opiniones**.
- Botón fijo **Contactar por WhatsApp**, con el mensaje ya escrito; el contacto queda en el historial. (En el prototipo no se envía nada real.)
- Solo puede calificar quien contactó antes al prestador.
- Menú para **reportar** o **bloquear**; el prestador bloqueado desaparece del catálogo.

## 6. Publicar
- El prestador agrega una foto y la app la analiza **en su teléfono**: muestra etiquetas con porcentaje de confianza y sugiere una categoría. Él confirma o cambia. (En el prototipo es una simulación de ML Kit.)
- La foto se comprime antes de guardarse.
- Formulario: título, categoría, descripción, precio referencial y disponibilidad, con errores junto a cada campo.
- El **borrador se guarda solo**; si se cierra la app, se recupera.
- Para publicar hay que tener la cuenta verificada.
