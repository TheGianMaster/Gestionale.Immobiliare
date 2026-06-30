import { AnagraficaEditor } from '@/components/controllo/AnagraficaEditor'

interface Props { params: Promise<{ slug: string }> }

export default async function EditAnagraficaPage({ params }: Props) {
  const { slug } = await params
  return <AnagraficaEditor mode="edit" slug={slug} />
}
