'use client'

/**
 * src/components/bilancio/AffittuariList.tsx
 * Lista affittuari attualmente in affitto, in coda alla vista principale.
 * T-124. Consuma GET /api/bilancio/affittuari (T-119) — NON più un
 * placeholder puro: l'anagrafica esiste già (vedi docs/12-BILANCIO.md §5.5).
 */

import { Users, Home } from 'lucide-react'
import { formatData } from '@/lib/utils'

export interface AffittuarioOverview {
  id: string
  nome: string
  casa: string | null
  dataInizio: string | null
  dataFine: string | null
}

interface Props {
  affittuari: AffittuarioOverview[]
  loading?: boolean
}

export function AffittuariList({ affittuari, loading }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Affittuari attivi</h2>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map(i => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
        </div>
      ) : affittuari.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-light">
            <Users className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm text-text-secondary">Nessun affittuario configurato</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {affittuari.map(a => (
            <div key={a.id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-light">
                <Home className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{a.nome}</p>
                <p className="text-xs text-text-muted truncate">
                  {a.casa ?? 'Casa non collegata'}
                  {a.dataInizio ? ` · dal ${formatData(a.dataInizio)}` : ''}
                  {a.dataFine ? ` al ${formatData(a.dataFine)}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
