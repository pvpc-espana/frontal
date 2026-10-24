import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, Routes } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { esIdioma } from './core/config';
import { esFechaValida } from './core/fechas';
import { guardarIdioma, idiomaPreferido } from './core/idioma';
import { DiaComponent } from './dia/dia';

/** Activa el idioma de la URL o redirige al preferido si no es válido. */
const idiomaValido: CanActivateFn = (ruta) => {
  const idioma = ruta.paramMap.get('idioma');
  if (!esIdioma(idioma)) return inject(Router).createUrlTree(['/', idiomaPreferido()]);
  inject(TranslocoService).setActiveLang(idioma);
  document.documentElement.lang = idioma;
  guardarIdioma(idioma);
  return true;
};

const fechaValida: CanMatchFn = (_ruta, segmentos) => esFechaValida(segmentos[0]?.path);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: () => idiomaPreferido() },
  {
    path: ':idioma',
    canActivate: [idiomaValido],
    children: [
      { path: '', component: DiaComponent },
      { path: ':fecha', component: DiaComponent, canMatch: [fechaValida] },
      { path: '**', redirectTo: '' },
    ],
  },
];
