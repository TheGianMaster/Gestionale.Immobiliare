/**
 * GET    /api/anagrafiche/[slug]/schede/[id] — leggi scheda singola
 * PUT    /api/anagrafiche/[slug]/schede/[id] — aggiorna scheda
 * DELETE /api/anagrafiche/[slug]/schede/[id] — soft delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { getSchedaModel } from '@/models/Scheda'
import mongoose from 'mongoose'

type RouteParams = { params: Promise<{ slug: string; id: string }> }

// ——— GET ———
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { slug, id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()
    if (!config) {
      return NextResponse.json({ error: `Anagrafica "${slug}" non trovata` }, { status: 404 })
    }

    const Scheda = await getSchedaModel(slug)
    const scheda = await Scheda.findOne({ _id: id }).lean()

    if (!scheda) {
      return NextResponse.json({ error: 'Scheda non trovata' }, { status: 404 })
    }

    return NextResponse.json({ data: scheda, config })
  } catch (error) {
    console.error('[GET /api/anagrafiche/[slug]/schede/[id]]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// ——— PUT ———
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { slug, id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()
    if (!config) {
      return NextResponse.json({ error: `Anagrafica "${slug}" non trovata` }, { status: 404 })
    }

    const body = await req.json()
    const { dati, tags } = body

    const userId = new mongoose.Types.ObjectId(session.user.id)
    const Scheda = await getSchedaModel(slug)

    const aggiornamento: Record<string, unknown> = {
      modificataDa: userId,
      $inc: { versione: 1 },
    }
    if (dati !== undefined) aggiornamento.dati = dati
    if (tags !== undefined) aggiornamento.tags = tags

    const scheda = await Scheda.findOneAndUpdate(
      { _id: id },
      aggiornamento,
      { new: true }
    ).lean()

    if (!scheda) {
      return NextResponse.json({ error: 'Scheda non trovata' }, { status: 404 })
    }

    return NextResponse.json({ data: scheda })
  } catch (error) {
    console.error('[PUT /api/anagrafiche/[slug]/schede/[id]]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// ——— DELETE (soft) ———
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { slug, id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()
    if (!config) {
      return NextResponse.json({ error: `Anagrafica "${slug}" non trovata` }, { status: 404 })
    }

    const userId = new mongoose.Types.ObjectId(session.user.id)
    const Scheda = await getSchedaModel(slug)

    const scheda = await Scheda.findOneAndDelete({ _id: id }).lean()

    if (!scheda) {
      return NextResponse.json({ error: 'Scheda non trovata' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/anagrafiche/[slug]/schede/[id]]', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
