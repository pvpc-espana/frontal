import { describe, expect, it } from 'vitest';
import { DiaPvpc } from '../core/modelos';
import { construirPeriodos } from './periodos';

describe('construirPeriodos', () => {
  it('sin datos genera igualmente todas las horas del día', () => {
    const periodos = construirPeriodos('2026-10-25', null, 'es-ES');
    expect(periodos).toHaveLength(25);
    expect(periodos.every((p) => p.precio === null && p.clase === null)).toBe(true);
    expect(periodos.at(-1)?.etiquetaFin).toBe('24:00');
  });

  it('distingue la hora repetida del día de 25 horas', () => {
    const periodos = construirPeriodos('2026-10-25', null, 'es-ES');
    expect(periodos.slice(0, 4).map((p) => p.etiqueta)).toEqual([
      '00:00',
      '01:00',
      '02:00',
      '02:00',
    ]);
    expect(periodos.slice(0, 4).map((p) => p.zona)).toEqual([null, null, 'CEST', 'CET']);
  });

  it('asigna precios y clasificación', () => {
    const datos: DiaPvpc = {
      fecha: '2026-10-24',
      zona: 'peninsula',
      unidad: 'EUR/kWh',
      resolucion: 'PT1H',
      fuente: 'REE',
      resumen: { min: 0.1, max: 0.3, media: 0.2 },
      precios: Array.from({ length: 24 }, (_, h) => ({
        inicio: `2026-10-24T${String(h).padStart(2, '0')}:00:00+02:00`,
        precio: h === 0 ? 0.1 : h === 23 ? 0.3 : 0.2,
      })),
    };
    const periodos = construirPeriodos('2026-10-24', datos, 'es-ES');
    expect(periodos).toHaveLength(24);
    expect(periodos[0].clase?.tramo).toBe('barata');
    expect(periodos[12].clase?.tramo).toBe('media');
    expect(periodos[23].clase?.icono).toBe('muy-cara');
  });
});
