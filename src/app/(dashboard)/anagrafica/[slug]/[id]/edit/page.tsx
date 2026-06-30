/**
 * src/app/(dashboard)/anagrafica/[slug]/[id]/edit/page.tsx
 * Pagina modifica scheda esistente.
 */

import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { Variabile } from '@/models/Variabile'
import { getSchedaModel } from '@/models/Scheda'
import { SchedaForm } from '@/components/anagrafica/SchedaForm'
import mongoose from 'mongoose'

interface Props {
  params: Promise<{ slug: string; id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `Modifica scheda — ${slug}` }
}

export default async function EditSchedaPage({ params }: Props) {
  const { slug, id } = await params

  const session = await auth()
  if (!session) return null

  if (!mongoose.isValidObjectId(id)) notFound()

  await connectDB()

  const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()
  if (!config) notFound()

  const variabili = await Variabile.find({ anagraficaSlug: slug })
    .sort({ ordine: 1 })
    .lean()

  const Scheda = await getSchedaModel(slug)
  const scheda = await Scheda.findOne({ _id: id, attiva: true }).lean()
  if (!scheda) notFound()

  const s  = JSON.parse(JSON.stringify(scheda))
  const c  = JSON.parse(JSON.stringify(config))
  const vv = JSON.parse(JSON.stringify(variabili))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Modifica scheda</h1>
        <p className="text-sm text-text-muted mt-1">{c.nome}</p>
      </div>
      <SchedaForm
        anagraficaSlug={slug}
        anagraficaNome={c.nome}
        variabili={vv}
        schedaId={id}
        valoriIniziali={s.dati ?? {}}
        tagsIniziali={s.tags ?? []}
      />
    </div>
  )
}
