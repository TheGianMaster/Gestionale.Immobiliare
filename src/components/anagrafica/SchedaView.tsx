'use client'

/**
 * src/components/anagrafica/SchedaView.tsx
 * Visualizzazione read-only di una scheda.
 * Mostra tutti i campi in modalità lettura, con tab Dati | Documenti.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IAnagraficaConfig } from '@/models/AnagraficaConfig'
import type { IVariabile } from '@/models/Variabile'

// ——— TIPI ———
interface Scheda {
  _id: string
  dati: Record<string, unknown>
  tags?: string[]
  createdAt: string
  updatedAt: string
  creataDa?: string
  modificataDa?: string
}

interface SchedaViewProps {
  slug: string
  scheda: Scheda
  config: IAnagraficaConfig
  variabili: IVariabile[]
}

type Tab = 'dati' | 'documenti'

// ——— FORMATTA VALORE ———
function formatValore(valore: unknown, tipo: string): string {
  if (valore === null || valore === undefined || valore === '') return '—'
  switch (tipo) {
    case 'boolean':
      return valore ? 'Sì' : 'No'
    case 'date':
      try {
        return new Date(String(valore)).toLocaleDateString('it-IT', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        })
      } catch {
        return String(valore)
      }
    case 'number':
      return typeof valore === 'number'
        ? valore.toLocaleString('it-IT')
        : String(valore)
    case 'relation': {
      const obj = valore as Record<string, unknown>
      return obj?.label ? String(obj.label) : String(valore)
    }
    case 'multiselect':
    case 'file':
      if (Array.isArray(valore)) return valore.join(', ')
      return String(valore)
    case 'color':
      return String(valore)
    default:
      return String(valore)
  }
}

// ——— CAMPO VIEW ———
function CampoView({
  variabile,
  valore,
}: {
  variabile: IVariabile
  valore: unknown
}) {
  const valoreFormattato = formatValore(valore, variabile.tipo)
  const isVuoto = valoreFormattato === '—'

  return (
    <div
      className="grid grid-cols-[200px_1fr] gap-x-6 py-3 items-start"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <dt
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {variabile.label}
        {variabile.obbligatorio && (
          <span style={{ color: 'var(--color-error)' }} aria-label="obbligatorio"> *</span>
        )}
      </dt>
      <dd className="text-sm" style={{ color: isVuoto ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
        {variabile.tipo === 'color' && !isVuoto ? (
          <span className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border inline-block"
              style={{
                backgroundColor: String(valore),
                borderColor: 'var(--color-border-strong)',
              }}
            />
            {valoreFormattato}
          </span>
        ) : variabile.tipo === 'textarea' ? (
          <span className="whitespace-pre-wrap">{valoreFormattato}</span>
        ) : (
          valoreFormattato
        )}
      </dd>
    </div>
  )
}

// ——— COMPONENTE PRINCIPALE ———
export function SchedaView({ slug, scheda, config, variabili }: SchedaViewProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dati')

  // Label display: prima previewColumn non vuota
  const labelScheda = (() => {
    for (const col of (config.previewColumns ?? [])) {
      const v = scheda.dati[col]
      if (v && String(v).trim()) return String(v).trim()
    }
    return `Scheda #${scheda._id.slice(-6)}`
  })()

  return (
    <div className="max-w-3xl">

      {/* ——— HEADER ——— */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(`/anagrafica/${slug}`)}
            className="p-1.5 rounded-lg transition-colors hover:bg-surface-hover shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Torna alla lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {config.nome}
            </p>
            <h1 className="text-xl font-semibold text-text-primary truncate">
              {labelScheda}
            </h1>
          </div>
        </div>
        <button
          onClick={() => router.push(`/anagrafica/${slug}/${scheda._id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shrink-0"
          style={{
            backgroundColor: 'var(--color-brand)',
            color: 'var(--color-text-on-brand)',
          }}
        >
          <Pencil className="w-4 h-4" />
          Modifica
        </button>
      </div>

      {/* ——— TAB ——— */}
      <div
        className="flex gap-1 mb-6 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {(['dati', 'documenti'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
            style={tab === t
              ? { borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }
              : { borderColor: 'transparent' }
            }
          >
            {t === 'dati' ? 'Dati' : 'Documenti'}
          </button>
        ))}
      </div>

      {/* ——— TAB DATI ——— */}
      {tab === 'dati' && (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <dl className="px-6 py-2">
            {variabili.length === 0 ? (
              <p className="py-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                Nessuna variabile configurata per questa anagrafica.
              </p>
            ) : (
              variabili.map((v) => (
                <CampoView
                  key={v.slug}
                  variabile={v}
                  valore={scheda.dati[v.slug]}
                />
              ))
            )}
          </dl>

          {/* Meta info */}
          <div
            className="px-6 py-3 flex flex-wrap gap-x-6 gap-y-1"
            style={{
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-hover)',
            }}
          >
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Creata il{' '}
              {new Date(scheda.createdAt).toLocaleDateString('it-IT', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Ultima modifica{' '}
              {new Date(scheda.updatedAt).toLocaleDateString('it-IT', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}

      {/* ——— TAB DOCUMENTI (WIP — T-060/T-061) ——— */}
      {tab === 'documenti' && (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            🚧 Sezione documenti — Work in Progress
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {/* TODO: Upload R2 + lista documenti (T-060, T-061) */}
            L'upload e la gestione documenti sarà implementata in Fase 6.
          </p>
        </div>
      )}
    </div>
  )
}

export default SchedaView
