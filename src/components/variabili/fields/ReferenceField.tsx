'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { X, Search, ExternalLink, Plus } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

interface RefValue { id: string; label: string }
interface ReferenceFieldProps extends BaseFieldProps { anagraficaSlug?: string }

function slugToNome(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function useSearch(targetSlug: string | undefined, query: string, open: boolean) {
  const [results, setResults] = useState<RefValue[]>([])
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    if (!open || !targetSlug) return
    const t = setTimeout(() => {
      setSearching(true)
      const q = query ? `&q=${encodeURIComponent(query)}` : ''
      fetch(`/api/anagrafiche/${targetSlug}/schede?limit=8${q}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.schede)) {
            setResults(data.schede.map((s: { _id: string; dati?: Record<string,unknown> }) => ({
              id: s._id,
              label: Object.values(s.dati ?? {})[0] ? String(Object.values(s.dati ?? {})[0]) : s._id,
            })))
          }
        })
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [targetSlug, query, open])
  return { results, searching }
}

export function ReferenceField({ variabile, valore, mode, onChange, error }: ReferenceFieldProps) {
  const val        = valore as RefValue | null
  const targetSlug = (variabile as { referenceTo?: string }).referenceTo
  const targetNome = targetSlug ? slugToNome(targetSlug) : ''

  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { results, searching } = useSearch(targetSlug, query, open)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // View mode
  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome} obbligatorio={variabile.obbligatorio}>
        {val ? (
          <span className="inline-flex flex-col gap-0.5">
            <Link
              href={`/anagrafica/${targetSlug ?? ''}/${val.id}/view`}
              className="inline-flex items-center gap-1 hover:underline"
              style={{ color: 'var(--color-brand)' }}
            >
              {val.label} <ExternalLink className="w-3 h-3 shrink-0" />
            </Link>
            {targetNome && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {targetNome}
              </span>
            )}
          </span>
        ) : EMPTY}
      </ViewRow>
    )
  }

  // Edit mode
  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />

      {/* Badge anagrafica target */}
      {targetNome && (
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
          Collega a: <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{targetNome}</span>
        </p>
      )}

      <div ref={wrapRef} className="relative">
        {val ? (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <span className="text-sm text-text-primary flex-1 truncate">{val.label}</span>
            <button type="button" onClick={() => onChange?.(null)}
              className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text" value={query} placeholder="Cerca..."
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                className={cn(inputClass(!!error), 'pl-9')}
              />
            </div>
            {targetSlug && (
              <button
                type="button"
                onClick={() => window.open(`/anagrafica/${targetSlug}/new`, '_blank')}
                title={`Nuova scheda in ${targetNome}`}
                className="btn-icon w-10 h-10 rounded-lg border shrink-0"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-brand)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {open && !val && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            {searching
              ? <div className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>Ricerca...</div>
              : results.length === 0
                ? <div className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>Nessun risultato</div>
                : <div className="py-1 max-h-48 overflow-y-auto">
                    {results.map(r => (
                      <button key={r.id} type="button"
                        onMouseDown={() => { onChange?.(r); setOpen(false); setQuery('') }}
                        className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
                        style={{ color: 'var(--color-text-primary)' }}>
                        {r.label}
                      </button>
                    ))}
                  </div>
            }
          </div>
        )}
      </div>

      <FieldError message={error} />
    </div>
  )
}
