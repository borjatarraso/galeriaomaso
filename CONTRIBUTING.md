# Cómo contribuir a galeriaomaso.com

¡Bienvenido/a! Este documento está dirigido a **personas y empresas externas**
(diseñadores, desarrolladores, agencias web) que quieran proponer cambios al
sitio público de la Galería O+O. Explica todo lo necesario para visualizar la
web, descargar el código, modificarlo y enviar tu propuesta — sin tener que
conocer la infraestructura interna de la galería.

- **Sitio en producción:** <https://www.galeriaomaso.com>
- **Repositorio:** <https://github.com/borjatarraso/galeriaomaso>
- **Licencia:** BSD-3-Clause (puedes consultar el archivo `README.md`)
- **Mantenedor:** Borja Tarraso `<borja.tarraso@member.fsf.org>`

---

## 1. Cómo está hecha la web (resumen técnico)

La web es un **sitio estático**: no hay servidor de aplicaciones, base de
datos, CMS ni paso de compilación. Cada página HTML que ves en producción está
literalmente en el repositorio. Esto significa que puedes:

- Abrir cualquier `.html` directamente con tu navegador para previsualizar.
- Editar texto, estilos o imágenes con cualquier editor (VS Code, Sublime,
  Vim, Notepad++, etc.).
- Probar tus cambios sin instalar nada (ni Node, ni npm, ni Python).

### Tecnologías utilizadas

| Capa | Tecnología | Detalles |
|------|------------|----------|
| Marcado | **HTML5** | Páginas escritas a mano. Atributo `lang="es"` por defecto; las traducciones se aplican en cliente (ver más abajo). |
| Estilos | **CSS3** vanilla (sin preprocesador) | Un único archivo `style.css` (~1.500 líneas) usando variables CSS, Flexbox y Grid. No hay Sass, Less, Tailwind ni PostCSS. |
| Comportamiento | **JavaScript ES5/ES6 vanilla** | Dos archivos: `site.js` (interacciones, menú, *lightbox* de imágenes, selector de idioma) y `translations.js` (cadenas de navegación traducidas). Sin frameworks (ni React, ni Vue, ni jQuery). |
| Tipografía | **Google Fonts** | Familia `Cinzel Decorative` cargada vía `<link>` en cada página. |
| Traducción | **Google Translate Element** | Se inyecta dinámicamente desde `site.js`. El menú propio traduce las cadenas de navegación; Google Translate cubre el resto del contenido (cuerpo, posts, etc.) para los 7 idiomas distintos del español soportados. |
| Iconografía | **SVG inline** | Los iconos del menú superior están embebidos como SVG dentro del HTML. |
| Favicon | **ICO multi-resolución** | `favicon.ico` con 7 tamaños (16, 24, 32, 48, 64, 128, 256 px). |
| Imágenes | **JPG / PNG / WebP** | Se sirven directamente desde `images/`. No hay pipeline de optimización; sube las imágenes ya optimizadas (ver §6). |

> Sin **build step**: lo que está en el repositorio es exactamente lo que se
> sirve. Esto simplifica el aprendizaje y la revisión de los cambios.

---

## 2. Estructura del repositorio

```
.
├── index.html                # Página de inicio
├── exposiciones.html         # Listados de secciones principales
├── artistas.html
├── articulos.html
├── internacional.html
├── ferias.html
├── cursos.html
├── noticias.html
├── enlaces.html
├── contacta.html
├── como-llegar.html
├── posts/                    # 313 páginas de posts individuales (un .html por post)
├── images/                   # ~2.300 imágenes (obras, exposiciones, banners, etc.)
├── assets/                   # Recursos compartidos
├── style.css                 # Hoja de estilos global
├── site.js                   # JavaScript del sitio
├── translations.js           # Diccionario de cadenas de navegación
├── favicon.ico               # Icono de pestaña
├── README.md                 # Documentación del mantenedor
├── CONTRIBUTING.md           # ← Este archivo
└── public/                   # Espejo del sitio para despliegue (ver §7)
```

Hay **648 archivos HTML** en total. Las páginas raíz (`index.html`,
`exposiciones.html`, etc.) son las secciones de navegación principal. Cada
post tiene su propio archivo dentro de `posts/`.

### El espejo `public/`

El directorio `public/` contiene una copia idéntica del sitio. Es la carpeta
desde la que el sitio se publica en producción. **Cuando modifiques o añadas
un archivo, debes hacer el mismo cambio en los dos lugares**: en la raíz **y**
dentro de `public/`. Por ejemplo:

- Si editas `style.css`, edita también `public/style.css`.
- Si añades `images/nueva-obra.jpg`, añade también `public/images/nueva-obra.jpg`.

Una forma rápida de mantenerlos sincronizados al final de tus cambios:

```bash
# desde la raíz del repositorio
cp style.css public/style.css
cp site.js public/site.js
cp favicon.ico public/favicon.ico
# (o lo que hayas tocado; ajusta las rutas)
```

El mantenedor verifica esta sincronización antes de aprobar la *pull request*.

---

## 3. Cómo previsualizar el sitio en local

No necesitas instalar nada. Tienes dos opciones:

### Opción A — Abrir el HTML directamente

```bash
xdg-open index.html      # Linux
open index.html          # macOS
start index.html         # Windows
```

Funciona para el 99% de los casos. Algunas funciones (como el selector de
idioma o la carga de fuentes externas) requieren conexión a internet, pero
no requieren servidor.

