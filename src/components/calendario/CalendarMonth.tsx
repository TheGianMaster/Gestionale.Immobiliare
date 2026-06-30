'use client'

/**
 * src/components/calendario/CalendarMonth.tsx
 * Vista mensile del calendario.
 */

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Evento {
  _id: string
  titolo: string
  inizio: string
  fine?: string
  tuttoIlGiorno: boolean
  colore: string
}

interface CalendarMonthProps {
  currentMonth: Date
  eventi: Evento[]
  onDayClick: (date: Date) => void
  onEventClick: (id: string) => void
  onAddClick: (date: Date) => void
}

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MAX_EVENTI_CELLA = 3

export function CalendarMonth({ currentMonth, eventi, onDayClick, onEventClick, onAddClick }: CalendarMonthProps) {
  const [hoverDay, setHoverDay] = useState<string | null>(null)

  const start = startOfMonth(currentMonth)
  const end   = endOfMonth(currentMonth)
  const days  = eachDayOfInterval({ start, end })

  // Padding iniziale: lunedi = 0, ..., domenica = 6
  const firstWeekday = (getDay(start) + 6) % 7 // converti da 0=dom a 0=lun
  const emptyBefore = Array.from({ length: firstWeekday })

  const getEventiPerGiorno = (day: Date) =>
    eventi.filter(e => isSameDay(new Date(e.inizio), day))
      .sort((a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime())

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
      {/* Header giorni settimana */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}>
        {GIORNI_SETTIMANA.map(g => (
          <div key={g} className="py-2 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
            {g}
          </div>
        ))}
      </div>

      {/* Griglia giorni */}
      <div className="grid grid-cols-7" style={{ backgroundColor: 'var(--color-surface)' }}>
        {emptyBefore.map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] border-b border-r"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }} />
        ))}

        {days.map(day => {
          const key       = format(day, 'yyyy-MM-dd')
          const eventiGiorno = getEventiPerGiorno(day)
          const visible   = eventiGiorno.slice(0, MAX_EVENTI_CELLA)
          const overflow  = eventiGiorno.length - MAX_EVENTI_CELLA
          const isHover   = hoverDay === key
          const inThisMonth = isSameMonth(day, currentMonth)
          const today     = isToday(day)

          return (
            <div
              key={key}
              className="min-h-[100px] border-b border-r p-1 transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: isHover ? 'var(--color-surface-hover)' : inThisMonth ? 'var(--color-surface)' : 'var(--color-bg)',
              }}
              onMouseEnter={() => setHoverDay(key)}
              onMouseLeave={() => setHoverDay(null)}
              onClick={() => onAddClick(day)}
            >
              {/* Numero giorno */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                    today ? 'text-white font-bold' : inThisMonth ? 'text-text-primary' : 'text-text-muted opacity-40'
                  )}
                  style={today ? { backgroundColor: 'var(--color-brand)' } : {}}
                >
                  {format(day, 'd')}
                </span>
                {isHover && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onAddClick(day) }}
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-surface-elevated"
                    style={{ color: 'var(--color-brand)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Pillole eventi */}
              <div className="space-y-0.5">
                {visible.map(ev => (
                  <button
                    key={ev._id}
                    type="button"
                    onClick={e => { e.stopPropagation(); onEventClick(ev._id) }}
                    className="w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: ev.colore + '25',
                      color: ev.colore,
                      border: `1px solid ${ev.colore}50`,
                    }}
                    title={ev.titolo}
                  >
                    {!ev.tuttoIlGiorno && (
                      <span className="mr-1 opacity-70">{format(new Date(ev.inizio), 'HH:mm')}</span>
                    )}
                    {ev.titolo}
                  </button>
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onDayClick(day) }}
                    className="w-full text-left text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-surface-hover"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    +{overflow} altri
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
