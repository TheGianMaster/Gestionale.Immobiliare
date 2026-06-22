/**
 * src/config/app.ts
 * Configurazione generale dell'applicazione.
 *
 * ——— LOGO ———
 * Per usare un logo personalizzato, inserire il file in:
 *   public/images/logo.png   (consigliato: 32×32 px, PNG o SVG trasparente)
 *
 * Se il file non esiste (o non si carica), viene mostrato il placeholder
 * con la lettera definita in `logoFallback`.
 */

export const APP_CONFIG = {
  /** Nome dell'app — appare in sidebar, header mobile, login page e metadata */
  nome: 'GianBusiness',

  /** Path del logo, relativo a /public */
  logo: '/images/logo.png',

  /** Lettera di fallback mostrata se il logo non è disponibile */
  logoFallback: 'G',
} as const

export type AppConfig = typeof APP_CONFIG
