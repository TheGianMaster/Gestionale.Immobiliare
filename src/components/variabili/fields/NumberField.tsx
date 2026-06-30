'use client'

import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'

export function NumberField({ variabile, valore, mode, onChange, error }: BaseFieldProps) {
  const val = valore !== undefined && valore !== null ? String(valore) : ''
  const decimali = !!(variabile as { decimali?: boolean }).decimali

  if (mode === 'view') {
    const formatted = valore !== undefined && valore !== null
      ? Number(valore).toLocaleString('it-IT', { maximumFractionDigits: decimali ? 2 : 0 })
      : EMPTY
    return <ViewRow label={variabile.nome}>{formatted}</ViewRow>
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <input
        type="number"
        value={val}
        step={decimali ? '0.01' : '1'}
        min={(variabile as { min?: number }).min}
        max={(variabile as { max?: number }).max}
        placeholder={variabile.placeholder ?? ''}
        onChange={e => onChange?.(e.target.value === '' ? null : Number(e.target.value))}
        className={inputClass(!!error)}
        style={{ MozAppearance: 'textfield' } as React.CSSProperties}
      />
      <FieldError message={error} />
    </div>
  )
}
