'use client'

/**
 * src/components/calendario/CalendarDay.tsx
 * Vista giornaliera del calendario.
 */

import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { Plus } from 'lucide-react'

interface Evento {
  _id: string
  titolo: string
  inizio: string
  fine?: string
  tuttoIlGiorno: boolean
  colore: string
}

interface CalendarDayProps {
  currentDate: Date
  eventi: Evento[]
  onEventClick: (id: string) => void
  onAddClick: (date: Date) => void
}

const SLOT_HEIGHT = 48  // px per slot 30 min
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getPosition(inizio: Date, fine?: Date) {
  const startH = inizio.getHours()
  const startM = inizio.getMinutes()
  const endH   = fine ? fine.getHours() : startH + 1
  const endM   = fine ? fine.getMinutes() : 0

  const top    = (startH * 2 + Math.floor(startM / 30)) * SLOT_HEIGHT
  const totalM = (endH * 60 + endM) - (startH * 60 + startM)
  const height = Math.max(1, totalM / 30) * SLOT_HEIGHT
  return { top, height }
}

export function CalendarDay({ currentDate, eventi, onEventClick, onAddClick }: CalendarDayProps) {
  const eventiGiorno = eventi.filter(e => isSameDay(new Date(e.inizio), currentDate))
  const tuttoGiorno  = eventiGiorno.filter(e => e.tuttoIlGiorno)
  const orari        = eventiGiorno.filter(e => !e.tuttoIlGiorno)

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* Tutto il giorno */}
      {tuttoGiorno.length > 0 && (
        <div className="flex gap-2 px-4 py-2 border-b"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}>
          <span className="text-xs text-text-muted w-12 shrink-0 pt-0.5">Tutto il giorno</span>
          <div className="flex flex-wrap gap-1.5">
            {tuttoGiorno.map(ev => (
              <button
                key={ev._id}
                type="button"
                onClick={() => onEventClick(ev._id)}
                className="text-xs px-2 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity"
                style={{ backgroundColor: ev.colore + '25', color: ev.colore, border: `1px solid ${ev.colore}50` }}
              >
                {ev.titolo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Griglia oraria */}
      <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
        <div className="relative" style={{ height: `${24 * 2 * SLOT_HEIGHT}px` }}>
          {/* Linee ore */}
          {HOURS.map(h => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t flex"
              style={{ top: `${h * 2 * SLOT_HEIGHT}px`, borderColor: 'var(--color-border)' }}
            >
              <span className="text-[10px] w-12 px-2 shrink-0 -mt-2.5"
                style={{ color: 'var(--color-text-muted)' }}>
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Click area per nuovo evento */}
          <div
            className="absolute inset-0 left-12 cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const y = e.clientY - rect.top
              const slot = Math.floor(y / SLOT_HEIGHT)
              const h = Math.floor(slot / 2)
              const m = (slot % 2) * 30
              const d = new Date(currentDate)
              d.setHours(h, m)
              onAddClick(d)
            }}
          />

          {/* Eventi */}
          {orari.map(ev => {
            const pos = getPosition(new Date(ev.inizio), ev.fine ? new Date(ev.fine) : undefined)
            return (
              <button
                key={ev._id}
                type="button"
                onClick={e => { e.stopPropagation(); onEventClick(ev._id) }}
                className="absolute left-14 right-4 rounded-lg px-2 py-1 text-left text-xs font-medium transition-opacity hover:opacity-80 overflow-hidden"
                style={{
                  top: pos.top,
                  height: Math.max(pos.height, SLOT_HEIGHT) - 2,
                  backgroundColor: ev.colore + '25',
                  color: ev.colore,
                  border: `1px solid ${ev.colore}50`,
                }}
              >
                <span className="font-semibold block truncate">{ev.titolo}</span>
                <span className="opacity-70">
                  {format(new Date(ev.inizio), 'HH:mm')}
                  {ev.fine ? ` - ${format(new Date(ev.fine), 'HH:mm')}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {orari.length === 0 && tuttoGiorno.length === 0 && (
        <div className="text-center py-16 text-sm text-text-muted">
          <p>Nessun evento questo giorno</p>
          <button
            type="button"
            onClick={() => onAddClick(currentDate)}
            className="btn-ghost mt-3"
            style={{ color: 'var(--color-brand)' }}
          >
            <Plus className="w-4 h-4" />
            Aggiungi evento
          </button>
        </div>
      )}
    </div>
  )
}
