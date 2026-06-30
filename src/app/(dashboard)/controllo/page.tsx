'use client'

/**
 * src/app/(dashboard)/controllo/page.tsx
 * Pannello di Controllo — admin only.
 * Sezioni: Calendario, Anagrafiche (doc), Variabili, Varianti, Utenze, Automazioni
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings, Calendar, FolderOpen, Database, Layers,
  Users, Zap, Plus, Pencil, Trash2, Loader2,
  Check, X, ChevronDown, ChevronRight, Save, Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WIPSection } from '@/components/ui/WIPSection'

// ── Tipi ─────────────────────────────────────────────────────
interface TipoCalendario { _id: string; nome: string; colore: string }
interface AnagraficaCfg  { slug: string; nome: string; colore: string; tipiDocumento: string[]; maxDocumentoMB: number }

// ── Sezioni nav ───────────────────────────────────────────────
type SezioneId = 'calendario' | 'anagrafiche' | 'variabili' | 'varianti' | 'utenze' | 'automazioni'

const SEZIONI: { id: SezioneId; label: string; Icona: React.ElementType }[] = [
  { id: 'calendario',   label: 'Calendario',   Icona: Calendar },
  { id: 'anagrafiche',  label: 'Anagrafiche',  Icona: FolderOpen },
  { id: 'variabili',    label: 'Variabili',    Icona: Database },
  { id: 'varianti',     label: 'Varianti',     Icona: Layers },
  { id: 'utenze',       label: 'Utenze',       Icona: Users },
  { id: 'automazioni',  label: 'Automazioni',  Icona: Zap },
]

// ── Color dots ────────────────────────────────────────────────
const COLORI_PRESET = ['#6366F1','#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#6B7280']
function ColorDot({ c, sel, onClick }: { c: string; sel: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('w-5 h-5 rounded-full border-2 transition-transform hover:scale-110', sel ? 'scale-125' : 'border-transparent')}
      style={{ backgroundColor: c, borderColor: sel ? 'var(--color-text-primary)' : 'transparent' }} />
  )
}

// ── SEZIONE CALENDARIO ────────────────────────────────────────
function SezioneCalendario() {
  const [tipi, setTipi]     = useState<TipoCalendario[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [nome, setNome]       = useState('')
  const [colore, setColore]   = useState('#6366F1')
  const [saving, setSaving]   = useState(false)
  const [showNew, setShowNew] = useState(false)

  const fetch_tipi = useCallback(async () => {
    setLoading(true)
    try { const j = await (await fetch('/api/controllo/calendario/tipi')).json(); setTipi(j.data ?? []) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch_tipi() }, [fetch_tipi])

  const salva = async (id?: string) => {
    if (!nome.trim()) return
    setSaving(true)
    try {
      if (id) {
        await fetch(`/api/controllo/calendario/tipi/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nome.trim(), colore }) })
      } else {
        await fetch('/api/controllo/calendario/tipi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nome.trim(), colore }) })
      }
      setEditing(null); setShowNew(false); setNome(''); setColore('#6366F1'); fetch_tipi()
    } finally { setSaving(false) }
  }

  const elimina = async (id: string) => {
    if (!confirm('Eliminare questo tipo?')) return
    await fetch(`/api/controllo/calendario/tipi/${id}`, { method: 'DELETE' }); fetch_tipi()
  }

  const startEdit = (t: TipoCalendario) => { setEditing(t._id); setNome(t.nome); setColore(t.colore); setShowNew(false) }
  const cancel = () => { setEditing(null); setShowNew(false); setNome(''); setColore('#6366F1') }

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        Configura i tipi di appuntamento disponibili nel calendario. I tipi vengono mostrati come chip colorati nel form di creazione evento.
      </p>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-brand)' }} /></div>
      ) : (
        <div className="space-y-2">
          {tipi.length === 0 && !showNew && (
            <p className="text-sm text-text-muted text-center py-4">Nessun tipo configurato. Usa i default di sistema (Appuntamento, Scadenza, ecc.)</p>
          )}
          {tipi.map(t => (
            <div key={t._id} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              {editing === t._id ? (
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colore }} />
                  <input value={nome} onChange={e => setNome(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') salva(t._id) }}
                    className="flex-1 min-w-[100px] px-2 py-1 rounded text-sm border"
                    style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                  <div className="flex gap-1.5 flex-wrap">{COLORI_PRESET.map(c => <ColorDot key={c} c={c} sel={colore === c} onClick={() => setColore(c)} />)}</div>
                  <button onClick={() => salva(t._id)} disabled={saving} className="btn-primary text-xs">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Salva
                  </button>
                  <button onClick={cancel} className="btn-ghost text-xs"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colore }} />
                  <span className="flex-1 text-sm font-medium text-text-primary">{t.nome}</span>
                  <button onClick={() => startEdit(t)} className="btn-icon"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => elimina(t._id)} className="btn-icon-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
          {showNew ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border flex-wrap"
              style={{ borderColor: 'var(--color-brand)', backgroundColor: 'var(--color-surface)' }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colore }} />
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome tipo..." autoFocus
                onKeyDown={e => { if (e.key === 'Enter') salva() }}
                className="flex-1 min-w-[100px] px-2 py-1 rounded text-sm border"
                style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              <div className="flex gap-1.5 flex-wrap">{COLORI_PRESET.map(c => <ColorDot key={c} c={c} sel={colore === c} onClick={() => setColore(c)} />)}</div>
              <button onClick={() => salva()} disabled={saving} className="btn-primary text-xs">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Aggiungi
              </button>
              <button onClick={cancel} className="btn-ghost text-xs"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => { setShowNew(true); setNome(''); setColore('#6366F1'); setEditing(null) }} className="btn-ghost w-full justify-center">
              <Plus className="w-4 h-4" /> Aggiungi tipo appuntamento
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── SEZIONE ANAGRAFICHE ───────────────────────────────────────
function SezioneAnagrafiche() {
  const [anagrafiche, setAnagrafiche] = useState<AnagraficaCfg[]>([])
  const [loading, setLoading]         = useState(true)
  const [aperta, setAperta]           = useState<string | null>(null)
  const [editing, setEditing]         = useState<Record<string, { maxMB: number; tipi: string[] }>>({})
  const [saving, setSaving]           = useState<string | null>(null)
  const [tagInput, setTagInput]       = useState<Record<string, string>>({})

  const fetch_ana = useCallback(async () => {
    setLoading(true)
    try { const j = await (await fetch('/api/anagrafiche')).json(); setAnagrafiche(j.data ?? []) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch_ana() }, [fetch_ana])

  const initEdit = (ana: AnagraficaCfg) => {
    if (!editing[ana.slug]) setEditing(p => ({ ...p, [ana.slug]: { maxMB: ana.maxDocumentoMB ?? 10, tipi: [...(ana.tipiDocumento ?? [])] } }))
    setAperta(p => p === ana.slug ? null : ana.slug)
  }

  const addTag = (slug: string) => {
    const t = tagInput[slug]?.trim(); if (!t) return
    setEditing(p => ({ ...p, [slug]: { ...p[slug], tipi: [...(p[slug]?.tipi ?? []), t] } }))
    setTagInput(p => ({ ...p, [slug]: '' }))
  }
  const removeTag = (slug: string, t: string) =>
    setEditing(p => ({ ...p, [slug]: { ...p[slug], tipi: (p[slug]?.tipi ?? []).filter(x => x !== t) } }))

  const salva = async (ana: AnagraficaCfg) => {
    const edit = editing[ana.slug]; if (!edit) return
    setSaving(ana.slug)
    try {
      await fetch(`/api/controllo/anagrafiche/${ana.slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maxDocumentoMB: edit.maxMB, tipiDocumento: edit.tipi }) })
      setAnagrafiche(prev => prev.map(a => a.slug === ana.slug ? { ...a, maxDocumentoMB: edit.maxMB, tipiDocumento: edit.tipi } : a))
      setAperta(null)
    } finally { setSaving(null) }
  }

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-brand)' }} /></div>

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        Configura la dimensione massima dei documenti e i tag disponibili per ciascuna anagrafica.
      </p>
      <div className="space-y-2">
        {anagrafiche.map(ana => {
          const isAperta = aperta === ana.slug; const edit = editing[ana.slug]
          return (
            <div key={ana.slug} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
              <button type="button" onClick={() => initEdit(ana)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                style={{ backgroundColor: 'var(--color-surface)' }}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ana.colore }} />
                <span className="flex-1 text-sm font-medium text-text-primary">{ana.nome}</span>
                <span className="text-xs text-text-muted">Max {edit?.maxMB ?? ana.maxDocumentoMB ?? 10} MB</span>
                {isAperta ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
              </button>
              {isAperta && edit && (
                <div className="px-4 py-4 border-t space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Dimensione massima documento (MB)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} max={100} value={edit.maxMB}
                        onChange={e => setEditing(p => ({ ...p, [ana.slug]: { ...p[ana.slug], maxMB: Number(e.target.value) } }))}
                        className="w-24 px-3 py-2 rounded-lg text-sm border"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <span className="text-sm text-text-muted">MB</span>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-2">
                      <Tag className="w-3.5 h-3.5" /> Tag tipi documento
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
                      {edit.tipi.map(t => (
                        <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                          {t}
                          <button type="button" onClick={() => removeTag(ana.slug, t)} className="hover:opacity-60">&times;</button>
                        </span>
                      ))}
                      {edit.tipi.length === 0 && <span className="text-xs text-text-muted italic">Verranno usati i default di sistema</span>}
                    </div>
                    <div className="flex gap-2">
                      <input value={tagInput[ana.slug] ?? ''} onChange={e => setTagInput(p => ({ ...p, [ana.slug]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(ana.slug) } }}
                        placeholder="es. Contratto, Fattura..."
                        className="flex-1 px-3 py-2 rounded-lg text-sm border"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <button type="button" onClick={() => addTag(ana.slug)} className="btn-secondary"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setAperta(null)} className="btn-ghost text-xs">Annulla</button>
                    <button onClick={() => salva(ana)} disabled={saving === ana.slug} className="btn-primary text-xs">
                      {saving === ana.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salva
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── PAGINA PRINCIPALE ─────────────────────────────────────────
export default function PannelloControlloPage() {
  const router = useRouter()
  const [sezione, setSezione] = useState<SezioneId>('calendario')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Client-side admin check (il middleware fa gia il redirect server-side)
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => {
        if (!s?.user || s.user.ruolo !== 'admin') router.replace('/home')
        else setAuthChecked(true)
      })
      .catch(() => router.replace('/home'))
  }, [router])

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand)' }} />
      </div>
    )
  }

  const renderSezione = () => {
    switch (sezione) {
      case 'calendario':  return <SezioneCalendario />
      case 'anagrafiche': return <SezioneAnagrafiche />
      case 'variabili':
        return <WIPSection
          nome="Variabili"
          descrizione="Crea e modifica i tipi di campo. Aggiungi nuove variabili alle anagrafiche e gestisci le opzioni dei campi select."
          icona={<Database className="w-8 h-8" style={{ color: 'var(--color-brand)' }} />}
        />
      case 'varianti':
        return <WIPSection
          nome="Varianti"
          descrizione="Gestisci le varianti per ogni anagrafica. Definisci quali campi sono oscurati o obbligatori per ogni variante."
          icona={<Layers className="w-8 h-8" style={{ color: 'var(--color-brand)' }} />}
        />
      case 'utenze':
        return <WIPSection
          nome="Utenze"
          descrizione="Gestisci gli utenti del sistema. Crea e disattiva account, configura il tempo di sessione."
          icona={<Users className="w-8 h-8" style={{ color: 'var(--color-brand)' }} />}
          nota="Il tempo di logout automatico (attualmente 72 ore) sara configurabile da questa sezione per ogni utente o a livello globale."
        />
      case 'automazioni':
        return <WIPSection
          nome="Automazioni"
          descrizione="Crea regole automatiche (trigger → azione). Esempi: al salvataggio di una scheda invia una notifica, quando scade un contratto crea un evento nel calendario."
          icona={<Zap className="w-8 h-8" style={{ color: 'var(--color-brand)' }} />}
          nota="Le automazioni intelligenti saranno supportate da AI per suggerire e ottimizzare le regole."
        />
    }
  }

  const sezioneAttiva = SEZIONI.find(s => s.id === sezione)!

  return (
    <div className="h-full animate-slide-up">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-brand-light)' }}>
            <Settings className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Pannello di Controllo</h1>
            <p className="text-xs text-text-muted">Configurazione di sistema</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0" style={{ height: 'calc(100vh - 130px)' }}>
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0 border-r overflow-y-auto py-2"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          {SEZIONI.map(({ id, label, Icona }) => (
            <button
              key={id}
              onClick={() => setSezione(id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors',
                sezione === id
                  ? 'text-brand'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
              style={sezione === id ? {
                backgroundColor: 'var(--color-brand-light)',
                color: 'var(--color-brand)',
                boxShadow: 'inset 3px 0 0 var(--color-brand)',
              } : {}}
            >
              <Icona className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Contenuto sezione */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <sezioneAttiva.Icona className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
              <h2 className="text-base font-semibold text-text-primary">{sezioneAttiva.label}</h2>
            </div>
            {renderSezione()}
          </div>
        </div>
      </div>
    </div>
  )
}
