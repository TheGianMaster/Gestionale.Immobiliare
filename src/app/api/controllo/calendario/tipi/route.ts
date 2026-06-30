/**
 * GET  /api/controllo/calendario/tipi  -- lista tipi appuntamento
 * POST /api/controllo/calendario/tipi  -- crea tipo
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTipoCalendarioModel } from '@/models/TipoCalendario'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const M = await getTipoCalendarioModel()
    const tipi = await M.find({}).sort({ ordine: 1, nome: 1 }).lean()
    return NextResponse.json({ data: tipi })
  } catch (err) {
    console.error('[GET /api/controllo/calendario/tipi]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const body = await req.json()
    if (!body.nome?.trim()) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    const M = await getTipoCalendarioModel()
    const tipo = await M.create({ nome: body.nome.trim(), colore: body.colore ?? '#6366F1', ordine: body.ordine ?? 0 })
    return NextResponse.json({ data: tipo }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/controllo/calendario/tipi]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
