/**
 * GET  /api/anagrafiche/[slug]/schede — lista con paginazione + ricerca
 * POST /api/anagrafiche/[slug]/schede — crea nuova scheda
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { getSchedaModel } from '@/models/Scheda'
import mongoose from 'mongoose'

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

    // Verifica che l'anagrafica esista
    const config = await AnagraficaConfig.findOne({ slug, attiva: true })
      .select('previewColumns')
      .lean()

    if (!config) {
      return NextResponse.json({ error: `Anagrafica "${slug}" non trovata` }, { status: 404 })
    }

    const Scheda = await getSchedaModel(slug)

    // ——— FILTRO BASE ———
    const filtro: Record<string, unknown> = {}

    // ——— RICERCA FULL-TEXT SUI PREVIEW COLUMNS ———
    if (q && config.previewColumns.length > 0) {
      filtro.$or = config.previewColumns.map((col) => ({
        [`dati.${col}`]: { $regex: q, $options: 'i' },
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
      return NextResponse.json({ error: `Anagrafica "${slug}" non trovata` }, { status: 404 })
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

    return NextResponse.json({ data: scheda }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/anagrafiche/[slug]/schede]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
