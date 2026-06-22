import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { SelectOption } from '@/models/SelectOption'

/**
 * GET /api/select-options?variabile=<slug>&anagrafica=<slug>
 * Restituisce le opzioni attive per un campo select di una specifica anagrafica.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const variabileSlug  = searchParams.get('variabile')
    const anagraficaSlug = searchParams.get('anagrafica')

    if (!variabileSlug || !anagraficaSlug) {
      return NextResponse.json({ error: 'variabile e anagrafica sono obbligatori' }, { status: 400 })
    }

    await connectDB()

    const opzioni = await SelectOption.find({
      anagraficaSlug,
      variabileSlug,
      attiva: true,
    })
      .select('valore etichetta colore ordine')
      .sort({ ordine: 1, etichetta: 1 })
      .lean()

    return NextResponse.json({
      opzioni: opzioni.map(o => ({
        valore:    o.valore,
        etichetta: o.etichetta,
        colore:    o.colore ?? null,
      })),
    })
  } catch (err) {
    console.error('[select-options] GET error:', err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
