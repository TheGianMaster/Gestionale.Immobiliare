'use client'

/**
 * src/components/layout/NotificationBell.tsx
 * Campanellina notifiche nell'header.
 *
 * - Badge numerico: rosso, visibile solo se ≥ 1 notifica non letta
 * - Click: apre dropdown con ultime 5 notifiche + link "Vedi tutte"
 * - Polling ogni 60s per aggiornare il counter
 * - Segna come letta al click sulla singola notifica
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

// ——— TIPI ———
interface NotificaPreview {
  _id: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  titolo: string
  messaggio?: string
  letta: boolean
  createdAt: string
}

// ——— ICONE PER TIPO ———
const ICONE_TIPO = {
  info:    { Icona: Info,          colore: 'var(--color-info)' },
  success: { Icona: CheckCircle,   colore: 'var(--color-success)' },
  warning: { Icona: AlertTriangle, colore: 'var(--color-warning)' },
  error:   { Icona: XCircle,       colore: 'var(--color-error)' },
}

const POLLING_MS = 60_000 // 60 secondi

export function NotificationBell() {
  const [aperto, setAperto] = useState(false)
  const [notifiche, setNotifiche] = useState<NotificaPreview[]>([])
  const [nonLette, setNonLette] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // ——— FETCH COUNTER ———
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifiche/count')
      if (!res.ok) return
      const { count } = await res.json()
      setNonLette(count ?? 0)
    } catch {
      // silenzioso
    }
  }, [])

  // ——— FETCH NOTIFICHE (al click apertura) ———
  const fetchNotifiche = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifiche?limit=5')
      if (!res.ok) return
      const data = await res.json()
      setNotifiche(data.notifiche ?? [])
    } catch {
      // silenzioso
    } finally {
      setLoading(false)
    }
  }, [])

  // Polling 60s
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, POLLING_MS)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Aggiorna notifiche quando si apre il dropdown
  useEffect(() => {
    if (aperto) fetchNotifiche()
  }, [aperto, fetchNotifiche])

  // Chiudi su click fuori
  useEffect(() => {
    function onClickFuori(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAperto(false)
      }
    }
    if (aperto) document.addEventListener('mousedown', onClickFuori)
    return () => document.removeEventListener('mousedown', onClickFuori)
  }, [aperto])

  // Chiudi su Escape
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAperto(false)
    }
    if (aperto) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [aperto])

  // ——— SEGNA COME LETTA ———
  async function segnaLetta(id: string) {
    try {
      await fetch(`/api/notifiche/${id}/leggi`, { method: 'PATCH' })
      setNotifiche((prev) =>
        prev.map((n) => (n._id === id ? { ...n, letta: true } : n))
      )
      setNonLette((prev) => Math.max(0, prev - 1))
    } catch {
      // silenzioso
    }
  }

  // ——— SEGNA TUTTE COME LETTE ———
  async function segnaLetteTutte() {
    try {
      await fetch('/api/notifiche/leggi-tutte', { method: 'PATCH' })
      setNotifiche((prev) => prev.map((n) => ({ ...n, letta: true })))
      setNonLette(0)
    } catch {
      // silenzioso
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* ——— TRIGGER ——— */}
      <button
        onClick={() => setAperto((v) => !v)}
        className={cn(
          'btn-icon relative',
          aperto && 'bg-surface-hover'
        )}
        aria-label={`Notifiche${nonLette > 0 ? ` — ${nonLette} non lette` : ''}`}
        aria-expanded={aperto}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {/* Badge */}
        {nonLette > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
            style={{
              backgroundColor: 'var(--color-error)',
              color: '#fff',
            }}
            aria-hidden="true"
          >
            {nonLette > 99 ? '99+' : nonLette}
          </span>
        )}
      </button>

      {/* ——— DROPDOWN ——— */}
      {aperto && (
        <div
          className="absolute right-0 top-full mt-1 w-80 rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
          role="dialog"
          aria-label="Notifiche recenti"
        >
          {/* Header dropdown */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h3 className="text-sm font-semibold text-text-primary">
              Notifiche
              {nonLette > 0 && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--color-error)',
                    color: '#fff',
                  }}
                >
                  {nonLette}
                </span>
              )}
            </h3>
            {nonLette > 0 && (
              <button
                onClick={segnaLetteTutte}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-brand transition-all duration-[var(--duration-fast)] hover:scale-105"
                title="Segna tutte come lette"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Segna tutte</span>
              </button>
            )}
          </div>

          {/* Lista notifiche */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--color-brand)' }}
                />
              </div>
            ) : notifiche.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-muted">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p>Nessuna notifica</p>
              </div>
            ) : (
              notifiche.map((n) => {
                const { Icona, colore } = ICONE_TIPO[n.tipo] ?? ICONE_TIPO.info
                return (
                  <button
                    key={n._id}
                    onClick={() => segnaLetta(n._id)}
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors',
                      'hover:bg-surface-hover border-b last:border-b-0',
                      !n.letta && 'border-l-2'
                    )}
                    style={{
                      borderColor: 'var(--color-border)',
                      borderLeftColor: !n.letta ? 'var(--color-brand)' : undefined,
                      backgroundColor: !n.letta
                        ? 'var(--color-brand-light)'
                        : undefined,
                    }}
                  >
                    <Icona
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: colore }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm truncate',
                          !n.letta
                            ? 'font-semibold text-text-primary'
                            : 'text-text-secondary'
                        )}
                      >
                        {n.titolo}
                      </p>
                      {n.messaggio && (
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {n.messaggio}
                        </p>
                      )}
                      <p className="text-[10px] text-text-muted mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div
            className="border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Link
              href="/notifiche"
              onClick={() => setAperto(false)}
              className="flex items-center justify-center py-2.5 text-xs font-medium transition-all duration-[var(--duration-fast)] hover:bg-surface-hover hover:scale-[1.02]"
              style={{ color: 'var(--color-brand)' }}
            >
              Vedi tutte le notifiche
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
