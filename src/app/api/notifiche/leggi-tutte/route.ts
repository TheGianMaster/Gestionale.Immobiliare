/**
 * PATCH /api/notifiche/leggi-tutte
 * Segna tutte le notifiche non lette dell'utente come lette.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Notifica } from '@/models/Notifica'

export async function PATCH() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await connectDB()

    await Notifica.updateMany(
      { userId: session.user.id, letta: false },
      { letta: true }
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/notifiche/leggi-tutte]', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
