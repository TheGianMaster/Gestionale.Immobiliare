'use client'

/**
 * src/components/bilancio/SpostaFondiModal.tsx
 * Modale "Sposta fondi": chiama POST /api/bilancio/trasferimento (T-115).
 * T-123.
 *
 * Riceve la lista portafogli come prop (già caricata dalla pagina overview
 * tramite GET /api/bilancio/overview) invece di rifare una fetch propria:
 * evita una seconda chiamata e mantiene un'unica fonte di dati per la vista.
 */

import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

export interface PortafoglioOption {
  id: string
  nome: string
  fondiDisponibili: number
}

interface Destinazione {
  portafoglioId: string
  importo: string
}

interface TrasferimentoErrore {
  error: string
  codice?: string
}

const MESSAGGI_CODICE: Record<string, string> = {
  ERR_AUTH: 'Sessione scaduta: effettua di nuovo il login.',
  ERR_VALIDATION: 'Dati non validi, controlla i campi.',
  ERR_ANA_TRASFERIMENTI: "Anagrafica 'trasferimenti' non configurata. Contatta chi gestisce il sistema.",
  ERR_ANA_PORTAFOGLI: "Anagrafica 'portafogli' non configurata. Contatta chi gestisce il sistema.",
  ERR_PORTAFOGLIO_NON_TROVATO: 'Uno dei portafogli selezionati non esiste più.',
  ERR_FONDI_INSUFFICIENTI: 'Fondi insufficienti sul portafoglio di origine.',
  ERR_CREATE_TRASFERIMENTO: 'Impossibile creare il trasferimento. Riprova.',
  ERR_RICALCOLO_FONDI: 'Il trasferimento è stato creato ma il ricalcolo dei saldi non è riuscito. Riprova più tardi o contatta chi gestisce il sistema.',
  ERR_INTERNO: 'Errore interno del server. Riprova.',
}

interface Props {
  portafogli: PortafoglioOption[]
  onClose: () => void
  onSuccess?: (saldi: Record<string, number>) => void
}

