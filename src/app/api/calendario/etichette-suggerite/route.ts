/**
 * GET /api/calendario/etichette-suggerite
 * Le 10 etichette usate piu spesso dall utente corrente.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getEventoModel } from '@/models/Evento'
import mongoose from 'mongoose'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const Evento = await getEventoModel()
    const userId = new mongoose.Types.ObjectId(session.user.id)

    const risultati = await Evento.aggregate([
      { $match: { creatoDa: userId, attivo: true } },
      { $unwind: '$etichette' },
      { $group: { _id: '$etichette', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    return NextResponse.json({ data: risultati.map((r: { _id: string }) => r._id) })
  } catch (err) {
    console.error('[GET /api/calendario/etichette-suggerite]', err)
    return NextResponse.json({ data: [] })
  }
}
