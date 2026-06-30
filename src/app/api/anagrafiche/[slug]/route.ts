/**
 * GET /api/anagrafiche/[slug]
 * Restituisce la configurazione completa di un'anagrafica con variabili popolate.
 * Usata dalla pagina preview, view e edit per conoscere i campi disponibili.
 *
 * Risposta: { data: IAnagraficaConfig & { variabiliPopulate: IVariabile[] } }
 * 404 se slug non trovato o anagrafica non attiva.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { Variabile } from '@/models/Variabile'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { slug } = await params

    await connectDB()

    const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()

    if (!config) {
      return NextResponse.json(
        { error: `Anagrafica "${slug}" non trovata` },
        { status: 404 }
      )
    }

    // Popola le variabili in ordine definito in config.variabili
    const variabiliPopulate = config.variabili.length > 0
      ? await Variabile.find({ anagraficaSlug: slug })
          .sort({ ordine: 1 })
          .lean()
      : []

    return NextResponse.json({
      data: {
        ...config,
        variabiliPopulate,
      },
    })
  } catch (error) {
    console.error('[GET /api/anagrafiche/[slug]]', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
