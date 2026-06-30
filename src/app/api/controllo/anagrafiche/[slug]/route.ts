/**
 * GET    /api/controllo/anagrafiche/[slug]  — legge config + variabili
 * PUT    /api/controllo/anagrafiche/[slug]  — aggiorna anagrafica (non referenceTo)
 * DELETE /api/controllo/anagrafiche/[slug]  — elimina anagrafica + variabili + options
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import AnagraficaConfig from '@/models/AnagraficaConfig'
import { Variabile } from '@/models/Variabile'
import { SelectOption } from '@/models/SelectOption'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug } = await params
    await connectDB()
    const cfg  = await AnagraficaConfig.findOne({ slug }).lean()
    if (!cfg) return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    const vars = await Variabile.find({ anagraficaSlug: slug }).sort({ ordine: 1 }).lean()
    return NextResponse.json({ data: cfg, variabili: vars })
  } catch (err) {
    console.error('[GET /api/controllo/anagrafiche/[slug]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug } = await params
    const body = await req.json()
    await connectDB()

    const allowed: Record<string, unknown> = {}
    if (body.nome           !== undefined) allowed.nome           = String(body.nome).trim()
    if (body.colore         !== undefined) allowed.colore         = body.colore
    if (body.icona          !== undefined) allowed.icona          = body.icona
    if (body.ordine         !== undefined) allowed.ordine         = Number(body.ordine)
    if (body.maxDocumentoMB !== undefined) allowed.maxDocumentoMB = Number(body.maxDocumentoMB)
    if (body.tipiDocumento  !== undefined) allowed.tipiDocumento  = body.tipiDocumento
    if (body.previewColumns !== undefined) allowed.previewColumns = body.previewColumns

    const cfg = await AnagraficaConfig.findOneAndUpdate({ slug }, { $set: allowed }, { new: true })
    if (!cfg) return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    return NextResponse.json({ data: cfg })
  } catch (err) {
    console.error('[PUT /api/controllo/anagrafiche/[slug]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug } = await params
    await connectDB()
    const cfg = await AnagraficaConfig.findOneAndDelete({ slug })
    if (!cfg) return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    await Variabile.deleteMany({ anagraficaSlug: slug })
    await SelectOption.deleteMany({ anagraficaSlug: slug })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/controllo/anagrafiche/[slug]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
