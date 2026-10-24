import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IconoComponent } from '../compartido/icono';
import { DeslizarDirective } from '../compartido/deslizar';
import { IDIOMA_POR_DEFECTO, LOCALES, esIdioma } from '../core/config';
import { fechaEnMadrid, horaEnMadrid, sumarDias } from '../core/fechas';
import { DiaPvpc, IndicePvpc } from '../core/modelos';
import { PreciosService } from '../core/precios.service';
import { Periodo, construirPeriodos } from './periodos';
import { NavegacionDiaComponent } from './navegacion-dia';
import { GraficoComponent } from './grafico';
import { RecordatoriosComponent } from './recordatorios';
import { Franja, TextosEvento, agruparFranjas } from '../core/calendario';

type Estado = 'cargando' | 'listo' | 'error';

@Component({
  selector: 'app-dia',
  imports: [
    RecordatoriosComponent,
    TranslocoPipe,
    IconoComponent,
    DeslizarDirective,
    NavegacionDiaComponent,
    GraficoComponent,
  ],
  templateUrl: './dia.html',
  styleUrl: './dia.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'teclado($event)' },
})
export class DiaComponent {
  private readonly precios = inject(PreciosService);
  private readonly router = inject(Router);
  /** Nombre de la aplicación traducido; se actualiza cuando llega cada idioma. */
  private readonly nombreApp = toSignal(inject(TranslocoService).selectTranslate('app.titulo'), {
    initialValue: '',
  });
  private readonly titulo = inject(Title);
  private readonly transloco = inject(TranslocoService);

  /** Parámetros de la ruta (`/:idioma/:fecha`); sin fecha se muestra hoy. */
  readonly idioma = input<string>(IDIOMA_POR_DEFECTO);
  readonly fecha = input<string>();

  protected readonly ahora = signal(Date.now());
  protected readonly hoy = computed(() => fechaEnMadrid(this.ahora()));
  protected readonly dia = computed(() => this.fecha() ?? this.hoy());
  protected readonly locale = computed(() => {
    const idioma = this.idioma();
    return LOCALES[esIdioma(idioma) ? idioma : IDIOMA_POR_DEFECTO];
  });

  protected readonly estado = signal<Estado>('cargando');
  /** Causa técnica del último error de carga, para poder diagnosticarlo. */
  protected readonly detalleError = signal('');
  protected readonly datos = signal<DiaPvpc | null>(null);
  protected readonly indice = signal<IndicePvpc | null>(null);
  /** Dirección de la última navegación, para animar la entrada del nuevo día. */
  protected readonly direccion = signal<'anterior' | 'siguiente' | null>(null);
  protected readonly seleccion = signal<number | null>(null);

  protected readonly periodos = computed(() =>
    construirPeriodos(this.dia(), this.datos(), this.locale()),
  );
  protected readonly conPrecios = computed(() => this.datos() !== null);

  protected readonly indiceActual = computed(() => {
    const t = this.ahora();
    return this.periodos().findIndex((p) => p.inicio <= t && t < p.fin);
  });

  /** Periodo destacado: el elegido, el actual (hoy) o el más barato (otros días). */
  protected readonly destacado = computed<{ periodo: Periodo; motivo: string } | null>(() => {
    const periodos = this.periodos();
    if (!this.conPrecios() || !periodos.length) return null;
    const elegido = this.seleccion();
    if (elegido !== null && periodos[elegido]) {
      return { periodo: periodos[elegido], motivo: 'destacado.seleccionada' };
    }
    if (this.indiceActual() >= 0) {
      return { periodo: periodos[this.indiceActual()], motivo: 'destacado.ahora' };
    }
    return { periodo: this.extremo('min')!, motivo: 'destacado.masBarata' };
  });

  protected readonly minimo = computed(() => this.extremo('min'));
  protected readonly maximo = computed(() => this.extremo('max'));

  protected readonly relativo = computed(() => {
    const diferencia = Math.round((Date.parse(this.dia()) - Date.parse(this.hoy())) / 86_400_000);
    return diferencia === 0
      ? 'hoy'
      : diferencia === 1
        ? 'manana'
        : diferencia === -1
          ? 'ayer'
          : null;
  });

