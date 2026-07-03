'use client'

/**
 * src/components/bilancio/FondiDisponibiliChart.tsx
 * Card sinistra della vista principale del Bilancio: donut chart "Fondi
 * disponibili" (Canvas 2D nativo, nessuna libreria — vedi §Stack tecnologico
 * del roadmap) + lista portafogli cliccabile sotto. T-120.
 */

import { useEffect, useRef } from 'react'
import { Wallet } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

export interface PortafoglioOverview {
  id: string
  nome: string
  colore: string
  fondiDisponibili: number
  share: number
}

interface Props {
  portafogli: PortafoglioOverview[]
  totaleFondi: number
  loading?: boolean
  onSelectPortafoglio?: (id: string) => void
}

const SIZE = 176
const SPESSORE = 26

export function FondiDisponibiliChart({ portafogli, totaleFondi, loading, onSelectPortafoglio }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, SIZE, SIZE)

    const cx = SIZE / 2
    const cy = SIZE / 2
    const radius = SIZE / 2 - SPESSORE / 2 - 2

    if (portafogli.length === 0 || totaleFondi <= 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = '#E5E7EB' // neutral.200, coerente con palette.ts — canvas non risolve le CSS var
      ctx.lineWidth = SPESSORE
      ctx.stroke()
      return
    }

    let angoloIniziale = -Math.PI / 2
    for (const p of portafogli) {
      const quota = totaleFondi > 0 ? Math.max(0, p.fondiDisponibili) / totaleFondi : 0
      const angoloFinale = angoloIniziale + quota * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, angoloIniziale, angoloFinale)
      ctx.strokeStyle = p.colore
      ctx.lineWidth = SPESSORE
      ctx.lineCap = quota > 0 ? 'butt' : 'round'
      ctx.stroke()
      angoloIniziale = angoloFinale
    }
  }, [portafogli, totaleFondi])

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Fondi disponibili</h2>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="skeleton rounded-full" style={{ width: SIZE, height: SIZE }} />
          <div className="w-full space-y-2">
            <div className="skeleton h-8 w-full rounded-lg" />
            <div className="skeleton h-8 w-full rounded-lg" />
          </div>
        </div>
      ) : portafogli.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-light">
            <Wallet className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm text-text-secondary">Nessun fondo disponibile</p>
        </div>
      ) : (
        <>
          <div className="relative flex items-center justify-center mb-5" style={{ width: SIZE, height: SIZE, margin: '0 auto' }}>
            <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-text-muted">Totale</span>
              <span className="text-base font-semibold text-text-primary leading-tight text-center px-2">
                {formatEuro(totaleFondi)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            {portafogli.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPortafoglio?.(p.id)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg table-row-hover text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.colore }} />
                <span className="flex-1 text-sm text-text-primary truncate">{p.nome}</span>
                <span className="text-sm font-medium text-text-primary">{formatEuro(p.fondiDisponibili)}</span>
                <span className="text-xs text-text-muted w-12 text-right shrink-0">{p.share.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
