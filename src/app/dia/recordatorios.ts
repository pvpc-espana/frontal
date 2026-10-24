import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconoComponent } from '../compartido/icono';
import { Franja, TextosEvento, generarIcs, urlGoogleCalendar } from '../core/calendario';

/**
 * Barra inferior con las horas marcadas y diálogo para añadirlas al calendario:
 * fichero .ics (calendario del dispositivo) o un enlace de Google Calendar por franja.
 */
@Component({
  selector: 'app-recordatorios',
  imports: [TranslocoPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cantidad() > 0) {
      <div class="hueco" aria-hidden="true"></div>
      <div class="barra" role="region" [attr.aria-label]="'recordatorios.titulo' | transloco">
        <span class="resumen">
          <app-icono nombre="campana-activa" />
          <span class="contador" aria-hidden="true">{{ cantidad() }}</span>
          <span class="texto-resumen">
            {{ 'recordatorios.seleccionadas' | transloco: { n: cantidad() } }}
          </span>
        </span>
        <button
          type="button"
          class="quitar"
          (click)="limpiar.emit()"
          [attr.aria-label]="'recordatorios.quitar' | transloco"
          [title]="'recordatorios.quitar' | transloco"
        >
          <app-icono nombre="cerrar" />
        </button>
        <button type="button" class="principal" (click)="abrir()">
          <app-icono nombre="calendario" />
          {{ 'recordatorios.anadir' | transloco }}
        </button>
      </div>
    }

    <dialog
      #dialogo
      (click)="cerrarSiFuera($event)"
      [attr.aria-labelledby]="'titulo-recordatorios'"
    >
      <div class="hoja">
        <header>
          <h2 id="titulo-recordatorios">{{ 'recordatorios.dialogoTitulo' | transloco }}</h2>
          <button
            type="button"
            class="cerrar"
            (click)="cerrar()"
            [attr.aria-label]="'recordatorios.cerrar' | transloco"
          >
            <app-icono nombre="cerrar" />
          </button>
        </header>
        <p class="ayuda">
          {{ 'recordatorios.dialogoTexto' | transloco: { n: franjas().length } }}
        </p>

        <button type="button" class="opcion destacada" (click)="descargar()">
          <app-icono nombre="descargar" />
          <span>
            <strong>{{ 'recordatorios.ics' | transloco }}</strong>
            <small>{{ 'recordatorios.icsDetalle' | transloco }}</small>
          </span>
        </button>

        <h3>{{ 'recordatorios.google' | transloco }}</h3>
        <ul class="franjas">
          @for (f of enlaces(); track f.url) {
            <li>
              <a class="opcion" [href]="f.url" target="_blank" rel="noopener">
                <app-icono nombre="calendario" />
                <span>
                  <strong>{{ f.horario }}</strong>
                  <small>{{ f.titulo }}</small>
                </span>
                <app-icono nombre="externo" class="externo" />
              </a>
            </li>
          }
        </ul>
      </div>
    </dialog>
  `,
  styles: `
    .hueco {
      block-size: 5rem;
    }
    .barra {
      position: fixed;
      z-index: 10;
      inset-inline: max(0.75rem, env(safe-area-inset-left));
      inset-block-end: max(0.75rem, env(safe-area-inset-bottom));
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-inline-size: 34rem;
      margin-inline: auto;
      padding: 0.5rem 0.5rem 0.5rem 1rem;
      border: 1px solid var(--borde);
      border-radius: 999px;
      background: color-mix(in oklab, var(--superficie) 88%, transparent);
      backdrop-filter: blur(14px);
      box-shadow: 0 12px 32px -12px rgb(0 0 0 / 0.35);
      animation: subir 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes subir {
      from {
        opacity: 0;
        translate: 0 1rem;
      }
    }
    .resumen {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      flex: 1;
      min-inline-size: 0;
      font-size: 0.85rem;
      font-weight: 650;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      app-icono {
        color: var(--acento);
      }
    }
    button,
    a {
      font: inherit;
      color: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .contador {
      display: grid;
      place-items: center;
      min-inline-size: 1.5rem;
      block-size: 1.5rem;
      padding-inline: 0.35rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 750;
      color: var(--acento);
      background: var(--acento-suave);
    }
    /* En pantallas estrechas sólo se ve el contador; el texto queda para lectores */
    .texto-resumen {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    @media (min-width: 30rem) {
      .contador {
        display: none;
      }
      .texto-resumen {
        position: static;
        inline-size: auto;
        block-size: auto;
        clip-path: none;
      }
    }
    .quitar {
      display: grid;
      place-items: center;
      inline-size: 2.5rem;
      block-size: 2.5rem;
      flex: none;
      border: 0;
      border-radius: 50%;
      background: none;
      color: var(--tenue);
    }
    .quitar:hover {
      background: var(--superficie-alta);
    }
    .principal {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      min-block-size: 2.5rem;
      padding: 0 1rem;
      border: 0;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #fff;
      background: var(--acento);
      white-space: nowrap;
    }
    dialog {
      inline-size: min(100%, 30rem);
      max-block-size: 85dvh;
      margin: auto auto 0;
      padding: 0;
      border: 1px solid var(--borde);
      border-radius: 1.5rem 1.5rem 0 0;
      color: var(--texto);
      background: var(--superficie);
      box-shadow: 0 -12px 40px -12px rgb(0 0 0 / 0.4);
    }
    dialog[open] {
      animation: subir 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    dialog::backdrop {
      background: rgb(8 12 24 / 0.45);
      backdrop-filter: blur(2px);
    }
    @media (min-width: 40rem) {
      dialog {
        margin: auto;
        border-radius: 1.5rem;
      }
    }
    .hoja {
      display: grid;
      gap: 0.75rem;
      padding: 1.25rem 1.25rem max(1.25rem, env(safe-area-inset-bottom));
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    h2 {
      margin: 0;
      font-size: 1.15rem;
    }
    h3 {
      margin: 0.5rem 0 0;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--tenue);
    }
    .cerrar {
      display: grid;
      place-items: center;
      inline-size: 2.5rem;
      block-size: 2.5rem;
      border: 0;
      border-radius: 50%;
      background: var(--superficie-alta);
    }
    .ayuda {
      margin: 0;
      font-size: 0.9rem;
      color: var(--tenue);
    }
    .franjas {
      display: grid;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .opcion {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      inline-size: 100%;
      padding: 0.8rem 1rem;
      border: 1px solid var(--borde);
      border-radius: 1rem;
      background: var(--superficie);
      text-align: start;
      text-decoration: none;
      app-icono {
        font-size: 1.15rem;
        color: var(--acento);
      }
      span {
        display: grid;
        flex: 1;
      }
      small {
        font-size: 0.8rem;
        color: var(--tenue);
      }
      .externo {
        font-size: 0.95rem;
        color: var(--tenue);
      }
    }
    .opcion:hover {
      background: var(--superficie-alta);
    }
    .opcion.destacada {
      border-color: color-mix(in oklab, var(--acento) 40%, var(--borde));
      background: var(--acento-suave);
    }
  `,
})
export class RecordatoriosComponent {
  readonly cantidad = input(0);
  readonly franjas = input<Franja[]>([]);
  readonly textos = input.required<TextosEvento>();
  /** Horario legible de una franja, p. ej. «10:00 – 17:00». */
  readonly horario = input.required<(f: Franja) => string>();
  readonly nombreFichero = input('pvpc.ics');
  readonly limpiar = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly enlaces = computed(() =>
    this.franjas().map((f) => ({
      horario: this.horario()(f),
      titulo: this.textos().titulo(f),
      url: urlGoogleCalendar(f, this.textos()),
    })),
  );

  protected abrir(): void {
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  /** Un clic en el fondo (fuera de la hoja) cierra el diálogo. */
  protected cerrarSiFuera(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.cerrar();
  }

  protected descargar(): void {
    const ics = generarIcs(this.franjas(), this.textos());
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = this.nombreFichero();
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    this.cerrar();
  }
}
