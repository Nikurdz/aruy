"""Aruy · Inserta las Figuras 1 a 5 en una copia del documento del proyecto.

Uso:  python tools/insertar-figuras.py [origen.docx] [destino.docx]
Por defecto: lee ../PMV-Frameflow-sistema-trabajo-prototipo/docs/Proyecto_v1.docx y escribe docs/Proyecto_v2.docx.
El original no se modifica. Debajo de cada «Pantalla N» (sección 4) reemplaza los párrafos vacíos por un texto que cita la figura,
el pie «Figura N. …» (mismo formato que «Tabla 1» del documento: centrado, número en negrita y título en cursiva), la imagen y una nota.
Requiere las capturas de docs/figuras (node tools/capturar-figuras.mjs)."""
import re, struct, sys, zipfile, os, shutil, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(os.path.join(ROOT, "..", "PMV-Frameflow-sistema-trabajo-prototipo", "docs", "Proyecto_v1.docx"))
DST = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "docs", "Proyecto_v2.docx")
FIG = os.path.join(ROOT, "docs", "figuras")

FIGURAS = [
    {
        "pantalla": "Pantalla 1", "archivo": "figura-1-login.png", "titulo": "Pantalla de login en modo claro y oscuro",
        "alt": "Pantalla de inicio de sesión de Aruy en un teléfono, en modo claro y en modo oscuro, con la banda de tejido, los campos de correo y contraseña y las cuentas de ejemplo.",
        "texto": ("La Figura 1 presenta la pantalla de inicio de sesión de Aruy, desarrollada como prototipo de interfaz con HTML, CSS y JavaScript. "
                  "La persona ingresa su correo y su contraseña (funcionalidad 1) o recupera su contraseña si la olvidó. Quien aún no tiene cuenta "
                  "elige si usará Aruy como prestador de servicios o como contratante (funcionalidad 2) y confirma su cuenta con un código de verificación "
                  "(funcionalidad 14). La banda de tejido superior es el elemento visual de la marca, los campos y botones miden al menos 48 dp y la pantalla "
                  "cambia entre modo claro y oscuro con la estructura de Material Design 3."),
        "ancho_in": 3.8,
    },
    {
        "pantalla": "Pantalla 2", "archivo": "figura-2-home-estados.png", "titulo": "Pantalla Home con los estados Loading, Success y Error",
        "alt": "Pantalla de inicio del contratante en tres estados: cargando con esqueletos y banda de tejido animada, con servicios disponibles cerca y mejor valorados, y con un mensaje de error y el botón Reintentar.",
        "texto": ("La Figura 2 muestra la pantalla de inicio del contratante, que presenta el catálogo de servicios con los tres estados de la sealed class "
                  "ServicioUiState: Loading mientras se consulta la API, Success cuando los servicios se leen desde la base local (Room, como fuente única de la verdad) "
                  "y Error cuando no hay conexión ni servicios guardados, con una acción para reintentar. Desde aquí se accede a la búsqueda por categoría y zona "
                  "(funcionalidades 6 y 7), a los favoritos (funcionalidad 11) y a los servicios vistos recientemente, que se conservan para consultarlos sin conexión."),
        "ancho_in": 6.2,
    },
    {
        "pantalla": "Pantalla 3", "archivo": "figura-3-detalle.png", "titulo": "Pantalla de detalle del servicio en modo claro y oscuro",
        "alt": "Detalle de un servicio con una galería de fotos de trabajos, precio referencial, calificación, disponibilidad, cuenta verificada, el prestador, pestañas de servicio, trabajos y opiniones y el botón Contactar por WhatsApp.",
        "texto": ("La Figura 3 corresponde al detalle del servicio. Reúne el portafolio de fotografías de trabajos (funcionalidad 5), el precio referencial, la calificación y las "
                  "recomendaciones (funcionalidades 9 y 10), la disponibilidad del prestador (funcionalidad 13) y la insignia de cuenta verificada. La acción principal, "
                  "«Contactar por WhatsApp» (funcionalidad 8), permanece fija en la parte inferior; el corazón guarda al prestador en favoritos (funcionalidad 11) y el menú de "
                  "opciones permite reportarlo o bloquearlo (funcionalidad 16)."),
        "ancho_in": 4.2,
    },
    {
        "pantalla": "Pantalla 4", "archivo": "figura-4-publicar-ia.png", "titulo": "Pantalla para publicar un servicio con etiquetas de IA",
        "alt": "A la izquierda, la hoja con las etiquetas sugeridas por el análisis de la foto y la categoría Electricidad; a la derecha, el formulario del servicio con la categoría sugerida y el aviso de borrador guardado.",
        "texto": ("La Figura 4 muestra la pantalla con la que el prestador publica un servicio (funcionalidad 4) y agrega fotografías de sus trabajos al portafolio (funcionalidad 5). "
                  "Al elegir una foto, la aplicación la analiza en el dispositivo con el componente de inteligencia artificial de la sección 6: se listan solo las etiquetas con confianza alta "
                  "y se propone una categoría que el prestador confirma o cambia. En este prototipo web el análisis es una simulación de ML Kit Image Labeling. La foto se comprime antes "
                  "de guardarse y el borrador se conserva en la base local, de modo que no se pierde lo escrito si el sistema cierra la aplicación."),
        "ancho_in": 4.2,
    },
    {
        "pantalla": "Pantalla 5", "archivo": "figura-5-perfil.png", "titulo": "Pantalla de perfil y ajustes en modo claro y oscuro",
        "alt": "Perfil de una persona prestadora con foto, rol, cuenta verificada, interruptor de disponibilidad y listas de cuenta, privacidad y seguridad, en modo claro y en modo oscuro.",
        "texto": ("La Figura 5 presenta el perfil del usuario, desde donde se gestionan la información personal y la foto de perfil (funcionalidad 3) y la disponibilidad del prestador "
                  "(funcionalidad 13). También agrupa los permisos de ubicación, cámara y galería, que se piden solo cuando son necesarios (funcionalidad 18), la privacidad y la protección "
                  "de datos (funcionalidad 15), los reportes y las normas de la comunidad (funcionalidades 16 y 17), el cierre de sesión y la eliminación de la cuenta y de los datos "
                  "personales (funcionalidad 19)."),
        "ancho_in": 4.2,
    },
]

