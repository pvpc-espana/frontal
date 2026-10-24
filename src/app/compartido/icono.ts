import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NombreIcono =
  | 'anterior'
  | 'siguiente'
  | 'rayo'
  | 'sol'
  | 'luna'
  | 'auto'
  | 'idioma'
  | 'muy-barata'
  | 'normal'
  | 'muy-cara'
  | 'reloj'
  | 'reintentar'
  | 'calendario'
  | 'campana'
  | 'campana-activa'
  | 'estrella'
  | 'descargar'
  | 'externo'
  | 'cerrar'
  | 'instalar'
  | 'compartir'
  | 'nuevo';

/** Iconos SVG propios: aspecto idéntico en todos los sistemas (a diferencia de los emojis). */
@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: inline-flex;
      inline-size: 1.25em;
      block-size: 1.25em;
      flex: none;
    }
    svg {
      inline-size: 100%;
      block-size: 100%;
    }
  `,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @switch (nombre()) {
        @case ('anterior') {
          <path d="M15 18l-6-6 6-6" />
        }
        @case ('siguiente') {
          <path d="M9 18l6-6-6-6" />
        }
        @case ('rayo') {
          <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" fill="currentColor" stroke="none" />
        }
        @case ('sol') {
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        }
        @case ('luna') {
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        }
        @case ('auto') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none" />
        }
        @case ('idioma') {
          <circle cx="12" cy="12" r="9" />
          <path
            d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"
          />
        }
        @case ('muy-barata') {
          <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />
          <path d="M7.5 12.3l3 3 6-6.3" stroke="var(--sobre-color, #fff)" stroke-width="2.4" />
        }
        @case ('normal') {
          <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" opacity=".55" />
        }
        @case ('muy-cara') {
          <path
            d="M10.3 3.9L2.4 17.6A2 2 0 004.1 20.6h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
            fill="currentColor"
            stroke="none"
          />
          <path d="M12 9v4.5M12 17h.01" stroke="var(--sobre-color, #fff)" stroke-width="2.4" />
        }
        @case ('reloj') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('reintentar') {
          <path d="M3 12a9 9 0 0115.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 01-15.5 6.2L3 16M3 21v-5h5" />
        }
        @case ('calendario') {
          <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
          <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
        }
        @case ('campana') {
          <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0" />
        }
        @case ('campana-activa') {
          <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9z" fill="currentColor" />
          <path d="M10.3 21a1.9 1.9 0 003.4 0" />
        }
        @case ('estrella') {
          <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" />
        }
        @case ('descargar') {
          <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
        }
        @case ('externo') {
          <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
        }
        @case ('cerrar') {
          <path d="M6 6l12 12M18 6L6 18" />
        }
        @case ('instalar') {
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <path d="M12 7v7M9 11.5l3 3 3-3M10.5 18.5h3" />
        }
        @case ('compartir') {
          <path
            d="M12 3v12M8 7l4-4 4 4M7 10H5.5A1.5 1.5 0 004 11.5v8A1.5 1.5 0 005.5 21h13a1.5 1.5 0 001.5-1.5v-8a1.5 1.5 0 00-1.5-1.5H17"
          />
        }
        @case ('nuevo') {
          <path
            d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z"
          />
        }
      }
    </svg>
  `,
})
export class IconoComponent {
  readonly nombre = input.required<NombreIcono>();
}
