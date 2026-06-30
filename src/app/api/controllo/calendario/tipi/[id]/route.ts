/**
 * PUT    /api/controllo/calendario/tipi/[id]
 * DELETE /api/controllo/calendario/tipi/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTipoCalendarioModel } from '@/models/TipoCalendario'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const M = await getTipoCalendarioModel()
    const tipo = await M.findByIdAndUpdate(id, body, { new: true })
    if (!tipo) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
    return NextResponse.json({ data: tipo })
  } catch (err) {
    console.error('[PUT /api/controllo/calendario/tipi/[id]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { id } = await params
    const M = await getTipoCalendarioModel()
    await M.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/controllo/calendario/tipi/[id]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