export function SpostaFondiModal({ portafogli, onClose, onSuccess }: Props) {
  const [origineId, setOrigineId] = useState('')
  const [destinazioni, setDestinazioni] = useState<Destinazione[]>([{ portafoglioId: '', importo: '' }])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [erroreValidazione, setErroreValidazione] = useState<string | null>(null)
  const [erroreApi, setErroreApi] = useState<TrasferimentoErrore | null>(null)
  const [successo, setSuccesso] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const origine = portafogli.find(p => p.id === origineId) ?? null
  const totaleDestinazioni = useMemo(
    () => destinazioni.reduce((tot, d) => tot + (Number(d.importo) || 0), 0),
    [destinazioni]
  )
  const superaFondiDisponibili = origine ? totaleDestinazioni > origine.fondiDisponibili : false

  function aggiungiDestinazione() {
    setDestinazioni(prev => [...prev, { portafoglioId: '', importo: '' }])
  }

  function rimuoviDestinazione(index: number) {
    setDestinazioni(prev => prev.filter((_, i) => i !== index))
  }

  function aggiornaDestinazione(index: number, campo: keyof Destinazione, valore: string) {
    setDestinazioni(prev => prev.map((d, i) => (i === index ? { ...d, [campo]: valore } : d)))
  }

  function portafogliDisponibiliPer(index: number): PortafoglioOption[] {
    const scelti = new Set(destinazioni.filter((_, i) => i !== index).map(d => d.portafoglioId))
    return portafogli.filter(p => p.id !== origineId && !scelti.has(p.id))
  }

  function valida(): string | null {
    if (!origineId) return 'Seleziona il portafoglio di origine'
    const righe = destinazioni.filter(d => d.portafoglioId)
    if (righe.length === 0) return 'Aggiungi almeno una destinazione'
    for (const d of righe) {
      const importo = Number(d.importo)
      if (!d.importo || isNaN(importo) || importo <= 0) return 'Ogni destinazione deve avere un importo maggiore di zero'
    }
    if (superaFondiDisponibili) return 'Il totale supera i fondi disponibili del portafoglio di origine'
    return null
  }

  async function handleSubmit() {
    const err = valida()
    if (err) { setErroreValidazione(err); return }
    setErroreValidazione(null)
    setErroreApi(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/bilancio/trasferimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portafoglioOrigineId: origineId,
          destinazioni: destinazioni
            .filter(d => d.portafoglioId)
            .map(d => ({ portafoglioDestinazioneId: d.portafoglioId, importo: Number(d.importo) })),
          note: note.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSuccesso(true)
        onSuccess?.(data.saldi ?? {})
      } else {
        setErroreApi({ error: data.error ?? 'Errore sconosciuto', codice: data.codice })
      }
    } catch {
      setErroreApi({ error: 'Errore di rete: impossibile contattare il server.', codice: 'ERR_RETE' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col modal-panel"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-base text-text-primary">Sposta fondi</h2>
          <button onClick={onClose} className="btn-icon text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {successo ? (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-success-light">
                <Plus className="w-7 h-7 rotate-45 text-success" />
              </div>
              <p className="font-semibold text-text-primary">Trasferimento completato</p>
              <p className="text-sm text-text-secondary">I saldi dei portafogli coinvolti sono stati aggiornati.</p>
              <button onClick={onClose} className="btn-primary mt-2">Chiudi</button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Origine */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-text-secondary">Portafoglio di origine</label>
                <select
                  value={origineId}
                  onChange={e => setOrigineId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none border-border bg-surface text-text-primary"
                >
                  <option value="">Seleziona...</option>
                  {portafogli.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {formatEuro(p.fondiDisponibili)} disponibili
                    </option>
                  ))}
                </select>
              </div>

              {/* Destinazioni */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Destinazioni</label>
                </div>
                <div className="space-y-2">
                  {destinazioni.map((d, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={d.portafoglioId}
                        onChange={e => aggiornaDestinazione(index, 'portafoglioId', e.target.value)}
                        className="flex-1 rounded-lg px-3 py-2 text-sm border outline-none border-border bg-surface text-text-primary"
                      >
                        <option value="">Seleziona...</option>
                        {portafogliDisponibiliPer(index).map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                      <input
                        type="number" min="0" step="0.01" placeholder="Importo €"
                        value={d.importo}
                        onChange={e => aggiornaDestinazione(index, 'importo', e.target.value)}
                        className="w-32 rounded-lg px-3 py-2 text-sm border outline-none border-border bg-surface text-text-primary"
                      />
                      {destinazioni.length > 1 && (
                        <button type="button" onClick={() => rimuoviDestinazione(index)} className="btn-icon-danger shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={aggiungiDestinazione} className="btn-ghost mt-2 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Aggiungi destinazione
                </button>
              </div>

              {/* Totale */}
              <div className="rounded-xl p-3 flex items-center justify-between text-sm bg-surface-hover">
                <span className="text-text-secondary">Totale destinazioni</span>
                <span className={superaFondiDisponibili ? 'font-semibold text-error' : 'font-semibold text-text-primary'}>
                  {formatEuro(totaleDestinazioni)}
                  {origine ? ` / ${formatEuro(origine.fondiDisponibili)} disponibili` : ''}
                </span>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-text-secondary">
                  Note <span className="text-text-muted font-normal">(facoltativo)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none resize-none border-border bg-surface text-text-primary"
                />
              </div>

              {(erroreValidazione || erroreApi) && (
                <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2 bg-error-light text-error">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {erroreValidazione ?? (erroreApi?.codice ? MESSAGGI_CODICE[erroreApi.codice] ?? erroreApi?.error : erroreApi?.error)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!successo && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3">
            <button onClick={onClose} className="btn-ghost">Annulla</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Sposta fondi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
