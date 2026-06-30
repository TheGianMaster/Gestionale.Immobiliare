/**
 * DELETE /api/controllo/anagrafiche/[slug]/variabili/[varSlug]/options/[optId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { SelectOption } from '@/models/SelectOption'

type Params = { params: Promise<{ slug: string; varSlug: string; optId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { optId } = await params
    await connectDB()
    const opt = await SelectOption.findByIdAndDelete(optId)
    if (!opt) return NextResponse.json({ error: 'Opzione non trovata' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE option]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
