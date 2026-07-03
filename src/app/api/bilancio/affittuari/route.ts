/**
 * GET /api/bilancio/affittuari
 * Lista affittuari attualmente in affitto, con la casa collegata.
 *
 * Correzione rispetto al roadmap originale: l'anagrafica 'affittuari' (e
 * 'case') esiste già ed è completa — vedi docs/12-BILANCIO.md §5.5 — quindi
 * questo endpoint NON è un placeholder puro: legge dati reali. Se in un
 * ambiente l'anagrafica non fosse ancora presente, ritorna comunque
 * `{ affittuari: [] }` con lo stesso contratto di risposta, così la UI
 * (T-124) non andrà toccata in futuro.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { getSchedaModel } from '@/models/Scheda'

function testo(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await connectDB()

    const cfg = await AnagraficaConfig.findOne({ slug: 'affittuari', attiva: true }).lean()
    if (!cfg) {
      // TODO: collegare ad anagrafica Affittuari quando disponibile (rif. T-111, T-119).
      // Ambiente senza l'anagrafica ancora importata: contratto di risposta già definitivo.
      return NextResponse.json({ affittuari: [] })
    }

    const [SchedaAffittuari, SchedaCase] = await Promise.all([
      getSchedaModel('affittuari'),
      getSchedaModel('case'),
    ])

    const oggi = new Date().toISOString().split('T')[0]

    // "Attivo" = senza data di uscita prevista, oppure con data di uscita futura/odierna
    const affittuariRaw = await SchedaAffittuari.find({
      attiva: true,
      $or: [
        { 'dati.uscita_prevista': { $exists: false } },
        { 'dati.uscita_prevista': null },
        { 'dati.uscita_prevista': '' },
        { 'dati.uscita_prevista': { $gte: oggi } },
      ],
    }).lean()

    const caseRaw = await SchedaCase.find({ attiva: true }).lean()
    const casaPerAffittuario = new Map<string, string>()
    for (const c of caseRaw) {
      const dati = (c.dati ?? {}) as Record<string, unknown>
      const refs = (dati.affittuari ?? []) as { id?: string }[]
      const via = testo(dati.via, 'Casa')
      for (const r of refs) {
        if (r.id) casaPerAffittuario.set(r.id, via)
      }
    }

    const affittuari = affittuariRaw.map(a => {
      const dati = (a.dati ?? {}) as Record<string, unknown>
      const id = String(a._id)
      const nomeCompleto = `${testo(dati.nome)} ${testo(dati.cognome)}`.trim()
      return {
        id,
        nome: nomeCompleto || 'Affittuario',
        casa: casaPerAffittuario.get(id) ?? null,
        dataInizio: testo(dati.entrato_il) || null,
        dataFine: testo(dati.uscita_prevista) || null,
      }
    })

    return NextResponse.json({ affittuari })
  } catch (error) {
    console.error('[GET /api/bilancio/affittuari]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
