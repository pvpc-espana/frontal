import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withNavigationErrorHandler,
  withRouterConfig,
} from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { IDIOMAS, IDIOMA_POR_DEFECTO } from './core/config';
import { CargadorTraducciones } from './core/idioma';

const CLAVE_RECARGA = 'pvpc.recargado';

/**
 * Tras un despliegue, quien tenga la app abierta puede pedir ficheros con hash que ya no
 * existen. En ese caso se recarga la página una sola vez para obtener la versión nueva.
 */
function recargarSiFaltaModulo(error: { error: unknown }): void {
  const mensaje = String((error.error as Error)?.message ?? error.error);
  if (
    !/dynamically imported module|ChunkLoadError|Importing a module script failed/i.test(mensaje)
  ) {
    return;
  }
  if (sessionStorage.getItem(CLAVE_RECARGA)) return;
  sessionStorage.setItem(CLAVE_RECARGA, '1');
  location.reload();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withNavigationErrorHandler(recargarSiFaltaModulo),
    ),
    provideTransloco({
      config: {
        availableLangs: [...IDIOMAS],
        defaultLang: IDIOMA_POR_DEFECTO,
        fallbackLang: IDIOMA_POR_DEFECTO,
        reRenderOnLangChange: true,
        missingHandler: { useFallbackTranslation: true },
        prodMode: !isDevMode(),
      },
      loader: CargadorTraducciones,
    }),
  ],
};
