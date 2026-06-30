/**
 * GET /api/documenti/[id]/url  -- genera URL presigned per preview/download
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDocumentoModel } from '@/models/Documento'
import { getPresignedUrl, isR2Configured } from '@/lib/r2'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    if (!isR2Configured()) {
      return NextResponse.json({ error: 'R2 non configurato' }, { status: 503 })
    }

    const Documento = await getDocumentoModel()
    const doc = await Documento.findById(params.id)
    if (!doc) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    const url = await getPresignedUrl(doc.s3Key, 3600)
    return NextResponse.json({ url, expiresIn: 3600 })
  } catch (err) {
    console.error('[GET /api/documenti/[id]/url]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
