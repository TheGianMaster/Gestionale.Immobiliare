'use client'

/**
 * src/components/controllo/AnagraficaEditor.tsx
 * Editor no-code per creare e modificare anagrafiche (campi + opzioni select).
 * Usato da /controllo/anagrafiche/nuova e /controllo/anagrafiche/[slug].
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Plus, Trash2, Loader2, AlertCircle,
  ChevronDown, ChevronRight, GripVertical, Info, X, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Tipi ─────────────────────────────────────────────────────────────────────

type TipoVariabile =
  | 'text' | 'text-area' | 'numbers' | 'mail' | 'phone'
  | 'data'  | 'select'   | 'reference' | 'multi-reference'
  | 'variantID' | 'line-items'

interface SelectOpt { _id: string; valore: string; etichetta: string; ordine: number }

interface ColonnaLineItems {
  slug: string; nome: string; tipo: 'text' | 'numbers' | 'reference'; referenceTo?: string; decimali?: boolean
}

interface Variabile {
  _id?: string
  slug: string; nome: string; tipo: TipoVariabile
  obbligatorio: boolean; visibileInPreview: boolean
  descrizione?: string; placeholder?: string
  decimali?: boolean; referenceTo?: string
  colonne?: ColonnaLineItems[]
  ordine: number
  options?: SelectOpt[]
}

interface AnagraficaCfg {
  slug: string; nome: string; colore: string; icona: string
  ordine: number; maxDocumentoMB: number; tipiDocumento: string[]
  previewColumns: string[]
}

interface AnagraficaEditorProps {
  mode: 'new' | 'edit'
  slug?: string
}

// ── Costanti ─────────────────────────────────────────────────────────────────

const TIPI: { value: TipoVariabile; label: string }[] = [
  { value: 'text',            label: 'Testo' },
  { value: 'text-area',       label: 'Testo lungo' },
  { value: 'numbers',         label: 'Numero / Valuta' },
  { value: 'mail',            label: 'Email' },
  { value: 'phone',           label: 'Telefono' },
  { value: 'data',            label: 'Data' },
  { value: 'select',          label: 'Selezione' },
  { value: 'reference',       label: 'Riferimento singolo' },
  { value: 'multi-reference', label: 'Riferimento multiplo' },
  { value: 'line-items',      label: 'Righe ripetibili' },
]

const COLORI_PRESET = [
  '#6366F1','#EF4444','#F59E0B','#10B981',
  '#3B82F6','#8B5CF6','#EC4899','#6B7280',
  '#0EA5E9','#22C55E','#DC2626','#16A34A',
]

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
function toVarSlug(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

// ── Input di stile condiviso ──────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, disabled, type = 'text', required }: {
  label?: string; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean; type?: string; required?: boolean
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          {label}{required && <span className="ml-0.5" style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}
      <input
        type={type} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={cn(
          'w-full rounded-lg px-3 py-2 text-sm border outline-none transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        )}
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={cn('w-9 h-5 rounded-full transition-colors flex items-center', checked ? 'bg-brand' : '')}
        style={{ backgroundColor: checked ? 'var(--color-brand)' : 'var(--color-border)' }}
      >
        <div className={cn('w-4 h-4 rounded-full bg-white shadow transition-transform ml-0.5', checked ? 'translate-x-4' : '')} />
      </div>
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </label>
  )
}

// ── Editor opzioni SELECT ─────────────────────────────────────────────────────
function SelectOptsEditor({ anagraficaSlug, varSlug, opts, onAdd, onDelete }: {
  anagraficaSlug: string; varSlug: string; opts: SelectOpt[]
  onAdd: (opt: SelectOpt) => void; onDelete: (id: string) => void
}) {
  const [newVal, setNewVal] = useState('')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    const v = newVal.trim(); if (!v) return
    setSaving(true)
    try {
      const res = await fetch(`/api/controllo/anagrafiche/${anagraficaSlug}/variabili/${varSlug}/options`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valore: v, etichetta: v }),
      })
      if (res.ok) { const j = await res.json(); onAdd(j.data); setNewVal('') }
    } finally { setSaving(false) }
  }

  const del = async (id: string) => {
    await fetch(`/api/controllo/anagrafiche/${anagraficaSlug}/variabili/${varSlug}/options/${id}`, { method: 'DELETE' })
    onDelete(id)
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Opzioni</p>
      <div className="space-y-1 mb-2">
        {opts.map(o => (
          <div key={o._id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <span className="flex-1" style={{ color: 'var(--color-text-primary)' }}>{o.etichetta}</span>
            <button type="button" onClick={() => del(o._id)} className="hover:opacity-70" style={{ color: 'var(--color-error)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {opts.length === 0 && (
          <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>Nessuna opzione. Aggiungine una sotto.</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Nuova opzione..."
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm border outline-none"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        />
        <button type="button" onClick={add} disabled={saving || !newVal.trim()} className="btn-secondary text-xs px-3">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

// ── Editor colonne LINE-ITEMS ─────────────────────────────────────────────────
function LineItemsColonneEditor({ colonne, anagrafiche, onChange, isExisting }: {
  colonne: ColonnaLineItems[]; anagrafiche: { slug: string; nome: string }[]
  onChange: (c: ColonnaLineItems[]) => void; isExisting?: boolean
}) {
  const addCol = () => onChange([...colonne, { slug: '', nome: '', tipo: 'text' }])
  const upd = (i: number, patch: Partial<ColonnaLineItems>) => {
    onChange(colonne.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  }
  const del = (i: number) => onChange(colonne.filter((_, idx) => idx !== i))

  return (
    <div className="mt-3">
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Colonne della riga ripetibile</p>
      <div className="space-y-2">
        {colonne.map((col, i) => {
          // Una colonna esistente con referenceTo già impostato è bloccata
          const colRefLocked = isExisting && !!col.referenceTo
          return (
            <div key={i} className="flex gap-2 items-start p-2 rounded-lg border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                <input value={col.nome} onChange={e => upd(i, { nome: e.target.value, slug: toVarSlug(e.target.value) })}
                  disabled={isExisting}
                  placeholder="Nome colonna" className="rounded px-2 py-1 text-xs border outline-none col-span-2"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', opacity: isExisting ? 0.6 : 1 }} />
                <select value={col.tipo}
                  onChange={e => upd(i, { tipo: e.target.value as ColonnaLineItems['tipo'] })}
                  disabled={isExisting}
                  className="rounded px-2 py-1 text-xs border outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', opacity: isExisting ? 0.6 : 1 }}>
                  <option value="text">Testo</option>
                  <option value="numbers">Numero</option>
                  <option value="reference">Reference</option>
                </select>
                {col.tipo === 'numbers' && (
                  <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <input type="checkbox" checked={!!col.decimali} onChange={e => upd(i, { decimali: e.target.checked })} />
                    Decimali
                  </label>
                )}
                {col.tipo === 'reference' && (
                  colRefLocked ? (
                    <div className="flex items-start gap-1.5 rounded px-2 py-1 col-span-2"
                      style={{ backgroundColor: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}>
                      <Info className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'var(--color-brand)' }} />
                      <div>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{col.referenceTo}</span>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Per cambiare il puntatore usa il terminale in locale.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <select value={col.referenceTo ?? ''} onChange={e => upd(i, { referenceTo: e.target.value })}
                      className="rounded px-2 py-1 text-xs border outline-none"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      <option value="">— Scegli anagrafica —</option>
                      {anagrafiche.map(a => <option key={a.slug} value={a.slug}>{a.nome}</option>)}
                    </select>
                  )
                )}
              </div>
              {!isExisting && (
                <button type="button" onClick={() => del(i)} className="mt-1 hover:opacity-70 shrink-0" style={{ color: 'var(--color-error)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
      {!isExisting && (
        <button type="button" onClick={addCol} className="mt-2 btn-ghost text-xs">
          <Plus className="w-3.5 h-3.5" /> Aggiungi colonna
        </button>
      )}
      {isExisting && (
        <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Le colonne delle righe ripetibili non sono modificabili dall'interfaccia. Usa il terminale in locale.
        </p>
      )}
    </div>
  )
}

// ── Form aggiunta/modifica variabile ─────────────────────────────────────────
function VariabileForm({ anagraficaSlug, anagrafiche, existingVar, onSaved, onCancel }: {
  anagraficaSlug: string; anagrafiche: { slug: string; nome: string }[]
  existingVar?: Variabile; onSaved: (v: Variabile) => void; onCancel: () => void
}) {
  const isEdit = !!existingVar
  const [nome,             setNome]             = useState(existingVar?.nome             ?? '')
  const [tipo,             setTipo]             = useState<TipoVariabile>(existingVar?.tipo ?? 'text')
  const [obbligatorio,     setObbligatorio]     = useState(existingVar?.obbligatorio     ?? false)
  const [visibileInPreview,setVisibileInPreview]= useState(existingVar?.visibileInPreview ?? false)
  const [descrizione,      setDescrizione]      = useState(existingVar?.descrizione      ?? '')
  const [placeholder,      setPlaceholder]      = useState(existingVar?.placeholder      ?? '')
  const [decimali,         setDecimali]         = useState(existingVar?.decimali         ?? false)
  const [referenceTo,      setReferenceTo]      = useState(existingVar?.referenceTo      ?? '')
  const [colonne,          setColonne]          = useState<ColonnaLineItems[]>(existingVar?.colonne ?? [])
  const [opts,             setOpts]             = useState<SelectOpt[]>(existingVar?.options ?? [])
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState('')

  const refLocked = isEdit && !!existingVar?.referenceTo

  const salva = async () => {
    if (!nome.trim()) { setError('Il nome è obbligatorio'); return }
    setSaving(true); setError('')
    try {
      const body: Record<string, unknown> = {
        nome, tipo, obbligatorio, visibileInPreview, descrizione, placeholder,
      }
      if (!isEdit) body.slug = toVarSlug(nome)
      if (tipo === 'numbers') body.decimali = decimali
      if ((tipo === 'reference' || tipo === 'multi-reference') && !refLocked) body.referenceTo = referenceTo
      if (tipo === 'line-items') body.colonne = colonne

      const url = isEdit
        ? `/api/controllo/anagrafiche/${anagraficaSlug}/variabili/${existingVar!.slug}`
        : `/api/controllo/anagrafiche/${anagraficaSlug}/variabili`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j   = await res.json()
      if (!res.ok) { setError(j.error ?? 'Errore'); return }

      onSaved({ ...j.data, options: opts })
    } finally { setSaving(false) }
  }

  return (
    <div className="rounded-xl border p-4 space-y-4"
      style={{ borderColor: 'var(--color-brand)', backgroundColor: 'var(--color-surface)' }}>

      {/* Nome + Tipo */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nome campo" value={nome} onChange={setNome} placeholder="es. Data di nascita" required />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as TipoVariabile)} disabled={isEdit}
            className={cn('w-full rounded-lg px-3 py-2 text-sm border outline-none', isEdit ? 'opacity-50 cursor-not-allowed' : '')}
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
            {TIPI.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {isEdit && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Il tipo non è modificabile dopo la creazione</p>}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex gap-6 flex-wrap">
        <Toggle label="Obbligatorio" checked={obbligatorio} onChange={setObbligatorio} />
        <Toggle label="Visibile in preview" checked={visibileInPreview} onChange={setVisibileInPreview} />
      </div>

      {/* Opzioni specifiche per tipo */}
      {tipo === 'numbers' && (
        <Toggle label="Decimali (es. importi in €)" checked={decimali} onChange={setDecimali} />
      )}

      {(tipo === 'reference' || tipo === 'multi-reference') && (
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Anagrafica di riferimento{!refLocked && <span className="ml-0.5" style={{ color: 'var(--color-error)' }}>*</span>}
          </label>
          {refLocked ? (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-brand)' }} />
              <div>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{existingVar?.referenceTo}</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Per cambiare il puntatore di un reference esistente, usa lo script da terminale in locale.
                </p>
              </div>
            </div>
          ) : (
            <select value={referenceTo} onChange={e => setReferenceTo(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
              <option value="">— Scegli anagrafica —</option>
              {anagrafiche.map(a => <option key={a.slug} value={a.slug}>{a.nome} ({a.slug})</option>)}
            </select>
          )}
        </div>
      )}

      {tipo === 'select' && anagraficaSlug && (
        <SelectOptsEditor
          anagraficaSlug={anagraficaSlug}
          varSlug={existingVar?.slug ?? toVarSlug(nome)}
          opts={opts}
          onAdd={opt => setOpts(p => [...p, opt])}
          onDelete={id => setOpts(p => p.filter(o => o._id !== id))}
        />
      )}

      {tipo === 'line-items' && (
        <LineItemsColonneEditor colonne={colonne} anagrafiche={anagrafiche} onChange={setColonne} isExisting={isEdit} />
      )}

      {/* Descrizione / placeholder */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Descrizione (tooltip)" value={descrizione} onChange={setDescrizione} placeholder="Facoltativa" />
        <Input label="Placeholder" value={placeholder} onChange={setPlaceholder} placeholder="Testo di esempio nel campo" />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
          style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error-dark)', border: '1px solid var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost text-xs">Annulla</button>
        <button type="button" onClick={salva} disabled={saving} className="btn-primary text-xs">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {isEdit ? 'Salva modifiche' : 'Aggiungi campo'}
        </button>
      </div>
    </div>
  )
}

