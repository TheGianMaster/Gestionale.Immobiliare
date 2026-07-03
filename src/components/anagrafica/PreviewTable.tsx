'use client'

/**
 * src/components/anagrafica/PreviewTable.tsx
 * Tabella lista schede di un'anagrafica.
 *
 * Colonne generate dinamicamente dai previewColumns della AnagraficaConfig.
 * Hover su riga → appaiono pulsanti azione (View, Edit, Delete).
 * Delete → apre DeleteConfirmModal.
 * Checkbox → selezione multipla + bulk delete.
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Loader2, FileX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchBar } from './SearchBar'
import type { IAnagraficaConfig } from '@/models/AnagraficaConfig'

// ——— TIPI ———
interface Scheda {
  _id: string
  dati: Record<string, unknown>
  createdAt: string
  tags?: string[]
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

interface PreviewTableProps {
  slug: string
  config: IAnagraficaConfig
}

// ——— FORMATTA VALORE CELLA ———
function formatCella(valore: unknown): string {
  if (valore === null || valore === undefined || valore === '') return '—'
  if (typeof valore === 'boolean') return valore ? 'Sì' : 'No'
  if (valore instanceof Date) return new Date(valore).toLocaleDateString('it-IT')
  if (typeof valore === 'string') {
    // Riconosce date ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(valore)) {
      try {
        return new Date(valore).toLocaleDateString('it-IT')
      } catch {
        return valore
      }
    }
    return valore
  }
  if (typeof valore === 'number') return valore.toLocaleString('it-IT')
  if (typeof valore === 'object' && valore !== null) {
    // Oggetto relation: { id, label }
    const obj = valore as Record<string, unknown>
    if ('label' in obj) return String(obj.label)
    return JSON.stringify(valore)
  }
  return String(valore)
}

// ——— LABEL SCHEDA (prima previewColumn non vuota) ———
function getLabelScheda(scheda: Scheda, previewColumns: string[]): string {
  for (const col of previewColumns) {
    const val = scheda.dati[col]
    if (val && String(val).trim()) return String(val).trim()
  }
  return `Scheda #${scheda._id.slice(-6)}`
}

// ——— MODALE CONFERMA ELIMINAZIONE (singola) ———
function DeleteConfirmModal({
  nome,
  onConfirm,
  onCancel,
  loading,
}: {
  nome: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h2 className="text-base font-semibold text-text-primary mb-2">
          Elimina scheda
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Sei sicuro di voler eliminare <strong>{nome}</strong>?{' '}
          Questa azione non può essere annullata.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-secondary">
            Annulla
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Elimina
          </button>
        </div>
      </div>
    </div>
  )
}

// ——— MODALE CONFERMA ELIMINAZIONE BULK ———
function BulkDeleteConfirmModal({
  count,
  onConfirm,
  onCancel,
  loading,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h2 className="text-base font-semibold text-text-primary mb-2">
          Elimina {count} {count === 1 ? 'scheda' : 'schede'}
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Sei sicuro di voler eliminare{' '}
          <strong>{count} {count === 1 ? 'scheda selezionata' : 'schede selezionate'}</strong>?{' '}
          Questa azione non può essere annullata.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-secondary">
            Annulla
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Elimina {count === 1 ? 'scheda' : `${count} schede`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ——— SKELETON ROW ———
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td className="px-4 py-3 w-10">
        <div className="h-4 w-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-border)' }} />
      </td>
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded animate-pulse"
            style={{
              backgroundColor: 'var(--color-border)',
              width: i === 0 ? '60%' : '80%',
            }}
          />
        </td>
      ))}
      <td />
    </tr>
  )
}

// ——— COMPONENTE PRINCIPALE ———
export function PreviewTable({ slug, config }: PreviewTableProps) {
  const router = useRouter()

  const [schede, setSchede]               = useState<Scheda[]>([])
  const [meta, setMeta]                   = useState<Meta | null>(null)
  const [loading, setLoading]             = useState(true)
  const [query, setQuery]                 = useState('')
  const [page, setPage]                   = useState(1)
  const [eliminando, setEliminando]       = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Scheda | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // multi-select
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkLoading, setBulkLoading]       = useState(false)

  const previewColumns = config.previewColumns ?? []

  // ——— FETCH ———
  const fetchSchede = useCallback(async (q: string, pg: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:  String(pg),
        limit: '20',
        ...(q ? { q } : {}),
      })
      const res  = await fetch(`/api/anagrafiche/${slug}/schede?${params}`)
      const json = await res.json()
      if (json.data) {
        setSchede(json.data)
        setMeta(json.meta)
      }
    } catch (err) {
      console.error('[PreviewTable] fetch error', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchSchede(query, page)
  }, [fetchSchede, query, page])

  // Reset pagina e selezione quando cambia la ricerca
  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    setPage(1)
    setSelectedIds(new Set())
  }, [])

  // ——— CHECKBOX LOGICA ———
  const allSelected = schede.length > 0 && schede.every((s) => selectedIds.has(s._id))
  const someSelected = !allSelected && schede.some((s) => selectedIds.has(s._id))

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(schede.map((s) => s._id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ——— DELETE SINGOLO ———
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/anagrafiche/${slug}/schede/${deleteTarget._id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteTarget(null)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(deleteTarget._id)
          return next
        })
        await fetchSchede(query, page)
      }
    } catch (err) {
      console.error('[PreviewTable] delete error', err)
    } finally {
      setDeleteLoading(false)
      setEliminando(null)
    }
  }

  // ——— DELETE BULK ———
  async function handleBulkDelete() {
    setBulkLoading(true)
    try {
      const res = await fetch(`/api/anagrafiche/${slug}/schede`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (res.ok) {
        setSelectedIds(new Set())
        setShowBulkConfirm(false)
        await fetchSchede(query, page)
      }
    } catch (err) {
      console.error('[PreviewTable] bulk delete error', err)
    } finally {
      setBulkLoading(false)
    }
  }

  // ——— RENDER ———
  return (
    <div>
      {/* ——— HEADER ——— */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{config.nome}</h1>
          {config.descrizione && (
            <p className="text-sm text-text-muted mt-0.5">{config.descrizione}</p>
          )}
        </div>
        <button
          onClick={() => router.push(`/anagrafica/${slug}/new`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shrink-0"
          style={{
            backgroundColor: 'var(--color-brand)',
            color: 'var(--color-text-on-brand)',
          }}
        >
          <Plus className="w-4 h-4" />
          Nuova scheda
        </button>
      </div>

      {/* ——— SEARCH ——— */}
      <div className="mb-4">
        <SearchBar
          placeholder={`Cerca in ${config.nome.toLowerCase()}...`}
          onSearch={handleSearch}
        />
      </div>

      {/* ——— BULK ACTION BAR ——— */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 mb-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-brand-subtle, rgba(var(--color-brand-rgb, 79,70,229),0.08))',
            border: '1px solid var(--color-brand)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>
            {selectedIds.size} {selectedIds.size === 1 ? 'scheda selezionata' : 'schede selezionate'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs underline"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Deseleziona tutto
            </button>
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="btn-danger flex items-center gap-1.5 text-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Elimina selezionate
            </button>
          </div>
        </div>
      )}

      {/* ——— TABELLA ——— */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse animate-fade-in">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {/* Checkbox header */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer"
                    aria-label="Seleziona tutte"
                  />
                </th>
                {previewColumns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {col}
                  </th>
                ))}
                {/* Colonna data creazione */}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Creata
                </th>
                {/* Colonna azioni */}
                <th className="w-28" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={previewColumns.length} />
                ))
              ) : schede.length === 0 ? (
                <tr>
                  <td colSpan={previewColumns.length + 3} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileX
                        className="w-10 h-10"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {query ? `Nessun risultato per "${query}"` : `Nessuna scheda in ${config.nome}`}
                      </p>
                      {!query && (
                        <button
                          onClick={() => router.push(`/anagrafica/${slug}/new`)}
                          className="btn-ghost"
                          style={{ color: 'var(--color-brand)' }}
                        >
                          + Crea la prima scheda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                schede.map((scheda) => {
                  const isSelected = selectedIds.has(scheda._id)
                  return (
                    <tr
                      key={scheda._id}
                      className="group transition-colors cursor-pointer"
                      style={{
                        borderTop: '1px solid var(--color-border)',
                        backgroundColor: isSelected
                          ? 'var(--color-brand-subtle, rgba(79,70,229,0.06))'
                          : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected
                          ? 'var(--color-brand-subtle, rgba(79,70,229,0.06))'
                          : ''
                      }}
                      onClick={() => router.push(`/anagrafica/${slug}/${scheda._id}/view`)}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-4 py-3 w-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleOne(scheda._id)
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(scheda._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 cursor-pointer"
                          aria-label="Seleziona scheda"
                        />
                      </td>

                      {/* Celle dati */}
                      {previewColumns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 max-w-[200px] truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {formatCella(scheda.dati[col])}
                        </td>
                      ))}

                      {/* Data creazione */}
                      <td
                        className="px-4 py-3 text-xs whitespace-nowrap"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {new Date(scheda.createdAt).toLocaleDateString('it-IT')}
                      </td>

                      {/* Azioni — appaiono su hover */}
                      <td
                        className="px-3 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* View */}
                          <button
                            title="Visualizza"
                            onClick={() => router.push(`/anagrafica/${slug}/${scheda._id}/view`)}
                            className="btn-icon"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Edit */}
                          <button
                            title="Modifica"
                            onClick={() => router.push(`/anagrafica/${slug}/${scheda._id}/edit`)}
                            className="btn-icon"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {/* Delete */}
                          <button
                            title="Elimina"
                            onClick={() => {
                              setDeleteTarget(scheda)
                              setEliminando(scheda._id)
                            }}
                            className="btn-icon-danger"
                            style={{ color: 'var(--color-error)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ——— PAGINAZIONE ——— */}
        {meta && meta.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {meta.total} {meta.total === 1 ? 'scheda' : 'schede'} totali
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-icon disabled:opacity-30"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {page} / {meta.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={!meta.hasMore}
                className="btn-icon disabled:opacity-30"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Pagina successiva"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ——— MODALE ELIMINAZIONE SINGOLA ——— */}
      {deleteTarget && (
        <DeleteConfirmModal
          nome={getLabelScheda(deleteTarget, previewColumns)}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteTarget(null)
            setEliminando(null)
          }}
          loading={deleteLoading}
        />
      )}

      {/* ——— MODALE ELIMINAZIONE BULK ——— */}
      {showBulkConfirm && (
        <BulkDeleteConfirmModal
          count={selectedIds.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
          loading={bulkLoading}
        />
      )}
    </div>
  )
}

export default PreviewTable
