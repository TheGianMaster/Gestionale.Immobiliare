/**
 * GET  /api/calendario        -- lista eventi per mese o giorno
 * POST /api/calendario        -- crea nuovo evento
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isRateLimited, getRequestIP } from '@/lib/rateLimit'
import { getEventoModel } from '@/models/Evento'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const meseParam  = searchParams.get('mese')   // "YYYY-MM"
    const giornoParam = searchParams.get('giorno') // "YYYY-MM-DD"
    const q          = searchParams.get('q')

    let dateInizio: Date, dateFine: Date
    if (giornoParam) {
      const d = new Date(giornoParam)
      dateInizio = startOfDay(d)
      dateFine   = endOfDay(d)
    } else {
      const ref = meseParam ? new Date(`${meseParam}-01`) : new Date()
      dateInizio = startOfMonth(ref)
      dateFine   = endOfMonth(ref)
    }

    const userId = new mongoose.Types.ObjectId(session.user.id)
    const Evento = await getEventoModel()

    const filtro: Record<string, unknown> = {
      inizio: { $gte: dateInizio, $lte: dateFine },
      $or: [{ creatoDa: userId }, { partecipanti: userId }],
    }

    if (q) {
      filtro.$or = [
        { titolo: { $regex: q, $options: 'i' } },
        { descrizione: { $regex: q, $options: 'i' } },
      ]
    }

    const eventi = await Evento.find(filtro).sort({ inizio: 1 }).lean()
    return NextResponse.json({ data: eventi })
  } catch (err) {
    console.error('[GET /api/calendario]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    if (isRateLimited(getRequestIP(req), { limit: 60, window: 60 })) {
      return NextResponse.json({ error: 'Troppe richieste.' }, { status: 429 })
    }

    const body = await req.json()
    const { titolo, tipo, descrizione, inizio, oraInizio, fine, oraFine, tuttoIlGiorno, colore, etichette, schedaId, anagraficaSlug, partecipanti } = body

    if (!titolo?.trim()) {
      return NextResponse.json({ error: 'Titolo obbligatorio' }, { status: 400 })
    }
    if (!inizio) {
      return NextResponse.json({ error: 'Data inizio obbligatoria' }, { status: 400 })
    }

    const inizioDate = tuttoIlGiorno
      ? new Date(`${inizio}T00:00:00`)
      : new Date(`${inizio}T${oraInizio ?? '00:00'}:00`)

    const fineDate = fine
      ? (tuttoIlGiorno ? new Date(`${fine}T23:59:59`) : new Date(`${fine}T${oraFine ?? oraInizio ?? '00:00'}:00`))
      : undefined

    const Evento = await getEventoModel()
    const evento = await Evento.create({
      titolo: titolo.trim(),
      tipo: tipo ?? 'altro',
      descrizione: descrizione?.trim(),
      inizio: inizioDate,
      fine: fineDate,
      tuttoIlGiorno: tuttoIlGiorno ?? false,
      colore: colore ?? '#6366F1',
      etichette: etichette ?? [],
      schedaId: schedaId || undefined,
      anagraficaSlug: anagraficaSlug || undefined,
      creatoDa: session.user.id,
      partecipanti: partecipanti ?? [],
    })

    return NextResponse.json({ data: evento }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/calendario]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
