'use client'

/**
 * src/components/automazioni/NuovoDebitoWizard.tsx
 * Wizard multi-step per la creazione guidata di un nuovo debito.
 * Al completamento crea automaticamente: Debito + Portafogli + Ricavo.
 */

import { useState, useEffect, useRef } from 'react'
import {
  X, Search, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, AlertCircle, ExternalLink, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RefVal { id: string; label: string }

// ── Ricerca reference inline ──────────────────────────────────────────────────
function RefSearch({
  slug,
  value,
  onChange,
  placeholder = 'Cerca...',
}: {
  slug: string
  value: RefVal | null
  onChange: (v: RefVal | null) => void
  placeholder?: string
}) {
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const [results, setResults] = useState<RefVal[]>([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      setLoading(true)
      fetch(`/api/anagrafiche/${slug}/schede?limit=8${query ? `&q=${encodeURIComponent(query)}` : ''}`)
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d.data)) {
            setResults(d.data.map((s: { _id: string; dati?: Record<string, unknown> }) => ({
              id: s._id,
              label: Object.values(s.dati ?? {})[0] ? String(Object.values(s.dati ?? {})[0]) : s._id,
            })))
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [open, query, slug])

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
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm border"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <span className="flex-1 text-text-primary">{value.label}</span>
        <button type="button" onClick={() => onChange(null)} style={{ color: 'var(--color-text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" value={query} placeholder={placeholder}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm border outline-none"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <button
          type="button"
          onClick={() => window.open(`/anagrafica/${slug}/new`, '_blank')}
          title="Nuova scheda"
          className="w-10 h-10 flex items-center justify-center rounded-lg border shrink-0 transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-brand)', backgroundColor: 'var(--color-surface)' }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
          {loading
            ? <p className="px-3 py-2 text-sm text-text-muted">Ricerca...</p>
            : results.length === 0
              ? <p className="px-3 py-2 text-sm text-text-muted">Nessun risultato</p>
              : results.map(r => (
                  <button key={r.id} type="button"
                    onMouseDown={() => { onChange(r); setOpen(false); setQuery('') }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors text-text-primary">
                    {r.label}
                  </button>
                ))
          }
        </div>
      )}
    </div>
  )
}

// ── Card selezione opzione ────────────────────────────────────────────────────
function OptionCard({
  label, desc, selected, onClick,
}: { label: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left rounded-xl border-2 px-5 py-4 transition-colors"
      style={{
        borderColor: selected ? 'var(--color-brand)' : 'var(--color-border)',
        backgroundColor: selected ? 'var(--color-brand-light)' : 'var(--color-surface)',
      }}>
      <p className="font-semibold text-sm text-text-primary">{label}</p>
      <p className="text-xs mt-0.5 text-text-secondary">{desc}</p>
    </button>
  )
}

// ── Campo etichetta ───────────────────────────────────────────────────────────
function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-xs font-medium mb-1.5 text-text-secondary">
      {children}
      {optional && <span className="ml-1 text-text-muted font-normal">(facoltativo)</span>}
    </label>
  )
}

function Input({ type = 'text', value, onChange, placeholder, min, max, step }: {
  type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; min?: string; max?: string; step?: string
}) {
  return (
    <input type={type} value={value} placeholder={placeholder}
      min={min} max={max} step={step}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
    />
  )
}

// ── Tipi ──────────────────────────────────────────────────────────────────────
type TipoDebito  = 'infruttifero' | 'bancario'
type TipoBancario = 'mutuo' | 'finanziamento'
type TipoTasso   = 'alla_francese' | 'altro'

interface ConfirmResult {
  success: boolean
  message: string
  ids?: { debito: string; portafogli: string; ricavo: string }
  codice?: string
  dettaglio?: string
}

