/** Aruy · Configuración del prototipo y banderas por URL. */
AR.config = (function () {
  var q = new URLSearchParams(location.search);
  return {
    NAME: "Aruy",
    VERSION: "1.0.0",
    /** Prefijo de todo lo que se guarda en el navegador (Room simulado). */
    PREFIX: "aruy.v1.",
    /** ?demo=1 muestra el panel de demostración (simular carga lenta, error, sin conexión, cambiar de cuenta). */
    DEMO: q.get("demo") === "1",
    /** Latencia simulada de la API (ms). */
    LATENCY: { min: 650, max: 1100 },
    /** Código de verificación de prueba (se muestra rotulado como tal en la pantalla). */
    TEST_CODE: "482915",
    /** Contraseña de las cuentas de ejemplo. */
    DEMO_PASSWORD: "Aruy#2026",
    /** Fotos máximas por servicio y tamaño de compresión (recomendación del documento). */
    MAX_PHOTOS: 6,
    PHOTO_MAX_SIDE: 1280,
    PHOTO_QUALITY: 0.8,
    /** Confianza mínima para mostrar una etiqueta de IA al prestador. */
    ML_MIN_CONFIDENCE: 0.7
  };
})();
