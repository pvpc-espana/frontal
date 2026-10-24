# PVPC España · Frontal

Interfaz web de [pvpc.linaresdigital.com](https://pvpc.linaresdigital.com): precio de la luz
(PVPC) hora a hora, hoy y mañana. La documentación general del proyecto está en
[`nucleo`](https://github.com/pvpc-espana/nucleo).

- **Angular 22** (componentes *standalone*, *signals*, sin zone.js) y **Transloco** para los
  6 idiomas (`public/i18n/*.json`).
- Lee los JSON de `https://datos.pvpc.linaresdigital.com/v1/` (`src/app/core/config.ts`).
- Mobile-first: deslizar el dedo, botones arriba y abajo o flechas del teclado para cambiar
  de día; tema automático, claro u oscuro.
- Clasificación de cada hora (color e icono) en `src/app/core/umbrales.ts`.

## Desarrollo

Requiere Node.js 22.22.3+ o 24.15+.

```bash
npm ci
npm start          # servidor de desarrollo en http://localhost:4200
npm test           # pruebas unitarias (Vitest)
npm run lint       # formato (Prettier); `npm run formato` lo corrige
npm run build      # compilación en dist/ + páginas de entrada por idioma
```

`npm run build` ejecuta `ng build` y después `scripts/paginas-entrada.mjs`, que genera
`/{es,en,fr,de,it,pt}/index.html` (responden 200 con su idioma, metadatos y `hreflang`),
`404.html` para las URLs con fecha y añade la CSP con el *hash* del script de tema.

## Publicación

El workflow `.github/workflows/publicar.yml` compila, pasa formato y pruebas, y despliega
`dist/` en GitHub Pages en cada push a `main` (fuente de Pages: «GitHub Actions»).