// ── Wizard principale ─────────────────────────────────────────────────────────
export function NuovoDebitoWizard({ onClose }: { onClose: () => void }) {
  const [step,              setStep]              = useState(1)
  const [tipoDebito,        setTipoDebito]        = useState<TipoDebito | null>(null)
  const [tipoBancario,      setTipoBancario]      = useState<TipoBancario | null>(null)
  const [tipoTasso,         setTipoTasso]         = useState<TipoTasso | null>(null)
  const [tassoInteresse,    setTassoInteresse]    = useState('')
  const [totaleAddebitato,  setTotaleAddebitato]  = useState('')
  const [durataAnni,        setDurataAnni]        = useState('')
  const [rataMensile,       setRataMensile]       = useState('')
  const [dataPrimaRata,     setDataPrimaRata]     = useState('')
  const [giornoPromemoria,  setGiornoPromemoria]  = useState('')
  const [titolo,            setTitolo]            = useState('')
  const [importoErogato,    setImportoErogato]    = useState('')
  const [scadenzaPrevista,  setScadenzaPrevista]  = useState('')
  const [referente,         setReferente]         = useState<RefVal | null>(null)
  const [casaRiferimento,   setCasaRiferimento]   = useState<RefVal | null>(null)
  const [note,              setNote]              = useState('')
  const [stepError,         setStepError]         = useState<string | null>(null)
  const [submitting,        setSubmitting]        = useState(false)
  const [confirmResult,     setConfirmResult]     = useState<ConfirmResult | null>(null)

  // Chiudi con Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // ── Navigazione step ────────────────────────────────────────────────────────
  function getActiveSteps(): number[] {
    return tipoDebito === 'infruttifero' ? [1, 5, 6] : [1, 2, 3, 4, 5, 6]
  }

  function stepDisplay() {
    const active = getActiveSteps()
    return { current: active.indexOf(step) + 1, total: active.length }
  }

  function goNext() {
    const active = getActiveSteps()
    const idx = active.indexOf(step)
    if (idx < active.length - 1) setStep(active[idx + 1])
  }

  function goPrev() {
    const active = getActiveSteps()
    const idx = active.indexOf(step)
    if (idx > 0) setStep(active[idx - 1])
  }

  // ── Validazione ─────────────────────────────────────────────────────────────
  function validate(): string | null {
    switch (step) {
      case 1: return tipoDebito ? null : 'Seleziona il tipo di debito per continuare'
      case 2: return tipoBancario ? null : 'Seleziona il tipo di finanziamento bancario'
      case 3:
        if (!tipoTasso) return 'Seleziona il tipo di tasso'
        if (!tassoInteresse || isNaN(Number(tassoInteresse))) return 'Inserisci il tasso di interesse'
        if (!totaleAddebitato || isNaN(Number(totaleAddebitato)) || Number(totaleAddebitato) <= 0) return 'Inserisci il totale addebitato'
        return null
      case 4:
        if (!durataAnni || Number(durataAnni) <= 0) return 'Inserisci la durata in anni'
        if (!rataMensile || Number(rataMensile) <= 0) return 'Inserisci la rata mensile'
        if (!dataPrimaRata) return 'Inserisci la data della prima rata'
        if (!giornoPromemoria || Number(giornoPromemoria) < 1 || Number(giornoPromemoria) > 31)
          return 'Inserisci un giorno valido (1-31) per il promemoria'
        return null
      case 5:
        if (!titolo.trim()) return 'Il titolo è obbligatorio'
        if (!importoErogato || Number(importoErogato) <= 0) return "Inserisci l'importo erogato"
        if (!referente) return 'Seleziona il referente dalla rubrica'
        if (!casaRiferimento) return 'Seleziona la casa di riferimento'
        return null
      default: return null
    }
  }

  function handleNext() {
    const err = validate()
    if (err) { setStepError(err); return }
    setStepError(null)
    goNext()
  }

  // ── Conferma e invio ────────────────────────────────────────────────────────
  async function handleConfirm() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/automazioni/nuovo-debito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoDebito,
          tipoBancario:     tipoDebito === 'bancario' ? tipoBancario  : undefined,
          tipoTasso:        tipoDebito === 'bancario' ? tipoTasso     : undefined,
          tassoInteresse:   tipoDebito === 'bancario' ? Number(tassoInteresse)   : undefined,
          totaleAddebitato: tipoDebito === 'bancario' ? Number(totaleAddebitato) : undefined,
          durataAnni:       tipoDebito === 'bancario' ? Number(durataAnni)       : undefined,
          rataMensile:      tipoDebito === 'bancario' ? Number(rataMensile)      : undefined,
          dataPrimaRata:    tipoDebito === 'bancario' ? dataPrimaRata            : undefined,
          giornoPromemoria: tipoDebito === 'bancario' ? Number(giornoPromemoria) : undefined,
          titolo,
          importoErogato: Number(importoErogato),
          scadenzaPrevista: scadenzaPrevista || undefined,
          referente,
          casaRiferimento,
          note: note || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setConfirmResult({ success: true, message: data.message, ids: data.ids })
      } else {
        setConfirmResult({ success: false, message: data.error, codice: data.codice, dettaglio: data.dettaglio })
      }
    } catch (e) {
      setConfirmResult({ success: false, message: 'Errore di rete: impossibile contattare il server.', codice: 'ERR_RETE', dettaglio: String(e) })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Label step ───────────────────────────────────────────────────────────────
  const STEP_LABELS: Record<number, string> = {
    1: 'Tipo di debito',
    2: 'Dettagli bancari',
    3: 'Tasso di interesse',
    4: 'Vincoli e scadenze',
    5: 'Informazioni sui fondi',
    6: 'Riepilogo',
  }

  const { current: stepNum, total: stepTotal } = stepDisplay()

  // ── Recap helper ─────────────────────────────────────────────────────────────
  function RecapRow({ label, value }: { label: string; value: React.ReactNode }) {
    if (!value) return null
    return (
      <div className="flex gap-3 py-1.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-xs text-text-secondary w-40 shrink-0">{label}</span>
        <span className="text-xs font-medium text-text-primary">{value}</span>
      </div>
    )
  }

  // ── Render step content ───────────────────────────────────────────────────────
  function renderStep() {
    // Risultato finale
    if (confirmResult) {
      return (
        <div className="flex flex-col items-center text-center py-6 gap-4">
          {confirmResult.success ? (
            <>
              <CheckCircle2 className="w-14 h-14" style={{ color: 'var(--color-success, #22C55E)' }} />
              <div>
                <p className="font-semibold text-text-primary mb-1">{confirmResult.message}</p>
                <p className="text-sm text-text-secondary">Puoi ora visualizzare le schede create dal gestionale.</p>
              </div>
              {confirmResult.ids && (
                <div className="flex flex-col gap-2 w-full mt-2">
                  {[
                    { label: 'Debito', slug: 'debiti',     id: confirmResult.ids.debito },
                    { label: 'Portafogli', slug: 'portafogli', id: confirmResult.ids.portafogli },
                    { label: 'Ricavo', slug: 'ricavi',     id: confirmResult.ids.ricavo },
                  ].map(({ label, slug, id }) => (
                    <a key={slug} href={`/anagrafica/${slug}/${id}/view`}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-surface-hover transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-brand)' }}>
                      Apri {label}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              )}
              <button onClick={onClose} className="btn-primary mt-2">Chiudi</button>
            </>
          ) : (
            <>
              <AlertCircle className="w-14 h-14" style={{ color: 'var(--color-error)' }} />
              <div>
                <p className="font-semibold text-text-primary mb-1">Si è verificato un errore</p>
                <p className="text-sm text-text-secondary">{confirmResult.message}</p>
              </div>
              {confirmResult.codice && (
                <div className="w-full rounded-xl p-3 text-left text-xs font-mono"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className="text-text-muted">Codice errore: <span className="text-text-primary font-semibold">{confirmResult.codice}</span></p>
                  {confirmResult.dettaglio && (
                    <p className="text-text-muted mt-1 break-all">Dettaglio: {confirmResult.dettaglio}</p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setConfirmResult(null)} className="btn-secondary">Riprova</button>
                <button onClick={onClose} className="btn-ghost">Chiudi</button>
              </div>
            </>
          )}
        </div>
      )
    }

    // Step 6 — Recap
    if (step === 6) {
      const isBancario = tipoDebito === 'bancario'
      return (
        <div className="space-y-1">
          <p className="text-sm text-text-secondary mb-4">
            Verifica i dati prima di confermare. Verranno create automaticamente 3 schede: Debito, Portafogli e Ricavo.
          </p>
          <RecapRow label="Tipo debito" value={isBancario ? `Bancario — ${tipoBancario}` : 'Infruttifero'} />
          {isBancario && (
            <>
              <RecapRow label="Tipo tasso" value={tipoTasso === 'alla_francese' ? 'Alla francese' : 'Altro'} />
              <RecapRow label="Tasso interesse" value={`${tassoInteresse}%`} />
              <RecapRow label="Totale addebitato" value={`€ ${Number(totaleAddebitato).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} />
              <RecapRow label="Durata" value={`${durataAnni} anni`} />
              <RecapRow label="Rata mensile" value={`€ ${Number(rataMensile).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} />
              <RecapRow label="Data prima rata" value={dataPrimaRata} />
              <RecapRow label="Promemoria mensile" value={`Giorno ${giornoPromemoria}`} />
            </>
          )}
          <RecapRow label="Titolo" value={titolo} />
          <RecapRow label="Importo erogato" value={`€ ${Number(importoErogato).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} />
          {scadenzaPrevista && <RecapRow label="Scadenza prevista" value={scadenzaPrevista} />}
          <RecapRow label="Referente" value={referente?.label} />
          <RecapRow label="Casa" value={casaRiferimento?.label} />
          {note && <RecapRow label="Note" value={note} />}
          <div className="pt-4 rounded-xl p-3 text-xs text-text-secondary"
            style={{ backgroundColor: 'var(--color-surface-hover)', marginTop: '0.5rem' }}>
            Schede che verranno create: <strong className="text-text-primary">Debito</strong>,{' '}
            <strong className="text-text-primary">Portafogli di debito — {titolo}</strong>,{' '}
            <strong className="text-text-primary">Ricavo apertura debito</strong>
          </div>
        </div>
      )
    }

    // Step 1 — Tipo debito
    if (step === 1) return (
      <div className="space-y-3">
        <OptionCard label="Infruttifero" desc="Debito senza interessi (es: prestito tra privati, anticipo soci)" selected={tipoDebito === 'infruttifero'} onClick={() => setTipoDebito('infruttifero')} />
        <OptionCard label="Bancario" desc="Mutuo o finanziamento con istituto di credito, con tasso di interesse" selected={tipoDebito === 'bancario'} onClick={() => setTipoDebito('bancario')} />
      </div>
    )

    // Step 2 — Tipo bancario
    if (step === 2) return (
      <div className="space-y-3">
        <OptionCard label="Mutuo" desc="Finanziamento ipotecario a medio-lungo termine per l'acquisto di immobili" selected={tipoBancario === 'mutuo'} onClick={() => setTipoBancario('mutuo')} />
        <OptionCard label="Finanziamento" desc="Prestito personale o linea di credito per altri scopi" selected={tipoBancario === 'finanziamento'} onClick={() => setTipoBancario('finanziamento')} />
      </div>
    )

    // Step 3 — Tasso
    if (step === 3) return (
      <div className="space-y-5">
        <div className="space-y-3">
          <Label>Tipo di tasso</Label>
          <div className="space-y-2">
            <OptionCard label="Alla francese" desc="Rate costanti con quota capitale crescente e interessi decrescenti" selected={tipoTasso === 'alla_francese'} onClick={() => setTipoTasso('alla_francese')} />
            <OptionCard label="Altro" desc="Tasso variabile, piano di ammortamento personalizzato o altro" selected={tipoTasso === 'altro'} onClick={() => setTipoTasso('altro')} />
          </div>
        </div>
        <div>
          <Label>Tasso di interesse annuo (%)</Label>
          <Input type="number" value={tassoInteresse} onChange={setTassoInteresse} placeholder="es. 2.5" step="0.01" min="0" />
        </div>
        <div>
          <Label>Totale addebitato (€)</Label>
          <Input type="number" value={totaleAddebitato} onChange={setTotaleAddebitato} placeholder="es. 150000" step="0.01" min="0" />
        </div>
      </div>
    )

    // Step 4 — Vincoli
    if (step === 4) return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Durata in anni</Label>
            <Input type="number" value={durataAnni} onChange={setDurataAnni} placeholder="es. 25" min="1" />
          </div>
          <div>
            <Label>Rata mensile (€)</Label>
            <Input type="number" value={rataMensile} onChange={setRataMensile} placeholder="es. 600" step="0.01" min="0" />
          </div>
        </div>
        <div>
          <Label>Data prima rata</Label>
          <Input type="date" value={dataPrimaRata} onChange={setDataPrimaRata} />
        </div>
        <div>
          <Label>Giorno del mese per il promemoria (1-31)</Label>
          <Input type="number" value={giornoPromemoria} onChange={setGiornoPromemoria} placeholder="es. 15" min="1" max="31" />
        </div>
      </div>
    )

    // Step 5 — Fondi
    if (step === 5) return (
      <div className="space-y-5">
        <div>
          <Label>Titolo del debito</Label>
          <Input value={titolo} onChange={setTitolo} placeholder="es. Mutuo casa Milano" />
        </div>
        <div>
          <Label>Importo erogato (€)</Label>
          <Input type="number" value={importoErogato} onChange={setImportoErogato} placeholder="es. 150000" step="0.01" min="0" />
        </div>
        <div>
          <Label optional>Scadenza prevista</Label>
          <Input type="date" value={scadenzaPrevista} onChange={setScadenzaPrevista} />
        </div>
        <div>
          <Label>Referente (Rubrica)</Label>
          <RefSearch slug="rubrica" value={referente} onChange={setReferente} placeholder="Cerca in Rubrica..." />
        </div>
        <div>
          <Label>Casa di riferimento</Label>
          <RefSearch slug="case" value={casaRiferimento} onChange={setCasaRiferimento} placeholder="Cerca in Case..." />
        </div>
        <div>
          <Label optional>Note</Label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Note aggiuntive..."
            className="w-full rounded-lg px-3 py-2 text-sm border outline-none resize-none"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }} />
        </div>
      </div>
    )

    return null
  }

  const isResultScreen = !!confirmResult
  const isRecap        = step === 6

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col shadow-2xl"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          maxHeight: '90vh',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h2 className="font-semibold text-base text-text-primary">Nuovo debito</h2>
            {!isResultScreen && (
              <p className="text-xs text-text-muted mt-0.5">
                {isRecap ? 'Riepilogo' : `Passo ${stepNum} di ${stepTotal} — ${STEP_LABELS[step]}`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--color-text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!isResultScreen && (
          <div className="h-1 shrink-0" style={{ backgroundColor: 'var(--color-border)' }}>
            <div className="h-full transition-all duration-300"
              style={{
                width: `${(stepNum / stepTotal) * 100}%`,
                backgroundColor: 'var(--color-brand)',
              }} />
          </div>
        )}

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderStep()}
        </div>

        {/* Footer — navigazione */}
        {!isResultScreen && (
          <div className="px-6 py-4 border-t shrink-0 flex flex-col gap-2"
            style={{ borderColor: 'var(--color-border)' }}>
            {stepError && (
              <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-error-light, #FEE2E2)', color: 'var(--color-error)' }}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {stepError}
              </div>
            )}
            <div className="flex justify-between gap-3">
              {step > 1 ? (
                <button onClick={() => { setStepError(null); goPrev() }} className="btn-secondary flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Indietro
                </button>
              ) : (
                <button onClick={onClose} className="btn-ghost">Annulla</button>
              )}
              {isRecap ? (
                <button onClick={handleConfirm} disabled={submitting} className="btn-primary flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Conferma e crea
                </button>
              ) : (
                <button onClick={handleNext} className="btn-primary flex items-center gap-1.5">
                  Avanti <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
