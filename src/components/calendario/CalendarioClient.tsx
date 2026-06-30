'use client'

/**
 * src/components/calendario/CalendarioClient.tsx
 * Shell client del calendario con navigazione, viste e modale evento.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addMonths, subMonths, addDays, subDays, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalendarMonth } from './CalendarMonth'
import { CalendarDay } from './CalendarDay'
import { EventModal, type EventoForm } from './EventModal'

type Vista = 'month' | 'day'

interface Evento {
  _id: string
  titolo: string
  inizio: string
  fine?: string
  tuttoIlGiorno: boolean
  colore: string
  tipo: string
  descrizione?: string
  oraInizio?: string
  oraFine?: string
  etichette?: string[]
}

function eventoToForm(e: Evento): EventoForm & { _id: string } {
  const inizio = new Date(e.inizio)
  const fine   = e.fine ? new Date(e.fine) : undefined
  return {
    _id:           e._id,
    titolo:        e.titolo,
    tipo:          e.tipo,
    descrizione:   e.descrizione ?? '',
    inizio:        format(inizio, 'yyyy-MM-dd'),
    oraInizio:     format(inizio, 'HH:mm'),
    fine:          fine ? format(fine, 'yyyy-MM-dd') : format(inizio, 'yyyy-MM-dd'),
    oraFine:       fine ? format(fine, 'HH:mm') : '',
    tuttoIlGiorno: e.tuttoIlGiorno,
    colore:        e.colore,
    etichette:     e.etichette ?? [],
  }
}

export function CalendarioClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const vistaParam = (searchParams.get('view') as Vista | null) ?? 'month'
  const monthParam = searchParams.get('month')
  const dateParam  = searchParams.get('date')

  const [vista, setVista]   = useState<Vista>(vistaParam)
  const [mese, setMese]     = useState<Date>(() =>
    monthParam ? parseISO(`${monthParam}-01`) : new Date()
  )
  const [giorno, setGiorno] = useState<Date>(() =>
    dateParam ? parseISO(dateParam) : new Date()
  )

  const [eventi, setEventi]           = useState<Evento[]>([])
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [selectedEvento, setSelectedEvento] = useState<(EventoForm & { _id: string }) | undefined>()
  const [defaultDate, setDefaultDate] = useState<string | undefined>()

  // Aggiorna URL
  const updateUrl = useCallback((v: Vista, m: Date, d: Date) => {
    const params = new URLSearchParams()
    params.set('view', v)
    if (v === 'month') params.set('month', format(m, 'yyyy-MM'))
    else params.set('date', format(d, 'yyyy-MM-dd'))
    router.replace(`/calendario?${params.toString()}`, { scroll: false })
  }, [router])

  // Fetch eventi
  const fetchEventi = useCallback(async () => {
    setLoading(true)
    try {
      const param = vista === 'month'
        ? `mese=${format(mese, 'yyyy-MM')}`
        : `giorno=${format(giorno, 'yyyy-MM-dd')}`
      const res = await fetch(`/api/calendario?${param}`)
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setEventi(data ?? [])
    } catch {
      setEventi([])
    } finally {
      setLoading(false)
    }
  }, [vista, mese, giorno])

  useEffect(() => { fetchEventi() }, [fetchEventi])

  const switchVista = (v: Vista) => {
    setVista(v)
    updateUrl(v, mese, giorno)
  }

  const prevPeriod = () => {
    if (vista === 'month') {
      const m = subMonths(mese, 1)
      setMese(m)
      updateUrl('month', m, giorno)
    } else {
      const d = subDays(giorno, 1)
      setGiorno(d)
      updateUrl('day', mese, d)
    }
  }

  const nextPeriod = () => {
    if (vista === 'month') {
      const m = addMonths(mese, 1)
      setMese(m)
      updateUrl('month', m, giorno)
    } else {
      const d = addDays(giorno, 1)
      setGiorno(d)
      updateUrl('day', mese, d)
    }
  }

  const goToToday = () => {
    const now = new Date()
    setMese(now)
    setGiorno(now)
    updateUrl(vista, now, now)
  }

  const openNewEvento = (date: Date) => {
    setSelectedEvento(undefined)
    setDefaultDate(format(date, 'yyyy-MM-dd'))
    setModalOpen(true)
  }

  const openEvento = (id: string) => {
    const ev = eventi.find(e => e._id === id)
    if (!ev) return
    setSelectedEvento(eventoToForm(ev))
    setDefaultDate(undefined)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setSelectedEvento(undefined) }

  const periodoLabel = vista === 'month'
    ? format(mese, 'MMMM yyyy', { locale: it })
    : format(giorno, 'EEEE d MMMM yyyy', { locale: it })

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="btn-icon"><ChevronLeft className="w-4 h-4" /></button>
          <h2 className="text-base font-semibold text-text-primary capitalize min-w-[180px] text-center">
            {periodoLabel}
          </h2>
          <button onClick={nextPeriod} className="btn-icon"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={goToToday} className="btn-ghost text-xs ml-1">Oggi</button>
        </div>

        <div className="flex items-center gap-2">
          {/* Vista toggle */}
          <div className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)' }}>
            {(['month', 'day'] as Vista[]).map(v => (
              <button
                key={v}
                onClick={() => switchVista(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  vista === v ? 'text-white' : 'text-text-secondary hover:bg-surface-hover'
                )}
                style={vista === v ? { backgroundColor: 'var(--color-brand)' } : {}}
              >
                {v === 'month' ? 'Mese' : 'Giorno'}
              </button>
            ))}
          </div>
          <button onClick={() => openNewEvento(vista === 'day' ? giorno : new Date())} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nuovo evento
          </button>
        </div>
      </div>

      {/* Contenuto */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand)' }} />
        </div>
      ) : vista === 'month' ? (
        <CalendarMonth
          currentMonth={mese}
          eventi={eventi}
          onDayClick={d => { setGiorno(d); switchVista('day') }}
          onEventClick={openEvento}
          onAddClick={openNewEvento}
        />
      ) : (
        <CalendarDay
          currentDate={giorno}
          eventi={eventi}
          onEventClick={openEvento}
          onAddClick={openNewEvento}
        />
      )}

      {/* Modale evento */}
      {modalOpen && (
        <EventModal
          evento={selectedEvento}
          defaultDate={defaultDate}
          onClose={closeModal}
          onSaved={fetchEventi}
        />
      )}
    </div>
  )
}
