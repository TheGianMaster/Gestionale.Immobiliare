'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, AlertCircle, Loader2 } from 'lucide-react'
import { FieldRenderer } from '@/components/variabili/FieldRenderer'
import { buildSchedaSchema } from '@/lib/validators'
import type { IVariabile } from '@/types/variabili'
import { cn } from '@/lib/utils'

interface SchedaFormProps {
  anagraficaSlug: string
  anagraficaNome: string
  variabili:      IVariabile[]
  schedaId?:      string          // presente in edit, assente in new
  valoriIniziali?: Record<string, unknown>
  tagsIniziali?:  string[]
}

export function SchedaForm({
  anagraficaSlug,
  anagraficaNome,
  variabili,
  schedaId,
  valoriIniziali = {},
  tagsIniziali   = [],
}: SchedaFormProps) {
  const router = useRouter()
  const isEdit = !!schedaId

  const [dati,    setDati]    = useState<Record<string, unknown>>(valoriIniziali)
  const [tags,    setTags]    = useState<string[]>(tagsIniziali)
  const [tagInput, setTagInput] = useState('')
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [saving,  setSaving]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Variante selezionata (per nascondere campi soloPerVarianti)
  const variantIDField = variabili.find(v => v.tipo === 'variantID')
  const varianteCorrente = variantIDField ? (dati[variantIDField.slug] as string | null) : null

  const handleChange = useCallback((slug: string, valore: unknown) => {
    setDati(prev => ({ ...prev, [slug]: valore }))
    if (errors[slug]) setErrors(prev => { const n = { ...prev }; delete n[slug]; return n })
  }, [errors])

  function isFieldVisible(v: IVariabile): boolean {
    if (!v.soloPerVarianti?.length) return true
    return !!varianteCorrente && v.soloPerVarianti.includes(varianteCorrente)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    // Validazione client-side
    const schema = buildSchedaSchema(variabili, variantIDField?.slug, varianteCorrente)
    const result = schema.safeParse(dati)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (key) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      // Scroll al primo errore
      const firstKey = Object.keys(fieldErrors)[0]
      if (firstKey) {
        document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setSaving(true)
    try {
      const url    = isEdit
        ? `/api/anagrafiche/${anagraficaSlug}/schede/${schedaId}`
        : `/api/anagrafiche/${anagraficaSlug}/schede`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dati, tags }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Errore ${res.status}`)
      }

      const data = await res.json()
      const id   = data.data?._id ?? schedaId
      router.push(`/anagrafica/${anagraficaSlug}/${id}/view`)
      router.refresh()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)) }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* Errore API */}
      {apiError && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error-dark)', border: '1px solid var(--color-error)' }}
          role="alert">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Campi */}
      <div className="rounded-xl divide-y" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', divideColor: 'var(--color-border)' }}>
        {variabili.filter(v => v.tipo !== 'variantID').length > 0 && variantIDField && (
          <div className="px-6 py-4" id={`field-${variantIDField.slug}`}>
            <FieldRenderer
              key={variantIDField.slug}
              variabile={variantIDField}
              valore={dati[variantIDField.slug] ?? null}
              mode="edit"
              onChange={handleChange}
              error={errors[variantIDField.slug]}
              anagraficaSlug={anagraficaSlug}
            />
          </div>
        )}

        {variabili
          .filter(v => v.tipo !== 'variantID')
          .filter(v => isFieldVisible(v))
          .map(v => (
            <div key={v.slug} className="px-6 py-4" id={`field-${v.slug}`}>
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

        {variabili.filter(v => v.tipo !== 'variantID' && isFieldVisible(v)).length === 0 && !variantIDField && (
          <div className="px-6 py-8 text-center text-sm text-text-muted">
            Nessun campo configurato per questa anagrafica.
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="rounded-xl px-6 py-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <label className="block text-sm font-medium text-text-primary mb-2">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:opacity-70 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Aggiungi tag (premi Invio o virgola)"
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none' }}
        />
        <p className="text-xs text-text-muted mt-1">Premi Invio o virgola per aggiungere un tag</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <X className="w-4 h-4" />
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          style={{ backgroundColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvataggio...' : isEdit ? 'Salva modifiche' : 'Crea scheda'}
        </button>
      </div>
    </form>
  )
}
