/** Aruy · Snackbar (Material 3): mensaje breve con acción opcional («Deshacer»). */
AR.snack = (function () {
  var root = document.getElementById("snack-root"), timer = null, cur = null;

  function hide(el, done) {
    if (!el) return;
    el.classList.add("out");
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); if (done) done(); }, AR.u.reducedMotion() ? 0 : 140);
  }

  /** @param {string} msg  @param {{action?:string, onAction?:Function, ms?:number}=} o */
  function show(msg, o) {
    o = o || {};
    clearTimeout(timer);
    if (cur) hide(cur);
    var el = document.createElement("div");
    el.className = "snack"; el.setAttribute("role", "status");
    el.innerHTML = AR.html`<span class="msg">${msg}</span>${o.action ? AR.html`<button type="button" data-act>${o.action}</button>` : ""}`.toString();
    root.appendChild(el); cur = el;
    var act = el.querySelector("[data-act]");
    if (act) act.addEventListener("click", function () { clearTimeout(timer); hide(el); cur = null; if (o.onAction) o.onAction(); });
    timer = setTimeout(function () { hide(el); if (cur === el) cur = null; }, o.ms || (o.action ? 6000 : 3600));
    AR.a11y.say(msg);
  }

  return { show: show };
})();
