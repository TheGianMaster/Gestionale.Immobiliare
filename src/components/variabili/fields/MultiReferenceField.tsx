'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, Search, ExternalLink } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

interface RefValue { id: string; label: string }

interface MultiReferenceFieldProps extends BaseFieldProps {
  anagraficaSlug?: string
}

export function MultiReferenceField({ variabile, valore, mode, onChange, error, anagraficaSlug }: MultiReferenceFieldProps) {
  const vals = (valore as RefValue[]) ?? []
  const targetSlug = (variabile as { referenceTo?: string }).referenceTo
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<RefValue[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !targetSlug) return
    const timer = setTimeout(() => {
      const q = query ? `&q=${encodeURIComponent(query)}` : ''
      fetch(`/api/anagrafiche/${targetSlug}/schede?limit=8${q}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.schede)) {
            setResults(data.schede
              .filter((s: { _id: string }) => !vals.some(v => v.id === s._id))
              .map((s: { _id: string; dati?: Record<string,unknown> }) => ({
                id: s._id,
                label: Object.values(s.dati ?? {})[0] ? String(Object.values(s.dati ?? {})[0]) : s._id,
              })))
          }
        })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [open, targetSlug, query, vals])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function remove(id: string) { onChange?.(vals.filter(v => v.id !== id)) }
  function add(r: RefValue) { onChange?.([...vals, r]); setQuery(''); }

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        {vals.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {vals.map(v => (
              <Link key={v.id} href={`/anagrafica/${targetSlug ?? ''}/${v.id}/view`}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full text-brand hover:underline"
                style={{ backgroundColor: 'var(--color-brand-light)' }}>
                {v.label} <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            ))}
          </div>
        ) : EMPTY}
      </ViewRow>
    )
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input type="text" value={query} placeholder="Aggiungi..."
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className={cn(inputClass(!!error), 'pl-9')} />
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            {results.length === 0
              ? <div className="px-3 py-2 text-sm text-text-muted">Nessun risultato</div>
              : <div className="py-1 max-h-48 overflow-y-auto">
                  {results.map(r => (
                    <button key={r.id} type="button" onMouseDown={() => add(r)}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors">
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
