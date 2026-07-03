/**
 * GET /api/bilancio/portafoglio/[id]
 * Dati per la vista di dettaglio di un portafoglio (isPortfolioView del template).
 * Vedi docs/12-BILANCIO.md §6 e roadmap T-117.
 */

import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getSchedaModel } from '@/models/Scheda'
import { aggregaMovimenti, filtraPerPortafoglio } from '@/lib/bilancio/aggregaMovimenti'
import { ricalcolaFondiPortafoglio, ricalcolaTotaleRestituitoDebito } from '@/lib/bilancio/ricalcolaFondiPortafoglio'

function numero(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function testo(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback
}

interface RigaFondo {
  fondo?: { id?: string }
  importo?: number
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    await connectDB()

    const [SchedaPortafogli, SchedaDebiti, SchedaSpese] = await Promise.all([
      getSchedaModel('portafogli'),
      getSchedaModel('debiti'),
      getSchedaModel('spese'),
    ])

    const portafoglio = await SchedaPortafogli.findOne({ _id: id, attiva: true }).lean()
    if (!portafoglio) {
      return NextResponse.json({ error: 'Portafoglio non trovato' }, { status: 404 })
    }
    const dati = (portafoglio.dati ?? {}) as Record<string, unknown>

    // Ricalcolo "on-read" (vedi nota in overview/route.ts): non fidarsi del
    // valore persistito, ricalcolarlo ora. Fallback sul valore persistito se fallisce.
    let fondiDisponibili: number
    try {
      fondiDisponibili = await ricalcolaFondiPortafoglio(id)
    } catch (e) {
      console.warn('[GET /api/bilancio/portafoglio/[id]] Ricalcolo fondi on-read fallito:', e)
      fondiDisponibili = numero(dati.fondi_disponibili)
    }

    const debitoAssociato = dati.debito_associato as { id?: string; label?: string } | undefined
    let residuoDebito: number | null = null
    if (debitoAssociato?.id && mongoose.isValidObjectId(debitoAssociato.id)) {
      const d = await SchedaDebiti.findOne({ _id: debitoAssociato.id }).lean()
      if (d) {
        const datiDebito = (d.dati ?? {}) as Record<string, unknown>
        const base = numero(datiDebito.totale_addebitato) || numero(datiDebito.importo_erogato)
        let restituitoFresco: number
        try {
          restituitoFresco = await ricalcolaTotaleRestituitoDebito(debitoAssociato.id)
        } catch (e) {
          console.warn('[GET /api/bilancio/portafoglio/[id]] Ricalcolo debito on-read fallito:', e)
          restituitoFresco = numero(datiDebito.totale_restituito)
        }
        residuoDebito = Math.max(0, base - restituitoFresco)
      }
    }

    const movimenti = filtraPerPortafoglio(await aggregaMovimenti(), id)
    const totaleRicavi = movimenti.filter(m => m.tipo === 'ricavo').reduce((t, m) => t + m.importo, 0)
    const totaleSpese = movimenti.filter(m => m.tipo === 'spesa').reduce((t, m) => t + m.importo, 0)

    // Abbattimenti debito usciti da questo portafoglio (banner ambra, vedi template §isPortfolioView)
    const speseAbbattimento = await SchedaSpese.find({
      attiva: true,
      'dati.stato_spesa': 'pagata',
      'dati.fondi_provenienza.fondo.id': id,
      'dati.abbattimento_debito.id': { $exists: true, $ne: null },
    }).lean()
    const totaleAbbattimenti = speseAbbattimento.reduce((tot, s) => {
      const righe = ((s.dati as Record<string, unknown>)?.fondi_provenienza ?? []) as RigaFondo[]
      return tot + righe.filter(r => r.fondo?.id === id).reduce((t, r) => t + numero(r.importo), 0)
    }, 0)

    return NextResponse.json({
      portafoglio: {
        id: String(portafoglio._id),
        nome: testo(dati.titolo, 'Portafoglio'),
        sottotitolo: testo(dati.sottotitolo) || null,
        dataApertura: testo(dati.data_apertura) || null,
        dataChiusura: testo(dati.data_chiusura) || null,
        fondiDisponibili,
        debitoAssociato: debitoAssociato?.id ? {
          id: debitoAssociato.id,
          nome: debitoAssociato.label ?? null,
          residuo: residuoDebito,
        } : null,
        totaleRicavi,
        totaleSpese,
        totaleAbbattimentiDebito: totaleAbbattimenti > 0 ? totaleAbbattimenti : null,
      },
      movimenti,
    })
  } catch (error) {
    console.error('[GET /api/bilancio/portafoglio/[id]]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
