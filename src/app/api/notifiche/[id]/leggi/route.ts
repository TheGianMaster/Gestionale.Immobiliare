/**
 * PATCH /api/notifiche/[id]/leggi
 * Segna una singola notifica come letta.
 * Verifica che la notifica appartenga all'utente corrente.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Notifica } from '@/models/Notifica'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const notifica = await Notifica.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { letta: true },
      { new: true }
    )

    if (!notifica) {
      return NextResponse.json({ error: 'Notifica non trovata' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/notifiche/[id]/leggi]', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
