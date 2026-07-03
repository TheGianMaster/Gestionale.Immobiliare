/**
 * GET /api/bilancio/debito/[id]
 * Dati per la vista di dettaglio di un debito (isDebtView del template).
 * Vedi docs/12-BILANCIO.md §6 e roadmap T-118.
 */

import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getSchedaModel } from '@/models/Scheda'
import { aggregaMovimenti, filtraPerDebito } from '@/lib/bilancio/aggregaMovimenti'
import { ricalcolaTotaleRestituitoDebito, ricalcolaFondiPortafoglio } from '@/lib/bilancio/ricalcolaFondiPortafoglio'

function numero(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function testo(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback
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

    const [SchedaDebiti, SchedaPortafogli] = await Promise.all([
      getSchedaModel('debiti'),
      getSchedaModel('portafogli'),
    ])

    const debito = await SchedaDebiti.findOne({ _id: id, attiva: true }).lean()
    if (!debito) {
      return NextResponse.json({ error: 'Debito non trovato' }, { status: 404 })
    }
    const dati = (debito.dati ?? {}) as Record<string, unknown>

    // Ricalcolo "on-read" (vedi nota in overview/route.ts): non fidarsi del
    // valore persistito, ricalcolarlo ora. Fallback sul valore persistito se fallisce.
    let restituito: number
    try {
      restituito = await ricalcolaTotaleRestituitoDebito(id)
    } catch (e) {
      console.warn('[GET /api/bilancio/debito/[id]] Ricalcolo debito on-read fallito:', e)
      restituito = numero(dati.totale_restituito)
    }

    const erogato = numero(dati.importo_erogato)
    const base = numero(dati.totale_addebitato) || erogato
    const residuo = Math.max(0, base - restituito)
    const referente = dati.referente as { id?: string; label?: string } | undefined

    // Portafoglio collegato: reverse lookup su debito_associato.id (relazione 1:1 lato Portafoglio)
    const portafoglioCollegato = await SchedaPortafogli.findOne({
      attiva: true, 'dati.debito_associato.id': id,
    }).lean()
    const datiPortafoglio = portafoglioCollegato
      ? (portafoglioCollegato.dati ?? {}) as Record<string, unknown>
      : null

    let fondiPortafoglioCollegato: number | null = null
    if (portafoglioCollegato) {
      try {
        fondiPortafoglioCollegato = await ricalcolaFondiPortafoglio(String(portafoglioCollegato._id))
      } catch (e) {
        console.warn('[GET /api/bilancio/debito/[id]] Ricalcolo portafoglio on-read fallito:', e)
        fondiPortafoglioCollegato = numero(datiPortafoglio?.fondi_disponibili)
      }
    }

    const movimenti = filtraPerDebito(await aggregaMovimenti(), id)

    return NextResponse.json({
      debito: {
        id: String(debito._id),
        nome: testo(dati.titolo, 'Debito'),
        referente: referente?.label ?? null,
        tipoDebito: testo(dati.tipo_debito) || null,
        tipoTasso: testo(dati.tipo_tasso) || null,
        tassoInteresse: dati.tasso_interesse != null ? numero(dati.tasso_interesse) : null,
        erogato,
        restituito,
        residuo,
        percentuale: base > 0 ? Math.round((restituito / base) * 1000) / 10 : 0,
        dataApertura: testo(dati.data_apertura) || null,
        scadenzaPrevista: testo(dati.scadenza_prevista) || null,
        rataMensile: dati.rata_mensile != null ? numero(dati.rata_mensile) : null,
        note: testo(dati.note) || null,
        portafoglioCollegato: portafoglioCollegato ? {
          id: String(portafoglioCollegato._id),
          nome: testo(datiPortafoglio?.titolo, 'Portafoglio'),
          fondiDisponibili: fondiPortafoglioCollegato,
        } : null,
      },
      movimenti,
    })
  } catch (error) {
    console.error('[GET /api/bilancio/debito/[id]]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
