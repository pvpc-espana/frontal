import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

const CADA_MEDIA_HORA = 30 * 60_000;

/** Avisa cuando el service worker ha descargado una versión nueva de la aplicación. */
@Injectable({ providedIn: 'root' })
export class ActualizacionService {
  private readonly sw = inject(SwUpdate);
  readonly disponible = signal(false);

  constructor() {
    if (!this.sw.isEnabled) return;
    this.sw.versionUpdates
      .pipe(
        filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.disponible.set(true));
    // Si la caché del service worker queda inservible, sólo queda recargar
    this.sw.unrecoverable.pipe(takeUntilDestroyed()).subscribe(() => location.reload());

    const comprobar = () => {
      if (document.visibilityState === 'visible') this.sw.checkForUpdate().catch(() => undefined);
    };
    const intervalo = setInterval(comprobar, CADA_MEDIA_HORA);
    document.addEventListener('visibilitychange', comprobar);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', comprobar);
    });
  }

  async actualizar(): Promise<void> {
    try {
      await this.sw.activateUpdate();
    } finally {
      location.reload();
    }
  }
}
