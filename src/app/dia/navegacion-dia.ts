import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconoComponent } from '../compartido/icono';

/** Barra de navegación entre días (se usa arriba y abajo de la vista). */
@Component({
  selector: 'app-navegacion-dia',
  imports: [TranslocoPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navegacion" [attr.aria-label]="'navegacion.etiqueta' | transloco">
      <button
        type="button"
        class="boton-dia"
        (click)="anterior.emit()"
        [disabled]="!puedeAnterior()"
        [attr.aria-label]="'navegacion.anterior' | transloco"
      >
        <app-icono nombre="anterior" />
        <span class="texto">{{ 'navegacion.anteriorCorto' | transloco }}</span>
      </button>

      <button
        type="button"
        class="centro"
        (click)="hoy.emit()"
        [disabled]="relativo() === 'hoy'"
        [attr.aria-label]="'navegacion.irAHoy' | transloco"
      >
        @if (relativo(); as r) {
          <span class="relativo" [class.es-hoy]="r === 'hoy'">{{
            'relativo.' + r | transloco
          }}</span>
        } @else {
          <span class="relativo volver"
            ><app-icono nombre="calendario" />{{ 'navegacion.hoy' | transloco }}</span
          >
        }
        @if (mostrarFecha()) {
          <span class="fecha">{{ fechaLarga() }}</span>
        }
      </button>

      <button
        type="button"
        class="boton-dia"
        [class.latido]="destacarSiguiente()"
        (click)="siguiente.emit()"
        [disabled]="!puedeSiguiente()"
        [attr.aria-label]="
          (destacarSiguiente() ? 'navegacion.mananaDisponible' : 'navegacion.siguiente') | transloco
        "
        [title]="destacarSiguiente() ? ('navegacion.mananaDisponible' | transloco) : ''"
      >
        <span class="texto">{{ 'navegacion.siguienteCorto' | transloco }}</span>
        <app-icono nombre="siguiente" />
      </button>
    </nav>
  `,
  styles: `
    .navegacion {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.5rem;
    }
    button {
      font: inherit;
      color: inherit;
      border: 0;
      background: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    button:disabled {
      cursor: default;
    }
    .boton-dia {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      min-block-size: 2.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 999px;
      background: var(--superficie);
      border: 1px solid var(--borde);
      box-shadow: var(--sombra-suave);
      font-weight: 600;
      font-size: 0.875rem;
      transition:
        transform 0.15s ease,
        background-color 0.2s ease,
        opacity 0.2s ease;
    }
    .boton-dia:not(:disabled):hover {
      background: var(--superficie-alta);
    }
    .boton-dia:not(:disabled):active {
      transform: scale(0.94);
    }
    .boton-dia:disabled {
      opacity: 0.35;
    }
    /* Latido: avisa de que ya están publicados los precios del día siguiente */
    .boton-dia.latido {
      color: #fff;
      background: var(--acento);
      border-color: transparent;
      animation: latido 1.6s ease-in-out infinite;
    }
    .boton-dia.latido:not(:disabled):hover {
      background: var(--acento);
      filter: brightness(1.1);
    }
    @keyframes latido {
      0%,
      40%,
      100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 color-mix(in oklab, var(--acento) 55%, transparent);
      }
      12% {
        transform: scale(1.1);
        box-shadow: 0 0 0 0.45rem color-mix(in oklab, var(--acento) 30%, transparent);
      }
      24% {
        transform: scale(1.02);
      }
      32% {
        transform: scale(1.08);
        box-shadow: 0 0 1.1rem 0.6rem color-mix(in oklab, var(--acento) 0%, transparent);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .boton-dia.latido {
        animation: none;
        box-shadow: 0 0 0 0.3rem color-mix(in oklab, var(--acento) 35%, transparent);
      }
    }
    .texto {
      display: none;
    }
    @media (min-width: 30rem) {
      .texto {
        display: inline;
      }
    }
    .centro {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
      min-inline-size: 0;
      padding: 0.25rem;
      border-radius: 1rem;
    }
    .relativo {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--acento);
    }
    .relativo.volver {
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: var(--acento-suave);
    }
    .fecha {
      font-size: 1rem;
      font-weight: 650;
      text-align: center;
      text-wrap: balance;
    }
    .fecha::first-letter {
      text-transform: uppercase;
    }
  `,
})
export class NavegacionDiaComponent {
  readonly fechaLarga = input.required<string>();
  readonly relativo = input<string | null>(null);
  readonly puedeAnterior = input(true);
  readonly puedeSiguiente = input(true);
  readonly mostrarFecha = input(true);
  /** Hace latir el botón «siguiente» (p. ej. cuando ya hay precios de mañana). */
  readonly destacarSiguiente = input(false);
  readonly anterior = output<void>();
  readonly siguiente = output<void>();
  readonly hoy = output<void>();
}
