/**
 * GET /api/documenti/[id]/url           -- URL presigned per visualizzazione inline (occhio)
 * GET /api/documenti/[id]/url?mode=download -- URL presigned per download forzato
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDocumentoModel } from '@/models/Documento'
import { getPresignedUrl, getPresignedDownloadUrl, isR2Configured } from '@/lib/r2'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    if (!isR2Configured()) {
      return NextResponse.json({ error: 'R2 non configurato' }, { status: 503 })
    }

    const { id } = await params
    const Documento = await getDocumentoModel()
    const doc = await Documento.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    const mode = req.nextUrl.searchParams.get('mode')

    // Download forzato: Content-Disposition: attachment
    if (mode === 'download') {
      const filename = doc.titolo || doc.nome
      const url = await getPresignedDownloadUrl(doc.s3Key, filename, 3600)
      return NextResponse.json({ url, expiresIn: 3600 })
    }

    // Preview inline: Content-Disposition: inline
    const url = await getPresignedUrl(doc.s3Key, 3600)
    return NextResponse.json({ url, expiresIn: 3600 })
  } catch (err) {
    console.error('[GET /api/documenti/[id]/url]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