INTRO = ("Las Figuras 1 a 5 presentan los bosquejos de las cinco pantallas principales de Aruy, obtenidos del prototipo de interfaz desarrollado con HTML, CSS y JavaScript. "
         "Todas siguen Material Design 3, con modo claro y oscuro y áreas táctiles de al menos 48 dp.")
NOTA = "Capturas del prototipo de interfaz de Aruy en un teléfono de 412 × 915 dp, equivalente a un Pixel 8. Los datos mostrados son de ejemplo. Elaboración propia."


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    return struct.unpack(">II", head[16:24])


def para_texto(texto):
    return ('<w:p><w:pPr><w:pStyle w:val="APA7"/><w:jc w:val="both"/><w:rPr><w:lang w:val="es-EC"/></w:rPr></w:pPr>'
            '<w:r><w:rPr><w:lang w:val="es-EC"/></w:rPr><w:t xml:space="preserve">%s</w:t></w:r></w:p>' % esc(texto))


def para_pie(n, titulo):
    return ('<w:p><w:pPr><w:pStyle w:val="APA7"/><w:keepNext/><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:i/><w:iCs/></w:rPr></w:pPr>'
            '<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>Figura %d</w:t></w:r><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">. </w:t></w:r>'
            '<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t>%s</w:t></w:r></w:p>' % (n, esc(titulo)))


def para_imagen(rid, n, cx, cy, alt, docpr_id):
    drawing = (
        '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="%d" cy="%d"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="%d" name="Figura %d" descr="%s"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="%d" name="figura-%d.png" descr="%s"/><pic:cNvPicPr/></pic:nvPicPr>'
        '<pic:blipFill><a:blip r:embed="%s"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="%d" cy="%d"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>'
        '</a:graphicData></a:graphic></wp:inline></w:drawing>' % (cx, cy, docpr_id, n, esc(alt), docpr_id, n, esc(alt), rid, cx, cy))
    return ('<w:p><w:pPr><w:pStyle w:val="APA7"/><w:keepNext/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr>'
            '<w:r>%s</w:r></w:p>' % drawing)


def para_nota():
    return ('<w:p><w:pPr><w:pStyle w:val="APA7"/><w:spacing w:before="0" w:after="240" w:line="276" w:lineRule="auto"/><w:ind w:firstLine="0"/><w:jc w:val="both"/></w:pPr>'
            '<w:r><w:rPr><w:i/><w:iCs/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="es-EC"/></w:rPr><w:t xml:space="preserve">Nota. </w:t></w:r>'
            '<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="es-EC"/></w:rPr><w:t>%s</w:t></w:r></w:p>' % esc(NOTA))


