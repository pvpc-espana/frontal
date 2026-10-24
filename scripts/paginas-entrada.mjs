// Tras `ng build`: añade la CSP y genera las páginas de entrada de cada idioma.
//
// GitHub Pages sólo sirve ficheros existentes: sin esto, /es/ respondería con 404.html
// (estado HTTP 404). Se generan /index.html y /{idioma}/index.html con su idioma,
// título, descripción, Open Graph y hreflang, y 404.html para las URLs con fecha.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SALIDA = 'dist';
const SITIO = 'https://pvpc.linaresdigital.com';
const DATOS = 'https://datos.pvpc.linaresdigital.com https://raw.githubusercontent.com';
const IDIOMAS = ['es', 'en', 'fr', 'de', 'it', 'pt'];
const LOCALES = { es: 'es_ES', en: 'en_GB', fr: 'fr_FR', de: 'de_DE', it: 'it_IT', pt: 'pt_PT' };

const plantilla = readFileSync(join(SALIDA, 'index.html'), 'utf8');

// La CSP permite el script en línea del tema por su hash, nunca 'unsafe-inline'
const scriptTema = /<script id="tema-inicial">([\s\S]*?)<\/script>/.exec(plantilla);
if (!scriptTema) throw new Error('No se encuentra el script tema-inicial en index.html');
const hash = createHash('sha256').update(scriptTema[1]).digest('base64');
const otrosScriptsEnLinea = [...plantilla.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].length - 1;
if (otrosScriptsEnLinea > 0) throw new Error('Hay scripts en línea no previstos por la CSP');

const csp = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${hash}'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${DATOS}`,
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

const alternativas = [
  ...IDIOMAS.map((i) => `<link rel="alternate" hreflang="${i}" href="${SITIO}/${i}/" />`),
  `<link rel="alternate" hreflang="x-default" href="${SITIO}/" />`,
].join('\n    ');

const escapar = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function pagina({ idioma, titulo, descripcion, url }) {
  let html = plantilla
    .replace(
      /<meta charset="utf-8"\s*\/?>/i,
      `$&\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
    )
    .replace('</head>', `  ${alternativas}\n    <link rel="canonical" href="${url}" />\n  </head>`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`);
  if (idioma) {
    html = html
      .replace(/<html lang="[^"]*"/, `<html lang="${idioma}"`)
      .replace(/<title>[^<]*<\/title>/, `<title>${escapar(titulo)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*"/, `$1${escapar(descripcion)}"`)
      .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${escapar(titulo)}"`)
      .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${escapar(descripcion)}"`)
      .replace(
        '</head>',
        `  <meta property="og:locale" content="${LOCALES[idioma]}" />\n  </head>`,
      );
  }
  if (!html.includes('Content-Security-Policy')) throw new Error('No se pudo insertar la CSP');
  return html;
}

const raiz = pagina({ url: `${SITIO}/` });
writeFileSync(join(SALIDA, 'index.html'), raiz);
writeFileSync(join(SALIDA, '404.html'), raiz);

for (const idioma of IDIOMAS) {
  const textos = JSON.parse(readFileSync(join(SALIDA, 'i18n', `${idioma}.json`), 'utf8'));
  mkdirSync(join(SALIDA, idioma), { recursive: true });
  writeFileSync(
    join(SALIDA, idioma, 'index.html'),
    pagina({
      idioma,
      titulo: textos.meta.titulo,
      descripcion: textos.meta.descripcion,
      url: `${SITIO}/${idioma}/`,
    }),
  );
}

console.log(
  `Páginas de entrada generadas: /, ${IDIOMAS.map((i) => `/${i}/`).join(', ')} y 404.html`,
);
