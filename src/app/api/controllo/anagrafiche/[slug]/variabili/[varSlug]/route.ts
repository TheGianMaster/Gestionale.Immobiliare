/**
 * PUT    /api/controllo/anagrafiche/[slug]/variabili/[varSlug]  — modifica variabile
 * DELETE /api/controllo/anagrafiche/[slug]/variabili/[varSlug]  — elimina variabile
 *
 * NOTA: referenceTo e' modificabile SOLO se era null/undefined.
 * Se gia' impostato, il client deve mostrare un warning e non inviarlo.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Variabile } from '@/models/Variabile'
import { SelectOption } from '@/models/SelectOption'
import AnagraficaConfig from '@/models/AnagraficaConfig'

type Params = { params: Promise<{ slug: string; varSlug: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug, varSlug } = await params
    const body = await req.json()
    await connectDB()

    const variabile = await Variabile.findOne({ anagraficaSlug: slug, slug: varSlug })
    if (!variabile) return NextResponse.json({ error: 'Variabile non trovata' }, { status: 404 })

    const allowed: Record<string, unknown> = {}
    if (body.nome             !== undefined) allowed.nome             = String(body.nome).trim()
    if (body.obbligatorio     !== undefined) allowed.obbligatorio     = !!body.obbligatorio
    if (body.visibileInPreview !== undefined) allowed.visibileInPreview = !!body.visibileInPreview
    if (body.descrizione      !== undefined) allowed.descrizione      = body.descrizione
    if (body.placeholder      !== undefined) allowed.placeholder      = body.placeholder
    if (body.decimali         !== undefined) allowed.decimali         = !!body.decimali
    if (body.ordine           !== undefined) allowed.ordine           = Number(body.ordine)
    if (body.colonne          !== undefined) allowed.colonne          = body.colonne

    // referenceTo: modificabile solo se non ancora impostato
    if (body.referenceTo !== undefined) {
      if (!variabile.referenceTo) {
        allowed.referenceTo = body.referenceTo
      }
      // Se referenceTo gia' impostato, lo ignoriamo silenziosamente
      // (il client mostra gia' il warning e non dovrebbe inviarlo)
    }

    await variabile.updateOne({ $set: allowed })
    const updated = await Variabile.findOne({ anagraficaSlug: slug, slug: varSlug }).lean()
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT variabile]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug, varSlug } = await params
    await connectDB()

    const variabile = await Variabile.findOneAndDelete({ anagraficaSlug: slug, slug: varSlug })
    if (!variabile) return NextResponse.json({ error: 'Variabile non trovata' }, { status: 404 })

    await SelectOption.deleteMany({ anagraficaSlug: slug, variabileSlug: varSlug })
    await AnagraficaConfig.updateOne({ slug }, { $pull: { variabili: varSlug, previewColumns: varSlug } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE variabile]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
