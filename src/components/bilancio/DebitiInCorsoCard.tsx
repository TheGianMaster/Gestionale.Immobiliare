'use client'

/**
 * src/components/bilancio/DebitiInCorsoCard.tsx
 * Card destra della vista principale del Bilancio: stato di rimborso di ogni
 * debito attivo, con barra di progresso. T-121.
 */

import { ArrowDownCircle } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

export interface DebitoOverview {
  id: string
  nome: string
  referente: string | null
  erogato: number
  restituito: number
  residuo: number
  percentuale: number
  scadenzaAnno: number | null
  colore: string
}

interface Props {
  debiti: DebitoOverview[]
  loading?: boolean
  onSelectDebito?: (id: string) => void
}

export function DebitiInCorsoCard({ debiti, loading, onSelectDebito }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Debiti in corso</h2>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map(i => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : debiti.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-light">
            <ArrowDownCircle className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm text-text-secondary">Nessun debito attivo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {debiti.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDebito?.(d.id)}
              className="w-full text-left rounded-xl p-3 table-row-hover"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-medium text-text-primary truncate">{d.nome}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.colore + '20', color: d.colore }}
                >
                  {d.percentuale.toFixed(0)}%
                </span>
              </div>

              {(d.referente || d.scadenzaAnno) && (
                <p className="text-xs text-text-muted mb-2">
                  {d.referente ?? ''}
                  {d.referente && d.scadenzaAnno ? ' · ' : ''}
                  {d.scadenzaAnno ? `scadenza ${d.scadenzaAnno}` : ''}
                </p>
              )}

              <div className="h-2 w-full rounded-full overflow-hidden bg-surface-hover mb-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, d.percentuale))}%`, backgroundColor: d.colore }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Restituito {formatEuro(d.restituito)}</span>
                <span>Erogato {formatEuro(d.erogato)}</span>
                <span>Residuo {formatEuro(d.residuo)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
