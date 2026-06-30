/**
 * POST /api/controllo/anagrafiche/import   — parsing del file Excel (multipart)
 * PUT  /api/controllo/anagrafiche/import   — esecuzione import nel DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { Variabile } from '@/models/Variabile'
import { SelectOption } from '@/models/SelectOption'
import { getSchedaModel } from '@/models/Scheda'
import ExcelJS from 'exceljs'
import mongoose from 'mongoose'

// ─── Tipi condivisi tra parse e execute ──────────────────────────────────────

export interface ParsedColumn {
  index: number
  header: string
  variabileSlug: string | null
  variabileNome: string | null
  tipo: string | null
  referenceTo: string | null
  matched: boolean
  isLineItems: boolean
  liSlug: string | null
  liColonnaSlug: string | null
}

export interface ParsedRow {
  excelRow: number
  values: (string | number | null)[]
}

export interface RefPreviewResult {
  rowIndex: number
  colIndex: number
  label: string
  referenceTo: string
  resolved: boolean
  foundId?: string
}

export interface ParsedSheet {
  sheetName: string
  slug: string | null
  nome: string | null
  colore: string | null
  matched: boolean
  columns: ParsedColumn[]
  rows: ParsedRow[]
  errors: string[]
  unmatchedHeaders: string[]
  refPreviews: RefPreviewResult[]
}

export interface ParseResult {
  sheets: ParsedSheet[]
  globalErrors: string[]
}

// ─── Utilità ─────────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\u0300-\u036f]/g, '')
}

function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  return a.toLowerCase().trim() === b.toLowerCase().trim() || toSlug(a) === toSlug(b)
}

function cellToRaw(v: ExcelJS.CellValue): string | number | null {
  if (v === null || v === undefined) return null
  if (v instanceof Date) {
    const y = v.getFullYear()
    const m = String(v.getMonth() + 1).padStart(2, '0')
    const d = String(v.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof v === 'object') {
    if ('richText' in v) return (v as ExcelJS.CellRichTextValue).richText.map(r => r.text).join('')
    if ('result' in v) return (v as ExcelJS.CellFormulaValue).result as string | number ?? null
    if ('error' in v) return null
    if ('text' in v) return (v as ExcelJS.CellHyperlinkValue).text
  }
  if (typeof v === 'boolean') return v ? '1' : '0'
  return v as string | number
}

function matchHeader(
  header: string,
  variabili: { slug: string; nome: string; tipo: string; referenceTo?: string; colonne?: { slug: string; nome: string }[] }[]
): Omit<ParsedColumn, 'index' | 'header'> {
  const raw = header.replace(/\n/g, ' ').trim()
  const empty: Omit<ParsedColumn, 'index' | 'header'> = {
    variabileSlug: null, variabileNome: null, tipo: null, referenceTo: null,
    matched: false, isLineItems: false, liSlug: null, liColonnaSlug: null,
  }
  if (!raw) return empty

  if (raw.startsWith('↳') || raw.startsWith('→')) {
    const m = raw.match(/^[↳→]\s+(.+?)\s*\((.+?)\s*[›>]/)
    if (m) {
      const colonnaName = m[1].trim()
      const groupName   = m[2].trim()
      const parent = variabili.find(v => v.tipo === 'line-items' && namesMatch(v.nome, groupName))
      if (parent) {
        const col = parent.colonne?.find(c => namesMatch(c.nome, colonnaName))
        return {
          variabileSlug: parent.slug, variabileNome: parent.nome, tipo: 'line-items', referenceTo: null,
          matched: true, isLineItems: true,
          liSlug: parent.slug, liColonnaSlug: col?.slug ?? toSlug(colonnaName),
        }
      }
    }
    return { ...empty, isLineItems: true }
  }

  const nomePart = raw.replace(/\s*\([^)]*\)\s*$/, '').trim()
  const v = variabili.find(v => namesMatch(v.nome, nomePart))
  if (v) return {
    variabileSlug: v.slug, variabileNome: v.nome, tipo: v.tipo,
    referenceTo: (v.tipo === 'reference' || v.tipo === 'multi-reference') ? (v.referenceTo ?? null) : null,
    matched: true, isLineItems: false, liSlug: null, liColonnaSlug: null,
  }

  const computedSlug = toSlug(nomePart)
  const v2 = variabili.find(v => v.slug === computedSlug)
  if (v2) return {
    variabileSlug: v2.slug, variabileNome: v2.nome, tipo: v2.tipo,
    referenceTo: (v2.tipo === 'reference' || v2.tipo === 'multi-reference') ? (v2.referenceTo ?? null) : null,
    matched: true, isLineItems: false, liSlug: null, liColonnaSlug: null,
  }

  return empty
}

// ─── Helper: risoluzione reference ───────────────────────────────────────────

async function resolveRef(
  label: string,
  referenceTo: string,
  anaMap: Record<string, { previewColumns?: string[] }>,
  cache: Map<string, { id: string; label: string } | null>
): Promise<{ id: string; label: string } | null> {
  const key = `${referenceTo}:${label.toLowerCase().trim()}`
  if (cache.has(key)) return cache.get(key)!
  const target = anaMap[referenceTo]
  const searchCols = (target?.previewColumns?.length ?? 0) > 0
    ? target!.previewColumns!.map(c => ({ [`dati.${c}`]: { $regex: label.trim(), $options: 'i' } }))
    : [
        { 'dati.nome': { $regex: label.trim(), $options: 'i' } },
        { 'dati.ragione_sociale': { $regex: label.trim(), $options: 'i' } },
        { 'dati.titolo': { $regex: label.trim(), $options: 'i' } },
      ]
  try {
    const RefModel = await getSchedaModel(referenceTo)
    const doc = await RefModel.findOne({ $or: searchCols }).lean()
    const result = doc ? { id: String(doc._id), label } : null
    cache.set(key, result)
    return result
  } catch {
    cache.set(key, null)
    return null
  }
}

// ─── POST — Parsing ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File))
      return NextResponse.json({ error: 'Nessun file ricevuto' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    await connectDB()
    const anagrafiche = await AnagraficaConfig.find({ attiva: true }).lean()
    const allVariabili = await Variabile.find({}).lean()

    const anagraficheMap = Object.fromEntries(anagrafiche.map(a => [a.slug, a]))
    const variabiliBySlug: Record<string, typeof allVariabili> = {}
    for (const v of allVariabili) {
      if (!variabiliBySlug[v.anagraficaSlug]) variabiliBySlug[v.anagraficaSlug] = []
      variabiliBySlug[v.anagraficaSlug].push(v)
    }

    const globalErrors: string[] = []
    const sheets: ParsedSheet[] = []
    const refCache = new Map<string, { id: string; label: string } | null>()

    for (const ws of wb.worksheets) {
      if (ws.name === '__opzioni') continue

      const sheetName = ws.name
      let slug: string | null = null
      const errors: string[] = []

      const row2val = String(ws.getCell(2, 1).value ?? '').toLowerCase()
      const slugMatch = row2val.match(/slug:([a-z0-9_-]+)/)
      if (slugMatch) {
        slug = slugMatch[1]
      } else {
        const found = anagrafiche.find(a =>
          namesMatch(a.nome, sheetName) || a.slug === toSlug(sheetName)
        )
        if (found) slug = found.slug
      }

      const ana = slug ? anagraficheMap[slug] : null
      if (!ana) {
        sheets.push({
          sheetName, slug: null, nome: null, colore: null, matched: false,
          columns: [], rows: [], errors: [`Anagrafica non trovata per il foglio "${sheetName}"`],
          unmatchedHeaders: [], refPreviews: [],
        })
        continue
      }

      const variabili = (variabiliBySlug[slug!] ?? []).sort((a, b) => a.ordine - b.ordine)

      const headerRow = ws.getRow(3)
      const columns: ParsedColumn[] = []
      const unmatchedHeaders: string[] = []

      headerRow.eachCell({ includeEmpty: false }, (cell, colIndex) => {
        const header = String(cell.value ?? '').trim()
        if (!header) return
        const match = matchHeader(header, variabili)
        const col: ParsedColumn = { index: colIndex, header, ...match }
        columns.push(col)
        if (!match.matched) unmatchedHeaders.push(header.replace(/\n/g, ' ').slice(0, 40))
      })

      if (columns.length === 0) {
        errors.push('Nessuna colonna trovata nella riga 3. Verifica il formato del file.')
      }

      const rows: ParsedRow[] = []
      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 3) return
        const values = columns.map(col => {
          const raw = cellToRaw(row.getCell(col.index).value)
          if (raw === null) return null
          const s = String(raw).trim()
          return s === '' ? null : (typeof raw === 'number' ? raw : s)
        })
        if (values.every(v => v === null)) return
        rows.push({ excelRow: rowNumber, values })
      })

      // Pre-risoluzione reference
      const refPreviews: RefPreviewResult[] = []
      const refCols = columns.filter(c =>
        c.matched && (c.tipo === 'reference' || c.tipo === 'multi-reference') && c.referenceTo
      )

      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri]
        for (const col of refCols) {
          const ci = columns.indexOf(col)
          const cellVal = row.values[ci]
          if (cellVal === null || cellVal === undefined) continue
          const rawStr = String(cellVal).trim()
          if (!rawStr) continue

          const labels = col.tipo === 'multi-reference'
            ? rawStr.split('|').map(s => s.trim()).filter(Boolean)
            : [rawStr]

          for (const label of labels) {
            if (!label) continue
            const result = await resolveRef(label, col.referenceTo!, anagraficheMap, refCache)
            refPreviews.push({
              rowIndex: ri, colIndex: col.index, label,
              referenceTo: col.referenceTo!,
              resolved: !!result, foundId: result?.id,
            })
          }
        }
      }

      sheets.push({
        sheetName, slug, nome: ana.nome, colore: ana.colore ?? null,
        matched: true, columns, rows, errors, unmatchedHeaders, refPreviews,
      })
    }

    return NextResponse.json({ sheets, globalErrors } satisfies ParseResult)
  } catch (err) {
    console.error('[POST /api/controllo/anagrafiche/import]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── PUT — Esecuzione ─────────────────────────────────────────────────────────

interface ExecuteRow extends ParsedRow { include: boolean }
interface ExecuteSheet {
  slug: string
  columns: ParsedColumn[]
  rows: ExecuteRow[]
  cellEdits: Record<string, string>
}
interface ExecuteRequest {
  sheets: ExecuteSheet[]
  refMode: 'skip-field' | 'skip-row'
}

function coerce(raw: unknown, tipo: string): unknown {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  if (s === '') return null
  switch (tipo) {
    case 'numbers': {
      const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
      return isNaN(n) ? null : n
    }
    case 'data': {
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
      const m = s.match(/^(\d{1,2})[\/\-.T](\d{1,2})[\/\-.T](\d{4})$/)
      if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
      return s
    }
    default: return s
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin' || !session.user.id)
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { sheets, refMode = 'skip-field' } = await req.json() as ExecuteRequest
    await connectDB()

    const anagrafiche = await AnagraficaConfig.find({ attiva: true }).lean()
    const anaMap = Object.fromEntries(anagrafiche.map(a => [a.slug, a]))
    const userId = new mongoose.Types.ObjectId(session.user.id)

    const refCache = new Map<string, { id: string; label: string } | null>()
    const selectCache = new Map<string, Map<string, string>>()
    const results = []

    for (const sheet of sheets) {
      const { slug, columns, rows, cellEdits } = sheet
      const allVariabili = await Variabile.find({ anagraficaSlug: slug }).lean()
      const varMap = Object.fromEntries(allVariabili.map(v => [v.slug, v]))
      const SchedaModel = await getSchedaModel(slug)

      const toInsert = []
      const sheetErrors: { rowExcel: number; message: string }[] = []
      const unresolvedRefs: { campo: string; label: string; referenceTo: string }[] = []

      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri]
        if (!row.include) continue

        const dati: Record<string, unknown> = {}
        const lineItemsAccum: Record<string, { colonnaSlug: string; values: unknown[] }[]> = {}
        let skipThisRow = false

        for (const col of columns) {
          if (!col.matched || col.variabileSlug === null) continue

          const editKey = `${ri}:${col.index}`
          const rawVal = editKey in cellEdits ? cellEdits[editKey] : row.values[columns.indexOf(col)]

          if (col.isLineItems && col.liSlug && col.liColonnaSlug) {
            if (!lineItemsAccum[col.liSlug]) lineItemsAccum[col.liSlug] = []
            const parts = rawVal !== null && rawVal !== undefined
              ? String(rawVal).split('|').map(p => p.trim()).filter(Boolean)
              : []
            lineItemsAccum[col.liSlug].push({ colonnaSlug: col.liColonnaSlug, values: parts })
            continue
          }

          const variabile = varMap[col.variabileSlug]
          if (!variabile) continue

          if (variabile.tipo === 'reference' && variabile.referenceTo) {
            if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '') {
              const resolved = await resolveRef(String(rawVal).trim(), variabile.referenceTo, anaMap, refCache)
              if (!resolved) {
                unresolvedRefs.push({ campo: col.variabileSlug, label: String(rawVal), referenceTo: variabile.referenceTo })
                if (refMode === 'skip-row') { skipThisRow = true; break }
                dati[col.variabileSlug] = null
              } else {
                dati[col.variabileSlug] = resolved
              }
            } else {
              dati[col.variabileSlug] = null
            }
            continue
          }

          if (variabile.tipo === 'multi-reference' && variabile.referenceTo) {
            if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '') {
              const labels = String(rawVal).split('|').map(p => p.trim()).filter(Boolean)
              let hasUnresolved = false
              const resolved = await Promise.all(labels.map(l => resolveRef(l, variabile.referenceTo!, anaMap, refCache)))
              resolved.forEach((r, i) => {
                if (!r) {
                  unresolvedRefs.push({ campo: col.variabileSlug, label: labels[i], referenceTo: variabile.referenceTo! })
                  hasUnresolved = true
                }
              })
              if (hasUnresolved && refMode === 'skip-row') { skipThisRow = true; break }
              const valid = resolved.filter(Boolean) as { id: string; label: string }[]
              dati[col.variabileSlug] = valid.length ? valid : null
            } else {
              dati[col.variabileSlug] = null
            }
            continue
          }

          // Campi select: converti etichetta → valore
          if (variabile.tipo === 'select') {
            const raw = rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : ''
            if (raw === '') {
              dati[col.variabileSlug] = null
            } else {
              const cacheKey = `${slug}:${col.variabileSlug}`
              if (!selectCache.has(cacheKey)) {
                const opts = await SelectOption.find({
                  anagraficaSlug: slug,
                  variabileSlug: col.variabileSlug,
                }).lean()
                const map = new Map<string, string>()
                for (const o of opts) {
                  map.set(o.etichetta.toLowerCase(), o.valore)
                  map.set(o.valore.toLowerCase(), o.valore)
                }
                selectCache.set(cacheKey, map)
              }
              const optsMap = selectCache.get(cacheKey)!
              const resolved = optsMap.get(raw.toLowerCase())
              dati[col.variabileSlug] = resolved ?? raw
            }
            continue
          }

          dati[col.variabileSlug] = coerce(rawVal, variabile.tipo)
        }

        if (skipThisRow) continue

        // Costruisci array line-items
        for (const [liSlug, colonnaEntries] of Object.entries(lineItemsAccum)) {
          const maxLen = Math.max(...colonnaEntries.map(e => e.values.length), 0)
          const lineItemRows = []
          for (let i = 0; i < maxLen; i++) {
            const rowObj: Record<string, unknown> = {}
            for (const { colonnaSlug, values } of colonnaEntries) {
              rowObj[colonnaSlug] = values[i] ?? null
            }
            lineItemRows.push(rowObj)
          }
          if (lineItemRows.length > 0) dati[liSlug] = lineItemRows
        }

        toInsert.push({
          anagraficaSlug: slug,
          dati,
          attiva: true,
          versione: 1,
          creataDa: userId,
          modificataDa: userId,
          tags: [],
        })
      }

      // Inserimento batch
      let inserted = 0
      let insertErrors = 0
      if (toInsert.length > 0) {
        try {
          await SchedaModel.insertMany(toInsert, { ordered: false })
          inserted = toInsert.length
        } catch (e: unknown) {
          const bulk = e as { insertedDocs?: unknown[]; writeErrors?: unknown[] }
          inserted     = bulk.insertedDocs?.length ?? 0
          insertErrors = bulk.writeErrors?.length ?? 0
        }
      }

      results.push({
        slug,
        inserted,
        insertErrors,
        errors: sheetErrors,
        skipped: rows.filter(r => !r.include).length,
        unresolvedRefs,
      })
    }

    return NextResponse.json({ results })

  } catch (err) {
    console.error('[PUT /api/controllo/anagrafiche/import]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
