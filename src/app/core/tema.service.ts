import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type ModoTema = 'auto' | 'claro' | 'oscuro';
const CLAVE = 'pvpc.tema';
const COLOR_BARRA = { claro: '#f5f6fb', oscuro: '#0b1020' } as const;

/** Tema claro/oscuro: automático según el sistema o elegido a mano. */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  private readonly consulta = this.documento.defaultView?.matchMedia(
    '(prefers-color-scheme: dark)',
  );
  private readonly sistemaOscuro = signal(this.consulta?.matches ?? false);

  readonly modo = signal<ModoTema>(leerModo());

  constructor() {
    this.consulta?.addEventListener('change', (e) => this.sistemaOscuro.set(e.matches));
    effect(() => {
      const modo = this.modo();
      const tema = modo === 'auto' ? (this.sistemaOscuro() ? 'oscuro' : 'claro') : modo;
      const raiz = this.documento.documentElement;
      raiz.dataset['tema'] = tema;
      raiz.style.colorScheme = tema === 'oscuro' ? 'dark' : 'light';
      this.documento
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', COLOR_BARRA[tema]);
      try {
        if (modo === 'auto') localStorage.removeItem(CLAVE);
        else localStorage.setItem(CLAVE, modo);
      } catch {
        // Almacenamiento no disponible (modo privado): la preferencia dura la sesión
      }
    });
  }

  /** Recorre Automático → Claro → Oscuro. */
  siguiente(): void {
    const orden: ModoTema[] = ['auto', 'claro', 'oscuro'];
    this.modo.update((m) => orden[(orden.indexOf(m) + 1) % orden.length]);
  }
}

function leerModo(): ModoTema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return guardado === 'claro' || guardado === 'oscuro' ? guardado : 'auto';
  } catch {
    return 'auto';
  }
}
