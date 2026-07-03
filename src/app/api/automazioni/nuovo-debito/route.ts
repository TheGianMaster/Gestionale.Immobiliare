/**
 * POST /api/automazioni/nuovo-debito
 * Wizard "Nuovo Debito":
 *   1. Crea una scheda Debito
 *   2. Crea un Portafogli collegato al debito
 *   3. Crea un Ricavo "apertura debito" che punta al portafogli
 *
 * Codici errore restituiti nel campo "codice":
 *   ERR_AUTH            — utente non autenticato
 *   ERR_VALIDATION      — campo obbligatorio mancante o non valido
 *   ERR_ANA_DEBITI      — anagrafica "debiti" non trovata/attiva nel DB
 *   ERR_ANA_PORTAFOGLI  — anagrafica "portafogli" non trovata/attiva nel DB
 *   ERR_ANA_RICAVI      — anagrafica "ricavi" non trovata/attiva nel DB
 *   ERR_CREATE_DEBITO   — errore Mongoose nella creazione del debito
 *   ERR_CREATE_PORTAFOGLI — errore nella creazione del portafogli (debito già creato viene eliminato)
 *   ERR_CREATE_RICAVO   — errore nella creazione del ricavo (debito + portafogli eliminati)
 *   ERR_INTERNO         — errore interno imprevisto
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { getSchedaModel } from '@/models/Scheda'
import mongoose from 'mongoose'

function errore(message: string, codice: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, codice, ...extra }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errore('Utente non autenticato', 'ERR_AUTH', 401)
    }
    const userId = new mongoose.Types.ObjectId(session.user.id)

    const body = await req.json()
    const {
      tipoDebito, tipoBancario, tipoTasso,
      tassoInteresse, totaleAddebitato, durataAnni,
      rataMensile, dataPrimaRata, giornoPromemoria,
      titolo, importoErogato, scadenzaPrevista,
      referente, casaRiferimento, note,
    } = body

    // ── Validazione ──────────────────────────────────────────────────────────
    if (!tipoDebito || !['infruttifero', 'bancario'].includes(tipoDebito))
      return errore('Tipo debito mancante o non valido (infruttifero | bancario)', 'ERR_VALIDATION')
    if (!titolo?.trim())
      return errore('Titolo obbligatorio', 'ERR_VALIDATION')
    if (!importoErogato || isNaN(Number(importoErogato)) || Number(importoErogato) <= 0)
      return errore('Importo erogato mancante o non valido', 'ERR_VALIDATION')

    if (tipoDebito === 'bancario') {
      if (!tipoBancario || !['mutuo', 'finanziamento'].includes(tipoBancario))
        return errore('Tipo bancario mancante (mutuo | finanziamento)', 'ERR_VALIDATION')
      if (!tipoTasso || !['alla_francese', 'altro'].includes(tipoTasso))
        return errore('Tipo tasso mancante (alla_francese | altro)', 'ERR_VALIDATION')
      if (!tassoInteresse || isNaN(Number(tassoInteresse)))
        return errore('Tasso di interesse mancante o non valido', 'ERR_VALIDATION')
      if (!totaleAddebitato || isNaN(Number(totaleAddebitato)) || Number(totaleAddebitato) <= 0)
        return errore('Totale addebitato mancante o non valido', 'ERR_VALIDATION')
      if (!durataAnni || isNaN(Number(durataAnni)) || Number(durataAnni) <= 0)
        return errore('Durata in anni mancante o non valida', 'ERR_VALIDATION')
      if (!rataMensile || isNaN(Number(rataMensile)) || Number(rataMensile) <= 0)
        return errore('Rata mensile mancante o non valida', 'ERR_VALIDATION')
      if (!dataPrimaRata)
        return errore('Data prima rata obbligatoria', 'ERR_VALIDATION')
      const g = Number(giornoPromemoria)
      if (!giornoPromemoria || isNaN(g) || g < 1 || g > 31)
        return errore('Giorno promemoria non valido (1-31)', 'ERR_VALIDATION')
    }

    // ── Connessione e verifica anagrafiche ───────────────────────────────────
    await connectDB()

    const [cfgDebiti, cfgPortafogli, cfgRicavi] = await Promise.all([
      AnagraficaConfig.findOne({ slug: 'debiti',     attiva: true }).lean(),
      AnagraficaConfig.findOne({ slug: 'portafogli', attiva: true }).lean(),
      AnagraficaConfig.findOne({ slug: 'ricavi',     attiva: true }).lean(),
    ])

    if (!cfgDebiti)
      return errore("Anagrafica 'debiti' non trovata o non attiva nel sistema. Eseguire npm run import:anagrafiche.", 'ERR_ANA_DEBITI', 500)
    if (!cfgPortafogli)
      return errore("Anagrafica 'portafogli' non trovata o non attiva nel sistema. Eseguire npm run import:anagrafiche.", 'ERR_ANA_PORTAFOGLI', 500)
    if (!cfgRicavi)
      return errore("Anagrafica 'ricavi' non trovata o non attiva nel sistema. Eseguire npm run import:anagrafiche.", 'ERR_ANA_RICAVI', 500)

    const [SchedaDebiti, SchedaPortafogli, SchedaRicavi] = await Promise.all([
      getSchedaModel('debiti'),
      getSchedaModel('portafogli'),
      getSchedaModel('ricavi'),
    ])

    // ── 1. Crea Debito ───────────────────────────────────────────────────────
    const titoloDebito = titolo.trim()
    const datiDebito: Record<string, unknown> = {
      titolo: titoloDebito,
      tipo_debito: tipoDebito === 'infruttifero' ? 'infruttifero' : tipoBancario,
      importo_erogato: Number(importoErogato),
      data_apertura: new Date().toISOString().split('T')[0],
    }
    if (referente)          datiDebito.referente          = referente
    if (casaRiferimento)    datiDebito.casa_riferimento   = casaRiferimento
    if (note?.trim())       datiDebito.note               = note.trim()
    if (scadenzaPrevista)   datiDebito.scadenza_prevista  = scadenzaPrevista

    if (tipoDebito === 'bancario') {
      datiDebito.tipo_tasso        = tipoTasso === 'alla_francese' ? 'alla francese' : 'altro'
      datiDebito.tasso_interesse   = Number(tassoInteresse)
      datiDebito.totale_addebitato = Number(totaleAddebitato)
      datiDebito.rata_mensile      = Number(rataMensile)
      datiDebito.durata_anni       = Number(durataAnni)
      datiDebito.data_prima_rata   = dataPrimaRata
      datiDebito.giorno_promemoria = Number(giornoPromemoria)
    }

    let debito
    try {
      debito = await SchedaDebiti.create({
        anagraficaSlug: 'debiti',
        dati: datiDebito,
        creataDa: userId, modificataDa: userId, versione: 1,
      })
    } catch (e) {
      return NextResponse.json({
        error: 'Impossibile creare il debito. Verificare che i campi siano corretti.',
        codice: 'ERR_CREATE_DEBITO',
        dettaglio: String(e),
      }, { status: 500 })
    }

    // ── 2. Crea Portafogli ───────────────────────────────────────────────────
    const titoloPortafogli = `Portafogli di debito - ${titoloDebito}`
    let portafogli
    try {
      portafogli = await SchedaPortafogli.create({
        anagraficaSlug: 'portafogli',
        dati: {
          titolo: titoloPortafogli,
          debito_associato: { id: String(debito._id), label: titoloDebito },
          data_apertura: new Date().toISOString().split('T')[0],
        },
        creataDa: userId, modificataDa: userId, versione: 1,
      })
    } catch (e) {
      await SchedaDebiti.findByIdAndDelete(debito._id).catch(() => {})
      return NextResponse.json({
        error: 'Impossibile creare il portafogli. Il debito creato è stato eliminato automaticamente.',
        codice: 'ERR_CREATE_PORTAFOGLI',
        dettaglio: String(e),
        nota: `ID debito eliminato: ${debito._id}`,
      }, { status: 500 })
    }

    // ── 3. Crea Ricavo ───────────────────────────────────────────────────────
    const titoloRicavo = `apertura debito ${titoloDebito}`
    const oggi = new Date().toISOString().split('T')[0]
    const datiRicavo: Record<string, unknown> = {
      titolo:          titoloRicavo,
      importo_totale:  Number(importoErogato),
      fondi_destinazione: [
        {
          fondo:   { id: String(portafogli._id), label: titoloPortafogli },
          importo: Number(importoErogato),
        },
      ],
      stato_ricavo: 'incassata',
      tipo_ricavo:  'debito',
      descrizione:  `incasso dell'importo erogato dal debito: ${titoloDebito}`,
      data:         oggi,
    }
    if (casaRiferimento) datiRicavo.casa = casaRiferimento

    let ricavo
    try {
      ricavo = await SchedaRicavi.create({
        anagraficaSlug: 'ricavi',
        dati: datiRicavo,
        creataDa: userId, modificataDa: userId, versione: 1,
      })
    } catch (e) {
      await Promise.all([
        SchedaDebiti.findByIdAndDelete(debito._id).catch(() => {}),
        SchedaPortafogli.findByIdAndDelete(portafogli._id).catch(() => {}),
      ])
      return NextResponse.json({
        error: 'Impossibile creare il ricavo. Debito e portafogli creati sono stati eliminati automaticamente.',
        codice: 'ERR_CREATE_RICAVO',
        dettaglio: String(e),
        nota: `ID debito e portafogli eliminati: ${debito._id}, ${portafogli._id}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Debito "${titoloDebito}" creato con successo insieme al portafogli e al ricavo di apertura.`,
      ids: {
        debito:     String(debito._id),
        portafogli: String(portafogli._id),
        ricavo:     String(ricavo._id),
      },
    })

  } catch (e) {
    console.error('[POST /api/automazioni/nuovo-debito]', e)
    return NextResponse.json({
      error: 'Errore interno imprevisto del server.',
      codice: 'ERR_INTERNO',
      dettaglio: String(e),
    }, { status: 500 })
  }
}
