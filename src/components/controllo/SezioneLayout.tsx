'use client'

/**
 * src/components/controllo/SezioneLayout.tsx
 * Editor visivo per configurare la struttura della sidebar.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown,
  Eye, EyeOff, Pencil, Check, X, FolderOpen, Minus,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SidebarRootNode, SidebarNodeSection, SidebarNodeAnagrafica,
} from '@/app/api/controllo/layout/route'

interface AnaInfo { slug: string; nome: string; icona: string; colore: string }

// ── Helpers ───────────────────────────────────────────────────

function nodeKey(node: SidebarRootNode): string {
  if (node.type === 'builtin')    return `b-${node.key}`
  if (node.type === 'section')    return `s-${node.id}`
  if (node.type === 'anagrafica') return `a-${node.slug}`
  return `sep-${node.id}`
}

function IconaAna({ nome, colore, size = 5 }: { nome: string; colore: string; size?: number }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-${size} h-${size} rounded text-[10px] font-bold shrink-0`}
      style={{ backgroundColor: colore + '20', color: colore }}
    >
      {(nome ?? '?').charAt(0).toUpperCase()}
    </span>
  )
}

// ── Sub-components ────────────────────────────────────────────

function VisToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick} title={visible ? 'Visibile — clicca per nascondere' : 'Nascosto — clicca per mostrare'}
      className={cn('btn-icon', !visible && 'opacity-40')}
    >
      {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
    </button>
  )
}

function MoveBtn({ dir, onClick, disabled }: { dir: 'up' | 'down'; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-icon disabled:opacity-20">
      {dir === 'up' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Componente principale ─────────────────────────────────────

export function SezioneLayout() {
  const [nodes, setNodes]           = useState<SidebarRootNode[]>([])
  const [anagrafiche, setAnagrafiche] = useState<AnaInfo[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [dirty, setDirty]           = useState(false)

  // Stato edit sezione
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editLabel, setEditLabel]   = useState('')
  const [editIcon, setEditIcon]     = useState('')

  // Stato aggiungi anagrafica
  const [addingTo, setAddingTo] = useState<string | null>(null) // section id o 'root'

  // ── Fetch iniziale ───────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/controllo/layout').then(r => r.json()).catch(() => ({ nodes: [] })),
      fetch('/api/anagrafiche').then(r => r.json()).catch(() => ({ anagrafiche: [] })),
    ]).then(([l, a]) => {
      setNodes(Array.isArray(l.nodes) ? l.nodes : [])
      setAnagrafiche(Array.isArray(a.anagrafiche) ? a.anagrafiche : [])
    }).finally(() => setLoading(false))
  }, [])

  // ── Mutazioni ────────────────────────────────────────────────
  const mut = useCallback((fn: (p: SidebarRootNode[]) => SidebarRootNode[]) => {
    setNodes(fn); setDirty(true)
  }, [])

  const moveRoot = (i: number, d: -1 | 1) => mut(p => {
    const a = [...p], j = i + d
    if (j < 0 || j >= a.length) return p;
    [a[i], a[j]] = [a[j], a[i]]; return a
  })

  const toggleRootVis = (i: number) => mut(p =>
    p.map((n, idx) => idx === i ? { ...n, visible: !n.visible } : n)
  )

  const deleteRoot = (i: number) => mut(p => p.filter((_, idx) => idx !== i))

  const addSection = () => mut(p => [...p, {
    type: 'section' as const, id: `sec-${Date.now()}`,
    label: 'Nuova sezione', icon: '📁',
    visible: true, initiallyCollapsed: false, children: [],
  }])

  const addSeparator = () => mut(p => [...p, {
    type: 'separator' as const, id: `sep-${Date.now()}`, visible: true,
  }])

  const updateSection = (i: number, changes: Partial<SidebarNodeSection>) => mut(p =>
    p.map((n, idx) => idx === i ? { ...n, ...changes } : n)
  )

  const addToSection = (sectionIdx: number, slug: string) => mut(p =>
    p.map((n, i) => {
      if (i !== sectionIdx || n.type !== 'section') return n
      if (n.children.some(c => c.slug === slug)) return n
      return { ...n, children: [...n.children, { type: 'anagrafica' as const, slug, visible: true }] }
    })
  )

  const removeFromSection = (sectionIdx: number, slug: string) => mut(p =>
    p.map((n, i) => {
      if (i !== sectionIdx || n.type !== 'section') return n
      return { ...n, children: n.children.filter(c => c.slug !== slug) }
    })
  )

  const moveInSection = (sectionIdx: number, ci: number, d: -1 | 1) => mut(p =>
    p.map((n, i) => {
      if (i !== sectionIdx || n.type !== 'section') return n
      const ch = [...n.children], j = ci + d
      if (j < 0 || j >= ch.length) return n;
      [ch[ci], ch[j]] = [ch[j], ch[ci]]
      return { ...n, children: ch }
    })
  )

  const toggleChildVis = (sectionIdx: number, ci: number) => mut(p =>
    p.map((n, i) => {
      if (i !== sectionIdx || n.type !== 'section') return n
      const ch = n.children.map((c, idx) => idx === ci ? { ...c, visible: !c.visible } : c)
      return { ...n, children: ch }
    })
  )

  const addToRoot = (slug: string) => {
    mut(p => {
      if (p.some(n => n.type === 'anagrafica' && (n as SidebarNodeAnagrafica).slug === slug)) return p
      return [...p, { type: 'anagrafica' as const, slug, visible: true }]
    })
    setAddingTo(null)
  }

  // ── Salvataggio ──────────────────────────────────────────────
  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/controllo/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes }),
      })
      if (res.ok) setDirty(false)
    } finally { setSaving(false) }
  }

  // ── Utilità ──────────────────────────────────────────────────
  const anaMap = Object.fromEntries(anagrafiche.map(a => [a.slug, a]))

  // Slug già usati ovunque nel layout
  const usedSlugs = new Set(nodes.flatMap(n => {
    if (n.type === 'anagrafica') return [n.slug]
    if (n.type === 'section') return n.children.map(c => c.slug)
    return []
  }))

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-brand)' }} />
    </div>
  )

  // ── Render ───────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <p className="text-sm text-text-secondary">
          Configura la struttura della sidebar: crea sezioni collassabili, aggiungi anagrafiche, imposta ordine e visibilità.
          Le modifiche si applicano immediatamente dopo il salvataggio.
        </p>
        <button onClick={save} disabled={!dirty || saving} className="btn-primary text-xs shrink-0">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Salvando…' : 'Salva layout'}
        </button>
      </div>

      {/* Tree editor */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>

        {/* Header fisso */}
        <div className="px-4 py-2 flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <GripVertical className="w-3.5 h-3.5 opacity-30" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Struttura sidebar</span>
        </div>

        {nodes.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            Nessun elemento — usa i pulsanti in basso per aggiungere sezioni e anagrafiche.
          </div>
        )}

        {nodes.map((node, i) => {
          const isFirst = i === 0
          const isLast = i === nodes.length - 1
          const borderStyle = { borderTop: '1px solid var(--color-border)' }

          // ── Separatore ─────────────────────────────────────────
          if (node.type === 'separator') return (
            <div key={nodeKey(node)} className="px-4 py-2.5 flex items-center gap-2"
              style={{ ...borderStyle, backgroundColor: 'var(--color-surface)' }}>
              <Minus className="w-4 h-4 text-text-muted shrink-0" />
              <span className="flex-1 text-xs text-text-muted italic">— Separatore —</span>
              <MoveBtn dir="up" onClick={() => moveRoot(i, -1)} disabled={isFirst} />
              <MoveBtn dir="down" onClick={() => moveRoot(i, 1)} disabled={isLast} />
              <button onClick={() => deleteRoot(i)} className="btn-icon-danger">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )

          // ── Builtin ────────────────────────────────────────────
          if (node.type === 'builtin') return (
            <div key={nodeKey(node)}
              className="px-4 py-3 flex items-center gap-2.5"
              style={{
                ...borderStyle,
                backgroundColor: node.visible ? 'var(--color-bg)' : 'var(--color-surface)',
                opacity: node.visible ? 1 : 0.55,
              }}>
              <span className="text-sm">{node.key === 'dashboard' ? '🏠' : '📅'}</span>
              <span className="text-sm font-medium flex-1">{node.label}</span>
              <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded border"
                style={{ borderColor: 'var(--color-border)' }}>predefinito</span>
              <VisToggle visible={node.visible} onClick={() => toggleRootVis(i)} />
              <MoveBtn dir="up" onClick={() => moveRoot(i, -1)} disabled={isFirst} />
              <MoveBtn dir="down" onClick={() => moveRoot(i, 1)} disabled={isLast} />
            </div>
          )

          // ── Anagrafica a radice ────────────────────────────────
          if (node.type === 'anagrafica') {
            const ana = anaMap[node.slug]
            return (
              <div key={nodeKey(node)}
                className="px-4 py-3 flex items-center gap-2.5"
                style={{
                  ...borderStyle,
                  backgroundColor: node.visible ? 'var(--color-bg)' : 'var(--color-surface)',
                  opacity: node.visible ? 1 : 0.55,
                }}>
                {ana
                  ? <IconaAna nome={ana.icona || ana.nome} colore={ana.colore} />
                  : <span className="w-5 h-5 rounded bg-border opacity-40" />}
                <span className="text-sm flex-1 font-medium">{ana?.nome ?? node.slug}</span>
                <VisToggle visible={node.visible} onClick={() => toggleRootVis(i)} />
                <MoveBtn dir="up" onClick={() => moveRoot(i, -1)} disabled={isFirst} />
                <MoveBtn dir="down" onClick={() => moveRoot(i, 1)} disabled={isLast} />
                <button onClick={() => deleteRoot(i)} className="btn-icon-danger">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }

          // ── Sezione ────────────────────────────────────────────
          if (node.type === 'section') {
            const isEditing = editingId === node.id
            return (
              <div key={nodeKey(node)} style={borderStyle}>
                {/* Header sezione */}
                <div className="px-4 py-3 flex items-center gap-2.5"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    opacity: node.visible ? 1 : 0.55,
                  }}>
                  <FolderOpen className="w-4 h-4 text-text-muted shrink-0" />
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input
                        value={editLabel} onChange={e => setEditLabel(e.target.value)}
                        placeholder="Nome sezione…" autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            updateSection(i, { label: editLabel.trim() || node.label, icon: editIcon.trim() || undefined })
                            setEditingId(null)
                          }
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 min-w-[120px] px-2 py-1 text-sm rounded border"
                        style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-brand)', color: 'var(--color-text-primary)' }}
                      />
                      <input
                        value={editIcon} onChange={e => setEditIcon(e.target.value)}
                        placeholder="🗂️" maxLength={4}
                        className="w-12 px-2 py-1 text-sm rounded border text-center"
                        style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                      <button
                        onClick={() => {
                          updateSection(i, { label: editLabel.trim() || node.label, icon: editIcon.trim() || undefined })
                          setEditingId(null)
                        }}
                        className="btn-icon" style={{ color: 'var(--color-brand)' }}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-icon">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {node.icon && <span className="text-base leading-none">{node.icon}</span>}
                      <span className="text-sm font-semibold flex-1">{node.label}</span>
                      <button
                        onClick={() => { setEditingId(node.id); setEditLabel(node.label); setEditIcon(node.icon ?? '') }}
                        className="btn-icon">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <VisToggle visible={node.visible} onClick={() => toggleRootVis(i)} />
                  <MoveBtn dir="up" onClick={() => moveRoot(i, -1)} disabled={isFirst} />
                  <MoveBtn dir="down" onClick={() => moveRoot(i, 1)} disabled={isLast} />
                  <button onClick={() => deleteRoot(i)} className="btn-icon-danger">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Children */}
                {node.children.map((child, ci) => {
                  const ana = anaMap[child.slug]
                  return (
                    <div key={child.slug}
                      className="pl-10 pr-4 py-2.5 flex items-center gap-2.5"
                      style={{
                        borderTop: '1px solid var(--color-border)',
                        backgroundColor: child.visible ? 'var(--color-bg)' : 'var(--color-surface)',
                        opacity: child.visible ? 1 : 0.5,
                      }}>
                      <div className="w-4 h-4 flex items-center justify-center opacity-20 shrink-0">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      {ana
                        ? <IconaAna nome={ana.icona || ana.nome} colore={ana.colore} />
                        : <span className="w-5 h-5 rounded opacity-30" style={{ backgroundColor: 'var(--color-border)' }} />}
                      <span className="text-sm flex-1">{ana?.nome ?? child.slug}</span>
                      <VisToggle visible={child.visible} onClick={() => toggleChildVis(i, ci)} />
                      <MoveBtn dir="up" onClick={() => moveInSection(i, ci, -1)} disabled={ci === 0} />
                      <MoveBtn dir="down" onClick={() => moveInSection(i, ci, 1)} disabled={ci === node.children.length - 1} />
                      <button onClick={() => removeFromSection(i, child.slug)} className="btn-icon-danger">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}

                {/* Aggiungi anagrafica alla sezione */}
                <div className="pl-10 pr-4 py-2.5"
                  style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  {addingTo === node.id ? (
                    <div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pb-1">
                        {anagrafiche
                          .filter(a => !node.children.some(c => c.slug === a.slug))
                          .map(a => (
                            <button
                              key={a.slug}
                              onClick={() => { addToSection(i, a.slug); setAddingTo(null) }}
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors hover:bg-surface-hover"
                              style={{ borderColor: 'var(--color-border)' }}>
                              <IconaAna nome={a.icona || a.nome} colore={a.colore} size={4} />
                              {a.nome}
                            </button>
                          ))}
                        {anagrafiche.filter(a => !node.children.some(c => c.slug === a.slug)).length === 0 && (
                          <span className="text-xs text-text-muted italic">Tutte le anagrafiche già incluse</span>
                        )}
                      </div>
                      <button onClick={() => setAddingTo(null)}
                        className="mt-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                        Annulla
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTo(node.id)}
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                      <Plus className="w-3 h-3" /> Aggiungi anagrafica alla sezione
                    </button>
                  )}
                </div>
              </div>
            )
          }

          return null
        })}

        {/* Fisso in fondo — Pannello Controllo */}
        <div className="px-4 py-3 flex items-center gap-2.5 opacity-35"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <span className="text-sm">⚙️</span>
          <span className="text-sm font-medium flex-1">Pannello di Controllo</span>
          <span className="text-[10px] text-text-muted italic">fisso · solo admin</span>
        </div>
      </div>

      {/* Azioni aggiungi */}
      <div className="flex flex-wrap gap-2 mt-3 items-start">
        <button onClick={addSection} className="btn-ghost text-xs">
          <Plus className="w-3.5 h-3.5" /> Nuova sezione
        </button>

        {addingTo === 'root' ? (
          <div className="flex-1 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs text-text-muted mb-2">Scegli anagrafica da aggiungere alla radice:</p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {anagrafiche.filter(a => !usedSlugs.has(a.slug)).map(a => (
                <button
                  key={a.slug}
                  onClick={() => addToRoot(a.slug)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors hover:bg-surface-hover"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <IconaAna nome={a.icona || a.nome} colore={a.colore} size={4} />
                  {a.nome}
                </button>
              ))}
              {anagrafiche.filter(a => !usedSlugs.has(a.slug)).length === 0 && (
                <span className="text-xs text-text-muted italic">Tutte le anagrafiche già presenti</span>
              )}
            </div>
            <button onClick={() => setAddingTo(null)}
              className="mt-2 text-xs text-text-muted hover:text-text-primary transition-colors">
              Annulla
            </button>
          </div>
        ) : (
          <button onClick={() => setAddingTo('root')} className="btn-ghost text-xs">
            <Plus className="w-3.5 h-3.5" /> Aggiungi anagrafica
          </button>
        )}

        <button onClick={addSeparator} className="btn-ghost text-xs">
          <Minus className="w-3.5 h-3.5" /> Separatore
        </button>
      </div>

      {dirty && (
        <p className="text-xs text-amber-600 mt-4 flex items-center gap-1.5">
          ⚠ Modifiche non salvate — clicca &quot;Salva layout&quot; per applicarle alla sidebar.
        </p>
      )}
    </div>
  )
}
