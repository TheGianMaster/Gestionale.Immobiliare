'use client'

/**
 * src/app/(dashboard)/bilancio/overview/page.tsx
 * Route: /bilancio/overview
 *
 * Wiring "minimo" della vista principale (Fascia 3, T-120→T-124): mostra i
 * componenti costruiti in questa fascia con dati reali da GET
 * /api/bilancio/overview e GET /api/bilancio/affittuari.
 *
 * Non è ancora l'assemblaggio finale previsto da T-127 (Fascia 5): manca lo
 * switch di stato verso le viste di dettaglio Portafoglio/Debito (T-125/T-126,
 * Fascia 4, non ancora costruite), quindi le righe cliccabili di portafogli e
 * debiti non hanno ancora un `onSelect` collegato. Questo file verrà
 * riscritto in T-127 per includere quello switch.
 */

import { useCallback, useEffect, useState } from 'react'
import { BarChart2, ArrowLeftRight } from 'lucide-react'
import { FondiDisponibiliChart, type PortafoglioOverview } from '@/components/bilancio/FondiDisponibiliChart'
import { DebitiInCorsoCard, type DebitoOverview } from '@/components/bilancio/DebitiInCorsoCard'
import { UltimiMovimentiList, type MovimentoOverview } from '@/components/bilancio/UltimiMovimentiList'
import { SpostaFondiModal } from '@/components/bilancio/SpostaFondiModal'
import { AffittuariList, type AffittuarioOverview } from '@/components/bilancio/AffittuariList'

interface OverviewData {
  portafogli: PortafoglioOverview[]
  totaleFondi: number
  debiti: DebitoOverview[]
  ultimiMovimenti: MovimentoOverview[]
}

export default function BilancioOverviewPage() {
  const [dati, setDati] = useState<OverviewData | null>(null)
  const [affittuari, setAffittuari] = useState<AffittuarioOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAffittuari, setLoadingAffittuari] = useState(true)
  const [modaleAperta, setModaleAperta] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const caricaOverview = useCallback(async () => {
    setLoading(true)
    setErrore(null)
    try {
      const res = await fetch('/api/bilancio/overview')
      if (!res.ok) throw new Error('Errore nel caricamento dei dati del bilancio')
      const data = await res.json()
      setDati(data)
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore nel caricamento dei dati del bilancio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    caricaOverview()
  }, [caricaOverview])

  useEffect(() => {
    setLoadingAffittuari(true)
    fetch('/api/bilancio/affittuari')
      .then(r => r.json())
      .then(d => setAffittuari(Array.isArray(d.affittuari) ? d.affittuari : []))
      .catch(() => {})
      .finally(() => setLoadingAffittuari(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-brand-light">
            <BarChart2 className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Bilancio</h1>
            <p className="text-xs text-text-muted">Overview</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModaleAperta(true)}
          disabled={!dati || dati.portafogli.length === 0}
          className="btn-primary"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Sposta fondi
        </button>
      </div>

      {errore && (
        <div className="rounded-xl p-3 text-sm bg-error-light text-error">{errore}</div>
      )}

      {/* Griglia principale: Fondi disponibili | Debiti in corso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FondiDisponibiliChart
          portafogli={dati?.portafogli ?? []}
          totaleFondi={dati?.totaleFondi ?? 0}
          loading={loading}
        />
        <DebitiInCorsoCard
          debiti={dati?.debiti ?? []}
          loading={loading}
        />
      </div>

      {/* Ultimi movimenti — sotto le due card, come richiesto dal roadmap */}
      <UltimiMovimentiList movimenti={dati?.ultimiMovimenti ?? []} loading={loading} />

      {/* Affittuari attivi — in coda */}
      <AffittuariList affittuari={affittuari} loading={loadingAffittuari} />

      {modaleAperta && dati && (
        <SpostaFondiModal
          portafogli={dati.portafogli.map(p => ({ id: p.id, nome: p.nome, fondiDisponibili: p.fondiDisponibili }))}
          onClose={() => setModaleAperta(false)}
          onSuccess={() => { setModaleAperta(false); caricaOverview() }}
        />
      )}
    </div>
  )
}
