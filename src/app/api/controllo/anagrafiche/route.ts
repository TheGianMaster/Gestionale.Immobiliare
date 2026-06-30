/**
 * POST /api/controllo/anagrafiche  — crea una nuova anagrafica
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import AnagraficaConfig from '@/models/AnagraficaConfig'

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const body = await req.json()
    const { nome, slug: rawSlug, colore, icona, ordine } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })

    const slug = rawSlug?.trim() ? toSlug(rawSlug) : toSlug(nome)
    if (!slug) return NextResponse.json({ error: 'Slug non valido' }, { status: 400 })

    await connectDB()
    const exists = await AnagraficaConfig.findOne({ slug })
    if (exists) return NextResponse.json({ error: 'Slug già in uso' }, { status: 409 })

    const cfg = await AnagraficaConfig.create({
      slug,
      nome:           nome.trim(),
      colore:         colore ?? '#6366F1',
      icona:          icona  ?? 'FileText',
      variabili:      [],
      previewColumns: [],
      tipiDocumento:  [],
      maxDocumentoMB: 10,
      attiva:         true,
      ordine:         typeof ordine === 'number' ? ordine : 99,
    })

    return NextResponse.json({ data: cfg }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/controllo/anagrafiche]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
