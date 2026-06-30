'use client'

/**
 * src/app/(dashboard)/notifiche/page.tsx
 * Lista completa notifiche con filtri e paginazione.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, Info, CheckCircle, AlertTriangle, XCircle,
  CheckCheck, Loader2, Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface INotifica {
  _id: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  azione: string
  titolo: string
  messaggio?: string
  letta: boolean
  createdAt: string
}

const ICONE = {
  info:    { Icona: Info,          colore: 'var(--color-info)' },
  success: { Icona: CheckCircle,   colore: 'var(--color-success)' },
  warning: { Icona: AlertTriangle, colore: 'var(--color-warning)' },
  error:   { Icona: XCircle,       colore: 'var(--color-error)' },
}

type Filtro = 'tutte' | 'non_lette'

export default function NotifichePage() {
  const router = useRouter()
  const [notifiche, setNotifiche] = useState<INotifica[]>([])
  const [loading, setLoading]     = useState(true)
  const [filtro, setFiltro]       = useState<Filtro>('tutte')
  const [segnandoTutte, setSegnandoTutte] = useState(false)

  const fetch_notifiche = useCallback(async () => {
    setLoading(true)
    try {
      const params = filtro === 'non_lette' ? '?letta=false&limit=50' : '?limit=50'
      const res = await fetch(`/api/notifiche${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setNotifiche(json.notifiche ?? [])
    } catch {
      setNotifiche([])
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { fetch_notifiche() }, [fetch_notifiche])

  const segnaLetta = async (id: string) => {
    await fetch(`/api/notifiche/${id}/leggi`, { method: 'PATCH' })
    setNotifiche(prev => prev.map(n => n._id === id ? { ...n, letta: true } : n))
  }

  const segnaTutte = async () => {
    setSegnandoTutte(true)
    try {
      await fetch('/api/notifiche/leggi-tutte', { method: 'PATCH' })
      setNotifiche(prev => prev.map(n => ({ ...n, letta: true })))
    } finally {
      setSegnandoTutte(false)
    }
  }

  const nonLette = notifiche.filter(n => !n.letta).length

  return (
    <div className="p-6 max-w-2xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
            Notifiche
          </h1>
          {nonLette > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {nonLette} non {nonLette === 1 ? 'letta' : 'lette'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {nonLette > 0 && (
            <button
              onClick={segnaTutte}
              disabled={segnandoTutte}
              className="btn-ghost text-xs"
            >
              {segnandoTutte
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCheck className="w-3.5 h-3.5" />
              }
              Segna tutte come lette
            </button>
          )}
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {([['tutte', 'Tutte'], ['non_lette', 'Non lette']] as [Filtro, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              filtro === val ? '' : 'text-text-secondary hover:text-text-primary'
            )}
            style={{
              borderBottomColor: filtro === val ? 'var(--color-brand)' : 'transparent',
              color:             filtro === val ? 'var(--color-brand)' : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand)' }} />
        </div>
      ) : notifiche.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm font-medium text-text-secondary">
            {filtro === 'non_lette' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          {notifiche.map((n, i) => {
            const { Icona, colore } = ICONE[n.tipo] ?? ICONE.info
            return (
              <button
                key={n._id}
                type="button"
                onClick={async () => {
                  if (!n.letta) await segnaLetta(n._id)
                }}
                className={cn(
                  'w-full text-left flex items-start gap-4 px-4 py-4 transition-colors hover:bg-surface-hover',
                  i !== 0 && 'border-t'
                )}
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: n.letta ? 'var(--color-surface)' : 'var(--color-surface-elevated)',
                }}
              >
                {/* Punto non letta */}
                <span
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0 transition-opacity"
                  style={{
                    backgroundColor: colore,
                    opacity: n.letta ? 0 : 1,
                  }}
                />

                {/* Icona tipo */}
                <Icona className="w-4 h-4 mt-0.5 shrink-0" style={{ color: colore }} />

                {/* Contenuto */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm leading-snug',
                    n.letta ? 'text-text-secondary' : 'text-text-primary font-medium'
                  )}>
                    {n.titolo}
                  </p>
                  {n.messaggio && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.messaggio}</p>
                  )}
                  <p className="text-[10px] text-text-muted mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
