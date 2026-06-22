'use client'

import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'

export function TextField({ variabile, valore, mode, onChange, error }: BaseFieldProps) {
  const val = (valore as string) ?? ''
  const max = variabile.maxLength ?? 255

  if (mode === 'view') {
    return <ViewRow label={variabile.nome}>{val || EMPTY}</ViewRow>
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <input
        type="text"
        value={val}
        maxLength={max}
        placeholder={variabile.placeholder ?? ''}
        onChange={e => onChange?.(e.target.value)}
        className={inputClass(!!error)}
      />
      <div className="flex justify-between mt-1">
        <FieldError message={error} />
        <span className="text-xs text-text-muted ml-auto">{val.length} / {max}</span>
      </div>
    </div>
  )
}
