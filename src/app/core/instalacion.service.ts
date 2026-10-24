import { Injectable, signal } from '@angular/core';

/** Evento de Chromium para mostrar el diálogo de instalación cuando queramos. */
export interface EventoInstalacion extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Lo guarda `main.ts` si el navegador lo emite antes de arrancar Angular. */
    pvpcEventoInstalacion?: EventoInstalacion;
  }
}

/**
 * Instalación como aplicación (PWA): en Chrome, Edge y Samsung Internet con el diálogo
 * del navegador; en iPhone/iPad, con instrucciones (Safari no tiene diálogo propio).
 */
@Injectable({ providedIn: 'root' })
export class InstalacionService {
  private evento = window.pvpcEventoInstalacion;

  private readonly instalada =
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  /** iPhone/iPad (los iPad recientes se presentan como Mac con pantalla táctil). */
  readonly esIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  /** Hay que mostrar el botón «Instalar». */
  readonly disponible = signal(!this.instalada && (!!this.evento || this.esIos));

  constructor() {
    window.addEventListener('pvpc-instalable', () => {
      this.evento = window.pvpcEventoInstalacion;
      if (!this.instalada) this.disponible.set(true);
    });
    window.addEventListener('appinstalled', () => this.disponible.set(false));
  }

  /** Abre el diálogo del navegador. Devuelve `false` si hay que mostrar instrucciones. */
  async instalar(): Promise<boolean> {
    if (!this.evento) return false;
    await this.evento.prompt();
    const { outcome } = await this.evento.userChoice;
    // El evento sólo se puede usar una vez
    this.evento = window.pvpcEventoInstalacion = undefined;
    if (outcome === 'accepted') this.disponible.set(false);
    return true;
  }
}
