'use client'

/**
 * src/components/controllo/SezioneImport.tsx
 * Sezione Import del Pannello di Controllo.
 * Fasi: upload → preview/modifica → import → risultati
 */

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  CheckCircle2, AlertTriangle, XCircle, Loader2,
  FileSpreadsheet, ChevronRight, RotateCcw, Info, Check, X, Download,
  Link2, Link2Off,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParseResult, ParsedSheet, ParsedColumn, RefPreviewResult } from '@/app/api/controllo/anagrafiche/import/route'

// ── Tipi locali ───────────────────────────────────────────────

type RefMode = 'skip-field' | 'skip-row'

interface ExecuteRow { excelRow: number; values: (string | number | null)[]; include: boolean }
interface ExecuteSheet {
  slug: string
  columns: ParsedColumn[]
  rows: ExecuteRow[]
  cellEdits: Record<string, string>
}
interface SheetResult {
  slug: string; nome: string; inserted: number; skipped: number
  errors: { rowExcel: number; message: string }[]
  unresolvedRefs: { campo: string; label: string; referenceTo: string }[]
}
interface ExecuteResult { results: SheetResult[]; totalInserted: number; totalErrors: number }

function fmtVal(v: string | number | null): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

// ── Componente principale ─────────────────────────────────────

export function SezioneImport() {
  const [phase, setPhase] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [file, setFile]             = useState<File | null>(null)
  const [parsing, setParsing]       = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [execResult, setExecResult]   = useState<ExecuteResult | null>(null)
  const [exporting, setExporting]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPhase('upload'); setFile(null); setParsing(false)
    setParseError(null); setParseResult(null); setExecResult(null)
  }

  const esportaExcel = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/controllo/anagrafiche/export')
      if (!res.ok) { alert("Errore durante l'export"); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `anagrafiche-template-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.match(/\.xlsx?$/i)) { setParseError('Carica un file .xlsx'); return }
    setFile(f); setParsing(true); setParseError(null)
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch('/api/controllo/anagrafiche/import', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Errore parsing')
      setParseResult(j); setPhase('preview')
    } catch (e) {
      setParseError(String(e))
    } finally { setParsing(false) }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [handleFile])

  // UPLOAD
  if (phase === 'upload') return (
    <div>
      <p className="text-sm text-text-secondary mb-5">
        Carica il file <strong>.xlsx</strong> generato dall&apos;export per importare schede.
        Le colonne vengono abbinate per nome/slug — l&apos;ordine non è rilevante.
      </p>

      <div
        onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors',
          'hover:border-[color:var(--color-brand)] hover:bg-[color:var(--color-brand)]/5',
          'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
        )}
      >
        {parsing
          ? <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand)' }} />
          : <FileSpreadsheet className="w-8 h-8 opacity-40" />}
        <div className="text-center">
          <p className="font-medium text-sm">{parsing ? 'Analisi in corso…' : 'Trascina qui il file Excel'}</p>
          <p className="text-xs text-text-muted mt-1">{parsing ? '' : 'oppure clicca per scegliere — formato .xlsx'}</p>
        </div>
        {file && !parsing && (
          <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">✓ {file.name}</span>
        )}
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {parseError && <ErrBanner msg={parseError} />}

      <div className="mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs text-text-muted"
        style={{ borderColor: 'var(--color-border)' }}>
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Non hai il template? Scaricalo qui sotto — contiene un foglio per ogni anagrafica con tutte le colonne pronte e i menu a tendina per i campi selezione.
        </span>
      </div>

      <button onClick={esportaExcel} disabled={exporting} className="btn-secondary w-full justify-center mt-3">
        {exporting
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Download className="w-4 h-4" />}
        {exporting ? 'Generando template…' : 'Scarica template Excel'}
      </button>
    </div>
  )

  // PREVIEW
  if (phase === 'preview' && parseResult) return (
    <PreviewPhase
      parseResult={parseResult}
      onImport={async (sheets, refMode) => {
        setPhase('importing')
        try {
          const res = await fetch('/api/controllo/anagrafiche/import', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheets, refMode }),
          })
          const j = await res.json()
          if (!res.ok) throw new Error(j.error ?? 'Errore importazione')
          setExecResult(j); setPhase('done')
        } catch (e) {
          setParseError(String(e)); setPhase('preview')
        }
      }}
      onBack={reset}
    />
  )

  // IMPORTING
  if (phase === 'importing') return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand)' }} />
      <p className="font-medium">Importazione in corso…</p>
      <p className="text-sm text-text-muted">Non chiudere questa pagina.</p>
    </div>
  )

  // DONE
  if (phase === 'done' && execResult) return (
    <div>
      <div className={cn(
        'rounded-xl p-4 mb-5 flex items-center gap-3',
        execResult.totalErrors > 0
          ? 'bg-amber-100 border border-amber-300 text-amber-900'
          : 'bg-green-100 border border-green-300 text-green-900',
      )}>
        {execResult.totalErrors > 0
          ? <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          : <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />}
        <p className="font-semibold text-sm">
          {execResult.totalInserted} {execResult.totalInserted === 1 ? 'scheda inserita' : 'schede inserite'}
          {execResult.totalErrors > 0 ? ` · ${execResult.totalErrors} errori` : ''}
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {execResult.results.map(r => (
          <div key={r.slug} className="rounded-xl border p-4 text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{r.nome}</span>
              <span className="text-xs text-text-muted">{r.slug}</span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-green-700">✓ {r.inserted} inserite</span>
              {r.skipped > 0 && <span className="text-text-muted">⊘ {r.skipped} saltate</span>}
              {r.errors.length > 0 && <span className="text-red-600">✗ {r.errors.length} errori</span>}
            </div>
            {r.unresolvedRefs.length > 0 && (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                <p className="font-semibold mb-1">⚠ {r.unresolvedRefs.length} reference non risolti — completali manualmente:</p>
                {r.unresolvedRefs.slice(0, 6).map((ref, i) => (
                  <div key={i} className="opacity-80">
                    campo <strong>{ref.campo}</strong>: &quot;{ref.label}&quot; → {ref.referenceTo}
                  </div>
                ))}
                {r.unresolvedRefs.length > 6 && <div className="opacity-60">e altri {r.unresolvedRefs.length - 6}…</div>}
              </div>
            )}
            {r.errors.map((e, i) => <div key={i} className="mt-1 text-xs text-red-600">✗ {e.message}</div>)}
          </div>
        ))}
      </div>

      <button onClick={reset} className="btn-secondary w-full justify-center">
        <RotateCcw className="w-4 h-4" /> Nuova importazione
      </button>
    </div>
  )

  return null
}

// ── PreviewPhase ──────────────────────────────────────────────

function PreviewPhase({
  parseResult, onImport, onBack,
}: {
  parseResult: ParseResult
  onImport: (sheets: ExecuteSheet[], refMode: RefMode) => void
  onBack: () => void
}) {
  const matched = parseResult.sheets.filter(s => s.matched)
  const [activeIdx, setActiveIdx] = useState(0)
  const [refMode, setRefMode] = useState<RefMode>('skip-field')

  const [rowIncluded, setRowIncluded] = useState<Record<string, boolean[]>>(() => {
    const init: Record<string, boolean[]> = {}
    for (const s of matched) init[s.sheetName] = s.rows.map(() => true)
    return init
  })
  const [cellEdits, setCellEdits] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {}
    for (const s of matched) init[s.sheetName] = {}
    return init
  })

  const toggleRow = (name: string, ri: number) =>
    setRowIncluded(p => { const a = [...(p[name] ?? [])]; a[ri] = !a[ri]; return { ...p, [name]: a } })

  const toggleAll = (name: string, val: boolean) =>
    setRowIncluded(p => ({ ...p, [name]: (p[name] ?? []).map(() => val) }))

  const editCell = (name: string, ri: number, colIdx: number, val: string) =>
    setCellEdits(p => ({ ...p, [name]: { ...(p[name] ?? {}), [`${ri}:${colIdx}`]: val } }))

  const totalIncluded = matched.reduce(
    (s, sh) => s + (rowIncluded[sh.sheetName] ?? []).filter(Boolean).length, 0
  )

  // Totale reference non risolti
  const totalUnresolved = matched.reduce((s, sh) => {
    const uniq = new Set(sh.refPreviews.filter(r => !r.resolved).map(r => `${r.rowIndex}:${r.colIndex}:${r.label}`))
    return s + uniq.size
  }, 0)

  const buildPayload = (): ExecuteSheet[] => matched.map(s => ({
    slug: s.slug!,
    columns: s.columns,
    cellEdits: cellEdits[s.sheetName] ?? {},
    rows: s.rows.map((r, ri) => ({ ...r, include: rowIncluded[s.sheetName]?.[ri] ?? true })),
  }))

  const active = matched[activeIdx] as ParsedSheet | undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-semibold text-sm">Anteprima importazione</p>
          <p className="text-xs text-text-muted mt-0.5">
            {totalIncluded} righe selezionate su {matched.reduce((s, sh) => s + sh.rows.length, 0)} totali
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="btn-secondary text-xs"><RotateCcw className="w-3.5 h-3.5" /> Ricarica</button>
          <button onClick={() => onImport(buildPayload(), refMode)} disabled={totalIncluded === 0} className="btn-primary text-xs">
            Importa nel database <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Impostazione comportamento reference non risolti */}
      {totalUnresolved > 0 && (
        <div className="rounded-xl border p-3 flex flex-col gap-2 text-xs"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-amber-700">
              {totalUnresolved} reference non risolti — come procedere?
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setRefMode('skip-field')}
              className={cn(
                'px-3 py-1.5 rounded-lg border transition-colors',
                refMode === 'skip-field'
                  ? 'border-[color:var(--color-brand)] bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)] font-semibold'
                  : 'border-[color:var(--color-border)] text-text-muted hover:text-text-primary',
              )}
            >
              Importa la riga, lascia il campo vuoto
            </button>
            <button
              onClick={() => setRefMode('skip-row')}
              className={cn(
                'px-3 py-1.5 rounded-lg border transition-colors',
                refMode === 'skip-row'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold'
                  : 'border-[color:var(--color-border)] text-text-muted hover:text-text-primary',
              )}
            >
              Salta l&apos;intera riga
            </button>
          </div>
        </div>
      )}

      {parseResult.globalErrors.map((e, i) => <ErrBanner key={i} msg={e} />)}
      {parseResult.sheets.filter(s => !s.matched).map(s => (
        <ErrBanner key={s.sheetName} msg={`Foglio "${s.sheetName}": ${s.errors[0] ?? 'anagrafica non trovata'}`} />
      ))}
      {matched.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Nessun foglio abbinato. Verifica che il file sia l&apos;export del gestionale.
        </div>
      )}

      {matched.length > 1 && (
        <div className="flex gap-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {matched.map((s, i) => {
            const unresolved = s.refPreviews.filter(r => !r.resolved).length
            return (
              <button key={s.sheetName} onClick={() => setActiveIdx(i)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-t-lg border-b-2 transition-colors flex items-center gap-1',
                  i === activeIdx
                    ? 'border-[color:var(--color-brand)] text-[color:var(--color-brand)] font-semibold'
                    : 'border-transparent text-text-muted hover:text-text-primary',
                )}>
                {s.nome ?? s.slug}
                <span className="opacity-60">({(rowIncluded[s.sheetName] ?? []).filter(Boolean).length})</span>
                {unresolved > 0 && (
                  <span className="ml-0.5 rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold">
                    ⚠{unresolved}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {active && (
        <SheetTable
          sheet={active}
          included={rowIncluded[active.sheetName] ?? []}
          edits={cellEdits[active.sheetName] ?? {}}
          onToggleRow={ri => toggleRow(active.sheetName, ri)}
          onToggleAll={v => toggleAll(active.sheetName, v)}
          onEditCell={(ri, colIdx, val) => editCell(active.sheetName, ri, colIdx, val)}
        />
      )}
    </div>
  )
}

// ── SheetTable ────────────────────────────────────────────────

function SheetTable({
  sheet, included, edits, onToggleRow, onToggleAll, onEditCell,
}: {
  sheet: ParsedSheet
  included: boolean[]
  edits: Record<string, string>
  onToggleRow: (ri: number) => void
  onToggleAll: (v: boolean) => void
  onEditCell: (ri: number, colIdx: number, val: string) => void
}) {
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const allOn  = included.length > 0 && included.every(Boolean)
  const someOn = included.some(Boolean)

  const matchedCols  = sheet.columns.filter(c => c.matched)
  const ignoredCols  = sheet.columns.filter(c => !c.matched)
  const includedCount = included.filter(Boolean).length

  // Mappa rapida per lookup reference preview: "rowIndex:colIndex" → RefPreviewResult[]
  const refMap = useMemo(() => {
    const m = new Map<string, RefPreviewResult[]>()
    for (const rp of (sheet.refPreviews ?? [])) {
      const k = `${rp.rowIndex}:${rp.colIndex}`
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(rp)
    }
    return m
  }, [sheet.refPreviews])

  const unresolvedCount = useMemo(
    () => sheet.refPreviews?.filter(r => !r.resolved).length ?? 0,
    [sheet.refPreviews]
  )

  const startEdit = (ri: number, col: ParsedColumn) => {
    if (!col.matched) return
    const k = `${ri}:${col.index}`
    setEditKey(k)
    setEditVal(edits[k] ?? fmtVal(sheet.rows[ri]?.values[sheet.columns.indexOf(col)] ?? null))
  }

  const commit = (ri: number, col: ParsedColumn) => {
    if (editKey) onEditCell(ri, col.index, editVal)
    setEditKey(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-1">
          ✓ {matchedCols.length} colonne mappate
        </span>
        {ignoredCols.length > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-1">
            ⚠ {ignoredCols.length} ignorate: {ignoredCols.map(c => c.header.replace(/\n.*/,'')).slice(0,3).join(', ')}
            {ignoredCols.length > 3 ? ` e altre ${ignoredCols.length - 3}` : ''}
          </span>
        )}
        {unresolvedCount > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 flex items-center gap-1">
            <Link2Off className="w-3 h-3" />
            {unresolvedCount} reference non risolti
          </span>
        )}
        {sheet.errors.map((e, i) => <span key={i} className="rounded-full bg-red-100 text-red-700 px-2.5 py-1">✗ {e}</span>)}
        <span className="rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--color-border)' }}>
          {includedCount} / {sheet.rows.length} righe
        </span>
      </div>

      {sheet.rows.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Nessuna riga dati trovata (le prime 3 righe sono intestazioni).
        </div>
      )}

      {sheet.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-max min-w-full border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                <th className="sticky left-0 z-20 px-3 py-2 border-b border-r"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <input type="checkbox" checked={allOn}
                    ref={el => { if (el) el.indeterminate = !allOn && someOn }}
                    onChange={e => onToggleAll(e.target.checked)} className="cursor-pointer" />
                </th>
                {sheet.columns.map(col => (
                  <th key={col.index}
                    className={cn('px-3 py-2 text-left border-b border-r font-medium', col.matched ? 'text-text-primary' : 'opacity-40')}
                    style={{
                      borderColor: 'var(--color-border)', minWidth: '130px', maxWidth: '220px',
                      backgroundColor: col.matched
                        ? (col.isLineItems ? 'hsl(262 83% 58% / 0.07)' : 'var(--color-surface)')
                        : 'hsl(0 0% 50% / 0.04)',
                    }}>
                    <div className="flex items-center gap-1">
                      {col.matched
                        ? (col.isLineItems
                          ? <span className="text-purple-500 font-bold text-xs">↳</span>
                          : <Check className="w-3 h-3 text-green-500 shrink-0" />)
                        : <X className="w-3 h-3 text-amber-400 shrink-0" />}
                      <span className="truncate">{col.variabileNome ?? col.header.replace(/\n.*/,'')}</span>
                    </div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {col.tipo && <span className="text-[10px] opacity-50 font-normal">{col.tipo}</span>}
                      {col.referenceTo && (
                        <span className="text-[10px] text-blue-500 font-normal flex items-center gap-0.5">
                          <Link2 className="w-2.5 h-2.5" />{col.referenceTo}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row, ri) => {
                const on = included[ri] ?? true
                return (
                  <tr key={ri} className={cn('transition-opacity', !on && 'opacity-25',
                    ri % 2 === 0 ? '' : 'bg-[color:var(--color-surface)]/40')}>
                    <td className="sticky left-0 z-10 px-3 py-1.5 border-b border-r"
                      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                      <input type="checkbox" checked={on} onChange={() => onToggleRow(ri)} className="cursor-pointer" />
                    </td>
                    {sheet.columns.map(col => {
                      const ci  = sheet.columns.indexOf(col)
                      const k   = `${ri}:${col.index}`
                      const isE = editKey === k
                      const dv  = edits[k] ?? fmtVal(row.values[ci] ?? null)

                      // Stato reference per questa cella
                      const refResults = refMap.get(`${ri}:${col.index}`) ?? []
                      const hasUnresolved = refResults.some(r => !r.resolved)
                      const allResolved   = refResults.length > 0 && refResults.every(r => r.resolved)

                      return (
                        <td key={col.index}
                          onClick={() => !isE && col.matched && on && startEdit(ri, col)}
                          className={cn(
                            'px-3 py-1.5 border-b border-r max-w-[220px] overflow-hidden',
                            col.matched && on ? 'cursor-pointer hover:bg-[color:var(--color-brand)]/5' : '',
                            !col.matched ? 'opacity-30' : '',
                          )}
                          style={{
                            borderColor: 'var(--color-border)',
                            backgroundColor: hasUnresolved
                              ? 'hsl(43 96% 56% / 0.15)'
                              : allResolved
                                ? 'hsl(142 71% 45% / 0.10)'
                                : undefined,
                          }}>
                          {isE ? (
                            <input autoFocus value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              onBlur={() => commit(ri, col)}
                              onKeyDown={e => { if (e.key === 'Enter') commit(ri, col); if (e.key === 'Escape') setEditKey(null) }}
                              className="w-full bg-transparent outline outline-1 rounded px-1 text-xs"
                              style={{ outlineColor: 'var(--color-brand)' }} />
                          ) : (
                            <div className="flex items-center gap-1 min-w-0">
                              {hasUnresolved && (
                                <Link2Off className="w-3 h-3 text-amber-500 shrink-0" title={`Non trovato in ${col.referenceTo}`} />
                              )}
                              {allResolved && (
                                <Link2 className="w-3 h-3 text-green-500 shrink-0" title="Riferimento trovato" />
                              )}
                              <span className={cn('truncate block text-xs', !dv && 'text-text-muted italic')}>
                                {dv || (col.matched ? '—' : '')}
                              </span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-text-muted">
        Clicca su una cella per modificarla · ☑ per escludere righe · le colonne ⚠ non vengono importate · <Link2Off className="inline w-2.5 h-2.5 text-amber-500" /> = reference non trovato
      </p>
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────

function ErrBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
      <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{msg}</span>
    </div>
  )
}
