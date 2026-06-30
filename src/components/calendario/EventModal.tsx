'use client'

/**
 * src/components/calendario/EventModal.tsx
 * Form modale per creare / modificare / visualizzare un evento.
 * Features: backdrop, centering, overflow scroll, cursor-loading,
 *           ricorrenza, color picker custom, tipi da API.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Loader2, Trash2, Calendar, Clock, Tag, AlignLeft, RefreshCw, Check, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// ── Tipi ──────────────────────────────────────────────────────
const COLORI_PRESET = [
  '#6366F1', '#EF4444', '#F59E0B', '#10B981',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
]

export interface EventoForm {
  _id?: string
  titolo: string
  tipo: string
  descrizione: string
  inizio: string
  oraInizio: string
  fine: string
  oraFine: string
  tuttoIlGiorno: boolean
  colore: string
  etichette: string[]
  ricorrente: boolean
  ricorrenzaTipo: 'annuale' | 'mensile' | 'settimanale'
  ricorrenzaFine: string
}

interface TipoCalendario { _id: string; nome: string; colore: string }

interface EventModalProps {
  evento?: EventoForm & { _id: string }
  defaultDate?: string
  onClose: () => void
  onSaved: () => void
}

const DEFAULT: EventoForm = {
  titolo: '',
  tipo: '',
  descrizione: '',
  inizio: '',
  oraInizio: '09:00',
  fine: '',
  oraFine: '10:00',
  tuttoIlGiorno: false,
  colore: '#6366F1',
  etichette: [],
  ricorrente: false,
  ricorrenzaTipo: 'settimanale',
  ricorrenzaFine: '',
}

// ── Mini color picker inline ────────────────────────────────
function ColorPickerCustom({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [hex, setHex] = useState(value.replace('#', ''))
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  // Draw spectrum on canvas
  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height

    // Hue gradient (horizontal)
    const hueGrad = ctx.createLinearGradient(0, 0, W, 0)
    for (let i = 0; i <= 360; i += 60) {
      hueGrad.addColorStop(i / 360, `hsl(${i},100%,50%)`)
    }
    ctx.fillStyle = hueGrad
    ctx.fillRect(0, 0, W, H)

    // White to transparent (vertical top)
    const whiteGrad = ctx.createLinearGradient(0, 0, 0, H)
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)')
    whiteGrad.addColorStop(0.5, 'rgba(255,255,255,0)')
    ctx.fillStyle = whiteGrad
    ctx.fillRect(0, 0, W, H)

    // Black to transparent (vertical bottom)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, H)
    blackGrad.addColorStop(0.5, 'rgba(0,0,0,0)')
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = blackGrad
    ctx.fillRect(0, 0, W, H)
  }, [])

  useEffect(() => { if (open) drawSpectrum() }, [open, drawSpectrum])

  const pickColor = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    const ctx = canvas.getContext('2d')!
    const px = ctx.getImageData(Math.round(x * canvas.width / rect.width), Math.round(y * canvas.height / rect.height), 1, 1).data
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    const color = `#${toHex(px[0])}${toHex(px[1])}${toHex(px[2])}`
    setHex(color.replace('#', ''))
    onChange(color)
    setPos({ x: x / rect.width * 100, y: y / rect.height * 100 })
  }, [onChange])

  const handleHexInput = (val: string) => {
    setHex(val)
    if (/^[0-9A-Fa-f]{6}$/.test(val)) onChange(`#${val}`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="btn-icon w-6 h-6 rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: 'var(--color-border)' }}
        title="Colore personalizzato"
      >
        <Plus className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
      </button>

      {open && (
        <div
          className="absolute z-50 p-3 rounded-xl shadow-xl border mt-1"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            width: 220,
            right: 0,
          }}
        >
          {/* Spectrum canvas */}
          <canvas
            ref={canvasRef}
            width={200}
            height={120}
            className="w-full rounded-lg cursor-crosshair mb-2 block"
            style={{ position: 'relative' }}
            onMouseDown={e => { isDragging.current = true; pickColor(e) }}
            onMouseMove={e => { if (isDragging.current) pickColor(e) }}
            onMouseUp={() => { isDragging.current = false }}
            onMouseLeave={() => { isDragging.current = false }}
            onClick={pickColor}
          />

          {/* Preview + hex input */}
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full border-2 shrink-0"
              style={{ backgroundColor: `#${hex}`, borderColor: 'var(--color-border)' }}
            />
            <span className="text-sm text-text-muted">#</span>
            <input
              value={hex.toUpperCase()}
              onChange={e => handleHexInput(e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
              className="flex-1 px-2 py-1 rounded text-sm font-mono border uppercase"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              maxLength={6}
              placeholder="6366F1"
            />
            <button type="button" onClick={() => setOpen(false)} className="btn-icon">
              <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principale ────────────────────────────────────
export function EventModal({ evento, defaultDate, onClose, onSaved }: EventModalProps) {
  const isEdit = !!evento?._id
  const [mode, setMode] = useState<'view' | 'edit'>(isEdit ? 'view' : 'edit')
  const [form, setForm] = useState<EventoForm>(() =>
    evento
      ? { ...DEFAULT, ...evento }
      : { ...DEFAULT, inizio: defaultDate ?? format(new Date(), 'yyyy-MM-dd'), fine: defaultDate ?? format(new Date(), 'yyyy-MM-dd') }
  )
  const [tagInput, setTagInput]           = useState('')
  const [saving, setSaving]               = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [errore, setErrore]               = useState<string | null>(null)
  const [tipi, setTipi]                   = useState<TipoCalendario[]>([])
  const [etichetteSuggerite, setEtichetteSuggerite] = useState<string[]>([])

  // Fetch tipi appuntamento e etichette suggerite
  useEffect(() => {
    fetch('/api/controllo/calendario/tipi')
      .then(r => r.json())
      .then(j => {
        const lista: TipoCalendario[] = j.data ?? []
        setTipi(lista)
        if (!form.tipo && lista.length > 0) setForm(p => ({ ...p, tipo: lista[0].nome }))
      })
      .catch(() => {})

    fetch('/api/calendario/etichette-suggerite')
      .then(r => r.json())
      .then(j => setEtichetteSuggerite(j.data ?? []))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = <K extends keyof EventoForm>(key: K, val: EventoForm[K]) =>
    setForm(p => ({ ...p, [key]: val }))

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (t && !form.etichette.includes(t)) set('etichette', [...form.etichette, t])
    setTagInput('')
  }
  const removeTag = (t: string) => set('etichette', form.etichette.filter(e => e !== t))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titolo.trim()) { setErrore('Il titolo e obbligatorio'); return }
    setSaving(true)
    setErrore(null)
    try {
      const payload = {
        ...form,
        ricorrenza: form.ricorrente && form.ricorrenzaFine
          ? { tipo: form.ricorrenzaTipo, fine: form.ricorrenzaFine }
          : undefined,
      }
      const url    = isEdit ? `/api/calendario/${evento!._id}` : '/api/calendario'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? 'Errore') }
      onSaved()
      onClose()
    } catch (err: unknown) {
      setErrore(err instanceof Error ? err.message : 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!evento?._id || !confirm('Eliminare questo evento?')) return
    setDeleting(true)
    try {
      await fetch(`/api/calendario/${evento._id}`, { method: 'DELETE' })
      onSaved()
      onClose()
    } catch { setErrore('Errore eliminazione') }
    finally { setDeleting(false) }
  }

  const tipoCorrente = tipi.find(t => t.nome === form.tipo)

  return (
    // Backdrop full-screen fixed, centrato
    <div
      className="modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={cn(
          'modal-panel w-full max-w-lg rounded-2xl flex flex-col my-auto',
          (saving || deleting) && 'cursor-loading'
        )}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header fisso */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0 border-b"
          style={{ borderColor: 'var(--color-border)' }}>
          <span className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: tipoCorrente?.colore ?? form.colore }} />
          <h2 className="flex-1 text-base font-semibold text-text-primary truncate">
            {isEdit ? (mode === 'view' ? form.titolo : 'Modifica evento') : 'Nuovo evento'}
          </h2>
          {isEdit && mode === 'view' && (
            <button onClick={() => setMode('edit')} className="btn-secondary text-xs">Modifica</button>
          )}
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body scrollabile */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {errore && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4"
              style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
              {errore}
              <button onClick={() => setErrore(null)} className="ml-auto btn-icon">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form id="event-form" onSubmit={handleSubmit} className="space-y-4">

            {/* Titolo */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Titolo *</label>
              <input
                value={form.titolo}
                onChange={e => set('titolo', e.target.value)}
                disabled={mode === 'view'}
                placeholder="Inserisci titolo..."
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                required
                autoFocus
              />
            </div>

            {/* Tipo appuntamento */}
            {tipi.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {tipi.map(t => (
                    <button
                      key={t._id}
                      type="button"
                      disabled={mode === 'view'}
                      onClick={() => { set('tipo', t.nome); set('colore', t.colore) }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        form.tipo === t.nome ? 'scale-105' : 'opacity-60 hover:opacity-100'
                      )}
                      style={form.tipo === t.nome
                        ? { backgroundColor: t.colore + '25', color: t.colore, borderColor: t.colore }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                      }
                    >
                      {t.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tipo libero se nessun tipo configurato */}
            {tipi.length === 0 && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Tipo</label>
                <input
                  value={form.tipo}
                  onChange={e => set('tipo', e.target.value)}
                  disabled={mode === 'view'}
                  placeholder="es. Appuntamento, Scadenza..."
                  className="w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
            )}

            {/* Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Inizio
                </label>
                <input type="date" value={form.inizio} onChange={e => set('inizio', e.target.value)}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Fine
                </label>
                <input type="date" value={form.fine} onChange={e => set('fine', e.target.value)}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>

            {/* Tutto il giorno */}
            <div className="flex items-center gap-2">
              <input id="tutto-giorno" type="checkbox"
                checked={form.tuttoIlGiorno}
                onChange={e => set('tuttoIlGiorno', e.target.checked)}
                disabled={mode === 'view'}
                className="rounded" />
              <label htmlFor="tutto-giorno" className="text-xs text-text-secondary cursor-pointer select-none">
                Tutto il giorno
              </label>
            </div>

            {/* Orari */}
            {!form.tuttoIlGiorno && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1">
                    <Clock className="w-3.5 h-3.5" /> Ora inizio
                  </label>
                  <input type="time" value={form.oraInizio} onChange={e => set('oraInizio', e.target.value)}
                    disabled={mode === 'view'}
                    className="w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1">
                    <Clock className="w-3.5 h-3.5" /> Ora fine
                  </label>
                  <input type="time" value={form.oraFine} onChange={e => set('oraFine', e.target.value)}
                    disabled={mode === 'view'}
                    className="w-full px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                </div>
              </div>
            )}

            {/* Ricorrenza */}
            {mode === 'edit' && (
              <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <input
                    id="ricorrente"
                    type="checkbox"
                    checked={form.ricorrente}
                    onChange={e => set('ricorrente', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="ricorrente" className="text-xs font-medium text-text-secondary cursor-pointer select-none flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Evento ricorrente
                  </label>
                </div>

                {form.ricorrente && (
                  <div className="space-y-3 pt-1">
                    {/* Tipo ricorrenza */}
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Frequenza</label>
                      <select
                        value={form.ricorrenzaTipo}
                        onChange={e => set('ricorrenzaTipo', e.target.value as EventoForm['ricorrenzaTipo'])}
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      >
                        <option value="settimanale">Settimanale</option>
                        <option value="mensile">Mensile</option>
                        <option value="annuale">Annuale</option>
                      </select>
                    </div>

                    {/* Data fine ricorrenza */}
                    <div>
                      <label className="block text-xs text-text-muted mb-1">
                        {form.ricorrenzaTipo === 'annuale'
                          ? 'Anno fine (es. 2030-12-31)'
                          : 'Mese e anno fine'}
                      </label>
                      <input
                        type={form.ricorrenzaTipo === 'annuale' ? 'date' : 'month'}
                        value={form.ricorrenzaFine}
                        onChange={e => {
                          let val = e.target.value
                          // Per "month" input, aggiungi -01 per avere una data valida
                          if (form.ricorrenzaTipo !== 'annuale' && val && !val.includes('-01')) {
                            val = val + '-01'
                          }
                          set('ricorrenzaFine', val)
                        }}
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Colore */}
            {mode === 'edit' && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Colore</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLORI_PRESET.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('colore', c)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                        form.colore === c ? 'scale-125' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c, borderColor: form.colore === c ? 'var(--color-text-primary)' : 'transparent' }}
                    />
                  ))}
                  {/* Custom color picker */}
                  <ColorPickerCustom
                    value={form.colore}
                    onChange={c => set('colore', c)}
                  />
                  {/* Preview colore custom se non e preset */}
                  {!COLORI_PRESET.includes(form.colore) && (
                    <span className="w-6 h-6 rounded-full border-2"
                      style={{ backgroundColor: form.colore, borderColor: 'var(--color-text-primary)' }} />
                  )}
                </div>
              </div>
            )}

            {/* Etichette */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1.5">
                <Tag className="w-3.5 h-3.5" /> Etichette
              </label>
              {form.etichette.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.etichette.map(t => (
                    <span key={t}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: form.colore + '20', color: form.colore, border: `1px solid ${form.colore}50` }}>
                      {t}
                      {mode === 'edit' && (
                        <button type="button" onClick={() => removeTag(t)} className="hover:opacity-70 leading-none">&times;</button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {mode === 'edit' && etichetteSuggerite.filter(s => !form.etichette.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {etichetteSuggerite.filter(s => !form.etichette.includes(s)).map(s => (
                    <button type="button" key={s} onClick={() => addTag(s)}
                      className="text-xs px-2 py-0.5 rounded-full border transition-colors hover:bg-surface-hover"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      + {s}
                    </button>
                  ))}
                </div>
              )}
              {mode === 'edit' && (
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
                  placeholder="Aggiungi etichetta, premi Invio..."
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              )}
            </div>

            {/* Note */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1">
                <AlignLeft className="w-3.5 h-3.5" /> Note
              </label>
              <textarea
                value={form.descrizione}
                onChange={e => set('descrizione', e.target.value)}
                disabled={mode === 'view'}
                rows={3}
                placeholder="Note..."
                className="w-full px-3 py-2 rounded-lg text-sm border resize-none disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

          </form>
        </div>

        {/* Footer fisso */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0"
          style={{ borderColor: 'var(--color-border)' }}>
          <div>
            {isEdit && mode === 'edit' && (
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Elimina
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              {mode === 'view' ? 'Chiudi' : 'Annulla'}
            </button>
            {mode === 'edit' && (
              <button type="submit" form="event-form" disabled={saving} className="btn-primary">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? 'Salva modifiche' : 'Crea evento'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
