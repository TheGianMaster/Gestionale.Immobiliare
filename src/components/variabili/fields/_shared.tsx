'use client'

/**
 * src/components/variabili/fields/_shared.tsx
 * Props base, componenti di layout e utility condivisi da tutti i field types.
 */

import type { IVariabile } from '@/types/variabili'
import { cn } from '@/lib/utils'

export interface BaseFieldProps {
  variabile:  IVariabile
  valore:     unknown
  mode:       'view' | 'edit'
  onChange?:  (valore: unknown) => void
  error?:     string
}

export function FieldLabel({ label, obbligatorio }: { label: string; obbligatorio?: boolean }) {
  return (
    <label className="block text-sm font-medium text-text-secondary mb-1.5">
      {label}
      {obbligatorio && <span className="ml-1" style={{ color: 'var(--color-error)' }}>*</span>}
    </label>
  )
}

export function ViewRow({ label, children, obbligatorio }: {
  label: string; children: React.ReactNode; obbligatorio?: boolean
}) {
  return (
    <div className="flex gap-6 items-baseline">
      <dt className="text-sm font-medium shrink-0" style={{ width: 200, color: 'var(--color-text-secondary)' }}>
        {label}
        {obbligatorio && <span className="ml-1" style={{ color: 'var(--color-error)' }}>*</span>}
      </dt>
      <dd className="text-sm flex-1 min-w-0 break-words" style={{ color: 'var(--color-text-primary)' }}>
        {children}
      </dd>
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>{message}</p>
}

export function inputClass(hasError?: boolean) {
  return cn(
    'w-full rounded-lg px-3 py-2 text-sm transition-colors outline-none',
    'placeholder:text-text-muted',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    hasError
      ? 'border border-error focus:border-error bg-surface text-text-primary'
      : 'border border-border focus:border-border-focus bg-surface text-text-primary',
  )
}

export const EMPTY = <span style={{ color: 'var(--color-text-muted)' }}>—</span>
