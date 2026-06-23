'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldRenderer } from '@/components/variabili/FieldRenderer'
import type { IAnagraficaConfig } from '@/models/AnagraficaConfig'
import type { IVariabile } from '@/types/variabili'

interface Scheda {
  _id: string
  dati: Record<string, unknown>
  tags?: string[]
  createdAt: string
  updatedAt: string
}

interface SchedaViewProps {
  slug:      string
  scheda:    Scheda
  config:    IAnagraficaConfig
  variabili: IVariabile[]
}

type Tab = 'dati' | 'documenti'

export function SchedaView({ slug, scheda, config, variabili }: SchedaViewProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dati')

  const labelScheda = (() => {
    for (const col of (config.previewColumns ?? [])) {
      const v = scheda.dati[col]
      if (v && String(v).trim()) return String(v).trim()
    }
    return `Scheda #${scheda._id.slice(-6)}`
  })()

  return (
    <div className="max-w-3xl animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(`/anagrafica/${slug}`)}
            className="btn-ghost p-2 shrink-0"
            aria-label="Torna alla lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {config.nome}
            </p>
            <h1 className="text-xl font-semibold text-text-primary truncate">{labelScheda}</h1>
          </div>
        </div>
        <button
          onClick={() => router.push(`/anagrafica/${slug}/${scheda._id}/edit`)}
          className="btn-primary shrink-0"
        >
          <Pencil className="w-4 h-4" />
          Modifica
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {(['dati', 'documenti'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              tab === t ? 'text-brand' : 'text-text-secondary hover:text-text-primary',
            )}
            style={{
              borderBottomColor: tab === t ? 'var(--color-brand)' : 'transparent',
              color:             tab === t ? 'var(--color-brand)' : undefined,
            }}
          >
            {t === 'dati' ? 'Dati' : 'Documenti'}
          </button>
        ))}
      </div>

      {/* Tab Dati */}
      {tab === 'dati' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <dl className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {variabili.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                Nessuna variabile configurata.
              </p>
            ) : (
              variabili.map(v => (
                <div key={v.slug} className="px-6 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <FieldRenderer
                    variabile={v}
                    valore={scheda.dati[v.slug] ?? null}
                    mode="view"
                    anagraficaSlug={slug}
                  />
                </div>
              ))
            )}
          </dl>

          {/* Meta footer */}
          <div
            className="px-6 py-3 flex flex-wrap gap-x-6 gap-y-1"
            style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}
          >
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Creata il {new Date(scheda.createdAt).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' })}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Ultima modifica {new Date(scheda.updatedAt).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' })}
            </span>
            {scheda.tags && scheda.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-1 w-full">
                {scheda.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Documenti */}
      {tab === 'documenti' && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Sezione documenti — Work in Progress
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Upload e gestione documenti in arrivo nella Fase 6.
          </p>
        </div>
      )}
    </div>
  )
}

export default SchedaView
