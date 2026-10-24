import { describe, expect, it } from 'vitest';
import { esFechaValida, fechaEnMadrid, medianoche, periodosDelDia, sumarDias } from './fechas';

describe('fechas', () => {
  it('calcula la fecha en hora peninsular', () => {
    // 23:30 UTC del 24 de julio ya es día 25 en Madrid (UTC+2)
    expect(fechaEnMadrid(Date.UTC(2026, 6, 24, 23, 30))).toBe('2026-07-25');
  });

  it('valida fechas ISO', () => {
    expect(esFechaValida('2026-10-25')).toBe(true);
    expect(esFechaValida('2026-02-30')).toBe(false);
    expect(esFechaValida('25-10-2026')).toBe(false);
  });

  it('suma días cruzando meses', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('obtiene la medianoche con el desfase correcto', () => {
    expect(new Date(medianoche('2026-10-25')).toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(new Date(medianoche('2026-10-26')).toISOString()).toBe('2026-10-25T23:00:00.000Z');
  });

  it('cuenta 23, 24 y 25 horas según el cambio de hora', () => {
    expect(periodosDelDia('2026-03-29')).toHaveLength(23);
    expect(periodosDelDia('2026-10-24')).toHaveLength(24);
    expect(periodosDelDia('2026-10-25')).toHaveLength(25);
    expect(periodosDelDia('2026-10-24', 15)).toHaveLength(96);
  });
});
