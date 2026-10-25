import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiaPvpc } from './modelos';
import { PreciosService } from './precios.service';

const dia = (fecha: string): DiaPvpc => ({
  fecha,
  zona: 'peninsula',
  unidad: 'EUR/kWh',
  resolucion: 'PT1H',
  fuente: 'REE',
  resumen: { min: 0.1, max: 0.2, media: 0.15 },
  precios: [],
});

const respuesta = (cuerpo: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => cuerpo }) as Response;

describe('PreciosService', () => {
  let fetchSimulado: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-25T10:00:00+01:00'));
    localStorage.clear();
    fetchSimulado = vi.fn();
    vi.stubGlobal('fetch', fetchSimulado);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('guarda hoy y mañana en el dispositivo, pero no otros días', async () => {
    fetchSimulado.mockImplementation(async (url: string) =>
      respuesta(dia(url.match(/(\d{4}-\d{2}-\d{2})\.json/)![1])),
    );
    const servicio = new PreciosService();
    await servicio.dia('2026-10-25');
    await servicio.dia('2026-10-26');
    await servicio.dia('2026-10-20');
    expect(Object.keys(localStorage).sort()).toEqual([
      'pvpc.dia.2026-10-25',
      'pvpc.dia.2026-10-26',
    ]);
  });

  it('borra los días guardados que ya han pasado', async () => {
    localStorage.setItem('pvpc.dia.2026-10-24', JSON.stringify(dia('2026-10-24')));
    fetchSimulado.mockResolvedValue(respuesta(dia('2026-10-25')));
    await new PreciosService().dia('2026-10-25');
    expect(localStorage.getItem('pvpc.dia.2026-10-24')).toBeNull();
  });

  it('si falla la descarga usa la copia guardada y lo indica', async () => {
    localStorage.setItem('pvpc.dia.2026-10-25', JSON.stringify(dia('2026-10-25')));
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'));
    const resultado = await new PreciosService().dia('2026-10-25');
    expect(resultado.guardados).toBe(true);
    expect(resultado.datos?.fecha).toBe('2026-10-25');
  });

  it('sin copia guardada, el fallo se propaga y se puede reintentar', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'));
    const servicio = new PreciosService();
    await expect(servicio.dia('2026-10-25')).rejects.toThrow('Failed to fetch');
    fetchSimulado.mockResolvedValue(respuesta(dia('2026-10-25')));
    expect((await servicio.dia('2026-10-25')).guardados).toBe(false);
  });

  it('un día no publicado (404) no es un fallo', async () => {
    fetchSimulado.mockResolvedValue(respuesta(null, 404));
    expect(await new PreciosService().dia('2026-10-26')).toEqual({ datos: null, guardados: false });
  });
});