def main():
    work = tempfile.mkdtemp(prefix="aruy_docx_")
    try:
        with zipfile.ZipFile(SRC) as z:
            names = z.namelist()
            z.extractall(work)
        doc_path = os.path.join(work, "word", "document.xml")
        x = open(doc_path, encoding="utf-8").read()
        rels_path = os.path.join(work, "word", "_rels", "document.xml.rels")
        rels = open(rels_path, encoding="utf-8").read()

        paras = [(m.start(), m.end()) for m in re.finditer(r"<w:p[ >].*?</w:p>", x, re.S)]
        def texto(s): return "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", s))
        def estilo(s):
            m = re.search(r'<w:pStyle w:val="([^"]+)"', s); return m.group(1) if m else ""

        # párrafos del cuerpo: encabezados «Pantalla N» (estilo Ttulo2, no de la tabla de contenido)
        heads = {}
        for i, (a, b) in enumerate(paras):
            s = x[a:b]
            if estilo(s) == "Ttulo2" and texto(s).startswith("Pantalla "):
                heads[texto(s)] = i
        wire = [i for i, (a, b) in enumerate(paras) if estilo(x[a:b]) == "Ttulo1" and texto(x[a:b]) == "Wireframes / Mockups"][0]

        edits = []  # (inicio, fin, reemplazo) sobre el XML, de atrás hacia adelante
        next_rid = 900
        docpr = 9100
        os.makedirs(os.path.join(work, "word", "media"), exist_ok=True)
        rel_xml = ""
        for n, f in enumerate(FIGURAS, start=1):
            idx = heads[f["pantalla"]]
            j = idx + 1
            while j < len(paras) and estilo(x[paras[j][0]:paras[j][1]]) == "APA7" and not texto(x[paras[j][0]:paras[j][1]]).strip():
                j += 1
            ini, fin = paras[idx + 1][0], paras[j - 1][1]
            src = os.path.join(FIG, f["archivo"])
            media = "figura-%d.png" % n
            shutil.copyfile(src, os.path.join(work, "word", "media", media))
            w, h = png_size(src)
            cx = int(f["ancho_in"] * 914400); cy = int(cx * h / w)
            rid = "rIdFig%d" % n
            rel_xml += '<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/%s"/>' % (rid, media)
            nuevo = para_texto(f["texto"]) + para_pie(n, f["titulo"]) + para_imagen(rid, n, cx, cy, f["alt"], docpr + n) + para_nota()
            edits.append((ini, fin, nuevo))
            # cada pantalla empieza en una página nueva (salvo la primera, que sigue al título de la sección)
            if n > 1:
                hs, he = paras[idx]
                hp = x[hs:he]
                hp2 = hp.replace("<w:pStyle w:val=\"Ttulo2\"/>", "<w:pStyle w:val=\"Ttulo2\"/><w:pageBreakBefore/>", 1)
                edits.append((hs, he, hp2))

        # párrafo introductorio de la sección 4, justo después del título «Wireframes / Mockups»
        ws, we = paras[wire]
        edits.append((we, we, para_texto(INTRO)))

        for ini, fin, rep in sorted(edits, key=lambda e: e[0], reverse=True):
            x = x[:ini] + rep + x[fin:]
        open(doc_path, "w", encoding="utf-8").write(x)
        rels = rels.replace("</Relationships>", rel_xml + "</Relationships>")
        open(rels_path, "w", encoding="utf-8").write(rels)

        # que Word actualice la tabla de contenido (los números de página cambian) al abrir el archivo
        sp = os.path.join(work, "word", "settings.xml")
        st = open(sp, encoding="utf-8").read()
        if "w:updateFields" not in st:
            # el esquema exige este orden: updateFields va justo antes de hdrShapeDefaults, footnotePr, endnotePr o compat
            pos = min([p for p in (st.find(t) for t in ("<w:hdrShapeDefaults", "<w:footnotePr", "<w:endnotePr", "<w:compat")) if p >= 0] or [-1])
            if pos >= 0:
                st = st[:pos] + '<w:updateFields w:val="true"/>' + st[pos:]
                open(sp, "w", encoding="utf-8").write(st)

        os.makedirs(os.path.dirname(DST), exist_ok=True)
        if os.path.exists(DST): os.remove(DST)
        order = names + [os.path.join("word", "media", "figura-%d.png" % n).replace("\\", "/") for n in range(1, len(FIGURAS) + 1)]
        with zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED) as z:
            for name in order:
                if name.endswith("/"):
                    continue
                z.write(os.path.join(work, name), name)
        print("Listo:", DST)
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
