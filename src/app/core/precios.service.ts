import { Injectable } from '@angular/core';
import { URL_DATOS, URL_DATOS_RESPALDO } from './config';
import { fechaEnMadrid, sumarDias } from './fechas';
import { DiaPvpc, IndicePvpc } from './modelos';

export interface ResultadoDia {
  /** Precios del día, o `null` si aún no se han publicado. */
  datos: DiaPvpc | null;
  /** `true` si la descarga falló y se usa la copia guardada en el dispositivo. */
  guardados: boolean;
}

const PREFIJO_GUARDADO = 'pvpc.dia.';

/**
 * Lectura de los JSON publicados, con caché en memoria y precarga. Los precios de hoy y
 * de mañana se guardan además en el dispositivo para mostrarlos si falla la conexión.
 */
@Injectable({ providedIn: 'root' })
export class PreciosService {
  private readonly cache = new Map<string, Promise<ResultadoDia>>();
  private indice?: Promise<IndicePvpc | null>;

  dia(fecha: string): Promise<ResultadoDia> {
    let pendiente = this.cache.get(fecha);
    if (!pendiente) {
      const [anio, mes] = fecha.split('-');
      pendiente = this.leer<DiaPvpc>(`/${anio}/${mes}/${fecha}.json`, this.reciente(fecha)).then(
        (datos) => {
          if (datos) this.guardar(fecha, datos);
          return { datos, guardados: false };
        },
        (error) => {
          // Un fallo no se queda en la caché en memoria para poder reintentar
          this.cache.delete(fecha);
          const copia = this.leerGuardado(fecha);
          if (copia) return { datos: copia, guardados: true };
          throw error;
        },
      );
      this.cache.set(fecha, pendiente);
    }
    return pendiente;
  }

  precargar(...fechas: string[]): void {
    for (const fecha of fechas) this.dia(fecha).catch(() => undefined);
  }

  /** Olvida un día para volver a pedirlo (p. ej. si aún no estaba publicado). */
  olvidar(fecha: string): void {
    this.cache.delete(fecha);
  }

  indiceDisponible(): Promise<IndicePvpc | null> {
    this.indice ??= this.leer<IndicePvpc>('/indice.json', true).catch(() => null);
    return this.indice;
  }

  /** Guarda en el dispositivo los precios de hoy y mañana y borra los de días pasados. */
  private guardar(fecha: string, datos: DiaPvpc): void {
    const hoy = fechaEnMadrid();
    if (fecha < hoy || fecha > sumarDias(hoy, 1)) return;
    try {
      localStorage.setItem(PREFIJO_GUARDADO + fecha, JSON.stringify(datos));
      for (const clave of Object.keys(localStorage)) {
        if (clave.startsWith(PREFIJO_GUARDADO) && clave.slice(PREFIJO_GUARDADO.length) < hoy) {
          localStorage.removeItem(clave);
        }
      }
    } catch {
      // Almacenamiento lleno o no disponible: sólo se pierde el modo sin conexión
    }
  }

  private leerGuardado(fecha: string): DiaPvpc | null {
    try {
      const texto = localStorage.getItem(PREFIJO_GUARDADO + fecha);
      return texto ? (JSON.parse(texto) as DiaPvpc) : null;
    } catch {
      return null;
    }
  }

  /** Hoy y mañana pueden cambiar: se revalidan siempre con el servidor. */
  private reciente(fecha: string): boolean {
    return fecha >= sumarDias(fechaEnMadrid(), -1);
  }

  /** Fuentes en orden de preferencia; si la principal falla se pasa al respaldo. */
  private fuentes = [URL_DATOS, URL_DATOS_RESPALDO];

  private async leer<T>(ruta: string, revalidar: boolean): Promise<T | null> {
    let ultimoError: unknown;
    for (const base of [...this.fuentes]) {
      try {
        const respuesta = await fetch(base + ruta, { cache: revalidar ? 'no-cache' : 'default' });
        if (respuesta.status === 404) return null;
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        return (await respuesta.json()) as T;
      } catch (error) {
        ultimoError = error;
        // Durante el resto de la sesión se empieza directamente por la fuente que funciona
        if (base === this.fuentes[0] && this.fuentes.length > 1) {
          console.warn(`No se pudo leer ${base}${ruta}; se usa el respaldo`, error);
          this.fuentes = [...this.fuentes.slice(1), base];
        }
      }
    }
    throw ultimoError;
  }
}
