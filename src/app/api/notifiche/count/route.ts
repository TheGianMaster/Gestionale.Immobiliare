/**
 * GET /api/notifiche/count
 * Restituisce il numero di notifiche non lette dell'utente corrente.
 * Usato dalla NotificationBell per il badge (polling 60s).
 *
 * Risposta: { count: number }
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Notifica } from '@/models/Notifica'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await connectDB()

    const count = await Notifica.countDocuments({
      userId: session.user.id,
      letta: false,
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('[GET /api/notifiche/count]', error)
    return NextResponse.json({ count: 0 })
  }
}
