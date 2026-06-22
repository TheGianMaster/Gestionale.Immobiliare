'use client'

import { useEffect, useRef } from 'react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, inputClass, EMPTY } from './_shared'

export function TextAreaField({ variabile, valore, mode, onChange, error }: BaseFieldProps) {
  const val = (valore as string) ?? ''
  const max = 5000
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = Math.min(ref.current.scrollHeight, 400) + 'px'
  }, [val])

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        <span style={{ whiteSpace: 'pre-wrap' }}>{val || EMPTY}</span>
      </ViewRow>
    )
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <textarea
        ref={ref}
        value={val}
        maxLength={max}
        placeholder={variabile.placeholder ?? ''}
        onChange={e => onChange?.(e.target.value)}
        className={inputClass(!!error)}
        style={{ minHeight: 80, maxHeight: 400, resize: 'none', overflow: 'auto' }}
      />
      <div className="flex justify-between mt-1">
        <FieldError message={error} />
        <span className="text-xs text-text-muted ml-auto">{val.length} / {max}</span>
      </div>
    </div>
  )
}
