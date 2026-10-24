/** Formato v1 publicado en datos.pvpc.linaresdigital.com. */
export interface DiaPvpc {
  fecha: string;
  zona: string;
  unidad: 'EUR/kWh';
  resolucion: 'PT1H' | 'PT15M';
  fuente: string;
  resumen: { min: number; max: number; media: number };
  precios: { inicio: string; precio: number }[];
}

export interface IndicePvpc {
  version: number;
  primera: string;
  ultima: string;
  actualizado: string;
}
