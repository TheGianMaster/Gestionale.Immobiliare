'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { FieldRenderer } from '@/components/variabili/FieldRenderer'
import { buildSchedaSchema } from '@/lib/validators'
import type { IVariabile } from '@/types/variabili'

interface RefValue { id: string; label: string }

interface NewSchedaModalProps {
  anagraficaSlug:  string
  anagraficaNome?: string
  onCreated:       (ref: RefValue) => void
  onClose:         () => void
}

export function NewSchedaModal({ anagraficaSlug, anagraficaNome, onCreated, onClose }: NewSchedaModalProps) {
  const [variabili, setVariabili] = useState<IVariabile[]>([])
  const [configNome, setConfigNome] = useState(anagraficaNome ?? anagraficaSlug)
  const [loading, setLoading]   = useState(true)
  const [dati, setDati]         = useState<Record<string, unknown>>({})
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [saving, setSaving]     = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/anagrafiche/${anagraficaSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setVariabili(data.data.variabiliPopulate ?? [])
          setConfigNome(data.data.nome ?? anagraficaSlug)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [anagraficaSlug])

  // Chiudi su Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleChange(slug: string, valore: unknown) {
    setDati(prev => ({ ...prev, [slug]: valore }))
    if (errors[slug]) setErrors(prev => { const n = { ...prev }; delete n[slug]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    const schema = buildSchedaSchema(variabili)
    const result = schema.safeParse(dati)
    if (!result.success) {
      const fe: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const k = issue.path[0] as string
        if (k) fe[k] = issue.message
      }
      setErrors(fe)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/anagrafiche/${anagraficaSlug}/schede`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dati, tags: [] }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? `Errore ${res.status}`)
      }
      const d = await res.json()
      const id = String(d.data?._id ?? '')

      // Ricava label dalla prima previewColumn valorizzata
      const varTitle = variabili.find(v => v.visibileInPreview)
      const label    = varTitle ? (String(dati[varTitle.slug] ?? '') || id) : id

      onCreated({ id, label })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div
        className="modal-panel w-full max-w-lg rounded-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--color-surface)',
          border:          '1px solid var(--color-border)',
          boxShadow:       'var(--shadow-xl)',
          maxHeight:       '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Nuova scheda</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{configNome}</p>
          </div>
          <button onClick={onClose} className="btn-icon"
            style={{ color: 'var(--color-text-muted)' }} aria-label="Chiudi">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand)' }} />
            </div>
          ) : (
            <form id="new-scheda-modal-form" onSubmit={handleSubmit} noValidate className="space-y-1">
              {apiError && (
                <div className="mb-4 px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error-dark)', border: '1px solid var(--color-error)' }}>
                  {apiError}
                </div>
              )}
              {variabili.map(v => (
                <div key={v.slug} className="py-2">
                  <FieldRenderer
                    variabile={v}
                    valore={dati[v.slug] ?? null}
                    mode="edit"
                    onChange={handleChange}
                    error={errors[v.slug]}
                    anagraficaSlug={anagraficaSlug}
                  />
                </div>
              ))}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={onClose}
            className="btn-secondary">
            Annulla
          </button>
          <button type="submit" form="new-scheda-modal-form" disabled={saving || loading}
            className="btn-primary">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Salvataggio...' : 'Crea e seleziona'}
          </button>
        </div>
      </div>
    </div>
  )
}
