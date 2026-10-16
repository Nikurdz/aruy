/** Aruy · Estados de interfaz.
 *
 *  Réplica de las sealed class del documento (sección 5.2):
 *    sealed class ServicioUiState { Loading, Success(servicios), Error(mensaje) }
 *    sealed class UsuarioUiState  { Idle, Loading, Success(usuario), Error(mensaje) }
 *
 *  Un estado es un objeto con `kind` ("idle" | "loading" | "success" | "error").
 *  `match` hace de `when` exhaustivo: si falta un caso lanza un error en vez de dejar un estado sin pintar. */
AR.UiState = (function () {
  var KINDS = ["idle", "loading", "success", "error"];

  return {
    kinds: KINDS,
    idle: function () { return { kind: "idle" }; },
    loading: function (meta) { return { kind: "loading", meta: meta || {} }; },
    /** @param {*} data  contenido cargado  @param {Object=} meta  p. ej. { offline: true } si viene de la caché local */
    success: function (data, meta) { return { kind: "success", data: data, meta: meta || {} }; },
    error: function (mensaje, meta) { return { kind: "error", mensaje: mensaje, meta: meta || {} }; },

    /** when exhaustivo: cada caso es una función; `_` actúa como `else`. */
    match: function (state, cases) {
      var fn = cases[state.kind] || cases._;
      if (!fn) throw new Error("UiState sin manejador para «" + state.kind + "»");
      return fn(state);
    }
  };
})();
