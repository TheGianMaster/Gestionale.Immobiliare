'use client'

import { useState, useEffect } from 'react'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, EMPTY } from './_shared'
import { cn } from '@/lib/utils'

interface SelectOption { _id: string; label: string; valore: string; colore?: string }

interface SelectFieldProps extends BaseFieldProps {
  anagraficaSlug?: string
}

export function SelectField({ variabile, valore, mode, onChange, error, anagraficaSlug }: SelectFieldProps) {
  const [options, setOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const val = (valore as string) ?? ''

  useEffect(() => {
    const params = new URLSearchParams({ variabile: variabile.slug })
    if (anagraficaSlug) params.set('anagrafica', anagraficaSlug)
    fetch('/api/select-options?' + params)
      .then(r => r.json())
      .then(data => {
        const raw = data.opzioni ?? data.options ?? []
        if (Array.isArray(raw)) {
          setOptions(raw.map(function(o) {
            return {
              valore: o.valore,
              label:  o.etichetta ?? o.label ?? o.valore,
              colore: o.colore,
            }
          }))
        }
      })
      .catch(function() {})
      .finally(function() { setLoading(false) })
  }, [variabile.slug, anagraficaSlug])

  const selected = options.find(function(o) { return o.valore === val })

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        {selected ? (
          <span className="inline-flex items-center gap-1.5">
            {selected.colore && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.colore }} />
            )}
            {selected.label}
          </span>
        ) : EMPTY}
      </ViewRow>
    )
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <Select.Root value={val} onValueChange={function(v) { onChange?.(v === '__none__' ? null : v) }}>
        <Select.Trigger
          className={cn(
            'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
            'bg-surface text-text-primary border outline-none',
            error ? 'border-error' : 'border-border focus:border-border-focus',
            'disabled:opacity-50',
          )}
          disabled={loading}
        >
          <Select.Value placeholder="Seleziona..." />
          <Select.Icon><ChevronDown className="w-4 h-4 text-text-muted" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="z-50 rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: 'var(--radix-select-trigger-width)',
            }}
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              <Select.Item
                value="__none__"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-text-muted cursor-pointer outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover"
              >
                <Select.ItemText>Seleziona...</Select.ItemText>
              </Select.Item>
              {options.map(function(o) {
                return (
                  <Select.Item
                    key={o.valore}
                    value={o.valore}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-text-primary cursor-pointer outline-none hover:bg-surface-hover data-[highlighted]:bg-surface-hover"
                  >
                    {o.colore && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: o.colore }} />}
                    <Select.ItemText>{o.label}</Select.ItemText>
                    <Select.ItemIndicator className="ml-auto">
                      <Check className="w-3.5 h-3.5" />
                    </Select.ItemIndicator>
                  </Select.Item>
                )
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <FieldError message={error} />
    </div>
  )
}
