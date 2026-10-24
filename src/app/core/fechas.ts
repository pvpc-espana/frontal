/** Utilidades de fechas en hora peninsular (Europe/Madrid). Las fechas son ISO AAAA-MM-DD. */

export const ZONA = 'Europe/Madrid';

const formatoFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatoDesfase = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  timeZoneName: 'longOffset',
});

/** Fecha ISO de un instante en hora peninsular. */
export function fechaEnMadrid(instante: Date | number = Date.now()): string {
  return formatoFecha.format(instante);
}

const formatoHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA,
  hour: 'numeric',
  hourCycle: 'h23',
});

/** Hora (0-23) de un instante en hora peninsular. */
export function horaEnMadrid(instante: Date | number = Date.now()): number {
  return Number(formatoHora.format(instante));
}

export function esFechaValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Desfase de Madrid respecto a UTC, en minutos, en un instante dado. */
export function desfaseMinutos(instante: number): number {
  const nombre = formatoDesfase
    .formatToParts(instante)
    .find((p) => p.type === 'timeZoneName')?.value;
  const partes = /GMT([+-])(\d{2}):(\d{2})/.exec(nombre ?? '');
  if (!partes) return 0;
  const minutos = Number(partes[2]) * 60 + Number(partes[3]);
  return partes[1] === '-' ? -minutos : minutos;
}

/** Instante (ms) de la medianoche peninsular de una fecha. */
export function medianoche(fecha: string): number {
  const [a, m, d] = fecha.split('-').map(Number);
  const utc = Date.UTC(a, m - 1, d);
  const aproximado = utc - desfaseMinutos(utc) * 60_000;
  return utc - desfaseMinutos(aproximado) * 60_000;
}

/** Inicios (ms) de los periodos de un día: 23, 24 o 25 horas (o ×4 si son cuartos). */
export function periodosDelDia(fecha: string, minutos = 60): number[] {
  const inicio = medianoche(fecha);
  const fin = medianoche(sumarDias(fecha, 1));
  const periodos: number[] = [];
  for (let t = inicio; t < fin; t += minutos * 60_000) periodos.push(t);
  return periodos;
}
