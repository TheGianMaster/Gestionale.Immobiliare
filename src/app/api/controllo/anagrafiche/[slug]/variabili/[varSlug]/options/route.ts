/**
 * GET    .../options          — lista opzioni select
 * POST   .../options          — aggiunge opzione
 * DELETE .../options/[optId]  — elimina opzione (gestita in [optId]/route.ts)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { SelectOption } from '@/models/SelectOption'

type Params = { params: Promise<{ slug: string; varSlug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug, varSlug } = await params
    await connectDB()
    const opts = await SelectOption.find({ anagraficaSlug: slug, variabileSlug: varSlug, attiva: true })
      .sort({ ordine: 1 }).lean()
    return NextResponse.json({ data: opts })
  } catch (err) {
    console.error('[GET options]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const { slug, varSlug } = await params
    const body = await req.json()
    await connectDB()

    const { valore, etichetta } = body
    if (!valore?.trim()) return NextResponse.json({ error: 'valore obbligatorio' }, { status: 400 })

    const maxOrd = await SelectOption.findOne({ anagraficaSlug: slug, variabileSlug: varSlug })
      .sort({ ordine: -1 }).select('ordine').lean()
    const ordine = ((maxOrd as { ordine?: number } | null)?.ordine ?? -1) + 1

    const opt = await SelectOption.create({
      anagraficaSlug: slug, variabileSlug: varSlug,
      valore:   valore.trim(),
      etichetta: (etichetta ?? valore).trim(),
      ordine, attiva: true,
    })
    return NextResponse.json({ data: opt }, { status: 201 })
  } catch (err) {
    console.error('[POST options]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
