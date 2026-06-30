/**
 * GET  /api/documenti?schedaId=xxx   -- lista documenti di una scheda
 * POST /api/documenti                -- upload nuovo documento (multipart/form-data)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isRateLimited, getRequestIP } from '@/lib/rateLimit'
import { getDocumentoModel } from '@/models/Documento'
import { uploadToR2, generateR2Key, R2_BUCKET, MIME_ACCETTATI, MAX_FILE_SIZE, isR2Configured } from '@/lib/r2'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const schedaId = req.nextUrl.searchParams.get('schedaId')
    if (!schedaId) return NextResponse.json({ error: 'schedaId obbligatorio' }, { status: 400 })

    const Documento = await getDocumentoModel()
    const docs = await Documento.find({ schedaId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ data: docs })
  } catch (err) {
    console.error('[GET /api/documenti]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    if (isRateLimited(getRequestIP(req), { limit: 20, window: 60 })) {
      return NextResponse.json({ error: 'Troppe richieste. Riprova tra un minuto.' }, { status: 429 })
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Storage R2 non configurato. Aggiungi le variabili R2_* in .env.local' },
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file          = formData.get('file') as File | null
    const schedaId      = formData.get('schedaId') as string | null
    const anagraficaSlug = formData.get('anagraficaSlug') as string | null
    const tipoDocumento  = (formData.get('tipoDocumento') as string | null) ?? 'documento'
    const titolo         = (formData.get('titolo') as string | null)?.trim() || undefined

    if (!file || !schedaId || !anagraficaSlug) {
      return NextResponse.json({ error: 'Campi obbligatori: file, schedaId, anagraficaSlug' }, { status: 400 })
    }
    if (!Object.keys(MIME_ACCETTATI).includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo file non supportato. Accettati: ${Object.keys(MIME_ACCETTATI).join(', ')}` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File troppo grande. Massimo 10 MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const s3Key  = generateR2Key(anagraficaSlug, schedaId, file.name)

    await uploadToR2(buffer, s3Key, file.type)

    const Documento = await getDocumentoModel()
    const doc = await Documento.create({
      schedaId,
      anagraficaSlug,
      tipo:       tipoDocumento,
      titolo,
      nome:       file.name,
      mimeType:   file.type,
      dimensione: file.size,
      s3Key,
      s3Bucket:   R2_BUCKET,
      caricatoDa: session.user.id,
      attivo:     true,
    })

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/documenti]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
