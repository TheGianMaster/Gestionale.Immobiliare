/**
 * DELETE /api/documenti/[id]  -- elimina documento (soft-delete + cancella da R2)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDocumentoModel } from '@/models/Documento'
import { deleteFromR2, isR2Configured } from '@/lib/r2'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const Documento = await getDocumentoModel()
    const doc = await Documento.findById(params.id)
    if (!doc) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    // Cancella da R2
    if (isR2Configured()) {
      try { await deleteFromR2(doc.s3Key) } catch (e) {
        console.warn('[DELETE /api/documenti] Errore cancellazione R2:', e)
      }
    }

    // Hard delete da MongoDB
    await doc.deleteOne()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/documenti/[id]]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
