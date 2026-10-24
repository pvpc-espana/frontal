import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { IDIOMA_POR_DEFECTO, Idioma, esIdioma } from './config';

const CLAVE = 'pvpc.idioma';

@Injectable({ providedIn: 'root' })
export class CargadorTraducciones implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  getTranslation(idioma: string) {
    return this.http.get<Translation>(`/i18n/${idioma}.json`);
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
