import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';
import { IconoComponent } from './compartido/icono';
import { IDIOMAS, IDIOMA_POR_DEFECTO, Idioma, NOMBRES_IDIOMA, esIdioma } from './core/config';
import { TemaService } from './core/tema.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TranslocoPipe, IconoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly tema = inject(TemaService);
  protected readonly idioma = toSignal(
    inject(TranslocoService).langChanges$.pipe(map((i) => (esIdioma(i) ? i : IDIOMA_POR_DEFECTO))),
    { initialValue: IDIOMA_POR_DEFECTO },
  );
  protected readonly idiomas = IDIOMAS;
  protected readonly nombres = NOMBRES_IDIOMA;

  protected cambiarIdioma(evento: Event): void {
    const idioma = (evento.target as HTMLSelectElement).value;
    if (!esIdioma(idioma)) return;
    const [, , ...resto] = this.router.url.split('?')[0].split('/');
    this.router.navigate(['/', idioma as Idioma, ...resto.filter(Boolean)]);
  }
}
