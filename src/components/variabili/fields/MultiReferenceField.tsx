'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, Search, ExternalLink, Plus } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

interface RefValue { id: string; label: string }
interface MultiReferenceFieldProps extends BaseFieldProps { anagraficaSlug?: string }

function slugToNome(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function MultiReferenceField({ variabile, valore, mode, onChange, error }: MultiReferenceFieldProps) {
  const vals       = (valore as RefValue[]) ?? []
  const targetSlug = (variabile as { referenceTo?: string }).referenceTo
  const targetNome = targetSlug ? slugToNome(targetSlug) : ''

  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [results, setResults] = useState<RefValue[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !targetSlug) return
    const t = setTimeout(() => {
      const q = query ? `&q=${encodeURIComponent(query)}` : ''
      fetch(`/api/anagrafiche/${targetSlug}/schede?limit=8${q}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.data)) {
            setResults(data.data
              .filter((s: { _id: string }) => !vals.some(v => v.id === s._id))
              .map((s: { _id: string; dati?: Record<string,unknown> }) => ({
                id: s._id,
                label: Object.values(s.dati ?? {})[0] ? String(Object.values(s.dati ?? {})[0]) : s._id,
              })))
          }
        })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [open, targetSlug, query, vals])

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  function remove(id: string) { onChange?.(vals.filter(v => v.id !== id)) }
  function add(r: RefValue)   { onChange?.([...vals, r]); setQuery('') }

  // View mode
  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome} obbligatorio={variabile.obbligatorio}>
        {vals.length > 0 ? (
          <span className="flex flex-col gap-1">
            <span className="flex flex-wrap gap-1.5">
              {vals.map(v => (
                <Link key={v.id}
                  href={`/anagrafica/${targetSlug ?? ''}/${v.id}/view`}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full hover:underline"
                  style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                  {v.label} <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              ))}
            </span>
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

      {targetNome && (
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
          Collega a: <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{targetNome}</span>
        </p>
      )}

      {vals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {vals.map(v => (
            <span key={v.id} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
              {v.label}
              <button type="button" onClick={() => remove(v.id)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={wrapRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input type="text" value={query} placeholder="Aggiungi..."
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              className={cn(inputClass(!!error), 'pl-9')} />
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

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            {results.length === 0
              ? <div className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>Nessun risultato</div>
              : <div className="py-1 max-h-48 overflow-y-auto">
                  {results.map(r => (
                    <button key={r.id} type="button" onMouseDown={() => add(r)}
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
