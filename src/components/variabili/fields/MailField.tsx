'use client'

import { Mail } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

export function MailField({ variabile, valore, mode, onChange, error }: BaseFieldProps) {
  const val = (valore as string) ?? ''

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        {val ? (
          <a href={`mailto:${val}`} className="flex items-center gap-1.5 text-brand hover:underline">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            {val}
          </a>
        ) : EMPTY}
      </ViewRow>
    )
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="email"
          value={val}
          placeholder={variabile.placeholder ?? 'nome@esempio.it'}
          onChange={e => onChange?.(e.target.value)}
          className={cn(inputClass(!!error), 'pl-9')}
        />
      </div>
      <FieldError message={error} />
    </div>
  )
}
