import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { from } from 'rxjs';
import { recargarSiFaltaModulo } from './recarga';
import { IDIOMA_POR_DEFECTO, Idioma, esIdioma } from './config';

const CLAVE = 'pvpc.idioma';

/**
 * Las traducciones se empaquetan como módulos con hash en el nombre: cada versión de la
 * aplicación carga siempre sus propios textos, sin mezclarse con ficheros en caché.
 */
@Injectable({ providedIn: 'root' })
export class CargadorTraducciones implements TranslocoLoader {
  getTranslation(idioma: string) {
    return from(
      import(`../../i18n/${idioma}.json`).then(
        (m: { default: Translation }) => m.default,
        (error) => {
          recargarSiFaltaModulo(error);
          throw error;
        },
      ),
    );
  }
}

/** Idioma guardado por el usuario o, si no hay, el del navegador. */
export function idiomaPreferido(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (esIdioma(guardado)) return guardado;
  } catch {
    // Sin almacenamiento disponible
  }
  for (const preferido of navigator.languages ?? [navigator.language]) {
    const base = preferido.slice(0, 2).toLowerCase();
    if (esIdioma(base)) return base;
  }
  return IDIOMA_POR_DEFECTO;
}

export function guardarIdioma(idioma: Idioma): void {
  try {
    localStorage.setItem(CLAVE, idioma);
  } catch {
    // Sin almacenamiento disponible
  }
}
