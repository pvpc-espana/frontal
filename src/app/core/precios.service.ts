import { Injectable } from '@angular/core';
import { URL_DATOS } from './config';
import { fechaEnMadrid, sumarDias } from './fechas';
import { DiaPvpc, IndicePvpc } from './modelos';

/** Lectura de los JSON publicados, con caché en memoria y precarga. */
@Injectable({ providedIn: 'root' })
export class PreciosService {
  private readonly cache = new Map<string, Promise<DiaPvpc | null>>();
  private indice?: Promise<IndicePvpc | null>;

  /** Precios de un día, o `null` si no hay datos publicados para él. */
  dia(fecha: string): Promise<DiaPvpc | null> {
    let pendiente = this.cache.get(fecha);
    if (!pendiente) {
      const [anio, mes] = fecha.split('-');
      pendiente = this.leer<DiaPvpc>(
        `${URL_DATOS}/${anio}/${mes}/${fecha}.json`,
        this.reciente(fecha),
      );
      // Un error de red no se queda en caché para poder reintentar
      pendiente.catch(() => this.cache.delete(fecha));
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
    this.indice ??= this.leer<IndicePvpc>(`${URL_DATOS}/indice.json`, true).catch(() => null);
    return this.indice;
  }

  /** Hoy y mañana pueden cambiar: se revalidan siempre con el servidor. */
  private reciente(fecha: string): boolean {
    return fecha >= sumarDias(fechaEnMadrid(), -1);
  }

  private async leer<T>(url: string, revalidar: boolean): Promise<T | null> {
    const respuesta = await fetch(url, { cache: revalidar ? 'no-cache' : 'default' });
    if (respuesta.status === 404) return null;
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return (await respuesta.json()) as T;
  }
}
