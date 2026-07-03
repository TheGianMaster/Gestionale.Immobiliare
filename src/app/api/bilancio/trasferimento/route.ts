/**
 * POST /api/bilancio/trasferimento
 * Sposta fondi da un portafoglio di origine a una o più destinazioni, in modo
 * atomico: crea la Scheda nell'anagrafica dinamica 'trasferimenti' e ricalcola
 * i portafogli coinvolti. Vedi docs/12-BILANCIO.md §6.2 e roadmap T-115.
 *
 * Pattern di robustezza allineato al wizard "Nuovo Debito"
 * (src/app/api/automazioni/nuovo-debito/route.ts, T-102).
 *
 * Codici errore restituiti nel campo "codice":
 *   ERR_AUTH                   — utente non autenticato
 *   ERR_VALIDATION              — payload non valido (Zod o regole di business)
 *   ERR_ANA_TRASFERIMENTI       — anagrafica 'trasferimenti' non trovata/attiva (eseguire npm run import:anagrafiche)
 *   ERR_ANA_PORTAFOGLI          — anagrafica 'portafogli' non trovata/attiva
 *   ERR_PORTAFOGLIO_NON_TROVATO — portafoglio origine o una destinazione non esiste/non attivo
 *   ERR_FONDI_INSUFFICIENTI     — importo totale superiore ai fondi disponibili dell'origine
 *   ERR_CREATE_TRASFERIMENTO    — errore Mongoose nella creazione della scheda
 *   ERR_RICALCOLO_FONDI         — trasferimento creato ma il ricalcolo di uno o più portafogli è fallito
 *   ERR_INTERNO                 — errore interno imprevisto
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { getSchedaModel } from '@/models/Scheda'
import { ricalcolaFondiPortafoglio } from '@/lib/bilancio/ricalcolaFondiPortafoglio'

const destinazioneSchema = z.object({
  portafoglioDestinazioneId: z.string().min(1, 'ID portafoglio destinazione mancante'),
  importo: z.number({ invalid_type_error: 'Importo non valido' }).positive('L\'importo deve essere maggiore di zero'),
})

const bodySchema = z.object({
  portafoglioOrigineId: z.string().min(1, 'ID portafoglio origine mancante'),
  destinazioni: z.array(destinazioneSchema).min(1, 'Almeno una destinazione è richiesta'),
  note: z.string().optional(),
})

function errore(message: string, codice: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, codice, ...extra }, { status })
}

function testo(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errore('Utente non autenticato', 'ERR_AUTH', 401)
    }
    const userId = new mongoose.Types.ObjectId(session.user.id)

    const body = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return errore(
        'Dati non validi: ' + parsed.error.issues.map(i => i.message).join('; '),
        'ERR_VALIDATION'
      )
    }
    const { portafoglioOrigineId, destinazioni, note } = parsed.data

    if (!mongoose.isValidObjectId(portafoglioOrigineId)) {
      return errore('ID portafoglio di origine non valido', 'ERR_VALIDATION')
    }
    const destIds = destinazioni.map(d => d.portafoglioDestinazioneId)
    for (const id of destIds) {
      if (!mongoose.isValidObjectId(id)) {
        return errore('ID portafoglio di destinazione non valido', 'ERR_VALIDATION')
      }
    }
    if (destIds.includes(portafoglioOrigineId)) {
      return errore('Una destinazione non può coincidere con il portafoglio di origine', 'ERR_VALIDATION')
    }
    if (new Set(destIds).size !== destIds.length) {
      return errore('Non puoi selezionare più volte lo stesso portafoglio come destinazione', 'ERR_VALIDATION')
    }

    await connectDB()

    const [cfgTrasferimenti, cfgPortafogli] = await Promise.all([
      AnagraficaConfig.findOne({ slug: 'trasferimenti', attiva: true }).lean(),
      AnagraficaConfig.findOne({ slug: 'portafogli', attiva: true }).lean(),
    ])
    if (!cfgTrasferimenti) {
      return errore(
        "Anagrafica 'trasferimenti' non trovata o non attiva nel sistema. Eseguire npm run import:anagrafiche.",
        'ERR_ANA_TRASFERIMENTI', 500
      )
    }
    if (!cfgPortafogli) {
      return errore(
        "Anagrafica 'portafogli' non trovata o non attiva nel sistema. Eseguire npm run import:anagrafiche.",
        'ERR_ANA_PORTAFOGLI', 500
      )
    }

    const SchedaPortafogli = await getSchedaModel('portafogli')

    const origine = await SchedaPortafogli.findOne({ _id: portafoglioOrigineId, attiva: true }).lean()
    if (!origine) {
      return errore('Portafoglio di origine non trovato o non attivo', 'ERR_PORTAFOGLIO_NON_TROVATO', 404)
    }

    const destinazioniPortafogli = await SchedaPortafogli.find({
      _id: { $in: destIds }, attiva: true,
    }).lean()
    if (destinazioniPortafogli.length !== destIds.length) {
      return errore('Uno o più portafogli di destinazione non esistono o non sono attivi', 'ERR_PORTAFOGLIO_NON_TROVATO', 404)
    }
    const labelById = new Map(
      destinazioniPortafogli.map(p => [String(p._id), testo((p.dati as Record<string, unknown>)?.titolo, String(p._id))])
    )

    const importoTotale = destinazioni.reduce((tot, d) => tot + d.importo, 0)

    // Fondi correnti, ricalcolati al momento (non da valore stantio) prima di verificare la disponibilità
    const fondiCorrenti = await ricalcolaFondiPortafoglio(portafoglioOrigineId)
    if (importoTotale > fondiCorrenti) {
      return errore(
        `Fondi insufficienti: disponibili ${fondiCorrenti.toFixed(2)} €, richiesti ${importoTotale.toFixed(2)} €`,
        'ERR_FONDI_INSUFFICIENTI', 400,
        { fondiDisponibili: fondiCorrenti, importoRichiesto: importoTotale }
      )
    }

    const origineLabel = testo((origine.dati as Record<string, unknown>)?.titolo, String(origine._id))
    const titolo = `${origineLabel} → ${destIds.map(id => labelById.get(id)).join(', ')}`

    const SchedaTrasferimenti = await getSchedaModel('trasferimenti')
    const oggi = new Date().toISOString().split('T')[0]

    let trasferimento
    try {
      trasferimento = await SchedaTrasferimenti.create({
        anagraficaSlug: 'trasferimenti',
        dati: {
          titolo,
          portafoglio_origine: { id: portafoglioOrigineId, label: origineLabel },
          destinazioni: destinazioni.map(d => ({
            portafoglio: { id: d.portafoglioDestinazioneId, label: labelById.get(d.portafoglioDestinazioneId) },
            importo: d.importo,
          })),
          importo_totale: importoTotale,
          data: oggi,
          ...(note?.trim() ? { note: note.trim() } : {}),
        },
        creataDa: userId,
        modificataDa: userId,
        versione: 1,
      })
    } catch (e) {
      return errore('Impossibile creare il trasferimento. Verificare i dati inviati.', 'ERR_CREATE_TRASFERIMENTO', 500, {
        dettaglio: String(e),
      })
    }

    // Ricalcolo di tutti i portafogli coinvolti (l'origine viene ricalcolata di
    // nuovo per includere anche il trasferimento appena creato)
    const idsDaRicalcolare = [portafoglioOrigineId, ...new Set(destIds)]
    const saldi: Record<string, number> = {}
    const erroriRicalcolo: string[] = []

    for (const id of idsDaRicalcolare) {
      try {
        saldi[id] = await ricalcolaFondiPortafoglio(id)
      } catch (e) {
        erroriRicalcolo.push(`${id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (erroriRicalcolo.length > 0) {
      return errore(
        'Trasferimento creato ma il ricalcolo di uno o più portafogli è fallito. Esegui "npm run ricalcola:fondi" per riconciliare.',
        'ERR_RICALCOLO_FONDI', 500,
        { trasferimentoId: String(trasferimento._id), erroriRicalcolo, saldiParziali: saldi }
      )
    }

    return NextResponse.json({
      success: true,
      trasferimento,
      saldi,
    }, { status: 201 })

  } catch (e) {
    console.error('[POST /api/bilancio/trasferimento]', e)
    return errore('Errore interno imprevisto del server', 'ERR_INTERNO', 500, { dettaglio: String(e) })
  }
}
