'use client'

/**
 * src/components/variabili/fields/LineItemsField.tsx
 * Campo "righe ripetibili" (line-items).
 * Ogni riga è composta dalle colonne definite in variabile.colonne.
 * Tipi colonna supportati: text, numbers, reference.
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Search, X, ExternalLink } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, EMPTY, inputClass } from './_shared'
import type { IColonnaLineItems, LineItemRow } from '@/types/variabili'
import { cn } from '@/lib/utils'

// ─── Inline reference search ────────────────────────────────────────────────

interface RefVal { id: string; label: string }

function InlineRefCell({
  col,
  value,
  onChange,
}: {
  col: IColonnaLineItems
  value: RefVal | null
  onChange: (v: RefVal | null) => void
}) {
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [results, setResults] = useState<RefVal[]>([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !col.referenceTo) return
    const t = setTimeout(() => {
      setLoading(true)
      const q = query ? `&q=${encodeURIComponent(query)}` : ''
      fetch(`/api/anagrafiche/${col.referenceTo}/schede?limit=8${q}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.data)) {
            setResults(data.data.map((s: { _id: string; dati?: Record<string, unknown> }) => ({
              id: s._id,
              label: Object.values(s.dati ?? {})[0]
                ? String(Object.values(s.dati ?? {})[0]) : s._id,
            })))
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [open, query, col.referenceTo])

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  if (value) {
    return (
      <div className="flex items-center gap-1 rounded px-2 py-1 text-xs border"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <span className="flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{value.label}</span>
        <button type="button" onClick={() => onChange(null)} className="shrink-0 hover:opacity-60"
          style={{ color: 'var(--color-text-muted)' }}>
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
          style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={query}
          placeholder={col.placeholder ?? 'Cerca...'}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full rounded px-2 pl-6 py-1 text-xs border outline-none"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-0.5 rounded-lg overflow-hidden z-50"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          {loading
            ? <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>Ricerca...</div>
            : results.length === 0
              ? <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>Nessun risultato</div>
              : <div className="py-0.5 max-h-36 overflow-y-auto">
                  {results.map(r => (
                    <button key={r.id} type="button"
                      onMouseDown={() => { onChange(r); setOpen(false); setQuery('') }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-surface-hover transition-colors"
                      style={{ color: 'var(--color-text-primary)' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
          }
        </div>
      )}
    </div>
  )
}

// ─── Cella numerica ──────────────────────────────────────────────────────────

function NumberCell({ col, value, onChange }: {
  col: IColonnaLineItems
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      placeholder={col.placeholder ?? '0'}
      step={col.decimali ? '0.01' : '1'}
      onChange={e => {
        const n = e.target.value === '' ? null : Number(e.target.value)
        onChange(n)
      }}
      className="w-full rounded px-2 py-1 text-xs border outline-none"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
      }}
    />
  )
}

// ─── Cella testo ─────────────────────────────────────────────────────────────

function TextCell({ col, value, onChange }: {
  col: IColonnaLineItems
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={col.placeholder ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded px-2 py-1 text-xs border outline-none"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
      }}
    />
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export function LineItemsField({ variabile, valore, mode, onChange, error }: BaseFieldProps) {
  const colonne = (variabile.colonne ?? []) as IColonnaLineItems[]
  const rows    = (Array.isArray(valore) ? valore : []) as LineItemRow[]

  function updateRow(idx: number, colSlug: string, val: unknown) {
    const next = rows.map((r, i) => i === idx ? { ...r, [colSlug]: val } : r)
    onChange?.(next)
  }

  function addRow() {
    const emptyRow: LineItemRow = {}
    colonne.forEach(c => { emptyRow[c.slug] = c.tipo === 'numbers' ? null : c.tipo === 'reference' ? null : '' })
    onChange?.([...rows, emptyRow])
  }

  function removeRow(idx: number) {
    onChange?.(rows.filter((_, i) => i !== idx))
  }

  // ── VIEW ──
  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome} obbligatorio={variabile.obbligatorio}>
        {rows.length === 0
          ? EMPTY
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-0.5">
                <thead>
                  <tr>
                    {colonne.map(c => (
                      <th key={c.slug}
                        className="text-left px-2 py-1 font-medium"
                        style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                        {c.nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      {colonne.map(c => {
                        const cell = row[c.slug]
                        let content: React.ReactNode = EMPTY

                        if (c.tipo === 'reference') {
                          const ref = cell as RefVal | null
                          if (ref?.label) {
                            content = c.referenceTo
                              ? (
                                <Link href={`/anagrafica/${c.referenceTo}/${ref.id}/view`}
                                  className="inline-flex items-center gap-0.5 hover:underline"
                                  style={{ color: 'var(--color-brand)' }}>
                                  {ref.label} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </Link>
                              ) : <span>{ref.label}</span>
                          }
                        } else if (c.tipo === 'numbers') {
                          const n = cell !== null && cell !== undefined ? Number(cell) : null
                          if (n !== null && !isNaN(n)) {
                            content = <span>{c.decimali ? n.toFixed(2) : String(n)}</span>
                          }
                        } else {
                          const s = cell as string
                          if (s) content = <span>{s}</span>
                        }

                        return (
                          <td key={c.slug} className="px-2 py-1"
                            style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                            {content}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </ViewRow>
    )
  }

  // ── EDIT ──
  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      {variabile.descrizione && (
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{variabile.descrizione}</p>
      )}

      <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
        {/* Intestazioni */}
        <div
          className="grid text-xs font-medium px-2 py-1.5"
          style={{
            gridTemplateColumns: `repeat(${colonne.length}, 1fr) 2rem`,
            backgroundColor: 'var(--color-surface-hover)',
            borderBottom: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {colonne.map(c => <div key={c.slug} className="px-1">{c.nome}</div>)}
          <div />
        </div>

        {/* Righe */}
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid items-center gap-1 px-2 py-1.5"
            style={{
              gridTemplateColumns: `repeat(${colonne.length}, 1fr) 2rem`,
              borderBottom: idx < rows.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}
          >
            {colonne.map(c => (
              <div key={c.slug} className="px-1 min-w-0">
                {c.tipo === 'reference'
                  ? <InlineRefCell
                      col={c}
                      value={(row[c.slug] as RefVal | null) ?? null}
                      onChange={v => updateRow(idx, c.slug, v)}
                    />
                  : c.tipo === 'numbers'
                    ? <NumberCell
                        col={c}
                        value={(row[c.slug] as number | null) ?? null}
                        onChange={v => updateRow(idx, c.slug, v)}
                      />
                    : <TextCell
                        col={c}
                        value={(row[c.slug] as string) ?? ''}
                        onChange={v => updateRow(idx, c.slug, v)}
                      />
                }
              </div>
            ))}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-error)' }}
                title="Rimuovi riga"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="px-4 py-3 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Nessuna riga. Clicca "+ Aggiungi riga" per iniziare.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-2 flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-brand)' }}
      >
        <Plus className="w-3.5 h-3.5" />
        Aggiungi riga
      </button>

      <FieldError message={error} />
    </div>
  )
}
