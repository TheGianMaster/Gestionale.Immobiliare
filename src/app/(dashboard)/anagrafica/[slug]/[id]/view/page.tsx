/**
 * src/app/(dashboard)/anagrafica/[slug]/[id]/view/page.tsx
 * Pagina visualizzazione read-only scheda.
 * Carica scheda + config + variabili dal server, poi SchedaView (client) gestisce UI e tab.
 */

import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { Variabile } from '@/models/Variabile'
import { getSchedaModel } from '@/models/Scheda'
import { SchedaView } from '@/components/anagrafica/SchedaView'
import mongoose from 'mongoose'

interface Props {
  params: Promise<{ slug: string; id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `Vista scheda — ${slug} — Gestionale` }
}

export default async function ViewSchedaPage({ params }: Props) {
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

  // Serializzazione sicura per il passaggio a Client Component
  return (
    <SchedaView
      slug={slug}
      scheda={JSON.parse(JSON.stringify(scheda))}
      config={JSON.parse(JSON.stringify(config))}
      variabili={JSON.parse(JSON.stringify(variabili))}
    />
  )
}
