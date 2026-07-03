/**
 * GET /api/bilancio/overview
 * Dati aggregati per la vista principale del Bilancio: fondi per portafoglio
 * (per il donut), totale generale, debiti attivi, ultimi movimenti.
 * Vedi docs/12-BILANCIO.md §6 e roadmap T-116.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getSchedaModel } from '@/models/Scheda'
import { aggregaMovimenti } from '@/lib/bilancio/aggregaMovimenti'
import { ricalcolaFondiTuttiIPortafogli, ricalcolaTotaleRestituitoTuttiIDebiti } from '@/lib/bilancio/ricalcolaFondiPortafoglio'
import { palette } from '@/styles/palette'

function numero(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function testo(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback
}

/** Colore per-istanza: cicla su palette.eventi (8 colori), stessa convenzione del Calendario. Vedi docs/12-BILANCIO.md §6.4. */
function coloreIstanza(index: number): string {
  return palette.eventi[index % palette.eventi.length]
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await connectDB()

    // Ricalcolo "on-read": ogni apertura della vista ricalcola fondi_disponibili
    // e totale_restituito da zero leggendo Ricavi/Spese/Trasferimenti reali,
    // invece di fidarsi del valore persistito (che potrebbe essere stantio se un
    // punto di scrittura non ha richiamato il motore di ricalcolo — vedi bug
    // segnalato dall'utente 2026-07-03 su "Nuovo Debito"). Best-effort: se
    // fallisce, si procede comunque con i valori persistiti (pagina non si rompe).
    const [SchedaPortafogli, SchedaDebiti] = await Promise.all([
      getSchedaModel('portafogli'),
      getSchedaModel('debiti'),
    ])

    try {
      await Promise.all([
        ricalcolaFondiTuttiIPortafogli(),
        ricalcolaTotaleRestituitoTuttiIDebiti(),
      ])
    } catch (e) {
      console.warn('[GET /api/bilancio/overview] Ricalcolo on-read fallito, uso valori persistiti:', e)
    }

    const portafogliRaw = await SchedaPortafogli.find({ attiva: true }).sort({ createdAt: 1 }).lean()
    const totaleFondi = portafogliRaw.reduce(
      (tot, p) => tot + numero((p.dati as Record<string, unknown>)?.fondi_disponibili),
      0
    )

    const portafogli = portafogliRaw.map((p, idx) => {
      const dati = (p.dati ?? {}) as Record<string, unknown>
      const fondiDisponibili = numero(dati.fondi_disponibili)
      return {
        id: String(p._id),
        nome: testo(dati.titolo, 'Portafoglio'),
        colore: coloreIstanza(idx),
        fondiDisponibili,
        share: totaleFondi > 0 ? Math.round((fondiDisponibili / totaleFondi) * 1000) / 10 : 0,
      }
    })

    const debitiRaw = await SchedaDebiti.find({ attiva: true }).sort({ createdAt: 1 }).lean()
    const debiti = debitiRaw.map((d, idx) => {
      const dati = (d.dati ?? {}) as Record<string, unknown>
      const erogato = numero(dati.importo_erogato)
      const restituito = numero(dati.totale_restituito)
      const base = numero(dati.totale_addebitato) || erogato
      const residuo = Math.max(0, base - restituito)
      const referente = dati.referente as { id?: string; label?: string } | undefined
      const scadenza = dati.scadenza_prevista
      return {
        id: String(d._id),
        nome: testo(dati.titolo, 'Debito'),
        referente: referente?.label ?? null,
        erogato,
        restituito,
        residuo,
        percentuale: base > 0 ? Math.round((restituito / base) * 1000) / 10 : 0,
        scadenzaAnno: typeof scadenza === 'string' && scadenza.length >= 4 ? Number(scadenza.slice(0, 4)) : null,
        colore: coloreIstanza(idx),
      }
    })

    const movimenti = await aggregaMovimenti()
    const ultimiMovimenti = movimenti.slice(0, 15).map(m => ({
      id: m.id,
      tipo: m.tipo,
      titolo: m.titolo,
      data: m.data,
      importo: m.importo,
      colore: m.colore,
      portafoglioCoinvolto: m.portafoglioCoinvolto,
    }))

    return NextResponse.json({ portafogli, totaleFondi, debiti, ultimiMovimenti })
  } catch (error) {
    console.error('[GET /api/bilancio/overview]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
