const CLAVE = 'pvpc.recargado';

/**
 * Tras un despliegue, quien tenga la app abierta puede pedir ficheros con hash que ya no
 * existen. En ese caso se recarga la página una sola vez para obtener la versión nueva.
 * Devuelve `true` si el error era de ese tipo.
 */
export function recargarSiFaltaModulo(error: unknown): boolean {
  const mensaje = String((error as Error)?.message ?? error);
  if (
    !/dynamically imported module|ChunkLoadError|Importing a module script failed/i.test(mensaje)
  ) {
    return false;
  }
  try {
    if (sessionStorage.getItem(CLAVE)) return true;
    sessionStorage.setItem(CLAVE, '1');
  } catch {
    // Sin almacenamiento: se recarga igualmente
  }
  location.reload();
  return true;
}
