/**
 * src/lib/notifiche.ts
 * Utility per creare notifiche in-app dall API route.
 * Usare nelle API route per triggerare notifiche sugli eventi di sistema.
 */

import connectDB from '@/lib/mongodb'
import { Notifica } from '@/models/Notifica'
import type { TipoNotifica, AzioneNotifica } from '@/models/Notifica'

interface CreaNotificaOpts {
  userId: string
  titolo: string
  messaggio?: string
  tipo?: TipoNotifica
  azione: AzioneNotifica
  schedaId?: string
  anagraficaSlug?: string
  eventoId?: string
}

/**
 * Crea una notifica in-app per un utente.
 * Non lancia eccezioni -- errori vengono loggati silenziosamente.
 */
export async function creaNotifica(opts: CreaNotificaOpts): Promise<void> {
  try {
    await connectDB()

    const scadenzaTTL = new Date()
    scadenzaTTL.setDate(scadenzaTTL.getDate() + 30)

    await Notifica.create({
      userId:         opts.userId,
      titolo:         opts.titolo,
      messaggio:      opts.messaggio,
      tipo:           opts.tipo ?? 'info',
      azione:         opts.azione,
      schedaId:       opts.schedaId,
      anagraficaSlug: opts.anagraficaSlug,
      eventoId:       opts.eventoId,
      letta:          false,
      scadenzaTTL,
    })
  } catch (err) {
    console.error('[creaNotifica] Errore:', err)
    // Non propagare: la notifica e opzionale rispetto all azione principale
  }
}
