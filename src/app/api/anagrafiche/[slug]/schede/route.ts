/**
 * GET  /api/anagrafiche/[slug]/schede — lista con paginazione + ricerca
 * POST /api/anagrafiche/[slug]/schede — crea nuova scheda
 * DELETE /api/anagrafiche/[slug]/schede — elimina bulk per ids
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { getSchedaModel } from '@/models/Scheda'
import { ricalcolaImpattoScheda } from '@/lib/bilancio/ricalcolaFondiPortafoglio'
import mongoose from 'mongoose'

// ——— DELETE (bulk) ———
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { slug } = await params
    const body = await req.json()
    const { ids } = body as { ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids deve essere un array non vuoto' }, { status: 400 })
    }

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()
    if (!config) {
      return NextResponse.json({ error: 'Anagrafica non trovata' }, { status: 404 })
    }

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id))
    const Scheda = await getSchedaModel(slug)

    // Bilancio (T-114): cattura i dati PRIMA di eliminare, per poter ricalcolare
    // i portafogli/debiti coinvolti se questa e' un'anagrafica Ricavi/Spese/Trasferimenti.
    const daEliminare = await Scheda.find({ _id: { $in: objectIds } }).lean()

    const result = await Scheda.deleteMany({ _id: { $in: objectIds } })

    for (const doc of daEliminare) {
      await ricalcolaImpattoScheda(slug, doc.dati as Record<string, unknown>, null)
    }

    return NextResponse.json({ deleted: result.deletedCount })
  } catch (error) {
    console.error('[DELETE /api/anagrafiche/[slug]/schede]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// ——— GET ———
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = req.nextUrl

    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10))
    const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const q        = searchParams.get('q')?.trim() ?? ''
    const sortBy   = searchParams.get('sortBy')  ?? 'createdAt'
    const sortDir  = searchParams.get('sortDir') === 'asc' ? 1 : -1

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug, attiva: true })
      .select('previewColumns')
      .lean()

    if (!config) {
      return NextResponse.json({ error: 'Anagrafica non trovata' }, { status: 404 })
    }

    const Scheda = await getSchedaModel(slug)

    const filtro: Record<string, unknown> = {}

    if (q && config.previewColumns.length > 0) {
      filtro.$or = config.previewColumns.map((col) => ({
        ['dati.' + col]: { $regex: q, $options: 'i' },
      }))
    }

    const skip = (page - 1) * limit

    const [schede, total] = await Promise.all([
      Scheda.find(filtro)
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      Scheda.countDocuments(filtro),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: schede,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('[GET /api/anagrafiche/[slug]/schede]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// ——— POST ———
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { slug } = await params

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()
    if (!config) {
      return NextResponse.json({ error: 'Anagrafica non trovata' }, { status: 404 })
    }

    const body = await req.json()
    const { dati = {}, tags = [] } = body

    const userId = new mongoose.Types.ObjectId(session.user.id)
    const Scheda = await getSchedaModel(slug)

    const scheda = await Scheda.create({
      anagraficaSlug: slug,
      dati,
      tags,
      creataDa:     userId,
      modificataDa: userId,
      versione:     1,
    })

    // Bilancio (T-114): se questa scheda referenzia un Portafoglio (Ricavi/Spese/
    // Trasferimenti), ricalcola i saldi coinvolti. No-op per le altre anagrafiche.
    await ricalcolaImpattoScheda(slug, null, scheda.dati as Record<string, unknown>)

    return NextResponse.json({ data: scheda }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/anagrafiche/[slug]/schede]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
