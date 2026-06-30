/**
 * GET /api/controllo/anagrafiche/export
 * Genera un file XLSX con un foglio per ogni anagrafica attiva.
 * Ogni colonna = una variabile; layout professionale con il colore dell'anagrafica.
 * Campi select: dropdown con le opzioni disponibili (foglio nascosto __opzioni).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { Variabile } from '@/models/Variabile'
import { SelectOption } from '@/models/SelectOption'
import ExcelJS from 'exceljs'

function hexToArgb(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    const r = h[0] + h[0], g = h[1] + h[1], b = h[2] + h[2]
    return 'FF' + r + g + b
  }
  if (h.length === 6) return 'FF' + h.toUpperCase()
  return 'FF3B82F6'
}

function lightenArgb(argb: string, factor = 0.75): string {
  const r = parseInt(argb.slice(2, 4), 16)
  const g = parseInt(argb.slice(4, 6), 16)
  const b = parseInt(argb.slice(6, 8), 16)
  const lr = Math.round(r + (255 - r) * factor)
  const lg = Math.round(g + (255 - g) * factor)
  const lb = Math.round(b + (255 - b) * factor)
  return 'FF' + lr.toString(16).padStart(2, '0').toUpperCase()
             + lg.toString(16).padStart(2, '0').toUpperCase()
             + lb.toString(16).padStart(2, '0').toUpperCase()
}

/** Converte indice colonna 1-based in lettera Excel (1→A, 27→AA, ecc.) */
function colLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function labelTipo(tipo: string): string {
  const map: Record<string, string> = {
    'text': 'testo', 'text-area': 'testo lungo', 'numbers': 'numero',
    'mail': 'email', 'phone': 'telefono', 'data': 'data', 'select': 'selezione',
    'reference': 'riferimento', 'multi-reference': 'riferimenti multipli',
    'variantID': 'variante', 'line-items': 'righe ripetibili',
  }
  return map[tipo] ?? tipo
}

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await connectDB()

    const anagrafiche = await AnagraficaConfig.find({ attiva: true })
      .sort({ ordine: 1, nome: 1 })
      .lean()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Gestionale'
    workbook.created = new Date()

    // Foglio nascosto per le opzioni dei campi select
    const optsWs = workbook.addWorksheet('__opzioni', { state: 'veryHidden' })
    let globalOptsCol = 1

    for (const ana of anagrafiche) {
      const argb = hexToArgb(ana.colore ?? '#3B82F6')
      const lightArgb  = lightenArgb(argb, 0.82)
      const lightArgb2 = lightenArgb(argb, 0.92)

      const variabili = await Variabile.find({ anagraficaSlug: ana.slug })
        .sort({ ordine: 1 })
        .lean()

      // ── Carica opzioni select e popola foglio nascosto ──────────────────
      const selectOptsMap: Record<string, { optCol: number; count: number }> = {}
      for (const v of variabili) {
        if (v.tipo === 'select') {
          const opts = await SelectOption.find({
            anagraficaSlug: ana.slug,
            variabileSlug: v.slug,
            attiva: true,
          }).sort({ ordine: 1 }).lean()

          if (opts.length > 0) {
            optsWs.getCell(1, globalOptsCol).value = `${ana.slug}.${v.slug}`
            opts.forEach((o, i) => { optsWs.getCell(i + 2, globalOptsCol).value = o.etichetta })
            selectOptsMap[v.slug] = { optCol: globalOptsCol, count: opts.length }
            globalOptsCol++
          }
        }
      }

      // Nome foglio: max 31 chars, no caratteri illegali
      const sheetName = (ana.nome ?? ana.slug)
        .replace(/[:\\/?*[\]]/g, '')
        .slice(0, 31)

      const ws = workbook.addWorksheet(sheetName, {
        properties: { tabColor: { argb } },
        pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' },
        views: [{ state: 'frozen', ySplit: 3 }],
      })

      // ── RIGA 1 — Titolo ─────────────────────────────────────────────────
      ws.mergeCells(1, 1, 1, Math.max(variabili.length, 1) + 1)
      const titleCell = ws.getCell('A1')
      titleCell.value = (ana.icona ? ana.icona + '  ' : '') + (ana.nome ?? ana.slug).toUpperCase()
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
      ws.getRow(1).height = 32

      // ── RIGA 2 — Sottotitolo / legenda ──────────────────────────────────
      ws.mergeCells(2, 1, 2, Math.max(variabili.length, 1) + 1)
      const subtitleCell = ws.getCell('A2')
      subtitleCell.value = `slug:${ana.slug}   |   Template importazione — ${variabili.length} campo/i   |   Una riga = una scheda`
      subtitleCell.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } }
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightArgb } }
      ws.getRow(2).height = 18

      // ── RIGA 3 — Intestazioni colonne ────────────────────────────────────
      ws.getRow(3).height = 36

      let colIndex = 1
      const varSlugToExcelCol: Record<string, number> = {}

      for (const v of variabili) {
        const isLineItems = v.tipo === 'line-items'
        const colonne = v.colonne ?? []

        if (isLineItems && colonne.length > 0) {
          const startCol = colIndex
          for (const col of colonne) {
            const cell = ws.getCell(3, colIndex)
            cell.value = `↳ ${col.nome}\n(${v.nome} › ${labelTipo(col.tipo)})`
            cell.font = { bold: true, size: 9, color: { argb } }
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightArgb } }
            cell.border = {
              top:    { style: 'medium', color: { argb } },
              bottom: { style: 'medium', color: { argb } },
              left:   { style: 'thin',   color: { argb } },
              right:  { style: 'thin',   color: { argb } },
            }
            ws.getColumn(colIndex).width = 22
            colIndex++
          }
          if (colonne.length > 1 && startCol < colIndex - 1) {
            const firstCell = ws.getCell(3, startCol)
            firstCell.border = { ...firstCell.border, left: { style: 'medium', color: { argb } } }
            const lastCell = ws.getCell(3, colIndex - 1)
            lastCell.border = { ...lastCell.border, right: { style: 'medium', color: { argb } } }
          }
        } else {
          const cell = ws.getCell(3, colIndex)
          cell.value = `${v.nome}\n(${labelTipo(v.tipo)})`
          cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
          cell.border = {
            top:    { style: 'medium', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
            left:   { style: 'thin',   color: { argb: 'FFFFFFFF' } },
            right:  { style: 'thin',   color: { argb: 'FFFFFFFF' } },
          }
          ws.getColumn(colIndex).width = v.tipo === 'text-area' ? 30 : 20
          varSlugToExcelCol[v.slug] = colIndex  // traccia per data validation
          colIndex++
        }
      }

      // ── RIGHE DATI (4-53) — 50 righe vuote alternate ────────────────────
      for (let r = 4; r <= 53; r++) {
        const fillArgb = (r % 2 === 0) ? lightArgb2 : 'FFFFFFFF'
        ws.getRow(r).height = 20
        for (let c = 1; c < colIndex; c++) {
          const cell = ws.getCell(r, c)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } }
          cell.border = {
            bottom: { style: 'hair', color: { argb: lightArgb } },
            right:  { style: 'hair', color: { argb: lightArgb } },
          }
          cell.alignment = { vertical: 'middle' }
        }
      }

      // ── Dropdown per campi select (righe 4-53) ───────────────────────────
      for (const [slug, excelCol] of Object.entries(varSlugToExcelCol)) {
        const info = selectOptsMap[slug]
        if (!info) continue
        const letter = colLetter(info.optCol)
        for (let r = 4; r <= 53; r++) {
          ws.getCell(r, excelCol).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'__opzioni'!$${letter}$2:$${letter}$${info.count + 1}`],
          }
        }
      }

    }

    const buffer = await workbook.xlsx.writeBuffer()
    const today = new Date().toISOString().split('T')[0]
    return new NextResponse(buffer as Buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="anagrafiche-template-${today}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[GET /api/controllo/anagrafiche/export]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
