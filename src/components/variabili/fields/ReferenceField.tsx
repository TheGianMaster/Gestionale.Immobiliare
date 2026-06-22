'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { X, Search, ExternalLink } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

interface RefValue { id: string; label: string }

interface ReferenceFieldProps extends BaseFieldProps {
  anagraficaSlug?: string
}

function useSearch(targetSlug: string | undefined, query: string) {
  const [results, setResults] = useState<RefValue[]>([])
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    if (!targetSlug) return
    const timer = setTimeout(() => {
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
    return () => clearTimeout(timer)
  }, [targetSlug, query])
  return { results, searching }
}

export function ReferenceField({ variabile, valore, mode, onChange, error, anagraficaSlug }: ReferenceFieldProps) {
  const val = valore as RefValue | null
  const targetSlug = (variabile as { referenceTo?: string }).referenceTo
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { results, searching } = useSearch(open ? targetSlug : undefined, query)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        {val ? (
          <Link href={`/anagrafica/${targetSlug ?? ''}/${val.id}/view`} className="inline-flex items-center gap-1 text-brand hover:underline">
            {val.label} <ExternalLink className="w-3 h-3 shrink-0" />
          </Link>
        ) : EMPTY}
      </ViewRow>
    )
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <div ref={wrapRef} className="relative">
        {val ? (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <span className="text-sm text-text-primary flex-1 truncate">{val.label}</span>
            <button type="button" onClick={() => onChange?.(null)} className="text-text-muted hover:text-text-primary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              placeholder={`Cerca...`}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              className={cn(inputClass(!!error), 'pl-9')}
            />
          </>
        )}
        {open && !val && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            {searching ? (
              <div className="px-3 py-2 text-sm text-text-muted">Ricerca...</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-muted">Nessun risultato</div>
            ) : (
              <div className="py-1 max-h-48 overflow-y-auto">
                {results.map(r => (
                  <button key={r.id} type="button" onMouseDown={() => { onChange?.(r); setOpen(false); setQuery('') }}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors">
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <FieldError message={error} />
    </div>
  )
}
