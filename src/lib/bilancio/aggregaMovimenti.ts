/**
 * src/lib/bilancio/aggregaMovimenti.ts
 * Unisce Ricavi, Spese e Trasferimenti in una lista di "movimenti" omogenea,
 * usata dalla vista Overview (T-116) e dai dettagli Portafoglio/Debito (T-117/T-118).
 *
 * Definizione e regole: docs/12-BILANCIO.md §6.5.
 *
 * NOTA IMPORT: import relativi (non l'alias "@/"), stessa motivazione di
 * ricalcolaFondiPortafoglio.ts (compatibilità con eventuale uso da script tsx).
 */

import { getSchedaModel } from '../../models/Scheda'

export type TipoMovimento = 'ricavo' | 'spesa' | 'trasferimento'

export interface Movimento {
  id: string
  tipo: TipoMovimento
  titolo: string
  data: string | null
  importo: number
  colore: string
  /** Etichetta leggibile, es. "Portafoglio A" oppure "Portafoglio A → B, C" */
  portafoglioCoinvolto: string
  /** id dei portafogli coinvolti, per filtrare per-portafoglio (T-117) */
  portafogliIds: string[]
  /** id del debito collegato, se la spesa ha abbattimento_debito o aumento_debito valorizzato */
  debitoId?: string
  isAbbattimento?: boolean
  isAumento?: boolean
  createdAt: string
}

const COLORE_RICAVO = '#10B981'
const COLORE_SPESA = '#EF4444'
const COLORE_TRASFERIMENTO = '#3B82F6'

interface RigaFondo {
  fondo?: { id?: string; label?: string }
  importo?: number
}

interface RigaDestinazione {
  portafoglio?: { id?: string; label?: string }
  importo?: number
}

function numero(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function testo(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v : fallback
}

/**
 * Carica e unifica tutti i movimenti "non annullati" (vedi §6.5), ordinati
 * per data decrescente (a parità di data, per createdAt decrescente).
 * Non filtra per portafoglio/debito: il filtro va fatto a valle con
 * `filtraPerPortafoglio`/`filtraPerDebito`.
 */
export async function aggregaMovimenti(): Promise<Movimento[]> {
  const [SchedaRicavi, SchedaSpese, SchedaTrasferimenti] = await Promise.all([
    getSchedaModel('ricavi'),
    getSchedaModel('spese'),
    getSchedaModel('trasferimenti'),
  ])

  const [ricavi, spese, trasferimenti] = await Promise.all([
    SchedaRicavi.find({ attiva: true, 'dati.stato_ricavo': { $ne: 'annullata' } }).lean(),
    SchedaSpese.find({ attiva: true, 'dati.stato_spesa': { $ne: 'annullata' } }).lean(),
    SchedaTrasferimenti.find({ attiva: true }).lean(),
  ])

  const movimenti: Movimento[] = []

  for (const r of ricavi) {
    const dati = (r.dati ?? {}) as Record<string, unknown>
    const righe = (dati.fondi_destinazione ?? []) as RigaFondo[]
    const ids = righe.map(x => x.fondo?.id).filter((x): x is string => !!x)
    const labels = righe.map(x => x.fondo?.label).filter((x): x is string => !!x)
    movimenti.push({
      id: String(r._id),
      tipo: 'ricavo',
      titolo: testo(dati.titolo, 'Ricavo'),
      data: testo(dati.data) || null,
      importo: numero(dati.importo_totale),
      colore: COLORE_RICAVO,
      portafoglioCoinvolto: labels.join(', ') || '—',
      portafogliIds: ids,
      createdAt: String((r as unknown as { createdAt?: Date }).createdAt ?? ''),
    })
  }

  for (const s of spese) {
    const dati = (s.dati ?? {}) as Record<string, unknown>
    const righe = (dati.fondi_provenienza ?? []) as RigaFondo[]
    const ids = righe.map(x => x.fondo?.id).filter((x): x is string => !!x)
    const labels = righe.map(x => x.fondo?.label).filter((x): x is string => !!x)
    const abbattimento = dati.abbattimento_debito as { id?: string } | undefined
    const aumento = dati.aumento_debito as { id?: string } | undefined
    movimenti.push({
      id: String(s._id),
      tipo: 'spesa',
      titolo: testo(dati.titolo, 'Spesa'),
      data: testo(dati.data) || null,
      importo: numero(dati.importo_totale),
      colore: COLORE_SPESA,
      portafoglioCoinvolto: labels.join(', ') || '—',
      portafogliIds: ids,
      debitoId: abbattimento?.id ?? aumento?.id,
      isAbbattimento: !!abbattimento?.id,
      isAumento: !!aumento?.id,
      createdAt: String((s as unknown as { createdAt?: Date }).createdAt ?? ''),
    })
  }

  for (const t of trasferimenti) {
    const dati = (t.dati ?? {}) as Record<string, unknown>
    const origine = dati.portafoglio_origine as { id?: string; label?: string } | undefined
    const righe = (dati.destinazioni ?? []) as RigaDestinazione[]
    const destLabels = righe.map(x => x.portafoglio?.label).filter((x): x is string => !!x)
    const destIds = righe.map(x => x.portafoglio?.id).filter((x): x is string => !!x)
    const ids = [origine?.id, ...destIds].filter((x): x is string => !!x)
    movimenti.push({
      id: String(t._id),
      tipo: 'trasferimento',
      titolo: testo(dati.titolo, 'Trasferimento fondi'),
      data: testo(dati.data) || null,
      importo: numero(dati.importo_totale),
      colore: COLORE_TRASFERIMENTO,
      portafoglioCoinvolto: `${origine?.label ?? '—'} → ${destLabels.join(', ') || '—'}`,
      portafogliIds: ids,
      createdAt: String((t as unknown as { createdAt?: Date }).createdAt ?? ''),
    })
  }

  movimenti.sort((a, b) => {
    const da = a.data ?? ''
    const db = b.data ?? ''
    if (da !== db) return da < db ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })

  return movimenti
}

export function filtraPerPortafoglio(movimenti: Movimento[], portafoglioId: string): Movimento[] {
  return movimenti.filter(m => m.portafogliIds.includes(portafoglioId))
}

export function filtraPerDebito(movimenti: Movimento[], debitoId: string): Movimento[] {
  return movimenti.filter(m => m.debitoId === debitoId)
}
