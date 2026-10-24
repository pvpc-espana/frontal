/** Generación de recordatorios de calendario (iCalendar .ics y enlaces de Google Calendar). */

export interface PeriodoRecordatorio {
  inicio: number;
  fin: number;
  precio: number;
  /** Texto de la línea de detalle, p. ej. «14:00 · 0,0414 €/kWh». */
  linea: string;
}

/** Bloque de periodos seleccionados consecutivos: un evento y un aviso por bloque. */
export interface Franja {
  inicio: number;
  fin: number;
  precios: number[];
  lineas: string[];
}

export interface TextosEvento {
  /** Título del evento para una franja. */
  titulo: (franja: Franja) => string;
  /** Texto que precede al detalle de precios en la descripción. */
  descripcion: string;
  url: string;
}

const DOMINIO_UID = 'pvpc.linaresdigital.com';

/** Agrupa periodos consecutivos en franjas. */
export function agruparFranjas(periodos: PeriodoRecordatorio[]): Franja[] {
  const ordenados = [...periodos].sort((a, b) => a.inicio - b.inicio);
  const franjas: Franja[] = [];
  for (const p of ordenados) {
    const ultima = franjas.at(-1);
    if (ultima && ultima.fin === p.inicio) {
      ultima.fin = p.fin;
      ultima.precios.push(p.precio);
      ultima.lineas.push(p.linea);
    } else {
      franjas.push({ inicio: p.inicio, fin: p.fin, precios: [p.precio], lineas: [p.linea] });
    }
  }
  return franjas;
}

/** Instante en formato iCalendar UTC: 20261025T120000Z. */
export function fechaIcs(instante: number): string {
  return new Date(instante)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** Escapa texto según RFC 5545 (barra, punto y coma, coma y saltos de línea). */
export function escaparIcs(texto: string): string {
  return texto.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
}

/** Pliega líneas a 75 octetos como exige RFC 5545 (sin partir caracteres UTF-8). */
export function plegar(linea: string): string {
  const codificador = new TextEncoder();
  const partes: string[] = [];
  let actual = '';
  for (const caracter of linea) {
    const limite = partes.length === 0 ? 75 : 74; // las continuaciones empiezan por un espacio
    if (codificador.encode(actual + caracter).length > limite) {
      partes.push(actual);
      actual = '';
    }
    actual += caracter;
  }
  partes.push(actual);
  return partes.join('\r\n ');
}

function descripcion(franja: Franja, textos: TextosEvento): string {
  return [textos.descripcion, '', ...franja.lineas, '', textos.url].join('\n');
}

/** Calendario .ics con un evento por franja y un aviso al comienzo de cada una. */
export function generarIcs(franjas: Franja[], textos: TextosEvento, ahora = Date.now()): string {
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PVPC España//pvpc.linaresdigital.com//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const franja of franjas) {
    const titulo = escaparIcs(textos.titulo(franja));
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${fechaIcs(franja.inicio)}-${fechaIcs(franja.fin)}@${DOMINIO_UID}`,
      `DTSTAMP:${fechaIcs(ahora)}`,
      `DTSTART:${fechaIcs(franja.inicio)}`,
      `DTEND:${fechaIcs(franja.fin)}`,
      `SUMMARY:${titulo}`,
      `DESCRIPTION:${escaparIcs(descripcion(franja, textos))}`,
      `URL:${textos.url}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${titulo}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lineas.push('END:VCALENDAR');
  return lineas.map(plegar).join('\r\n') + '\r\n';
}

/** Enlace para crear la franja en Google Calendar (un evento por enlace). */
export function urlGoogleCalendar(franja: Franja, textos: TextosEvento): string {
  const parametros = new URLSearchParams({
    action: 'TEMPLATE',
    text: textos.titulo(franja),
    dates: `${fechaIcs(franja.inicio)}/${fechaIcs(franja.fin)}`,
    details: descripcion(franja, textos),
  });
  return `https://calendar.google.com/calendar/render?${parametros}`;
}
