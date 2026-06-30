'use client'

import { Phone } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

export function PhoneField({ variabile, valore, mode, onChange, error }: BaseFieldProps) {
  const val = (valore as string) ?? ''

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        {val ? (
          <a href={`tel:${val}`} className="flex items-center gap-1.5 text-brand hover:underline">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            {val}
          </a>
        ) : EMPTY}
      </ViewRow>
    )
  }

  function handleChange(raw: string) {
    const cleaned = raw.replace(/[^0-9+\s\-(). ]/g, '')
    onChange?.(cleaned)
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="tel"
          value={val}
          placeholder={variabile.placeholder ?? '+39 000 000 0000'}
          onChange={e => handleChange(e.target.value)}
          className={cn(inputClass(!!error), 'pl-9')}
        />
      </div>
      <FieldError message={error} />
    </div>
  )
}
