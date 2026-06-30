/**
 * GET  /api/controllo/anagrafiche/[slug]/variabili  — lista variabili
 * POST /api/controllo/anagrafiche/[slug]/variabili  — aggiunge variabile
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Variabile } from '@/models/Variabile'
import AnagraficaConfig from '@/models/AnagraficaConfig'

type Params = { params: Promise<{ slug: string }> }

function toVarSlug(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug } = await params
    await connectDB()
    const vars = await Variabile.find({ anagraficaSlug: slug }).sort({ ordine: 1 }).lean()
    return NextResponse.json({ data: vars })
  } catch (err) {
    console.error('[GET variabili]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug } = await params
    const body = await req.json()
    await connectDB()

    const cfg = await AnagraficaConfig.findOne({ slug })
    if (!cfg) return NextResponse.json({ error: 'Anagrafica non trovata' }, { status: 404 })

    const { nome, tipo, obbligatorio, descrizione, placeholder,
            decimali, referenceTo, colonne, ordine, visibileInPreview } = body
    if (!nome?.trim()) return NextResponse.json({ error: 'nome obbligatorio' }, { status: 400 })
    if (!tipo)         return NextResponse.json({ error: 'tipo obbligatorio' }, { status: 400 })

    const varSlug = toVarSlug(body.slug ?? nome)
    if (!varSlug)  return NextResponse.json({ error: 'slug non valido' }, { status: 400 })

    const exists = await Variabile.findOne({ anagraficaSlug: slug, slug: varSlug })
    if (exists) return NextResponse.json({ error: 'Slug variabile già in uso' }, { status: 409 })

    // Determina ordine massimo se non specificato
    const maxOrdine = await Variabile.findOne({ anagraficaSlug: slug }).sort({ ordine: -1 }).select('ordine').lean()
    const nextOrdine = typeof ordine === 'number' ? ordine : ((maxOrdine as { ordine?: number } | null)?.ordine ?? -1) + 1

    const doc: Record<string, unknown> = {
      slug: varSlug, nome: nome.trim(), tipo, anagraficaSlug: slug,
      obbligatorio:      !!obbligatorio,
      visibileInPreview: !!visibileInPreview,
      ordine:            nextOrdine,
    }
    if (descrizione)  doc.descrizione  = descrizione
    if (placeholder)  doc.placeholder  = placeholder
    if (decimali)     doc.decimali     = true
    if (referenceTo)  doc.referenceTo  = referenceTo
    if (colonne)      doc.colonne      = colonne

    const variabile = await Variabile.create(doc)

    // Aggiunge slug alla lista variabili dell'anagrafica
    await AnagraficaConfig.updateOne({ slug }, { $addToSet: { variabili: varSlug } })

    return NextResponse.json({ data: variabile }, { status: 201 })
  } catch (err) {
    console.error('[POST variabili]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
