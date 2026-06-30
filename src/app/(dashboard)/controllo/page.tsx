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
  Check, X, ChevronDown, ChevronRight, Save, Tag, Download, FileUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WIPSection } from '@/components/ui/WIPSection'
import { SezioneImport } from '@/components/controllo/SezioneImport'

// ── Tipi ─────────────────────────────────────────────────────
interface TipoCalendario { _id: string; nome: string; colore: string }
interface AnagraficaCfg  { slug: string; nome: string; colore: string; tipiDocumento: string[]; maxDocumentoMB: number }

// ── Sezioni nav ───────────────────────────────────────────────
type SezioneId = 'calendario' | 'anagrafiche' | 'import' | 'variabili' | 'varianti' | 'utenze' | 'automazioni'

const SEZIONI: { id: SezioneId; label: string; Icona: React.ElementType }[] = [
  { id: 'calendario',   label: 'Calendario',   Icona: Calendar },
  { id: 'anagrafiche',  label: 'Anagrafiche',  Icona: FolderOpen },
  { id: 'import',       label: 'Import',        Icona: FileUp },
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
  const router = useRouter()
  const [anagrafiche, setAnagrafiche] = useState<AnagraficaCfg[]>([])
  const [loading, setLoading]         = useState(true)
  const [deleting, setDeleting]       = useState<string | null>(null)
  const [exporting, setExporting]     = useState(false)

  const esportaExcel = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/controllo/anagrafiche/export')
      if (!res.ok) { alert('Errore durante l\'export'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `anagrafiche-template-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  const fetch_ana = useCallback(async () => {
    setLoading(true)
    try { const j = await (await fetch('/api/anagrafiche')).json(); setAnagrafiche(j.anagrafiche ?? []) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch_ana() }, [fetch_ana])

  const elimina = async (slug: string, nome: string) => {
    if (!confirm(`Eliminare l'anagrafica "${nome}" e tutti i suoi campi? I dati delle schede NON vengono eliminati.`)) return
    setDeleting(slug)
    try {
      await fetch(`/api/controllo/anagrafiche/${slug}`, { method: 'DELETE' })
      setAnagrafiche(prev => prev.filter(a => a.slug !== slug))
    } finally { setDeleting(null) }
  }

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-brand)' }} /></div>

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        Crea e configura le anagrafiche del gestionale. Ogni anagrafica ha i propri campi, tipi e logiche.
      </p>
      <div className="flex gap-2 mb-4">
        <button onClick={() => router.push('/controllo/anagrafiche/nuova')} className="btn-primary flex-1 justify-center">
          <Plus className="w-4 h-4" /> Crea nuova anagrafica
        </button>
        <button onClick={esportaExcel} disabled={exporting || anagrafiche.length === 0} className="btn-secondary gap-2 px-4"
          title="Esporta template Excel con tutti i campi delle anagrafiche">
          {exporting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">{exporting ? 'Generando…' : 'Esporta Excel'}</span>
        </button>
      </div>
      <div className="space-y-2">
        {anagrafiche.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">Nessuna anagrafica. Creane una.</p>
        )}
        {anagrafiche.map(ana => (
          <div key={ana.slug} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ana.colore ?? '#6366F1' }} />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm text-text-primary">{ana.nome}</span>
              <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>{ana.slug}</span>
            </div>
            <button onClick={() => router.push(`/controllo/anagrafiche/${ana.slug}`)} className="btn-secondary text-xs">
              <Pencil className="w-3.5 h-3.5" /> Modifica
            </button>
            <button onClick={() => elimina(ana.slug, ana.nome)} disabled={deleting === ana.slug} className="btn-icon-danger">
              {deleting === ana.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
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
      case 'import':      return <SezioneImport />
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
  const ActiveIcon = sezioneAttiva.Icona

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
          {SEZIONI.map(({ id, label, Icona: NavIcon }) => (
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
              <NavIcon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Contenuto sezione */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <ActiveIcon className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
              <h2 className="text-base font-semibold text-text-primary">{sezioneAttiva.label}</h2>
            </div>
            {renderSezione()}
          </div>
        </div>
      </div>
    </div>
  )
}
