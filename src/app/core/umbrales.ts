/**
 * Clasificación visual de cada periodo según su posición relativa en el rango del día,
 * r = (precio − mín) / (máx − mín), con los mismos umbrales que el flujo de n8n.
 */
export const UMBRALES = {
  /** Color: verde si r ≤ barata; naranja si r ≤ media; rojo en otro caso. */
  tramo: { barata: 0.33, media: 0.66 },
  /** Icono: ✅ si r < muyBarata; ⚠️ si r > muyCara; 🔘 en otro caso. */
  icono: { muyBarata: 0.15, muyCara: 0.85 },
} as const;

export type Tramo = 'barata' | 'media' | 'cara';
export type Icono = 'muy-barata' | 'normal' | 'muy-cara';

export interface Clasificacion {
  tramo: Tramo;
  icono: Icono;
  /** Posición relativa en el rango del día (0 = mínimo, 1 = máximo). */
  ratio: number;
}

export function clasificar(precio: number, min: number, max: number): Clasificacion {
  const ratio = max > min ? (precio - min) / (max - min) : 0;
  const tramo: Tramo =
    ratio <= UMBRALES.tramo.barata ? 'barata' : ratio <= UMBRALES.tramo.media ? 'media' : 'cara';
  const icono: Icono =
    ratio < UMBRALES.icono.muyBarata
      ? 'muy-barata'
      : ratio > UMBRALES.icono.muyCara
        ? 'muy-cara'
        : 'normal';
  return { tramo, icono, ratio };
}