// ── Card singola variabile ────────────────────────────────────────────────────
function VariabileCard({ variabile, anagraficaSlug, anagrafiche, onUpdated, onDeleted }: {
  variabile: Variabile; anagraficaSlug: string; anagrafiche: { slug: string; nome: string }[]
  onUpdated: (v: Variabile) => void; onDeleted: (slug: string) => void
}) {
  const [open,     setOpen]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Eliminare il campo "${variabile.nome}"?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/controllo/anagrafiche/${anagraficaSlug}/variabili/${variabile.slug}`, { method: 'DELETE' })
      onDeleted(variabile.slug)
    } finally { setDeleting(false) }
  }

  const tipoLabel = TIPI.find(t => t.value === variabile.tipo)?.label ?? variabile.tipo

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-surface-hover transition-colors"
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={() => setOpen(p => !p)}
      >
        <GripVertical className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-text-primary">{variabile.nome}</span>
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>
            {tipoLabel}
          </span>
          {variabile.obbligatorio && (
            <span className="ml-1 text-xs" style={{ color: 'var(--color-error)' }}>*</span>
          )}
          {variabile.referenceTo && (
            <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>→ {variabile.referenceTo}</span>
          )}
        </div>
        <button type="button" onClick={e => { e.stopPropagation(); handleDelete() }} disabled={deleting}
          className="btn-icon-danger shrink-0" title="Elimina campo">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
        {open ? <ChevronDown className="w-4 h-4 shrink-0 text-text-muted" /> : <ChevronRight className="w-4 h-4 shrink-0 text-text-muted" />}
      </div>

      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
          <div className="pt-3">
            <VariabileForm
              anagraficaSlug={anagraficaSlug}
              anagrafiche={anagrafiche}
              existingVar={variabile}
              onSaved={v => { onUpdated(v); setOpen(false) }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────────────────
export function AnagraficaEditor({ mode, slug: initialSlug }: AnagraficaEditorProps) {
  const router  = useRouter()
  const isNew   = mode === 'new'

  const [loading,   setLoading]   = useState(!isNew)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [toast,     setToast]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Config
  const [nome,      setNome]      = useState('')
  const [slug,      setSlug]      = useState(initialSlug ?? '')
  const [colore,    setColore]    = useState('#6366F1')
  const [icona,     setIcona]     = useState('FileText')
  const [maxMB,     setMaxMB]     = useState(10)
  const [tipiDoc,   setTipiDoc]   = useState<string[]>([])
  const [tipoDocInput, setTipoDocInput] = useState('')

  // Variabili
  const [variabili,    setVariabili]    = useState<Variabile[]>([])
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [anagrafiche,  setAnagrafiche]  = useState<{ slug: string; nome: string }[]>([])

  // Carica tutte le anagrafiche (per picker reference)
  useEffect(() => {
    fetch('/api/anagrafiche').then(r => r.json()).then(j => setAnagrafiche(j.anagrafiche ?? []))
  }, [])

  // Carica dati se edit
  useEffect(() => {
    if (isNew || !initialSlug) return
    setLoading(true)
    fetch(`/api/controllo/anagrafiche/${initialSlug}`)
      .then(r => r.json())
      .then(async j => {
        const cfg = j.data
        setNome(cfg.nome); setSlug(cfg.slug); setColore(cfg.colore ?? '#6366F1')
        setIcona(cfg.icona ?? 'FileText'); setMaxMB(cfg.maxDocumentoMB ?? 10)
        setTipiDoc(cfg.tipiDocumento ?? [])

        // Carica variabili + options per i campi select
        const vars: Variabile[] = j.variabili ?? []
        const varsConOpts = await Promise.all(vars.map(async v => {
          if (v.tipo !== 'select') return v
          const ro = await fetch(`/api/controllo/anagrafiche/${initialSlug}/variabili/${v.slug}/options`)
          const jo = await ro.json()
          return { ...v, options: jo.data ?? [] }
        }))
        setVariabili(varsConOpts)
      })
      .finally(() => setLoading(false))
  }, [isNew, initialSlug])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const salvaConfig = async () => {
    if (!nome.trim()) { setError('Il nome è obbligatorio'); return }
    if (isNew && !slug.trim()) { setError('Lo slug è obbligatorio'); return }
    setSaving(true); setError('')
    try {
      if (isNew) {
        const res = await fetch('/api/controllo/anagrafiche', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, slug, colore, icona }),
        })
        const j = await res.json()
        if (!res.ok) { setError(j.error ?? 'Errore'); showToast('error', j.error ?? 'Impossibile salvare'); return }
        router.replace(`/controllo/anagrafiche/${j.data.slug}`)
        router.refresh()
      } else {
        const res = await fetch(`/api/controllo/anagrafiche/${slug}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, colore, icona, maxDocumentoMB: maxMB, tipiDocumento: tipiDoc }),
        })
        if (!res.ok) {
          const j = await res.json()
          setError(j.error ?? 'Errore')
          showToast('error', j.error ?? 'Impossibile salvare')
        } else {
          showToast('success', 'Modifiche salvate')
        }
      }
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand)' }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 animate-slide-up">

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: toast.type === 'success' ? 'var(--color-success-light, #dcfce7)' : 'var(--color-error-light)',
            color:           toast.type === 'success' ? '#15803d' : 'var(--color-error-dark)',
            border: `1px solid ${toast.type === 'success' ? '#86efac' : 'var(--color-error)'}`,
          }}
        >
          {toast.type === 'success'
            ? <Check className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/controllo')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">
          {isNew ? 'Nuova anagrafica' : `Modifica: ${nome}`}
        </h1>
      </div>

      {/* ── SEZIONE CONFIG ── */}
      <div className="rounded-xl border p-5 mb-6 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold text-text-primary">Configurazione</h2>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Nome" value={nome} onChange={v => { setNome(v); if (isNew) setSlug(toSlug(v)) }} placeholder="es. Clienti" required />
          <Input label="Slug (identificatore)" value={slug} onChange={setSlug} placeholder="es. clienti" disabled={!isNew} required={isNew} />
        </div>
        {!isNew && <p className="text-xs -mt-2" style={{ color: 'var(--color-text-muted)' }}>Lo slug non è modificabile dopo la creazione.</p>}

        {/* Colore */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Colore</label>
          <div className="flex gap-2 flex-wrap">
            {COLORI_PRESET.map(c => (
              <button key={c} type="button" onClick={() => setColore(c)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: colore === c ? 'var(--color-text-primary)' : 'transparent' }} />
            ))}
          </div>
        </div>

        {!isNew && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Max MB documenti</label>
                <input type="number" min={1} max={100} value={maxMB} onChange={e => setMaxMB(Number(e.target.value))}
                  className="w-24 rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Tag tipi documento</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tipiDoc.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    {t}
                    <button type="button" onClick={() => setTipiDoc(p => p.filter(x => x !== t))} className="hover:opacity-60">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tipoDocInput} onChange={e => setTipoDocInput(e.target.value)} placeholder="es. Contratto"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (tipoDocInput.trim()) { setTipiDoc(p => [...p, tipoDocInput.trim()]); setTipoDocInput('') } } }}
                  className="flex-1 rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
                <button type="button" onClick={() => { if (tipoDocInput.trim()) { setTipiDoc(p => [...p, tipoDocInput.trim()]); setTipoDocInput('') } }} className="btn-secondary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error-dark)', border: '1px solid var(--color-error)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={salvaConfig} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Crea anagrafica' : 'Salva configurazione'}
          </button>
        </div>
      </div>

      {/* ── SEZIONE CAMPI (solo in edit) ── */}
      {!isNew && (
        <div className="rounded-xl border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Campi ({variabili.length})</h2>
          </div>

          <div className="space-y-2 mb-3">
            {variabili.map(v => (
              <VariabileCard
                key={v.slug}
                variabile={v}
                anagraficaSlug={slug}
                anagrafiche={anagrafiche}
                onUpdated={updated => setVariabili(p => p.map(x => x.slug === updated.slug ? updated : x))}
                onDeleted={vs => setVariabili(p => p.filter(x => x.slug !== vs))}
              />
            ))}
            {variabili.length === 0 && !showAddForm && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                Nessun campo ancora. Clicca "Aggiungi campo" per iniziare.
              </p>
            )}
          </div>

          {showAddForm ? (
            <VariabileForm
              anagraficaSlug={slug}
              anagrafiche={anagrafiche}
              onSaved={v => { setVariabili(p => [...p, v]); setShowAddForm(false) }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button type="button" onClick={() => setShowAddForm(true)} className="btn-ghost w-full justify-center mt-1">
              <Plus className="w-4 h-4" /> Aggiungi campo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
