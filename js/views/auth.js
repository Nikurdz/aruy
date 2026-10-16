/** Aruy · Acceso: splash, inicio de sesión (Figura 1), registro con rol, verificación y recuperar contraseña.
 *  Funcionalidades 1, 2, 14 y 15. El inicio de sesión sigue el modelo UsuarioUiState: Idle → Loading → Success | Error. */
(function () {
  var html = AR.html, raw = AR.raw, icon = AR.icon, U = AR.u, UI = AR.ui, V = AR.views, S = AR.UiState;

  function safeNext(q) { return q && /^#\/[a-z]/.test(q) && q.indexOf("#/login") !== 0 ? q : null; }

  function afterLogin(user, next) {
    if (!user.verificado) return AR.router.go("#/verificar", { replace: true });
    AR.router.go(next || AR.session.home(), { replace: true });
  }

  /* ---------- Splash: el hilo dibuja la «A» una sola vez ---------- */
  V.splash = {
    title: "Aruy",
    bar: { hidden: true },
    nav: false,
    render: function () {
      return html`<section class="splash" aria-label="Aruy">
        <svg class="splash-mark" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path class="draw-a" pathLength="1" d="M5 20 12 4l7 16" stroke="var(--c-primary)" stroke-width="2.6"/>
          <path class="draw-bar" pathLength="1" d="M8.7 14.5h6.6" stroke="var(--c-secondary)" stroke-width="2.2" stroke-linecap="butt"/>
        </svg>
        <h1 class="splash-word t-display">Aruy</h1>
        <p class="splash-tag t-body-l">Encuentra a quien necesitas, cerca de ti.</p>
        <div class="splash-band tejido tejido--lg" aria-hidden="true"></div>
        <button type="button" class="btn btn-text splash-skip" data-skip>Continuar</button>
      </section>`;
    },
    mount: function (root) {
      try { sessionStorage.setItem("aruy.splash", "1"); } catch (e) { /* sin sessionStorage */ }
      var done = false;
      function next() { if (done) return; done = true; AR.router.go(AR.session.isLoggedIn() ? AR.session.home() : "#/login", { replace: true }); }
      var t = setTimeout(next, U.reducedMotion() ? 500 : 2100);
      root.querySelector("[data-skip]").addEventListener("click", function () { clearTimeout(t); next(); });
      root.querySelector(".splash").addEventListener("click", function () { clearTimeout(t); next(); });
    }
  };

  /* ---------- Login ---------- */
  V.login = {
    title: "Iniciar sesión",
    bar: { hidden: true },
    nav: false,
    render: function (ctx) {
      var next = safeNext(ctx.query.next);
      return html`<div class="auth page page--narrow">
        <div class="tejido tejido--lg auth-band" aria-hidden="true"></div>
        <header class="auth-head">
          <span class="auth-mark">${UI.mark(44)}</span>
          <h1 class="t-display">Entra a Aruy</h1>
          <p class="t-body-l muted measure">Encuentra a quien necesitas o muestra tu trabajo a quienes te buscan.</p>
        </header>
        <form id="login-form" class="stack" novalidate>
          <p class="form-error" id="login-error" role="alert">${icon("alert", "ic-s")}<span></span></p>
          ${UI.field({ id: "correo", label: "Correo", type: "email", autocomplete: "username", inputmode: "email", enterkeyhint: "next", placeholder: "nombre@correo.com", spellcheck: false, lead: "mail" })}
          ${UI.field({ id: "clave", label: "Contraseña", type: "password", autocomplete: "current-password", enterkeyhint: "go", placeholder: "Tu contraseña", trail: { icon: "eye", label: "Mostrar contraseña" }, lead: "lock" })}
          <a class="auth-link" href="#/recuperar">¿Olvidaste tu contraseña?</a>
          <button type="submit" class="btn btn-filled btn-lg btn-block" id="login-btn">Iniciar sesión</button>
        </form>
        <section class="demo-accounts" aria-labelledby="demo-t">
          <h2 class="t-title-m" id="demo-t">Probar con una cuenta de ejemplo</h2>
          <p class="t-body-m muted">Es un prototipo: entra sin escribir nada y mira cada rol.</p>
          <div class="demo-grid">
            <button type="button" class="demo-card" data-demo="contratante">
              <span class="demo-ic">${icon("search", "ic-l")}</span>
              <span><b class="t-title-m">Contratar un servicio</b><span class="sub">Lucía, contratante</span></span>
            </button>
            <button type="button" class="demo-card" data-demo="prestador">
              <span class="demo-ic">${icon("briefcase", "ic-l")}</span>
              <span><b class="t-title-m">Ofrecer mis servicios</b><span class="sub">Camila, manicurista</span></span>
            </button>
          </div>
        </section>
        <p class="auth-foot t-body-l">¿No tienes cuenta? <a href="#/registro">Crear cuenta</a></p>
      </div>`;
    },
    mount: function (root, ctx) {
      var next = safeNext(ctx.query.next), form = root.querySelector("#login-form"), err = root.querySelector("#login-error"), btn = root.querySelector("#login-btn");
      UI.bindPasswordToggle(root, "clave");
      var state = S.idle();

      /* UsuarioUiState: la pantalla se pinta según el estado, con `match` exhaustivo */
      function set(st) {
        state = st;
        S.match(st, {
          idle: function () { btn.disabled = false; btn.textContent = "Iniciar sesión"; err.classList.remove("show"); },
          loading: function () { btn.disabled = true; btn.textContent = "Entrando…"; err.classList.remove("show"); root.querySelectorAll("[data-demo]").forEach(function (b) { b.disabled = true; }); },
          success: function (s) { btn.textContent = "¡Listo!"; afterLogin(s.data, next); },
          error: function (s) {
            btn.disabled = false; btn.textContent = "Iniciar sesión";
            root.querySelectorAll("[data-demo]").forEach(function (b) { b.disabled = false; });
            err.querySelector("span").textContent = s.mensaje; err.classList.add("show"); AR.a11y.say(s.mensaje);
          }
        });
      }

      function run(p) { set(S.loading()); p.then(function (u) { set(S.success(u)); }).catch(function (e) { set(S.error(e.message || "No pudimos iniciar sesión.")); }); }

      ["correo", "clave"].forEach(function (id) { root.querySelector("#" + id).addEventListener("input", function () { UI.setError(root, id, ""); err.classList.remove("show"); }); });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var c = AR.validate.correo(form.correo.value), k = form.clave.value;
        UI.setError(root, "correo", c.ok ? "" : c.error);
        UI.setError(root, "clave", k ? "" : "Escribe tu contraseña.");
        if (!c.ok) return form.correo.focus();
        if (!k) return form.clave.focus();
        run(AR.session.login(c.value, k));
      });

      U.on(root, "click", "[data-demo]", function (e, b) { run(AR.session.demo(b.getAttribute("data-demo"))); });
    }
  };

  /* ---------- Registro (2 pasos: rol y datos) ---------- */
  V.registro = {
    title: "Crear cuenta",
    bar: function (ctx) { return { title: "Crear cuenta", back: true }; },
    nav: false,
    render: function (ctx) {
      var paso = ctx.query.paso === "2" && ctx.query.rol ? 2 : 1, rol = ctx.query.rol === "prestador" ? "prestador" : "contratante";
      var stepper = html`<div class="stepper" style="--n:2" role="img" aria-label="Paso ${paso} de 2"><i class="done"></i><i class="${paso === 2 ? "done" : ""}"></i></div>`;
      if (paso === 1) {
        return html`<div class="page page--narrow stack stack-l">
          ${stepper}
          <header><h1 class="t-display">¿Cómo usarás Aruy?</h1><p class="t-body-l muted measure" style="margin-top:8px">Elige una opción. Cada cuenta tiene herramientas distintas.</p></header>
          <div class="role-grid" role="radiogroup" aria-label="Tipo de cuenta">
            <button type="button" class="role-card" role="radio" aria-checked="true" data-rol="contratante">
              <span class="role-ic">${icon("search", "ic-l")}</span>
              <b class="t-title-l">Quiero contratar servicios</b>
              <span class="t-body-m muted">Busca por categoría y zona, mira trabajos reales y escribe por WhatsApp.</span>
            </button>
            <button type="button" class="role-card" role="radio" aria-checked="false" data-rol="prestador">
              <span class="role-ic">${icon("briefcase", "ic-l")}</span>
              <b class="t-title-l">Quiero ofrecer mis servicios</b>
              <span class="t-body-m muted">Publica lo que haces, sube fotos de tus trabajos y recibe clientes cerca de ti.</span>
            </button>
          </div>
          <button type="button" class="btn btn-filled btn-lg btn-block" id="reg-next">Continuar</button>
          <p class="auth-foot t-body-l">¿Ya tienes cuenta? <a href="#/login">Iniciar sesión</a></p>
        </div>`;
      }
      var zonas = AR.catalog.zonas.map(function (z) { return html`<button type="button" class="chip" role="radio" aria-checked="${z.id === "norte"}" data-zona="${z.id}">${z.nombre}</button>`; });
      var cats = AR.catalog.categorias.map(function (c) { return html`<option value="${c.id}">${c.nombre}</option>`; });
      return html`<div class="page page--narrow stack stack-l">
        ${stepper}
        <header><h1 class="t-display">${rol === "prestador" ? "Crea tu perfil" : "Crea tu cuenta"}</h1>
          <p class="t-body-l muted measure" style="margin-top:8px">${rol === "prestador" ? "Será lo primero que vean quienes busquen tu servicio." : "Solo necesitas unos datos para empezar."}</p></header>
        <form id="reg-form" class="stack" novalidate>
          <p class="form-error" id="reg-error" role="alert">${icon("alert", "ic-s")}<span></span></p>
          ${UI.field({ id: "nombre", label: "Nombre completo", autocomplete: "name", enterkeyhint: "next", placeholder: "Ejemplo: Lucía Cevallos", maxlength: 60 })}
          ${UI.field({ id: "correo", label: "Correo", type: "email", autocomplete: "email", inputmode: "email", enterkeyhint: "next", placeholder: "nombre@correo.com", spellcheck: false })}
          ${UI.field({ id: "telefono", label: "Celular", optional: true, type: "tel", autocomplete: "tel", inputmode: "tel", enterkeyhint: "next", placeholder: "0998765432", hint: "Sirve para verificar tu cuenta por mensaje." })}
          <div class="field" data-field="clave">
            <label for="clave">Contraseña</label>
            <div class="input-wrap has-trail"><input class="input" id="clave" name="clave" type="password" autocomplete="new-password" enterkeyhint="done" placeholder="Mínimo 8 caracteres" aria-describedby="h-clave e-clave">
              <button type="button" class="icon-btn trail" data-trail="clave" aria-label="Mostrar contraseña">${icon("eye")}</button></div>
            <div class="meter" id="meter" data-level="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <p class="field-hint" id="h-clave"><span id="meter-text">Combina letras y números.</span></p>
            <p class="field-error" id="e-clave" role="alert">${icon("alert", "ic-s")}<span></span></p>
          </div>
          <div class="field"><span class="field-label" id="zona-l">Tu zona en Quito</span><div class="chips" role="radiogroup" aria-labelledby="zona-l">${zonas}</div></div>
          ${rol === "prestador" ? html`<div class="field" data-field="categoria"><label for="categoria">¿Qué servicio ofreces?</label>
            <select class="input" id="categoria" name="categoria">${cats}</select></div>` : ""}
          <label class="check-row"><input type="checkbox" id="acepto"><span>Acepto las <a href="#/normas">normas de la comunidad</a> y el uso de mis datos según la <a href="#/privacidad">política de privacidad</a>.</span></label>
          <p class="field-error" id="e-acepto" role="alert" style="margin-top:-8px">${icon("alert", "ic-s")}<span>Para crear tu cuenta acepta las normas.</span></p>
          <button type="submit" class="btn btn-filled btn-lg btn-block" id="reg-btn">Crear cuenta</button>
        </form>
      </div>`;
    },
    mount: function (root, ctx) {
      var rol = ctx.query.rol === "prestador" ? "prestador" : "contratante";
      if (ctx.query.paso !== "2" || !ctx.query.rol) {
        var picked = "contratante";
        U.on(root, "click", "[data-rol]", function (e, b) {
          picked = b.getAttribute("data-rol");
          root.querySelectorAll("[data-rol]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
        });
        root.querySelector("#reg-next").addEventListener("click", function () { AR.router.go("#/registro?paso=2&rol=" + picked); });
        return;
      }
      var form = root.querySelector("#reg-form"), err = root.querySelector("#reg-error"), zona = "norte";
      UI.bindPasswordToggle(root, "clave");
      U.on(root, "click", "[data-zona]", function (e, b) {
        zona = b.getAttribute("data-zona");
        root.querySelectorAll("[data-zona]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
      });
      var meter = root.querySelector("#meter"), mt = root.querySelector("#meter-text"), TXT = ["Combina letras y números.", "Débil: agrega más caracteres.", "Regular: agrega mayúsculas o un símbolo.", "Buena contraseña.", "Muy buena contraseña."];
      form.clave.addEventListener("input", function () {
        var v = AR.validate.password(form.clave.value), lvl = form.clave.value ? Math.max(1, v.score || 0) : 0;
        meter.setAttribute("data-level", String(lvl)); mt.textContent = TXT[lvl]; UI.setError(root, "clave", "");
      });
      ["nombre", "correo", "telefono"].forEach(function (id) { form[id].addEventListener("input", function () { UI.setError(root, id, ""); err.classList.remove("show"); }); });
      form.acepto.addEventListener("change", function () { root.querySelector("#e-acepto").style.display = "none"; });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var n = AR.validate.nombre(form.nombre.value), c = AR.validate.correo(form.correo.value), t = AR.validate.telefono(form.telefono.value), p = AR.validate.password(form.clave.value);
        UI.setError(root, "nombre", n.ok ? "" : n.error); UI.setError(root, "correo", c.ok ? "" : c.error);
        UI.setError(root, "telefono", t.ok ? "" : t.error); UI.setError(root, "clave", p.ok ? "" : p.error);
        var okAcepto = form.acepto.checked; root.querySelector("#e-acepto").style.display = okAcepto ? "none" : "flex";
        var firstBad = !n.ok ? form.nombre : !c.ok ? form.correo : !t.ok ? form.telefono : !p.ok ? form.clave : !okAcepto ? form.acepto : null;
        if (firstBad) return firstBad.focus();
        var btn = root.querySelector("#reg-btn"); btn.disabled = true; btn.textContent = "Creando tu cuenta…";
        AR.session.register({ nombre: n.value, correo: c.value, telefono: t.value, password: p.value, rol: rol, zona: zona, categoria: form.categoria && form.categoria.value })
          .then(function (u) { AR.router.go("#/verificar", { replace: true }); })
          .catch(function (er) {
            btn.disabled = false; btn.textContent = "Crear cuenta";
            if (er.code === "CORREO_EN_USO") UI.setError(root, "correo", er.message);
            else { err.querySelector("span").textContent = er.message || "No pudimos crear tu cuenta."; err.classList.add("show"); }
          });
      });
    }
  };

  /* ---------- Verificación por código (funcionalidad 14) ---------- */
  V.verificar = {
    title: "Verifica tu cuenta",
    bar: { title: "Verifica tu cuenta", back: false },
    nav: false,
    render: function () {
      var u = AR.session.user(), canal = u.telefono ? "tu celular" : "tu correo", destino = u.telefono || u.correo;
      return html`<div class="page page--narrow stack stack-l" id="verify">
        <header class="stack stack-s"><span class="verify-ic">${icon("mail", "ic-l")}</span>
          <h1 class="t-display">Revisa ${canal}</h1>
          <p class="t-body-l muted measure">Enviamos un código de 6 dígitos a <b>${destino}</b>. Escríbelo para confirmar que eres tú.</p></header>
        <div class="otp" id="otp" role="group" aria-label="Código de 6 dígitos">${[0, 1, 2, 3, 4, 5].map(function (i) {
          return html`<input inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="${i === 0 ? "one-time-code" : "off"}" aria-label="Dígito ${i + 1}">`;
        })}</div>
        <p class="field-error" id="otp-err" role="alert" style="display:none">${icon("alert", "ic-s")}<span></span></p>
        <div class="card card--warn stack stack-s">
          <b class="t-title-m">Solo en el prototipo</b>
          <p class="t-body-m">No se envía ningún mensaje real. Tu código de prueba es <b class="code">${AR.config.TEST_CODE}</b>.</p>
          <button type="button" class="btn btn-outlined" data-fill>Usar el código de prueba</button>
        </div>
        <div class="stack stack-s">
          <button type="button" class="btn btn-filled btn-lg btn-block" id="verify-btn">Verificar cuenta</button>
          <button type="button" class="btn btn-text btn-block" id="resend" disabled>Reenviar código en <span id="count">30</span> s</button>
          <button type="button" class="btn btn-text btn-block" id="later">Verificar más tarde</button>
        </div>
      </div>`;
    },
    mount: function (root) {
      var boxes = U.$$("#otp input", root), btn = root.querySelector("#verify-btn"), err = root.querySelector("#otp-err"), otp = root.querySelector("#otp");
      function code() { return boxes.map(function (b) { return b.value; }).join(""); }
      function submit() {
        if (code().length < 6) { show("Escribe los 6 dígitos del código."); return; }
        btn.disabled = true; btn.textContent = "Verificando…"; err.style.display = "none"; otp.classList.remove("has-error");
        AR.session.verify(code()).then(function () { success(); }).catch(function (e) { btn.disabled = false; btn.textContent = "Verificar cuenta"; show(e.message); boxes.forEach(function (b) { b.value = ""; }); boxes[0].focus(); });
      }
      function show(msg) { err.querySelector("span").textContent = msg; err.style.display = "flex"; otp.classList.add("has-error"); AR.a11y.say(msg); }
      function success() {
        root.querySelector("#verify").innerHTML = String(html`<div class="empty verify-ok">
          <span class="seal-big"><svg aria-hidden="true"><use href="#i-sello"/></svg></span>
          <h1 class="t-display">¡Cuenta verificada!</h1>
          <p class="t-body-l">Ahora las demás personas pueden confiar en tu perfil.</p>
          <button type="button" class="btn btn-filled btn-lg" id="go-on">Continuar</button></div>`);
        var b = root.querySelector("#go-on"); b.focus();
        b.addEventListener("click", function () { AR.router.go(AR.session.home(), { replace: true }); });
        AR.a11y.say("Cuenta verificada");
      }
      boxes.forEach(function (b, i) {
        b.addEventListener("input", function () {
          b.value = b.value.replace(/\D/g, "").slice(-1); err.style.display = "none"; otp.classList.remove("has-error");
          if (b.value && boxes[i + 1]) boxes[i + 1].focus();
          if (code().length === 6) submit();
        });
        b.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !b.value && boxes[i - 1]) { boxes[i - 1].focus(); } });
        b.addEventListener("paste", function (e) {
          var t = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6); if (!t) return;
          e.preventDefault(); t.split("").forEach(function (d, k) { if (boxes[k]) boxes[k].value = d; });
          (boxes[Math.min(t.length, 5)]).focus(); if (t.length === 6) submit();
        });
      });
      boxes[0].focus();
      root.querySelector("[data-fill]").addEventListener("click", function () { AR.config.TEST_CODE.split("").forEach(function (d, i) { boxes[i].value = d; }); submit(); });
      btn.addEventListener("click", submit);
      root.querySelector("#later").addEventListener("click", function () { AR.router.go(AR.session.home(), { replace: true }); });

      var left = 30, rs = root.querySelector("#resend"), cnt = root.querySelector("#count"), timer = setInterval(function () {
        if (!document.body.contains(rs)) return clearInterval(timer);
        left--; if (left <= 0) { clearInterval(timer); rs.disabled = false; rs.textContent = "Reenviar código"; } else cnt.textContent = left;
      }, 1000);
      rs.addEventListener("click", function () {
        AR.api.reenviarCodigo().then(function () { AR.snack.show("Te enviamos un código nuevo."); left = 30; rs.disabled = true; rs.innerHTML = 'Reenviar código en <span id="count">30</span> s'; cnt = rs.querySelector("#count"); timer = setInterval(function () { left--; if (left <= 0) { clearInterval(timer); rs.disabled = false; rs.textContent = "Reenviar código"; } else cnt.textContent = left; }, 1000); });
      });
    }
  };

  /* ---------- Recuperar contraseña ---------- */
  V.recuperar = {
    title: "Recuperar contraseña",
    bar: { title: "Recuperar contraseña", back: true },
    nav: false,
    render: function () {
      return html`<div class="page page--narrow stack stack-l" id="rec"></div>`;
    },
    mount: function (root) {
      var host = root.querySelector("#rec"), correo = "";
      function stepMail() {
        host.innerHTML = String(html`<header><h1 class="t-display">¿Olvidaste tu contraseña?</h1><p class="t-body-l muted measure" style="margin-top:8px">Escribe tu correo y te enviamos un código para crear una nueva.</p></header>
          <form class="stack" id="f1" novalidate><p class="form-error" id="e1" role="alert">${icon("alert", "ic-s")}<span></span></p>
            ${UI.field({ id: "correo", label: "Correo", type: "email", autocomplete: "username", inputmode: "email", placeholder: "nombre@correo.com", spellcheck: false, lead: "mail" })}
            <button class="btn btn-filled btn-lg btn-block" type="submit">Enviar código</button></form>`);
        var f = host.querySelector("#f1");
        f.addEventListener("submit", function (e) {
          e.preventDefault(); var c = AR.validate.correo(f.correo.value); UI.setError(host, "correo", c.ok ? "" : c.error); if (!c.ok) return f.correo.focus();
          var b = f.querySelector("button"); b.disabled = true; b.textContent = "Enviando…";
          AR.api.recuperar(c.value).then(function () { correo = c.value; stepCode(); }).catch(function (er) { b.disabled = false; b.textContent = "Enviar código"; var e1 = host.querySelector("#e1"); e1.querySelector("span").textContent = er.message; e1.classList.add("show"); });
        });
        f.correo.focus();
      }
      function stepCode() {
        host.innerHTML = String(html`<header><h1 class="t-display">Crea una contraseña nueva</h1><p class="t-body-l muted measure" style="margin-top:8px">Si ${correo} tiene una cuenta, le enviamos un código. Escríbelo y elige tu nueva contraseña.</p></header>
          <form class="stack" id="f2" novalidate><p class="form-error" id="e2" role="alert">${icon("alert", "ic-s")}<span></span></p>
            ${UI.field({ id: "codigo", label: "Código de 6 dígitos", inputmode: "numeric", maxlength: 6, autocomplete: "one-time-code", placeholder: "000000" })}
            ${UI.field({ id: "nueva", label: "Contraseña nueva", type: "password", autocomplete: "new-password", placeholder: "Mínimo 8 caracteres", trail: { icon: "eye", label: "Mostrar contraseña" } })}
            <div class="card card--warn t-body-m">Solo en el prototipo: el código de prueba es <b class="code">${AR.config.TEST_CODE}</b>.</div>
            <button class="btn btn-filled btn-lg btn-block" type="submit">Cambiar contraseña</button></form>`);
        UI.bindPasswordToggle(host, "nueva");
        var f = host.querySelector("#f2");
        f.addEventListener("submit", function (e) {
          e.preventDefault(); var p = AR.validate.password(f.nueva.value), cd = f.codigo.value.trim();
          UI.setError(host, "codigo", cd.length === 6 ? "" : "Escribe los 6 dígitos del código."); UI.setError(host, "nueva", p.ok ? "" : p.error);
          if (cd.length !== 6) return f.codigo.focus(); if (!p.ok) return f.nueva.focus();
          var b = f.querySelector("button[type=submit]"); b.disabled = true; b.textContent = "Cambiando…";
          AR.api.restablecer({ correo: correo, codigo: cd, password: p.value }).then(stepDone).catch(function (er) { b.disabled = false; b.textContent = "Cambiar contraseña"; var e2 = host.querySelector("#e2"); e2.querySelector("span").textContent = er.message; e2.classList.add("show"); });
        });
        f.codigo.focus();
      }
      function stepDone() {
        host.innerHTML = String(html`<div class="empty"><span class="seal-big"><svg aria-hidden="true"><use href="#i-sello"/></svg></span><h1 class="t-display">Contraseña cambiada</h1><p class="t-body-l">Ya puedes iniciar sesión con tu contraseña nueva.</p><a class="btn btn-filled btn-lg" href="#/login">Ir a iniciar sesión</a></div>`);
        AR.a11y.say("Contraseña cambiada");
      }
      stepMail();
    }
  };
})();
