'use client'

/**
 * src/components/anagrafica/DocumentiSection.tsx
 * Sezione documenti allegati a una scheda.
 * Upload drag-and-drop + lista + preview/download/elimina.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload, FileText, Image, Globe, Trash2,
  Eye, Download, Loader2, AlertCircle, Plus, X, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────────────────────
// Tipi
// ──────────────────────────────────────────────────────────────
interface DocRecord {
  _id: string
  nome: string
  titolo?: string
  mimeType: string
  dimensione: number
  tipo: string
  createdAt: string
}

const MIME_ICONE: Record<string, React.ComponentType<{ className?: string }>> = {
  'application/pdf': FileText,
  'image/jpeg':      Image,
  'image/png':       Image,
  'text/html':       Globe,
}

const MIME_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg':      'JPEG',
  'image/png':       'PNG',
  'text/html':       'HTML',
}

const TIPI_DEFAULT = ['Documento', 'Contratto', 'Fattura', 'Visura', 'Foto', 'Altro']
const DEFAULT_MAX_MB = 10

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ──────────────────────────────────────────────────────────────
// Modale tipo documento (pre-upload)
// ──────────────────────────────────────────────────────────────
function TipoModal({
  file,
  tipi,
  onConferma,
  onAnnulla,
}: {
  file: File
  tipi: string[]
  onConferma: (tipo: string, titolo: string) => void
  onAnnulla: () => void
}) {
  // Nome file senza estensione come titolo predefinito
  const nomeSenzaExt = file.name.replace(/\.[^.]+$/, '')
  const listaBase = tipi.length > 0 ? tipi : TIPI_DEFAULT

  const [titolo, setTitolo]           = useState(nomeSenzaExt)
  const [tipo, setTipo]               = useState(listaBase[0])
  const [tagExtra, setTagExtra]       = useState<string[]>([])
  const [nuovoTag, setNuovoTag]       = useState('')
  const [mostraInput, setMostraInput] = useState(false)

  const tutti = [...listaBase, ...tagExtra]

  const aggiungiTag = () => {
    const v = nuovoTag.trim()
    if (!v || tutti.some(t => t.toLowerCase() === v.toLowerCase())) {
      setNuovoTag('')
      setMostraInput(false)
      return
    }
    setTagExtra(prev => [...prev, v])
    setTipo(v)
    setNuovoTag('')
    setMostraInput(false)
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-sm rounded-2xl p-6 animate-scale-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 pr-3">
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Carica documento
            </h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {file.name} &middot; {formatBytes(file.size)}
            </p>
          </div>
          <button onClick={onAnnulla} className="btn-icon shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Titolo */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            Titolo
          </label>
          <input
            type="text"
            value={titolo}
            onChange={e => setTitolo(e.target.value)}
            placeholder="Nome visualizzato del documento"
            maxLength={255}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>

        {/* Tipo / tag */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Tipo documento
          </label>

          <div className="flex flex-wrap gap-2">
            {tutti.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className="px-3 py-1.5 rounded-full text-sm border transition-all"
                style={tipo === t
                  ? { backgroundColor: 'var(--color-brand)', color: '#fff', borderColor: 'var(--color-brand)' }
                  : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }
                }
              >
                {t}
              </button>
            ))}

            {/* Pulsante aggiungi nuovo tag */}
            {!mostraInput && (
              <button
                type="button"
                onClick={() => setMostraInput(true)}
                className="px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-1"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', borderStyle: 'dashed' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Nuovo
              </button>
            )}
          </div>

          {/* Input nuovo tag */}
          {mostraInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={nuovoTag}
                onChange={e => setNuovoTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); aggiungiTag() } if (e.key === 'Escape') { setMostraInput(false); setNuovoTag('') } }}
                placeholder="Nome tag..."
                autoFocus
                maxLength={50}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm border outline-none"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderColor: 'var(--color-brand)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button type="button" onClick={aggiungiTag} className="btn-primary py-1.5 px-3 text-sm">
                Aggiungi
              </button>
              <button type="button" onClick={() => { setMostraInput(false); setNuovoTag('') }} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="flex justify-end gap-3">
          <button onClick={onAnnulla} className="btn-secondary">Annulla</button>
          <button onClick={() => {
            const ext = file.name.match(/\.[^.]+$/)?.[0] ?? ''
            const t = titolo.trim() || nomeSenzaExt
            // Appende l'estensione originale se il titolo non la contiene già
            const titoloFinale = ext && !t.toLowerCase().endsWith(ext.toLowerCase()) ? t + ext : t
            onConferma(tipo, titoloFinale)
          }} className="btn-primary">
            <Upload className="w-4 h-4" />
            Carica file
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Modale preview
// ──────────────────────────────────────────────────────────────
function PreviewModal({
  doc,
  url,
  onClose,
}: {
  doc: DocRecord
  url: string
  onClose: () => void
}) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-panel w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <p className="text-sm font-semibold text-text-primary">{doc.nome}</p>
            <p className="text-xs text-text-muted mt-0.5">{MIME_LABEL[doc.mimeType] ?? doc.mimeType}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} download={doc.nome} className="btn-secondary text-xs">
              <Download className="w-3.5 h-3.5" />
              Scarica
            </a>
            <button onClick={onClose} className="btn-icon">
              <span className="sr-only">Chiudi</span>
              &#x2715;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {doc.mimeType.startsWith('image/') ? (
            <div className="w-full h-full flex items-center justify-center p-4"
              style={{ backgroundColor: 'var(--color-bg)' }}>
              <img
                src={url}
                alt={doc.nome}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : doc.mimeType === 'text/html' ? (
            <iframe
              src={url}
              sandbox="allow-same-origin"
              className="w-full h-full border-0"
              title={doc.nome}
            />
          ) : (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={doc.nome}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Componente principale
// ──────────────────────────────────────────────────────────────
interface AnagraficaConfigDoc {
  tipiDocumento: string[]
  maxDocumentoMB: number
}

interface DocumentiSectionProps {
  schedaId: string
  anagraficaSlug: string
  readOnly?: boolean
}

export function DocumentiSection({ schedaId, anagraficaSlug, readOnly = false }: DocumentiSectionProps) {
  const [docs, setDocs]               = useState<DocRecord[]>([])
  const [loading, setLoading]         = useState(true)
  const [dragging, setDragging]       = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [errore, setErrore]           = useState<string | null>(null)
  const [preview, setPreview]         = useState<{ doc: DocRecord; url: string } | null>(null)
  const [eliminando, setEliminando]   = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DocRecord | null>(null)
  const [openGroups, setOpenGroups]   = useState<Set<string>>(new Set())
  const [configDoc, setConfigDoc]     = useState<AnagraficaConfigDoc>({ tipiDocumento: [], maxDocumentoMB: DEFAULT_MAX_MB })
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch config anagrafica (tipi documento + max size)
  useEffect(() => {
    fetch(`/api/controllo/anagrafiche/${anagraficaSlug}`)
      .then(r => r.json())
      .then(j => {
        if (j.data) setConfigDoc({
          tipiDocumento: j.data.tipiDocumento ?? [],
          maxDocumentoMB: j.data.maxDocumentoMB ?? DEFAULT_MAX_MB,
        })
      })
      .catch(() => {})
  }, [anagraficaSlug])

  const maxBytes = configDoc.maxDocumentoMB * 1024 * 1024

  // Fetch lista
  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/documenti?schedaId=${schedaId}`)
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setDocs(data ?? [])
    } catch {
      setErrore('Errore caricamento documenti')
    } finally {
      setLoading(false)
    }
  }, [schedaId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // Apri tutti i gruppi di default quando i documenti vengono caricati
  useEffect(() => {
    if (docs.length > 0) {
      const tipi = new Set(docs.map(d => d.tipo))
      setOpenGroups(tipi)
    }
  }, [docs.length])

  // Drag & drop handlers
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setPendingFile(file)
  }

  // Upload
  const handleUpload = async (tipo: string, titolo: string) => {
    if (!pendingFile) return
    setUploading(true)
    setErrore(null)
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      fd.append('schedaId', schedaId)
      fd.append('anagraficaSlug', anagraficaSlug)
      fd.append('tipoDocumento', tipo)
      fd.append('titolo', titolo)

      const res = await fetch('/api/documenti', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Errore upload')
      setDocs(prev => [json.data, ...prev])
    } catch (e: unknown) {
      setErrore(e instanceof Error ? e.message : 'Errore upload')
    } finally {
      setUploading(false)
      setPendingFile(null)
    }
  }

  // Preview
  const openPreview = async (doc: DocRecord) => {
    try {
      const res = await fetch(`/api/documenti/${doc._id}/url`)
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setPreview({ doc, url })
    } catch {
      setErrore('Errore generazione URL')
    }
  }

  // Elimina
  const elimina = async (id: string) => {
    setEliminando(id)
    try {
      const res = await fetch(`/api/documenti/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDocs(prev => prev.filter(d => d._id !== id))
    } catch {
      setErrore('Errore eliminazione')
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Errore */}
      {errore && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errore}
          <button onClick={() => setErrore(null)} className="ml-auto btn-icon">&#x2715;</button>
        </div>
      )}

      {/* Drop zone (solo edit) */}
      {!readOnly && (
        <div
          onDragEnter={e => { e.preventDefault(); setDragging(true) }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
            dragging
              ? 'border-brand bg-brand/5 scale-[1.01]'
              : 'hover:border-brand/50 hover:bg-surface-hover'
          )}
          style={{ borderColor: dragging ? 'var(--color-brand)' : 'var(--color-border)' }}
        >
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".jpg,.jpeg,.png,.pdf,.html"
            onChange={e => { const f = e.target.files?.[0]; if (f) setPendingFile(f) }}
          />
          <Upload className="w-8 h-8 mx-auto mb-3 text-text-muted" />
          <p className="text-sm font-medium text-text-primary mb-1">
            Trascina un file qui
          </p>
          <p className="text-xs text-text-muted mb-4">
            oppure
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-secondary"
            disabled={uploading}
          >
            <Plus className="w-4 h-4" />
            Sfoglia file
          </button>
          <p className="text-xs text-text-muted mt-3">
            Formati: JPEG, PNG, PDF, HTML &middot; Max {configDoc.maxDocumentoMB} MB
          </p>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-surface-overlay)' }}>
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand)' }} />
            </div>
          )}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-14 rounded-lg animate-pulse skeleton" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Nessun documento allegato
        </div>
      ) : (() => {
        // Raggruppa documenti per tipo (tag), mantenendo l'ordine di prima occorrenza
        const gruppi = docs.reduce<Record<string, DocRecord[]>>((acc, doc) => {
          const key = doc.tipo || 'altro'
          if (!acc[key]) acc[key] = []
          acc[key].push(doc)
          return acc
        }, {})

        const toggleGruppo = (tag: string) => {
          setOpenGroups(prev => {
            const next = new Set(prev)
            if (next.has(tag)) next.delete(tag)
            else next.add(tag)
            return next
          })
        }

        const renderDoc = (doc: DocRecord, isLast: boolean) => {
          const Icona = MIME_ICONE[doc.mimeType] ?? FileText
          return (
            <div
              key={doc._id}
              className={cn('flex items-center gap-3 px-4 py-3 transition-colors', !isLast && 'border-b')}
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              {/* Icona file */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                <Icona className="w-4 h-4" style={{ color: 'var(--color-brand)' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {doc.titolo || doc.nome}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {MIME_LABEL[doc.mimeType] ?? doc.mimeType}
                  &nbsp;&middot;&nbsp;{formatBytes(doc.dimensione)}
                  &nbsp;&middot;&nbsp;{formatData(doc.createdAt)}
                </p>
              </div>

              {/* Azioni */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Anteprima: ottieni URL presigned (inline) e apri nuova scheda */}
                <button
                  type="button"
                  className="btn-icon"
                  title="Apri in nuova scheda"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/documenti/${doc._id}/url`)
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}))
                        throw new Error(body?.error ?? `Errore ${res.status}`)
                      }
                      const { url } = await res.json()
                      window.open(url, '_blank')
                    } catch (e) {
                      setErrore(e instanceof Error ? e.message : 'Errore apertura documento')
                    }
                  }}
                >
                  <Eye className="w-4 h-4" />
                </button>
                {/* Download: window.open con URL presigned attachment (evita CORS su fetch cross-origin) */}
                <button
                  type="button"
                  className="btn-icon"
                  title="Scarica"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/documenti/${doc._id}/url?mode=download`)
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}))
                        throw new Error(body?.error ?? `Errore ${res.status}`)
                      }
                      const { url } = await res.json()
                      // window.open con Content-Disposition: attachment → il browser scarica il file
                      window.open(url, '_blank')
                    } catch (e) {
                      setErrore(e instanceof Error ? e.message : 'Errore download')
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(doc)}
                    className="btn-icon-danger"
                    title="Elimina"
                    disabled={eliminando === doc._id}
                  >
                    {eliminando === doc._id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                )}
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-3">
            {Object.entries(gruppi).map(([tag, lista]) => {
              const aperto = openGroups.has(tag)
              return (
                <div
                  key={tag}
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {/* Header gruppo / accordion trigger */}
                  <button
                    type="button"
                    onClick={() => toggleGruppo(tag)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
                    style={{ backgroundColor: 'var(--color-surface-elevated)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}>
                        {tag}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: 'var(--color-brand-muted, color-mix(in srgb, var(--color-brand) 12%, transparent))',
                          color: 'var(--color-brand)',
                        }}
                      >
                        {lista.length}
                      </span>
                    </div>
                    <ChevronDown
                      className="w-4 h-4 transition-transform duration-200 shrink-0"
                      style={{
                        color: 'var(--color-text-muted)',
                        transform: aperto ? 'rotate(0deg)' : 'rotate(-90deg)',
                      }}
                    />
                  </button>

                  {/* Documenti del gruppo */}
                  {aperto && (
                    <div>
                      {lista.map((doc, i) => renderDoc(doc, i === lista.length - 1))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Modale conferma eliminazione */}
      {confirmDelete && (
        <div className="modal-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-xs rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-error-bg)' }}>
                <Trash2 className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Elimina documento
                </p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                  {confirmDelete.titolo || confirmDelete.nome}
                </p>
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              Il documento verrà eliminato definitivamente e non potrà essere recuperato.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="btn-secondary"
                onClick={() => setConfirmDelete(null)}
                disabled={eliminando === confirmDelete._id}
              >
                Annulla
              </button>
              <button
                className="btn-danger"
                disabled={eliminando === confirmDelete._id}
                onClick={async () => {
                  const id = confirmDelete._id
                  setConfirmDelete(null)
                  await elimina(id)
                }}
              >
                {eliminando === confirmDelete._id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : 'Elimina'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale tipo documento */}
      {pendingFile && (
        <TipoModal
          file={pendingFile}
          tipi={configDoc.tipiDocumento}
          onConferma={handleUpload}
          onAnnulla={() => setPendingFile(null)}
        />
      )}

      {/* Modale preview */}
      {preview && (
        <PreviewModal
          doc={preview.doc}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
