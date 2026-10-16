/** Aruy · Datos de ejemplo (lo que en producción vendría de Neon por la API REST).
 *  Todo es ficticio y genérico. No hay teléfonos reales: el contacto por WhatsApp se simula (ver contactSheet). */
AR.seed = (function () {
  var C = AR.catalog, U = AR.u;

  /* [nombre, oficio, categoría, zona, barrio, modalidad (d|l|a), servicios, años, calificación, trabajos, fotos] */
  var RAW = [
    ["Luis Quishpe", "Plomero", "plomeria", "sur", "quitumbe", "d", ["Reparación de fugas", "Destape de cañerías", "Cambio de grifería"], 8, 4.8, 42, 5],
    ["Marco Villacís", "Plomero", "plomeria", "norte", "carcelen", "d", ["Instalación de calefón", "Reparación de fugas"], 5, 4.5, 27, 4],
    ["Byron Chiliquinga", "Soldador", "albanileria", "sur", "chillogallo", "a", ["Puertas y portones", "Estructuras metálicas", "Soldadura de reparación"], 12, 4.9, 61, 6],
    ["Edison Toapanta", "Soldador", "albanileria", "valles", "tumbaco", "a", ["Rejas y ventanas", "Mantenimiento de estructuras"], 7, 4.3, 19, 3],
    ["Wilson Caiza", "Albañil", "albanileria", "centro", "historico", "d", ["Enlucido de paredes", "Levantamiento de paredes", "Pisos y cerámica"], 15, 4.6, 38, 5],
    ["Segundo Pilatuña", "Albañil", "albanileria", "sur", "magdalena", "d", ["Arreglo de humedad", "Remodelaciones pequeñas"], 10, 4.1, 22, 3],
    ["Andrés Proaño", "Electricista", "electricidad", "norte", "carolina", "d", ["Instalaciones eléctricas", "Cambio de breakers", "Luminarias"], 9, 4.7, 55, 4],
    ["Fabián Guamán", "Electricista", "electricidad", "valles", "cumbaya", "d", ["Cableado nuevo", "Revisión de cortocircuitos"], 6, 4.2, 18, 3],
    ["Diego Cevallos", "Pintor", "pintura", "centro", "floresta", "d", ["Pintura de paredes", "Empaste y sellado"], 11, 4.4, 33, 6],
    ["Hernán Yánez", "Pintor", "pintura", "norte", "iniaquito", "d", ["Pintura de fachadas", "Impermeabilización"], 14, 4.8, 47, 5],
    ["Patricio Almeida", "Carpintero", "carpinteria", "sur", "chillogallo", "a", ["Closets y muebles de cocina", "Puertas de madera", "Barnizado"], 20, 4.9, 72, 6],
    ["Milton Chávez", "Carpintero", "carpinteria", "valles", "chillos", "l", ["Reparación de muebles", "Camas y escritorios"], 8, 3.9, 14, 3],
    ["Camila Andrade", "Manicurista", "belleza", "norte", "carolina", "d", ["Manicure", "Pedicure", "Diseño de uñas"], 4, 4.9, 64, 4],
    ["Daniela Quispe", "Manicurista", "belleza", "sur", "quitumbe", "l", ["Uñas acrílicas", "Diseño de uñas", "Esmaltado semipermanente"], 6, 4.7, 88, 6],
    ["Paola Sarango", "Manicurista", "belleza", "centro", "historico", "a", ["Manicure", "Pedicure spa", "Esmaltado semipermanente"], 3, 4.4, 31, 4],
    ["Verónica Lasso", "Peluquera", "belleza", "norte", "cotocollao", "l", ["Corte de cabello", "Tintes y mechas", "Peinados"], 10, 4.8, 96, 5],
    ["Gabriela Espín", "Peluquera", "belleza", "valles", "cumbaya", "a", ["Corte de cabello", "Alisado", "Hidratación capilar"], 7, 4.5, 40, 4],
    ["Kevin Ushiña", "Barbero", "belleza", "centro", "sanblas", "l", ["Corte clásico", "Degradado", "Perfilado de barba"], 5, 4.6, 120, 6],
    ["Israel Naranjo", "Barbero", "belleza", "sur", "magdalena", "a", ["Degradado", "Afeitado con toalla caliente"], 4, 4.2, 45, 3],
    ["Karen Bastidas", "Maquilladora", "belleza", "norte", "iniaquito", "a", ["Maquillaje social", "Maquillaje de novias", "Cejas y pestañas"], 6, 4.9, 52, 6],
    ["Jessica Moreta", "Maquilladora", "belleza", "centro", "floresta", "d", ["Maquillaje de quinceañeras", "Clases de automaquillaje"], 3, 4.0, 16, 3],
    ["Lorena Cando", "Masajista", "bienestar", "valles", "tumbaco", "d", ["Masaje relajante", "Masaje descontracturante"], 9, 4.7, 58, 3],
    ["Andrea Iza", "Masajista", "bienestar", "norte", "carolina", "a", ["Drenaje linfático", "Masaje para embarazadas", "Masaje deportivo"], 12, 4.8, 73, 4],
    ["Sebastián Robalino", "Entrenador personal", "bienestar", "norte", "iniaquito", "a", ["Plan para bajar de peso", "Ganancia muscular", "Sesiones individuales"], 8, 4.9, 49, 5],
    ["Nicolás Paredes", "Entrenador personal", "bienestar", "valles", "cumbaya", "d", ["Preparación física", "Grupos pequeños"], 5, 4.3, 21, 3],
    ["Mónica Salazar", "Instructora de yoga", "bienestar", "norte", "cotocollao", "l", ["Yoga para principiantes", "Vinyasa", "Clases grupales"], 7, 4.8, 66, 4],
    ["Ricardo Endara", "Fotógrafo", "fotografia", "centro", "floresta", "d", ["Retratos", "Eventos y cumpleaños", "Edición de fotos"], 9, 4.6, 37, 6],
    ["Alejandra Vinueza", "Fotógrafa", "fotografia", "valles", "chillos", "a", ["Fotos de producto", "Álbum digital"], 4, 4.1, 12, 5],
    ["Rosa Chicaiza", "Cuidadora", "cuidado", "sur", "quitumbe", "d", ["Cuidado de adultos mayores", "Acompañamiento a citas", "Cuidado por horas"], 13, 4.9, 29, 0],
    ["Martha Alvear", "Cuidadora", "cuidado", "centro", "sanblas", "d", ["Cuidado de niños", "Cuidado por horas", "Turnos de noche"], 6, 4.4, 17, 0],
    ["Blanca Tigasi", "Limpieza del hogar", "limpieza", "sur", "magdalena", "d", ["Limpieza general", "Limpieza profunda"], 8, 4.5, 84, 3],
    ["Nancy Guerra", "Limpieza de oficinas", "limpieza", "norte", "carcelen", "d", ["Limpieza de oficinas", "Lavado de muebles", "Limpieza de vidrios"], 5, 4.2, 26, 3],
    ["Fanny Ojeda", "Jardinera", "otros", "valles", "tumbaco", "a", ["Mantenimiento de jardines", "Asesoría y cotización"], 6, 4.3, 15, 4]
  ];

  var MOD = { d: ["domicilio"], l: ["local"], a: ["domicilio", "local"] };

  var DESC = {
    plomeria: ["Reviso el problema, te explico qué hace falta y te doy el precio antes de empezar.", "Trabajo con materiales de ferretería de confianza y dejo el área limpia."],
    electricidad: ["Trabajo con normas de seguridad y te entrego la instalación probada y rotulada.", "Primero reviso el tablero y te explico qué conviene cambiar, sin gastos innecesarios."],
    albanileria: ["Cumplo los tiempos acordados y cuido los acabados. Visito la obra para cotizar sin costo.", "Trabajo solo o con ayudante según el tamaño de la obra."],
    pintura: ["Protejo muebles y pisos, preparo bien la superficie y uso la pintura que prefieras.", "Entrego prolijo y en el plazo acordado."],
    carpinteria: ["Hago las medidas en tu casa y te muestro el diseño antes de cortar.", "Madera seleccionada y acabados duraderos."],
    limpieza: ["Llevo mis productos y herramientas. Puntual y de confianza.", "Puedes elegir qué ambientes priorizar y cuántas horas necesitas."],
    belleza: ["Productos de calidad, materiales esterilizados y atención sin apuro.", "Te asesoro según tu estilo y lo que más te favorece."],
    bienestar: ["Plan a tu medida según tu objetivo y tu ritmo. Primera consulta para conocernos.", "Ambiente tranquilo y seguimiento cercano."],
    fotografia: ["Te muestro una selección previa y entrego las fotos editadas en pocos días.", "Atento a los detalles y a que te sientas cómodo frente a la cámara."],
    cuidado: ["Experiencia en cuidado responsable y cariñoso, con referencias.", "Puntualidad y buena comunicación con la familia."],
    otros: ["Cuéntame qué necesitas y te propongo una solución con precio claro.", "Trabajo por encargo y con cita previa."]
  };

  var AUTORES = ["Carla", "Mateo", "Lucía", "Jorge", "Paula", "Diego", "Valeria", "Santiago", "Elena", "Andrés", "Fernanda", "Ricardo", "Mónica", "Pablo", "Gabriela", "Sofía", "Esteban", "Daniela"];
  var INICIALES = ["R.", "M.", "T.", "C.", "P.", "V.", "S.", "A.", "G.", "L."];
  var COM5 = ["Llegó puntual y dejó todo limpio. Muy recomendado.", "Excelente trabajo, cumplió con lo acordado y el precio fue justo.", "Súper amable y profesional. Volveré a contratarle.", "Me explicó todo antes de empezar y el resultado quedó impecable.", "Rápido y prolijo. Resolvió el problema el mismo día.", "Atención de primera, se nota la experiencia."];
  var COM4 = ["Buen trabajo en general. Tardó un poco más de lo previsto.", "Quedó bien y fue amable. Lo contrataría de nuevo.", "Cumplió, aunque tuvimos que ajustar algunos detalles.", "Recomendable, buena comunicación por WhatsApp."];
  var COM3 = ["El trabajo quedó bien, pero llegó tarde.", "Regular: resolvió lo principal, faltaron detalles."];

  function build() {
    var prestadores = [], servicios = [];
    RAW.forEach(function (r, i) {
      var id = "p" + (i + 1), cat = C.cat(r[2]), b = C.barrio(r[4]), rr = U.rng(id);
      var nRes = Math.max(3, Math.round(r[9] * 0.55));
      var prest = {
        id: id, nombre: r[0], oficio: r[1], categoria: r[2], zona: r[3], barrio: r[4], lat: b.lat, lng: b.lng,
        modalidad: MOD[r[5]], anios: r[7], rating: r[8], trabajos: r[9], nResenas: nRes,
        nRecomendaciones: Math.round(nRes * (0.55 + rr() * 0.3)),
        verificado: r[8] >= 4.6 || r[9] >= 60, disponible: rr() > 0.22,
        bio: U.pick(rr, DESC[r[2]]) + " " + r[7] + " años de experiencia.",
        servicios: r[6], portafolio: [], estado: "activo"
      };
      for (var k = 0; k < r[10]; k++) prest.portafolio.push("art:" + r[2] + ":" + id + "-" + k);
      prestadores.push(prest);

      r[6].slice(0, 2).forEach(function (nombre, j) {
        var precio = Math.round(cat.precio[0] + rr() * (cat.precio[1] - cat.precio[0]));
        var fotos = [];
        var n = Math.max(r[10] ? 2 : 0, Math.min(4, r[10]));
        for (var f = 0; f < n; f++) fotos.push("art:" + r[2] + ":" + id + "-" + j + "-" + f);
        servicios.push({
          id: "s_" + id + "_" + (j + 1), prestadorId: id, titulo: nombre,
          descripcion: nombre + " en " + b.nombre + " y alrededores. " + U.pick(rr, DESC[r[2]]) + " Atiendo con cita previa por WhatsApp.",
          categoria: r[2], precioReferencial: precio, unidad: cat.unidad, fotos: fotos,
          disponible: prest.disponible, estado: "publicado", creadoEn: Date.now() - Math.round((20 + rr() * 300) * 86400000)
        });
      });
    });

    /* Moderación (funcionalidad 17): un servicio de la cuenta de ejemplo está en revisión por un reporte */
    servicios.push({
      id: "s_p13_3", prestadorId: "p13", titulo: "Diseño de uñas",
      descripcion: "Diseños a mano alzada y decoración con piedras. Atiendo con cita previa por WhatsApp.",
      categoria: "belleza", precioReferencial: 18, unidad: "por servicio", fotos: ["art:belleza:p13-2-0", "art:belleza:p13-2-1"],
      disponible: true, estado: "en_revision", motivoRevision: "Una persona reportó una de las fotos. El equipo la está revisando; tu servicio sigue visible mientras tanto.",
      creadoEn: Date.now() - 12 * 86400000
    });
    return { prestadores: prestadores, servicios: servicios };
  }

  /** Reseñas de ejemplo de un prestador (estables). */
  function resenas(prest) {
    var r = U.rng("res" + prest.id), out = [], n = Math.min(prest.nResenas, 9);
    for (var i = 0; i < n; i++) {
      var x = r(), rating = x < Math.max(0.1, (prest.rating - 3.4) / 1.9) ? 5 : x < 0.93 ? 4 : 3;
      var pool = rating === 5 ? COM5 : rating === 4 ? COM4 : COM3;
      out.push({
        id: "r_" + prest.id + "_" + i, prestadorId: prest.id, autor: U.pick(r, AUTORES) + " " + U.pick(r, INICIALES),
        rating: rating, comentario: U.pick(r, pool), recomienda: rating >= 4 && r() > 0.25,
        fecha: Date.now() - Math.round((3 + r() * 220) * 86400000)
      });
    }
    return out.sort(function (a, b) { return b.fecha - a.fecha; });
  }

  var data = build();

  /** Cuentas de ejemplo. La del prestador es el perfil público «p13». */
  var USUARIOS = [
    { id: "u_demo_contratante", nombre: "Lucía Cevallos", correo: "lucia.cevallos@ejemplo.ec", telefono: "0991234567", rol: "contratante",
      fotoPerfil: null, ubicacion: "norte", barrio: "carolina", verificado: true, demo: true, creadoEn: Date.now() - 90 * 86400000 },
    { id: "u_demo_prestador", nombre: "Camila Andrade", correo: "camila.andrade@ejemplo.ec", telefono: "0998765432", rol: "prestador",
      fotoPerfil: null, ubicacion: "norte", barrio: "carolina", verificado: true, demo: true, prestadorId: "p13", creadoEn: Date.now() - 200 * 86400000 }
  ];

  return { prestadores: data.prestadores, servicios: data.servicios, usuarios: USUARIOS, resenas: resenas };
})();
