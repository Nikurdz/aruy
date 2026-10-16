/** Aruy · Íconos propios (sprite SVG, trazo de 2 px en rejilla de 24). Los glifos de oficio (c-*) son dibujo propio, no emoji. */
(function () {
  var F = ' fill="currentColor" stroke="none"';

  var P = {
    /* Interfaz */
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    heart: '<path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6.1-8 11-8 11z"/>',
    "heart-fill": '<path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6.1-8 11-8 11z" fill="currentColor"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    forward: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    "chevron-right": '<path d="m9 5 7 7-7 7"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    star: '<path d="M12 2.8l2.8 5.9 6.4.9-4.7 4.5 1.2 6.4L12 17.4l-5.7 3.1 1.2-6.4L2.8 9.6l6.4-.9z"' + F + '/>',
    "star-o": '<path d="M12 3.6l2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.1 2.8 1-5.8-4.2-4.1 5.8-.8z"/>',
    pin: '<path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    chat: '<path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5z"/><path d="M9.3 8.4c-.4.6-.4 1.5.1 2.4a7.3 7.3 0 0 0 3.7 3.2c.8.3 1.6.2 2.1-.3l.4-.5-1.9-1.2-.9.6a5 5 0 0 1-2-2l.6-.9-1.3-1.9z"/>',
    share: '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6"/>',
    flag: '<path d="M5.5 21V4"/><path d="M5.5 4.5h12l-2.6 4 2.6 4h-12"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 8 8 5.5L20 8"/>',
    phone: '<path d="M5 4h4l1.6 4.2-2.4 1.6a11 11 0 0 0 6 6l1.6-2.4L20 15v4a1.5 1.5 0 0 1-1.6 1.5C10.5 20 4 13.5 3.5 5.6A1.5 1.5 0 0 1 5 4z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    "eye-off": '<path d="M3.5 3.5l17 17"/><path d="M10.6 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.5 7.5A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.5-.7"/><path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 3.7"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>',
    map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14M15 6v14"/>',
    logout: '<path d="M10 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h4"/><path d="m15 8 4 4-4 4M19 12H9"/>',
    block: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    "thumb-up": '<path d="M8 10.5V20H5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 5 10h3z"/><path d="m8 10.5 3.2-6.2a1.7 1.7 0 0 1 3.1 1.2L13.6 9H19a1.8 1.8 0 0 1 1.8 2.2l-1.4 6.3A2.5 2.5 0 0 1 17 19.5H8"/>',
    tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l7.3 7.3a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0L3.8 12.9a1 1 0 0 1-.3-.7z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
    sparkles: '<path d="M10 4l1.7 4.3L16 10l-4.3 1.7L10 16l-1.7-4.3L4 10l4.3-1.7z"/><path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z"/>',
    "wifi-off": '<path d="M3.5 3.5l17 17"/><path d="M8.6 16.2a5 5 0 0 1 6.8 0"/><path d="M5 12.6a10 10 0 0 1 3.8-2.3M15.2 10.3a10 10 0 0 1 3.8 2.3"/><path d="M2 9a15 15 0 0 1 4.6-2.8M12 6c3.4 0 6.5 1.3 9 3.3"/><path d="M12 19.6v.01"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4.7L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14 4.7l2-2.2"/><path d="M20 20v-4.5h-4.5"/>',
    briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17"/>',
    dashboard: '<rect x="3.5" y="3.5" width="7.5" height="9" rx="2"/><rect x="13" y="3.5" width="7.5" height="5" rx="2"/><rect x="13" y="11" width="7.5" height="9.5" rx="2"/><rect x="3.5" y="15" width="7.5" height="5.5" rx="2"/>',
    dollar: '<path d="M12 3.5v17"/><path d="M16 8c-.5-1.300-2-2.200-4-2.200-2.300 0-4 1.100-4 2.800s1.500 2.300 4 2.800 4 1.100 4 2.800-1.700 2.800-4 2.800c-2 0-3.600-.9-4.300-2.300"/>',
    camera: '<path d="M4 8h3l1.600-2.500h6.800L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.800"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m20.500 16-5-5-8 8.500"/>',
    trash: '<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l1 12.500h9L17.500 7M10 11v5.500M14 11v5.500"/>',
    edit: '<path d="M14.500 6.500l3 3"/><path d="M4 20l1-4L16.500 4.500a2.100 2.100 0 0 1 3 3L8 19z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.800l1.400 2.400a7.500 7.500 0 0 1 2 .8l2.700-.6 1.400 2.400-1.900 2a7.500 7.500 0 0 1 0 2.300l1.900 2-1.400 2.400-2.700-.6a7.500 7.500 0 0 1-2 .8L12 21.200l-1.400-2.400a7.500 7.500 0 0 1-2-.8l-2.700.6-1.400-2.400 1.900-2a7.500 7.500 0 0 1 0-2.300l-1.900-2 1.400-2.400 2.700.6a7.500 7.500 0 0 1 2-.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500V5M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800"/>',
    moon: '<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a6.800 6.800 0 0 0 10.500 10.500z"/>',
    bell: '<path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15z"/><path d="M10 21a2.200 2.200 0 0 0 4 0"/>',
    check: '<path d="M5 12.500l4.500 4.500L19 7"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="M8 12.300l2.800 2.800L16 9.500"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.500V13M12 16.400v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500M12 7.600v.01"/>',
    "more-vert": '<circle cx="12" cy="5" r="1.500"' + F + '/><circle cx="12" cy="12" r="1.500"' + F + '/><circle cx="12" cy="19" r="1.500"' + F + '/>',
    copy: '<rect x="8.500" y="8.500" width="11" height="11" rx="2.500"/><path d="M15.500 8.500V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.500a2 2 0 0 0 2 2h2.500"/>',
    locate: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"' + F + '/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.600 2.600 0 0 1 5 .8c0 1.700-2.500 2-2.500 3.700M12 17.200v.01"/>',
    "shield-check": '<path d="M12 3l7.500 3v5.500c0 4.600-3.100 8-7.500 9.500-4.400-1.500-7.500-4.900-7.500-9.500V6z"/><path d="m8.800 12.200 2.300 2.300 4.200-4.600"/>',
    download: '<path d="M12 4v11M7.500 11l4.500 4.500 4.500-4.500M5 20h14"/>',
    sort: '<path d="M7 4v16M3.500 16.500 7 20l3.500-3.500M17 20V4M13.500 7.500 17 4l3.500 3.500"/>',
    text: '<path d="M4 19 9.500 5h1L16 19M6 14.500h8.500M17.500 19l2.500-6 2.500 6"/>',
    mic: '<rect x="9" y="3.500" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>',
    rule: '<path d="M6 3.500h12v17H6z"/><path d="M9 8h6M9 12h6M9 16h3.500"/>',
    layers: '<path d="m12 3.500 9 4.500-9 4.500L3 8z"/><path d="m3 12.500 9 4.500 9-4.500M3 16.500l9 4.500 9-4.500"/>',

    /* Sello de cuenta verificada: rombo escalonado, como los de la banda de tejido */
    sello: '<path d="M10 2h4v2.500h2.500V7H19v2.500h2.500v5H19V17h-2.500v2.500H14V22h-4v-2.500H7.500V17H5v-2.500H2.500v-5H5V7h2.500V4.500H10z"' + F + '/><path d="M8.600 12.300l2.500 2.500 4.500-5" stroke="#fff" fill="none" stroke-width="2.200"/>',
    /* Marca: A tejida, con la barra cosida */
    marca: '<path d="M5 20 12 4l7 16" stroke-width="3.200"/><path d="M8.500 14.500h7" stroke-width="2.600" stroke-dasharray="2 2.600"/>',

    /* Glifos de oficio (dibujo propio) */
    "c-plomeria": '<path d="M12 3s6.500 6.500 6.500 11a6.500 6.500 0 0 1-13 0C5.500 9.500 12 3 12 3z"/><path d="M9 14.500a3 3 0 0 0 3 3"/>',
    "c-electricidad": '<path d="M13.200 2.800 5.500 13.200h5.800l-.9 8 8.100-11h-5.900z"/>',
    "c-albanileria": '<rect x="3" y="5" width="18" height="14" rx="1.800"/><path d="M3 9.700h18M3 14.300h18M9 5v4.700M15 9.700v4.600M9 14.300V19"/>',
    "c-pintura": '<rect x="4" y="3.500" width="14" height="5.500" rx="1.800"/><path d="M18 6.200h2.200v5.300H12v3"/><rect x="10.200" y="14.500" width="3.600" height="6" rx="1.200"/>',
    "c-carpinteria": '<path d="M4.500 19.500 13 11"/><path d="M10 8l3-3 6 6-3 3z"/>',
    "c-limpieza": '<path d="M15.500 3.500 12 11"/><path d="M7.500 11h9L19 21H5z"/><path d="M10 15.500 9.500 21M14 15.500l.5 5.500"/>',
    "c-belleza": '<circle cx="6" cy="6.500" r="2.500"/><circle cx="6" cy="17.500" r="2.500"/><path d="M8 8 20 18.500M8 16 20 5.500"/>',
    "c-bienestar": '<path d="M5 19C5 10.500 10 5 20 5c0 10-5.500 15-15 14z"/><path d="M5 19c3-4 6-6.500 10-8"/>',
    "c-fotografia": '<path d="M4 8h3l1.600-2.500h6.800L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.800"/>',
    "c-cuidado": '<circle cx="9" cy="7.500" r="3"/><path d="M3 20v-1.500a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5V20"/><circle cx="18" cy="10.500" r="2.200"/><path d="M17.500 20v-1.200a3.600 3.600 0 0 1 3.500-3.600"/>',
    "c-otros": '<rect x="4" y="4" width="6.500" height="6.500" rx="1.800"/><rect x="13.500" y="4" width="6.500" height="6.500" rx="1.800"/><rect x="4" y="13.500" width="6.500" height="6.500" rx="1.800"/><rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.800"/>'
  };

  function sprite() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">';
    Object.keys(P).forEach(function (k) {
      s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + P[k] + '</symbol>';
    });
    return s + '</svg>';
  }

  AR.icons = { paths: P, sprite: sprite };

  /** Devuelve el SVG de un ícono listo para insertar (decorativo: aria-hidden). */
  AR.icon = function (name, cls) {
    return AR.raw('<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>');
  };

  document.body.insertAdjacentHTML("afterbegin", sprite());
})();
