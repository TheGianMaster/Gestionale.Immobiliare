/**
 * GET /api/anagrafiche
 * Restituisce la lista delle AnagraficaConfig attive, ordinate per `ordine`.
 * Usata dalla Sidebar per costruire il menu navigazione dinamico.
 *
 * Risposta: { anagrafiche: AnagraficaNav[] }
 * Protetta da sessione NextAuth.
 *
 * TODO T-040: espandere con POST (creazione) e filtri avanzati.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'

export async function GET() {
  try {
    // ——— AUTH ———
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // ——— DB ———
    await connectDB()

    const anagrafiche = await AnagraficaConfig.find({ attiva: true })
      .select('slug nome icona colore ordine')
      .sort({ ordine: 1, nome: 1 })
      .lean()

    return NextResponse.json({ anagrafiche })
  } catch (error) {
    console.error('[GET /api/anagrafiche]', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
