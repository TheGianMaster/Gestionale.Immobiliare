'use client'

/**
 * src/components/bilancio/UltimiMovimentiList.tsx
 * Sezione "Ultimi movimenti", posizionata SOTTO le due card principali:
 * lista unificata di ricavi (verde), spese (rosso) e trasferimenti (azzurro).
 * T-122.
 */

import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react'
import { formatData, formatEuro } from '@/lib/utils'

export interface MovimentoOverview {
  id: string
  tipo: 'ricavo' | 'spesa' | 'trasferimento'
  titolo: string
  data: string | null
  importo: number
  colore: string
  portafoglioCoinvolto: string
}

interface Props {
  movimenti: MovimentoOverview[]
  loading?: boolean
  onVediTutti?: () => void
}

const BADGE_LABEL: Record<MovimentoOverview['tipo'], string> = {
  ricavo: 'Ricavo',
  spesa: 'Spesa',
  trasferimento: 'Trasferimento',
}

function Icona({ tipo }: { tipo: MovimentoOverview['tipo'] }) {
  if (tipo === 'ricavo') return <ArrowUpCircle className="w-4 h-4" />
  if (tipo === 'spesa') return <ArrowDownCircle className="w-4 h-4" />
  return <ArrowLeftRight className="w-4 h-4" />
}

function importoFormattato(m: MovimentoOverview): string {
  if (m.tipo === 'ricavo') return `+ ${formatEuro(m.importo)}`
  if (m.tipo === 'spesa') return `− ${formatEuro(m.importo)}`
  return formatEuro(m.importo)
}

export function UltimiMovimentiList({ movimenti, loading, onVediTutti }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Ultimi movimenti</h2>
        {onVediTutti && (
          <button type="button" onClick={onVediTutti} className="text-xs font-medium text-brand hover:underline">
            Vedi tutti
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
        </div>
      ) : movimenti.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">Nessun movimento recente</p>
      ) : (
        <div className="divide-y divide-border">
          {movimenti.map(m => (
            <div key={`${m.tipo}-${m.id}`} className="flex items-center gap-3 py-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: m.colore + '1A', color: m.colore }}
              >
                <Icona tipo={m.tipo} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{m.titolo}</p>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: m.colore + '1A', color: m.colore }}
                  >
                    {BADGE_LABEL[m.tipo]}
                  </span>
                </div>
                <p className="text-xs text-text-muted truncate">
                  {m.portafoglioCoinvolto}
                  {m.data ? ` · ${formatData(m.data)}` : ''}
                </p>
              </div>

              <span
                className="text-sm font-semibold shrink-0"
                style={{ color: m.tipo === 'trasferimento' ? 'var(--color-text-primary)' : m.colore }}
              >
                {importoFormattato(m)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
