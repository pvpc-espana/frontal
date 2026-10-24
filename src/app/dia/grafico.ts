import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Periodo } from './periodos';

/** Gráfico de barras de los periodos del día, con barras pulsables. */
@Component({
  selector: 'app-grafico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lienzo" [style.--columnas]="periodos().length" [class.vacio]="!hayPrecios()">
      @if (hayPrecios()) {
        <div class="linea-media" [style.bottom.%]="altura(media())" aria-hidden="true"></div>
      }
      @for (p of periodos(); track p.inicio; let i = $index) {
        <button
          type="button"
          class="barra"
          [class]="p.clase?.tramo ?? 'sin-dato'"
          [class.actual]="i === actual()"
          [class.elegida]="i === seleccion()"
          [class.pasada]="actual() >= 0 && i < actual()"
          [style.--alto.%]="hayPrecios() ? altura(p.precio) : 18 + ((i * 37) % 30)"
          [disabled]="!hayPrecios()"
          [attr.aria-label]="
            p.etiqueta +
            (p.zona ? ' ' + p.zona : '') +
            (p.precio !== null ? ' · ' + formatear()(p.precio) : '')
          "
          [attr.aria-pressed]="i === seleccion()"
          (click)="seleccionar.emit(i)"
        ></button>
      }
    </div>
    <div class="eje" [style.--columnas]="periodos().length" aria-hidden="true">
      @for (marca of marcas(); track marca.indice) {
        <span [style.grid-column]="marca.indice + 1">{{ marca.texto }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .lienzo {
      position: relative;
      display: grid;
      grid-template-columns: repeat(var(--columnas), 1fr);
      align-items: end;
      gap: clamp(1px, 0.6vw, 4px);
      block-size: clamp(9rem, 32vw, 13rem);
      padding-block-start: 0.75rem;
    }
    .barra {
      position: relative;
      block-size: max(var(--alto), 3%);
      min-inline-size: 0;
      padding: 0;
      border: 0;
      border-radius: 6px 6px 3px 3px;
      background: var(--color-tramo);
      opacity: 0.85;
      cursor: pointer;
      transition:
        block-size 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
        opacity 0.2s ease,
        transform 0.15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .barra:hover {
      opacity: 1;
    }
    .barra.pasada {
      opacity: 0.4;
    }
    .barra.actual,
    .barra.elegida {
      opacity: 1;
    }
    .barra.actual::after {
      content: '';
      position: absolute;
      inset-inline: 50%;
      inset-block-start: -0.6rem;
      inline-size: 0.4rem;
      block-size: 0.4rem;
      translate: -50% 0;
      border-radius: 50%;
      background: var(--texto);
    }
    .barra.elegida {
      outline: 2px solid var(--texto);
      outline-offset: 2px;
    }
    .barra.barata {
      --color-tramo: var(--barata);
    }
    .barra.media {
      --color-tramo: var(--media);
    }
    .barra.cara {
      --color-tramo: var(--cara);
    }
    .barra.sin-dato {
      --color-tramo: var(--borde);
      cursor: default;
    }
    @media (min-width: 60rem) {
      .lienzo {
        block-size: 17rem;
      }
    }
    .vacio .barra {
      animation: latido 1.6s ease-in-out infinite alternate;
    }
    @keyframes latido {
      to {
        opacity: 0.45;
      }
    }
    .linea-media {
      position: absolute;
      inset-inline: 0;
      border-block-start: 1.5px dashed var(--tenue);
      opacity: 0.6;
      pointer-events: none;
    }
    .eje {
      display: grid;
      grid-template-columns: repeat(var(--columnas), 1fr);
      margin-block-start: 0.4rem;
      font-size: 0.7rem;
      color: var(--tenue);
      font-variant-numeric: tabular-nums;
    }
    .eje span {
      white-space: nowrap;
    }
    @media (prefers-reduced-motion: reduce) {
      .barra {
        transition: none;
      }
      .vacio .barra {
        animation: none;
      }
    }
  `,
})
export class GraficoComponent {
  readonly periodos = input.required<Periodo[]>();
  readonly actual = input(-1);
  readonly seleccion = input<number | null>(null);
  readonly media = input<number | null>(null);
  readonly formatear = input<(v: number) => string>(String);
  readonly seleccionar = output<number>();

  protected readonly hayPrecios = computed(() => this.periodos().some((p) => p.precio !== null));
  private readonly maximo = computed(() =>
    Math.max(...this.periodos().map((p) => p.precio ?? 0), 0.0001),
  );

  /** Etiquetas del eje cada 6 horas (o cada 24 cuartos). */
  protected readonly marcas = computed(() => {
    const periodos = this.periodos();
    const paso = Math.max(1, Math.round(periodos.length / 4));
    return periodos
      .map((p, indice) => ({ indice, texto: p.etiqueta.slice(0, 5) }))
      .filter((m) => m.indice % paso === 0);
  });

  protected altura(precio: number | null): number {
    return precio === null ? 0 : Math.max(0, (precio / this.maximo()) * 100);
  }
}
