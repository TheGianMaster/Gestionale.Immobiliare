'use client'

/**
 * src/components/variabili/fields/_shared.tsx
 * Elementi condivisi tra tutti i field component.
 */

import type { IVariabile } from '@/types/variabili'
import { cn } from '@/lib/utils'

// Props base di ogni campo
export interface BaseFieldProps {
  variabile:  IVariabile
  valore:     unknown
  mode:       'view' | 'edit'
  onChange?:  (valore: unknown) => void
  error?:     string
}

// Label con asterisco obbligatorio
export function FieldLabel({ label, obbligatorio }: { label: string; obbligatorio?: boolean }) {
  return (
    <label className="block text-sm font-medium text-text-secondary mb-1">
      {label}
      {obbligatorio && <span className="ml-1 text-error">*</span>}
    </label>
  )
}

// Wrapper di ogni campo in view mode: "Label: valore"
export function ViewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5">
      <span className="text-sm text-text-muted w-40 shrink-0">{label}</span>
      <span className="text-sm text-text-primary flex-1 break-words">{children}</span>
    </div>
  )
}

// Messaggio errore inline
export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-error">{message}</p>
}

// Input base con stili comuni
export function inputClass(hasError?: boolean) {
  return cn(
    'w-full rounded-lg px-3 py-2 text-sm text-text-primary transition-colors',
    'bg-surface placeholder:text-text-muted',
    'border outline-none',
    hasError
      ? 'border-error focus:border-error'
      : 'border-border focus:border-border-focus',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  )
}

export const EMPTY = '-'
