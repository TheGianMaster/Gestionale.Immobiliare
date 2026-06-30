/**
 * GET /api/controllo/anagrafiche/[slug]  -- legge config
 * PUT /api/controllo/anagrafiche/[slug]  -- aggiorna maxDocumentoMB e tipiDocumento
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import AnagraficaConfig from '@/models/AnagraficaConfig'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    await connectDB()
    const cfg = await AnagraficaConfig.findOne({ slug: params.slug }).lean()
    if (!cfg) return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    return NextResponse.json({ data: cfg })
  } catch (err) {
    console.error('[GET /api/controllo/anagrafiche/[slug]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const body = await req.json()
    await connectDB()
    const allowed: Record<string, unknown> = {}
    if (body.maxDocumentoMB !== undefined) allowed.maxDocumentoMB = Number(body.maxDocumentoMB)
    if (body.tipiDocumento !== undefined) allowed.tipiDocumento = body.tipiDocumento
    const cfg = await AnagraficaConfig.findOneAndUpdate({ slug: params.slug }, allowed, { new: true })
    if (!cfg) return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    return NextResponse.json({ data: cfg })
  } catch (err) {
    console.error('[PUT /api/controllo/anagrafiche/[slug]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
