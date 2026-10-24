import { describe, expect, it } from 'vitest';
import { clasificar } from './umbrales';

// Precios del correo de n8n del 25/10/2026 (mínimo 0,0414, máximo 0,3468)
const MIN = 0.0414;
const MAX = 0.3468;

describe('clasificar', () => {
  it.each([
    [0.0414, 'barata', 'muy-barata'],
    [0.0545, 'barata', 'muy-barata'],
    [0.119, 'barata', 'normal'],
    [0.1776, 'media', 'normal'],
    [0.2326, 'media', 'normal'],
    [0.3095, 'cara', 'muy-cara'],
    [0.3468, 'cara', 'muy-cara'],
  ])('%s €/kWh → %s, %s', (precio, tramo, icono) => {
    expect(clasificar(precio, MIN, MAX)).toMatchObject({ tramo, icono });
  });

  it('separa color e icono: rojo sin aviso por debajo de 0,85', () => {
    expect(clasificar(MIN + 0.75 * (MAX - MIN), MIN, MAX)).toMatchObject({
      tramo: 'cara',
      icono: 'normal',
    });
  });

  it('un día con precio constante se considera barato', () => {
    expect(clasificar(0.1, 0.1, 0.1)).toMatchObject({ tramo: 'barata', ratio: 0 });
  });
});