### Opción B — Servidor local (recomendado para pruebas más fieles)

Si tienes Python instalado:

```bash
python3 -m http.server 8000
# luego abre http://127.0.0.1:8000/index.html
```

O con Node.js:

```bash
npx --yes serve .
# abre la URL que muestre por consola
```

Esto evita restricciones de los navegadores con `file://` (CORS, cookies de
terceros, etc.) y se acerca más a cómo verá la web un visitante real.

---

## 4. Flujo para proponer un cambio (Pull Request)

GitHub llama **Pull Request (PR)** a lo que GitLab llama **Merge Request
(MR)** — son el mismo concepto. Los pasos:

```bash
# 1. Haz un fork del repositorio en GitHub
#    (botón "Fork" arriba a la derecha en la página del repo)

# 2. Clona TU fork (sustituye <tu-usuario> por tu usuario de GitHub)
git clone https://github.com/<tu-usuario>/galeriaomaso.git
cd galeriaomaso

# 3. Crea una rama descriptiva
git checkout -b mejora/contraste-menu

# 4. Haz tus cambios
$EDITOR style.css
# recuerda: si tocas un archivo de la raíz, cópialo también en public/

# 5. Previsualiza (ver §3)

# 6. Commit + push a tu fork
git add -A
git commit -m "Mejorar contraste del menú principal en modo oscuro"
git push -u origin mejora/contraste-menu

# 7. Abre la Pull Request en GitHub
#    En la página de tu fork aparecerá un botón "Compare & pull request".
#    Apunta al repositorio original: borjatarraso/galeriaomaso, rama main.
```

### Buenas prácticas de PR

- **Una idea por PR.** Cambios pequeños y enfocados se revisan rápido. Si
  vas a tocar varios temas, abre varias PR.
- **Describe el *por qué*, no solo el *qué*.** El diff ya muestra qué
  cambiaste; cuéntanos por qué es útil para la galería o para los visitantes.
- **Adjunta capturas** si el cambio es visual (CSS, imágenes, layout). Una
  captura "antes/después" ayuda muchísimo a la revisión.
- **No incluyas archivos no relacionados.** Revisa `git status` antes de
  hacer commit. Evita subir `.DS_Store`, `Thumbs.db`, editores temporales,
  etc. (el repo tiene un `.gitignore` para los casos comunes).
- **Para cambios grandes** (rediseño, sección nueva, refactor estructural),
  abre primero un **GitHub Issue** describiendo la propuesta. Así
  consensuamos el enfoque antes de invertir tiempo.

---

## 5. Convenciones de código

- **HTML:** indentación de 4 espacios. Atributos en minúsculas. Comillas
  dobles. `lang="es"` en `<html>`.
- **CSS:** indentación de 4 espacios. Propiedades una por línea. Selectores
  separados por una línea en blanco. Usa las variables CSS ya definidas en
  `:root` (paleta de color, radios, sombras) antes de añadir valores nuevos.
- **JavaScript:** estilo "vanilla". Evita dependencias externas. Si necesitas
  una utilidad pequeña, escríbela en `site.js` dentro de su propio bloque
  IIFE para no contaminar el espacio global.
- **Nombres de archivo:** kebab-case (`como-llegar.html`, no
  `ComoLlegar.html`). Imágenes con nombres descriptivos en minúsculas.
- **Comentarios:** solo cuando expliquen el *por qué* (decisión no obvia,
  workaround conocido). Evita comentarios que repitan el código.

---

## 6. Imágenes

- **Formato:** JPG para fotografías, PNG para logos / iconos / capturas con
  texto, WebP si necesitas mejor compresión.
- **Tamaño máximo recomendado:** 2.000 px en el lado mayor para fotografías
  de obra. Tamaños mayores rara vez aportan algo y aumentan la carga.
- **Peso por archivo:** intenta no superar 1 MB por imagen. Optimiza con
  herramientas como `jpegoptim`, `pngquant`, `squoosh.app`, o el propio
  exportador de tu editor de imagen.
- **Nombres:** descriptivos y en minúsculas (`expo-2024-li-jian-tinta.jpg`,
  no `IMG_4521.JPG`).
- **Atributo `alt`:** siempre. Describe brevemente la imagen (no repitas
  "imagen de"). Mejora la accesibilidad y el SEO.

---

## 7. ¿Qué pasa cuando se aprueba una PR?

Tras la revisión y la fusión a la rama `main`, el sitio se actualiza
automáticamente en pocos minutos. No necesitas hacer nada más. Si la
publicación tardara más de lo razonable o el mantenedor detectara algún
problema, te lo comunicará en el hilo de la PR.

---

## 8. Revisión y comunicación

**Borja Tarraso** (`<borja.tarraso@member.fsf.org>`) revisa todas las
propuestas. Puede:

- Fusionar tu PR directamente.
- Fusionarla con pequeños ajustes de estilo o redacción.
- Pedirte cambios mediante comentarios en línea.
- Explicar por qué un cambio no encaja en la dirección actual del sitio.

Para preguntas previas (alcance, viabilidad, criterios estéticos), abre
un **GitHub Issue** o escribe directamente al email del mantenedor.

---

## 9. Código de conducta

Trato respetuoso y profesional en todos los hilos del repositorio
(issues, PR, commits). El mantenedor se reserva el derecho a cerrar
discusiones que se desvíen de este principio.

---

¡Gracias por dedicar tu tiempo a mejorar la web de la galería!
