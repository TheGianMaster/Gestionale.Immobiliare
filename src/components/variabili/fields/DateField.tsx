'use client'

import { useState, useRef, useEffect } from 'react'
import { format, parse, isValid, startOfMonth, addMonths, subMonths, getDaysInMonth, getDay, setYear, setMonth } from 'date-fns'
import { it } from 'date-fns/locale'
import * as Popover from '@radix-ui/react-popover'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
const GIORNI = ['Lu','Ma','Me','Gi','Ve','Sa','Do']

function isoToDisplay(iso: string) {
  if (!iso) return ''
  try {
    const d = parse(iso, 'yyyy-MM-dd', new Date())
    return isValid(d) ? format(d, 'dd/MM/yyyy') : ''
  } catch { return '' }
}

function displayToIso(display: string) {
  try {
    const d = parse(display, 'dd/MM/yyyy', new Date())
    return isValid(d) ? format(d, 'yyyy-MM-dd') : null
  } catch { return null }
}

function autoFormatDate(prev: string, next: string): string {
  let digits = next.replace(/\D/g, '')
  if (digits.length > 8) digits = digits.slice(0, 8)
  let out = ''
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) out += '/'
    out += digits[i]
  }
  return out
}

type ViewMode = 'day' | 'month' | 'year'

export function DateField({ variabile, valore, mode, onChange, error }: BaseFieldProps) {
  const isoVal = (valore as string) ?? ''
  const [inputVal, setInputVal] = useState(isoToDisplay(isoVal))
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(() => {
    if (isoVal) { try { return startOfMonth(parse(isoVal, 'yyyy-MM-dd', new Date())) } catch {} }
    return startOfMonth(new Date())
  })
  const [viewMode, setViewMode] = useState<ViewMode>('day')

  useEffect(() => { setInputVal(isoToDisplay(isoVal)) }, [isoVal])

  function selectDay(day: number) {
    const d = new Date(current.getFullYear(), current.getMonth(), day)
    const iso = format(d, 'yyyy-MM-dd')
    onChange?.(iso)
    setInputVal(format(d, 'dd/MM/yyyy'))
    setOpen(false)
    setViewMode('day')
  }

  function handleInputChange(raw: string) {
    const formatted = autoFormatDate(inputVal, raw)
    setInputVal(formatted)
    if (formatted.length === 10) {
      const iso = displayToIso(formatted)
      if (iso) { onChange?.(iso); try { setCurrent(startOfMonth(parse(iso, 'yyyy-MM-dd', new Date()))) } catch {} }
    } else if (formatted.length === 0) {
      onChange?.(null)
    }
  }

  function handleBlur() {
    if (inputVal.length > 0 && inputVal.length < 10) {
      setInputVal(isoToDisplay(isoVal))
    }
  }

  // Grid giorni
  const firstDay = (getDay(current) + 6) % 7  // 0=Lu
  const daysInMonth = getDaysInMonth(current)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const selectedDay = isoVal ? parse(isoVal, 'yyyy-MM-dd', new Date()) : null

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        {isoVal ? format(parse(isoVal, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : EMPTY}
      </ViewRow>
    )
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="relative">
          <input
            type="text"
            value={inputVal}
            placeholder="GG/MM/AAAA"
            maxLength={10}
            onChange={e => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={() => setOpen(true)}
            className={cn(inputClass(!!error), 'pr-9')}
          />
          <Popover.Trigger asChild>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary"
              tabIndex={-1}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Content
            className="z-50 rounded-xl p-3 w-64"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-lg)',
            }}
            align="start"
            sideOffset={4}
            onOpenAutoFocus={e => e.preventDefault()}
          >
            {viewMode === 'day' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button type="button" onClick={() => setCurrent(subMonths(current, 1))} className="p-1 rounded hover:bg-surface-hover">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setViewMode('month')} className="text-sm font-semibold hover:text-brand px-2">
                    {format(current, 'MMMM yyyy', { locale: it })}
                  </button>
                  <button type="button" onClick={() => setCurrent(addMonths(current, 1))} className="p-1 rounded hover:bg-surface-hover">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {GIORNI.map(g => (
                    <div key={g} className="text-center text-[10px] font-semibold text-text-muted py-1">{g}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-0.5">
                  {cells.map((d, i) => {
                    if (!d) return <div key={`e${i}`} />
                    const isSelected = selectedDay && isValid(selectedDay) &&
                      selectedDay.getFullYear() === current.getFullYear() &&
                      selectedDay.getMonth() === current.getMonth() &&
                      selectedDay.getDate() === d
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => selectDay(d)}
                        className={cn(
                          'text-xs w-8 h-8 mx-auto rounded-lg transition-colors flex items-center justify-center',
                          isSelected
                            ? 'text-white font-semibold'
                            : 'hover:bg-surface-hover text-text-primary',
                        )}
                        style={isSelected ? { backgroundColor: 'var(--color-brand)' } : undefined}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {viewMode === 'month' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button type="button" onClick={() => setCurrent(c => new Date(c.getFullYear() - 1, c.getMonth()))} className="p-1 rounded hover:bg-surface-hover">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setViewMode('year')} className="text-sm font-semibold hover:text-brand px-2">
                    {current.getFullYear()}
                  </button>
                  <button type="button" onClick={() => setCurrent(c => new Date(c.getFullYear() + 1, c.getMonth()))} className="p-1 rounded hover:bg-surface-hover">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MESI.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setCurrent(setMonth(current, i)); setViewMode('day') }}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-medium transition-colors',
                        current.getMonth() === i ? 'text-white' : 'hover:bg-surface-hover text-text-primary',
                      )}
                      style={current.getMonth() === i ? { backgroundColor: 'var(--color-brand)' } : undefined}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}

            {viewMode === 'year' && (() => {
              const yr = current.getFullYear()
              const years = Array.from({ length: 13 }, (_, i) => yr - 6 + i)
              return (
                <>
                  <div className="text-sm font-semibold text-center mb-2">{yr - 6} — {yr + 6}</div>
                  <div className="grid grid-cols-3 gap-1">
                    {years.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => { setCurrent(setYear(current, y)); setViewMode('month') }}
                        className={cn(
                          'py-1.5 rounded-lg text-xs font-medium transition-colors',
                          y === yr ? 'text-white' : 'hover:bg-surface-hover text-text-primary',
                        )}
                        style={y === yr ? { backgroundColor: 'var(--color-brand)' } : undefined}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </>
              )
            })()}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <FieldError message={error} />
    </div>
  )
}
