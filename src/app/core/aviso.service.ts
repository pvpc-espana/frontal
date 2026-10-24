import { Injectable, signal } from '@angular/core';

export interface Aviso {
  texto: string;
  tipo: 'info' | 'exito';
  /** Cambia en cada aviso para reiniciar la animación aunque el texto se repita. */
  id: number;
}

const DURACION_MS = 2800;

/** Mensajes emergentes breves (tipo «toast») que desaparecen solos. */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  readonly actual = signal<Aviso | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;
  private contador = 0;

  mostrar(texto: string, tipo: Aviso['tipo'] = 'info'): void {
    clearTimeout(this.temporizador);
    this.actual.set({ texto, tipo, id: ++this.contador });
    this.temporizador = setTimeout(() => this.actual.set(null), DURACION_MS);
  }
}
