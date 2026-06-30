/**
 * PUT    /api/calendario/[id]  -- aggiorna evento
 * DELETE /api/calendario/[id]  -- elimina evento (hard delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getEventoModel } from '@/models/Evento'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const Evento = await getEventoModel()
    const evento = await Evento.findById(id)

    if (!evento) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }
    if (String(evento.creatoDa) !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { titolo, tipo, descrizione, inizio, oraInizio, fine, oraFine, tuttoIlGiorno, colore, etichette, partecipanti } = body

    if (titolo !== undefined) evento.titolo = titolo.trim()
    if (tipo !== undefined) evento.tipo = tipo
    if (descrizione !== undefined) evento.descrizione = descrizione?.trim()
    if (colore !== undefined) evento.colore = colore
    if (etichette !== undefined) evento.etichette = etichette
    if (partecipanti !== undefined) evento.partecipanti = partecipanti
    if (tuttoIlGiorno !== undefined) evento.tuttoIlGiorno = tuttoIlGiorno

    if (inizio) {
      evento.inizio = evento.tuttoIlGiorno
        ? new Date(`${inizio}T00:00:00`)
        : new Date(`${inizio}T${oraInizio ?? '00:00'}:00`)
    }
    if (fine) {
      evento.fine = evento.tuttoIlGiorno
        ? new Date(`${fine}T23:59:59`)
        : new Date(`${fine}T${oraFine ?? oraInizio ?? '00:00'}:00`)
    }

    await evento.save()
    return NextResponse.json({ data: evento })
  } catch (err) {
    console.error('[PUT /api/calendario/[id]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { id } = await params
    const Evento = await getEventoModel()
    const evento = await Evento.findById(id)
    if (!evento) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }
    if (String(evento.creatoDa) !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    await evento.deleteOne()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/calendario/[id]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
