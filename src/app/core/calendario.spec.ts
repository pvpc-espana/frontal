import { describe, expect, it } from 'vitest';
import {
  agruparFranjas,
  escaparIcs,
  fechaIcs,
  generarIcs,
  plegar,
  urlGoogleCalendar,
} from './calendario';

const H = 3_600_000;
const BASE = Date.UTC(2026, 9, 25, 8); // 10:00 en Madrid (CET tras el cambio de hora)
const periodo = (n: number) => ({
  inicio: BASE + n * H,
  fin: BASE + (n + 1) * H,
  precio: n / 100,
  linea: `h${n}`,
});
const textos = {
  titulo: () => 'Luz barata, ¡ahora!',
  descripcion: 'PVPC',
  url: 'https://pvpc.linaresdigital.com/es/2026-10-25',
};

describe('calendario', () => {
  it('agrupa horas consecutivas en franjas', () => {
    const franjas = agruparFranjas([periodo(3), periodo(0), periodo(1), periodo(5)]);
    expect(franjas.map((f) => f.lineas)).toEqual([['h0', 'h1'], ['h3'], ['h5']]);
    expect(franjas[0].precios).toEqual([0, 0.01]);
    expect(franjas[0].fin - franjas[0].inicio).toBe(2 * H);
  });

  it('formatea fechas en UTC', () => {
    expect(fechaIcs(BASE)).toBe('20261025T080000Z');
  });

  it('escapa texto', () => {
    expect(escaparIcs('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('pliega líneas largas a 75 octetos sin partir caracteres', () => {
    const plegada = plegar('DESCRIPTION:' + 'ñ'.repeat(80));
    const lineas = plegada.split('\r\n');
    expect(lineas.length).toBeGreaterThan(1);
    for (const l of lineas) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(lineas.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(
      'DESCRIPTION:' + 'ñ'.repeat(80),
    );
  });

  it('genera un evento con aviso por franja', () => {
    const ics = generarIcs(agruparFranjas([periodo(0), periodo(1), periodo(4)]), textos, BASE);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.match(/TRIGGER:PT0M/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART:20261025T080000Z\r\nDTEND:20261025T100000Z');
    expect(ics).toContain('SUMMARY:Luz barata\\, ¡ahora!');
  });

  it('crea el enlace de Google Calendar', () => {
    const url = new URL(urlGoogleCalendar(agruparFranjas([periodo(0)])[0], textos));
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20261025T080000Z/20261025T090000Z');
  });
});
