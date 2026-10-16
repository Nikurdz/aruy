/** Aruy · Etiquetado de fotos (SIMULACIÓN de ML Kit Image Labeling).
 *
 *  En la app real, `ImageLabeler.process(InputImage)` corre en el dispositivo y devuelve etiquetas con texto y confianza
 *  (documento, sección 6). Aquí se reproduce el mismo contrato sin red ni dependencias:
 *     InputImage → ImageLabeler.process() → [{ texto, confianza }] → solo las de confianza alta → categoría sugerida.
 *  No reconoce imágenes de verdad: usa lo que sabe de las fotos de ejemplo, el nombre del archivo y el color dominante.
 *  La interfaz lo rotula siempre como simulación. */
AR.ml = (function () {
  /* Banco de etiquetas por categoría (subconjunto de las 400+ del modelo base) */
  var BANCO = {
    electricidad: ["Cable", "Tablero eléctrico", "Interruptor", "Tomacorriente", "Alicate", "Herramienta", "Cableado", "Lámpara"],
    plomeria: ["Grifo", "Tubería", "Llave inglesa", "Lavabo", "Sanitario", "Herramienta", "Fontanería", "Agua"],
    albanileria: ["Ladrillo", "Pared", "Cemento", "Obra", "Construcción", "Pala", "Cerámica", "Piso"],
    pintura: ["Pared", "Pintura", "Rodillo", "Brocha", "Habitación", "Techo", "Interior", "Color"],
    carpinteria: ["Madera", "Mueble", "Cocina", "Puerta", "Serrucho", "Taller", "Closet", "Barniz"],
    limpieza: ["Escoba", "Cubeta", "Limpieza", "Piso", "Ventana", "Cocina", "Guantes", "Detergente"],
    belleza: ["Uña", "Esmalte", "Mano", "Cabello", "Peluquería", "Maquillaje", "Tijeras", "Belleza"],
    bienestar: ["Masaje", "Gimnasio", "Ejercicio", "Yoga", "Pesas", "Estiramiento", "Relajación", "Deporte"],
    fotografia: ["Cámara", "Retrato", "Evento", "Lente", "Fotografía", "Sonrisa", "Fiesta", "Estudio"],
    cuidado: ["Persona", "Niño", "Adulto mayor", "Sonrisa", "Hogar", "Juego", "Familia", "Sofá"],
    otros: ["Jardín", "Planta", "Herramienta", "Exterior", "Césped", "Maceta", "Árbol", "Patio"]
  };
  var GENERICAS = ["Interior", "Mano", "Persona", "Ropa", "Mesa", "Piso", "Techo", "Pared"];
  var PALABRAS = {
    electricidad: /elec|cable|tablero|breaker|luz|foco|lamp/, plomeria: /plom|grif|tuber|fuga|agua|sanit|lavab/,
    albanileria: /alba|ladrill|cemento|obra|pared|enluc|ceram|suelda|solda|reja/, pintura: /pint|rodill|brocha|muro|fachada/,
    carpinteria: /carp|madera|mueble|closet|puerta|cocina/, limpieza: /limp|escoba|aseo|vidrio/, belleza: /una|manic|pedic|cabello|peluq|barb|maquill|corte/,
    bienestar: /masaj|yoga|gym|entren|ejerc/, fotografia: /foto|retrato|camara|evento/, cuidado: /cuid|nino|abuel|adulto/, otros: /jardin|planta/
  };
  var NO_TRABAJO = /selfie|perfil|meme|captura|screenshot|whatsapp|wallpaper|gato|perro|comida/;

  function dominantHue(canvas) {
    try {
      var c = document.createElement("canvas"); c.width = 8; c.height = 8;
      var x = c.getContext("2d"); x.drawImage(canvas, 0, 0, 8, 8);
      var d = x.getImageData(0, 0, 8, 8).data, r = 0, g = 0, b = 0;
      for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      var n = d.length / 4; return (Math.round(r / n) * 3 + Math.round(g / n) * 5 + Math.round(b / n) * 7) % 11;
    } catch (e) { return 0; }
  }

  /** Deduce la categoría de una entrada: muestra conocida > nombre de archivo > color dominante. */
  function guess(input) {
    if (input.cat) return { cat: input.cat, seguro: true };
    var name = AR.u.norm(input.nombre || "");
    if (NO_TRABAJO.test(name)) return { cat: null, seguro: false };
    var ids = Object.keys(PALABRAS);
    for (var i = 0; i < ids.length; i++) if (PALABRAS[ids[i]].test(name)) return { cat: ids[i], seguro: true };
    return { cat: AR.catalog.categorias[(input.hue || AR.u.hash(name || "x")) % (AR.catalog.categorias.length - 1)].id, seguro: false };
  }

  /**
   * @param {{nombre?:string, cat?:string, canvas?:HTMLCanvasElement}} input
   * @returns {Promise<{etiquetas:{texto:string,confianza:number}[], categoria:?string, trabajo:boolean, todas:number}>}
   */
  function label(input) {
    var hue = input.canvas ? dominantHue(input.canvas) : 0;
    var g = guess(Object.assign({ hue: hue }, input));
    var r = AR.u.rng((input.nombre || "") + "|" + (input.cat || "") + "|" + hue);
    var ms = 1100 + Math.round(r() * 700);   // el modelo corre una sola vez por foto; tarda un instante
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (!g.cat) {
          var gen = GENERICAS.slice().sort(function () { return r() - .5; }).slice(0, 4).map(function (t, i) { return { texto: t, confianza: Math.round((0.62 - i * 0.06) * 100) / 100 }; });
          return resolve({ etiquetas: gen, categoria: null, trabajo: false, todas: gen.length });
        }
        var banco = BANCO[g.cat].slice().sort(function () { return r() - .5; });
        var base = g.seguro ? 0.93 : 0.74;
        var tags = banco.slice(0, 5).map(function (t, i) { return { texto: t, confianza: Math.round(Math.max(0.35, base - i * (0.045 + r() * 0.06)) * 100) / 100 }; });
        tags = tags.concat(GENERICAS.slice(0, 2).map(function (t, i) { return { texto: t, confianza: Math.round((0.52 - i * 0.12) * 100) / 100 }; }));
        tags.sort(function (a, b) { return b.confianza - a.confianza; });
        resolve({ etiquetas: tags, categoria: g.cat, trabajo: true, todas: tags.length });
      }, ms);
    });
  }

  /** Solo se muestran las etiquetas con confianza alta (sección 6.1). */
  function confiables(res) { return res.etiquetas.filter(function (e) { return e.confianza >= AR.config.ML_MIN_CONFIDENCE; }); }

  return { label: label, confiables: confiables };
})();
