/** Aruy · Catálogos: categorías de servicio, zonas y barrios de Quito (coordenadas aproximadas, solo ilustrativas). */
AR.catalog = (function () {
  var CATEGORIAS = [
    { id: "plomeria", nombre: "Plomería", corto: "Plomería", precio: [10, 35], unidad: "por visita" },
    { id: "electricidad", nombre: "Electricidad", corto: "Electricidad", precio: [12, 40], unidad: "por visita" },
    { id: "albanileria", nombre: "Albañilería", corto: "Albañilería", precio: [20, 60], unidad: "por trabajo" },
    { id: "pintura", nombre: "Pintura", corto: "Pintura", precio: [15, 45], unidad: "por ambiente" },
    { id: "carpinteria", nombre: "Carpintería", corto: "Carpintería", precio: [25, 80], unidad: "por trabajo" },
    { id: "limpieza", nombre: "Limpieza", corto: "Limpieza", precio: [12, 28], unidad: "por jornada" },
    { id: "belleza", nombre: "Belleza", corto: "Belleza", precio: [6, 40], unidad: "por servicio" },
    { id: "bienestar", nombre: "Cuidado personal", corto: "Bienestar", precio: [15, 40], unidad: "por sesión" },
    { id: "fotografia", nombre: "Fotografía", corto: "Fotografía", precio: [30, 90], unidad: "por sesión" },
    { id: "cuidado", nombre: "Cuidado de personas", corto: "Cuidado", precio: [8, 20], unidad: "por hora" },
    { id: "otros", nombre: "Otros servicios", corto: "Otros", precio: [10, 40], unidad: "por trabajo" }
  ];

  var ZONAS = [
    { id: "norte", nombre: "Norte", largo: "Norte de Quito", lat: -0.1700, lng: -78.4800 },
    { id: "centro", nombre: "Centro", largo: "Centro de Quito", lat: -0.2150, lng: -78.5050 },
    { id: "sur", nombre: "Sur", largo: "Sur de Quito", lat: -0.2850, lng: -78.5450 },
    { id: "valles", nombre: "Valles", largo: "Valles de Quito", lat: -0.2250, lng: -78.4300 }
  ];

  var BARRIOS = {
    carolina: { nombre: "La Carolina", zona: "norte", lat: -0.1825, lng: -78.4840 },
    iniaquito: { nombre: "Iñaquito", zona: "norte", lat: -0.1770, lng: -78.4800 },
    cotocollao: { nombre: "Cotocollao", zona: "norte", lat: -0.1090, lng: -78.4950 },
    carcelen: { nombre: "Carcelén", zona: "norte", lat: -0.0950, lng: -78.4700 },
    floresta: { nombre: "La Floresta", zona: "centro", lat: -0.2060, lng: -78.4870 },
    historico: { nombre: "Centro Histórico", zona: "centro", lat: -0.2200, lng: -78.5120 },
    sanblas: { nombre: "San Blas", zona: "centro", lat: -0.2150, lng: -78.5080 },
    quitumbe: { nombre: "Quitumbe", zona: "sur", lat: -0.2920, lng: -78.5440 },
    chillogallo: { nombre: "Chillogallo", zona: "sur", lat: -0.2870, lng: -78.5600 },
    magdalena: { nombre: "La Magdalena", zona: "sur", lat: -0.2500, lng: -78.5200 },
    cumbaya: { nombre: "Cumbayá", zona: "valles", lat: -0.2000, lng: -78.4300 },
    tumbaco: { nombre: "Tumbaco", zona: "valles", lat: -0.2150, lng: -78.3990 },
    chillos: { nombre: "Valle de los Chillos", zona: "valles", lat: -0.3100, lng: -78.4500 }
  };

  var catById = {}; CATEGORIAS.forEach(function (c) { catById[c.id] = c; });
  var zonaById = {}; ZONAS.forEach(function (z) { zonaById[z.id] = z; });

  return {
    categorias: CATEGORIAS, zonas: ZONAS, barrios: BARRIOS,
    cat: function (id) { return catById[id] || catById.otros; },
    zona: function (id) { return zonaById[id]; },
    barrio: function (id) { return BARRIOS[id]; },
    /** Punto de referencia de un usuario: su barrio si lo conocemos, si no el centro de su zona. */
    punto: function (zonaId, barrioId) {
      var b = BARRIOS[barrioId]; if (b) return { lat: b.lat, lng: b.lng };
      var z = zonaById[zonaId] || zonaById.norte; return { lat: z.lat, lng: z.lng };
    }
  };
})();
