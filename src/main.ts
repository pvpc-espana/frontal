import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Chrome puede emitir el evento de instalación antes de que arranque Angular: se guarda
// para mostrar después nuestro propio botón «Instalar» en lugar de la barra del navegador.
window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault();
  window.pvpcEventoInstalacion = evento as typeof window.pvpcEventoInstalacion;
  window.dispatchEvent(new Event('pvpc-instalable'));
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
