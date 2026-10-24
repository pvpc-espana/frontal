import { Clasificacion, clasificar } from '../core/umbrales';
import { ZONA, periodosDelDia } from '../core/fechas';
import { DiaPvpc } from '../core/modelos';

export interface Periodo {
  inicio: number;
  fin: number;
  etiqueta: string;
  /** Zona horaria (CEST/CET) sólo para distinguir la hora repetida del día de 25 horas. */
  zona: string | null;
  etiquetaFin: string;
  precio: number | null;
  clase: Clasificacion | null;
}

/**
 * Periodos del día con su precio y clasificación. Sin datos se generan igualmente
 * las horas del día (23, 24 o 25) para que el diseño no cambie.
 */
export function construirPeriodos(fecha: string, datos: DiaPvpc | null, locale: string): Periodo[] {
  const minutos = datos?.resolucion === 'PT15M' ? 15 : 60;
  const precios = new Map((datos?.precios ?? []).map((p) => [Date.parse(p.inicio), p.precio]));
  const inicios = datos
    ? [...precios.keys()].sort((a, b) => a - b)
    : periodosDelDia(fecha, minutos);
  const hora = new Intl.DateTimeFormat(locale, {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const zona = new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, timeZoneName: 'short' });
  const nombreZona = (t: number) =>
    zona.formatToParts(t).find((p) => p.type === 'timeZoneName')?.value ?? null;

  const etiquetas = inicios.map((t) => hora.format(t));
  const repetidas = new Set(etiquetas.filter((e, i) => etiquetas.indexOf(e) !== i));
  const resumen = datos?.resumen;

  return inicios.map((inicio, i) => {
    const fin = inicio + minutos * 60_000;
    const precio = precios.get(inicio) ?? null;
    return {
      inicio,
      fin,
      etiqueta: etiquetas[i],
      // El día de 25 horas la hora repetida se distingue por su zona (CEST/CET)
      zona: repetidas.has(etiquetas[i]) ? nombreZona(inicio) : null,
      etiquetaFin: hora.format(fin).replace(/^00:00$/, '24:00'),
      precio,
      clase: precio !== null && resumen ? clasificar(precio, resumen.min, resumen.max) : null,
    };
  });
}