  protected readonly fechaLarga = computed(() =>
    new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(Date.parse(this.dia())),
  );

  protected readonly puedeAnterior = computed(() => {
    const primera = this.indice()?.primera;
    return !primera || this.dia() > primera;
  });

  protected readonly puedeSiguiente = computed(() => {
    const manana = sumarDias(this.hoy(), 1);
    const ultima = this.indice()?.ultima;
    return this.dia() < (ultima && ultima > manana ? ultima : manana);
  });

  /** Viendo hoy, ¿ya se han publicado los precios de mañana? Hace latir el botón «siguiente». */
  protected readonly mananaDisponible = signal(false);
  private ultimaComprobacionManana = 0;

  /** Inicios de los periodos marcados para añadir al calendario. */
  protected readonly recordatorios = signal<ReadonlySet<number>>(new Set());

  protected readonly franjasRecordatorio = computed(() =>
    agruparFranjas(
      this.periodos()
        .filter((p) => p.precio !== null && this.recordatorios().has(p.inicio))
        .map((p) => ({
          inicio: p.inicio,
          fin: p.fin,
          precio: p.precio!,
          linea: `${p.etiqueta}${p.zona ? ' ' + p.zona : ''} · ${this.precio(p.precio)} €/kWh`,
        })),
    ),
  );

  protected readonly textosEvento = computed<TextosEvento>(() => {
    this.nombreApp(); // se recalcula cuando cambia el idioma
    return {
      titulo: (f: Franja) => {
        const min = Math.min(...f.precios);
        const max = Math.max(...f.precios);
        const precio = min === max ? this.precio(min) : `${this.precio(min)}–${this.precio(max)}`;
        return this.transloco.translate('recordatorios.evento', { precio });
      },
      descripcion: this.transloco.translate('recordatorios.descripcion'),
      url: `https://pvpc.linaresdigital.com/${this.idioma()}/${this.dia()}`,
    };
  });

