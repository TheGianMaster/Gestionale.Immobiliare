/**
 * src/app/(dashboard)/anagrafica/[slug]/new/page.tsx
 * Pagina creazione nuova scheda.
 */

import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { Variabile } from '@/models/Variabile'
import { SchedaForm } from '@/components/anagrafica/SchedaForm'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `Nuova scheda — ${slug}` }
}

export default async function NewSchedaPage({ params }: Props) {
  const { slug } = await params

  const session = await auth()
  if (!session) return null

  await connectDB()

  const config = await AnagraficaConfig.findOne({ slug, attiva: true }).lean()
  if (!config) notFound()

  const variabili = await Variabile.find({ anagraficaSlug: slug })
    .sort({ ordine: 1 })
    .lean()

  const c  = JSON.parse(JSON.stringify(config))
  const vv = JSON.parse(JSON.stringify(variabili))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Nuova scheda</h1>
        <p className="text-sm text-text-muted mt-1">{c.nome}</p>
      </div>
      <SchedaForm
        anagraficaSlug={slug}
        anagraficaNome={c.nome}
        variabili={vv}
      />
    </div>
  )
}
