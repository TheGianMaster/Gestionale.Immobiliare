/**
 * src/app/(dashboard)/anagrafica/[slug]/page.tsx
 * Pagina lista schede per un'anagrafica.
 * Carica la config dal server, poi il PreviewTable (client) gestisce il fetch delle schede.
 */

import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { PreviewTable } from '@/components/anagrafica/PreviewTable'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug} — Gestionale` }
}

export default async function AnagraficaPage({ params }: Props) {
  const { slug } = await params

  // Auth già gestita dal middleware — verifichiamo comunque
  const session = await auth()
  if (!session) return null

  await connectDB()

  const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()

  if (!config) {
    notFound()
  }

  return (
    <PreviewTable
      slug={slug}
      config={JSON.parse(JSON.stringify(config))}
    />
  )
}