  protected readonly horarioFranja = computed(() => {
    const hora = new Intl.DateTimeFormat(this.locale(), {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    return (f: Franja) =>
      `${hora.format(f.inicio)} – ${hora.format(f.fin).replace(/^00:00$/, '24:00')}`;
  });

  /** Sin datos: ¿todavía no se han publicado o no los habrá? */
  protected readonly pendiente = computed(() => this.dia() >= this.hoy());

  private readonly formatoPrecio = computed(
    () =>
      new Intl.NumberFormat(this.locale(), { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
  );

  constructor() {
    const reloj = setInterval(() => {
      this.ahora.set(Date.now());
      this.comprobarManana();
    }, 30_000);
    const alVolver = () => {
      if (document.visibilityState !== 'visible') return;
      this.ahora.set(Date.now());
      this.comprobarManana(true);
      // Si faltaban precios de hoy o mañana, pueden haberse publicado mientras tanto
      if (!this.datos() && this.pendiente()) this.cargar(this.dia(), true);
    };
    document.addEventListener('visibilitychange', alVolver);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(reloj);
      document.removeEventListener('visibilitychange', alVolver);
    });

    this.precios.indiceDisponible().then((indice) => this.indice.set(indice));
    effect(() => this.cargar(this.dia()));
    effect(() => {
      // Título de la pestaña con la fecha, traducido
      const fecha = new Intl.DateTimeFormat(this.locale(), {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(Date.parse(this.dia()));
      this.titulo.setTitle(`${fecha} · ${this.nombreApp()}`);
    });
  }

  protected precio(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '—' : this.formatoPrecio().format(valor);
  }

  protected ir(dias: -1 | 1): void {
    if (dias < 0 ? !this.puedeAnterior() : !this.puedeSiguiente()) return;
    this.direccion.set(dias < 0 ? 'anterior' : 'siguiente');
    this.navegar(sumarDias(this.dia(), dias));
  }

  protected irAHoy(): void {
    if (this.dia() === this.hoy()) return;
    this.direccion.set(this.dia() > this.hoy() ? 'anterior' : 'siguiente');
    this.navegar(this.hoy());
  }

  protected seleccionar(indice: number): void {
    this.seleccion.update((actual) => (actual === indice ? null : indice));
  }

  /** Sólo se pueden recordar horas con precio que aún no han terminado. */
  protected recordable(p: Periodo): boolean {
    return p.precio !== null && p.fin > this.ahora();
  }

  protected alternarRecordatorio(p: Periodo): void {
    this.recordatorios.update((actual) => {
      const nuevo = new Set(actual);
      if (!nuevo.delete(p.inicio)) nuevo.add(p.inicio);
      return nuevo;
    });
  }

  /** Marca las horas «de las más baratas» (icono ✅) que aún no han pasado. */
  protected marcarBaratas(): void {
    this.recordatorios.set(
      new Set(
        this.periodos()
          .filter((p) => this.recordable(p) && p.clase?.icono === 'muy-barata')
          .map((p) => p.inicio),
      ),
    );
  }

  protected limpiarRecordatorios(): void {
    this.recordatorios.set(new Set());
  }

  protected reintentar(): void {
    this.cargar(this.dia(), true);
  }

  protected teclado(e: KeyboardEvent): void {
    const objetivo = e.target as HTMLElement | null;
    if (e.altKey || e.ctrlKey || e.metaKey || objetivo?.closest('input, select, textarea')) return;
    if (e.key === 'ArrowLeft') this.ir(-1);
    else if (e.key === 'ArrowRight') this.ir(1);
  }

  private navegar(fecha: string): void {
    const destino = fecha === this.hoy() ? [this.idioma()] : [this.idioma(), fecha];
    this.router.navigate(['/', ...destino]);
  }

  /**
   * Desde las 20:00 (hora peninsular), viendo el día de hoy ya cargado, comprueba cada
   * 5 minutos si se han publicado los precios de mañana (Red Eléctrica los publica a
   * partir de esa hora) para avisar con el botón «siguiente».
   */
  private async comprobarManana(forzar = false): Promise<void> {
    const ahora = Date.now();
    if (this.mananaDisponible() || this.dia() !== this.hoy() || this.estado() !== 'listo') return;
    if (horaEnMadrid(ahora) < 20) return;
    if (!forzar && ahora - this.ultimaComprobacionManana < 5 * 60_000) return;
    this.ultimaComprobacionManana = ahora;
    const manana = sumarDias(this.hoy(), 1);
    this.precios.olvidar(manana);
    try {
      const datos = await this.precios.dia(manana);
      if (datos && this.dia() === sumarDias(manana, -1)) this.mananaDisponible.set(true);
    } catch {
      // Sin conexión: se reintentará en la próxima comprobación
    }
  }

  private async cargar(fecha: string, forzar = false): Promise<void> {
    if (forzar) this.precios.olvidar(fecha);
    this.seleccion.set(null);
    if (!forzar) this.recordatorios.set(new Set());
    this.estado.set('cargando');
    try {
      const datos = await this.precios.dia(fecha);
      if (fecha !== this.dia()) return; // el usuario ya ha cambiado de día
      this.datos.set(datos);
      this.estado.set('listo');
      this.mananaDisponible.set(false);
      this.comprobarManana(true);
      // Precarga los días vecinos para que el deslizamiento sea instantáneo
      const vecinos = [];
      if (this.puedeAnterior()) vecinos.push(sumarDias(fecha, -1));
      if (this.puedeSiguiente()) vecinos.push(sumarDias(fecha, 1));
      this.precios.precargar(...vecinos);
    } catch (error) {
      if (fecha !== this.dia()) return;
      this.detalleError.set(error instanceof Error ? error.message : String(error));
      this.datos.set(null);
      this.estado.set('error');
    }
  }

  private extremo(tipo: 'min' | 'max'): Periodo | null {
    const conPrecio = this.periodos().filter((p) => p.precio !== null);
    if (!conPrecio.length) return null;
    return conPrecio.reduce((a, b) =>
      tipo === 'min' ? (b.precio! < a.precio! ? b : a) : b.precio! > a.precio! ? b : a,
    );
  }
}
