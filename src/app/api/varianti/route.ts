import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'

/**
 * GET /api/varianti?anagrafica=<slug>
 * Restituisce le varianti configurate per una tipologia di anagrafica.
 * Le varianti sono definite nella config dell'anagrafica (campo `varianti`).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const anagraficaSlug = searchParams.get('anagrafica')

    if (!anagraficaSlug) {
      return NextResponse.json({ error: 'anagrafica e obbligatorio' }, { status: 400 })
    }

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug: anagraficaSlug, attiva: true })
      .select('varianti')
      .lean() as { varianti?: Array<{ id: string; nome: string; descrizione?: string }> } | null

    if (!config) {
      return NextResponse.json({ error: 'Anagrafica non trovata' }, { status: 404 })
    }

    const varianti = (config.varianti ?? []).map(v => ({
      id:          v.id,
      nome:        v.nome,
      descrizione: v.descrizione ?? null,
    }))

    return NextResponse.json({ varianti })
  } catch (err) {
    console.error('[varianti] GET error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
