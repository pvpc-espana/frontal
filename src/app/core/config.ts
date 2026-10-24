/** URL base de los datos publicados por el núcleo. */
export const URL_DATOS = 'https://datos.pvpc.linaresdigital.com/v1';

/**
 * Respaldo si el dominio de datos no responde (p. ej. certificado HTTPS aún sin emitir):
 * los mismos ficheros servidos directamente desde el repositorio.
 */
export const URL_DATOS_RESPALDO =
  'https://raw.githubusercontent.com/pvpc-espana/datos/main/docs/v1';

export const IDIOMAS = ['es', 'en', 'fr', 'de', 'it', 'pt'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = 'es';

/** Configuración regional usada por Intl para cada idioma. */
export const LOCALES: Record<Idioma, string> = {
  es: 'es-ES',
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
};

export const NOMBRES_IDIOMA: Record<Idioma, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
};

export function esIdioma(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (IDIOMAS as readonly string[]).includes(valor);
}
