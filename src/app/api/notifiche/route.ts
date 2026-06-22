/**
 * GET /api/notifiche
 * Lista notifiche dell'utente corrente.
 * Query params: ?limit=5 | ?letta=false
 *
 * Risposta: { notifiche: INotifica[] }
 *
 * TODO T-080: implementazione completa con paginazione e filtri avanzati.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Notifica } from '@/models/Notifica'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const lettaParam = searchParams.get('letta')

    const filtro: Record<string, unknown> = {
      userId: session.user.id,
    }
    if (lettaParam !== null) {
      filtro.letta = lettaParam === 'true'
    }

    const notifiche = await Notifica.find(filtro)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .lean()

    return NextResponse.json({ notifiche })
  } catch (error) {
    console.error('[GET /api/notifiche]', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
