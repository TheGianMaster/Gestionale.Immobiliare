'use client'

import { useState, useEffect } from 'react'
import { BaseFieldProps, FieldLabel, FieldError, ViewRow, EMPTY } from './_shared'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'

interface Variante { id: string; nome: string; descrizione?: string }

interface VariantIDFieldProps extends BaseFieldProps {
  anagraficaSlug?: string
}

export function VariantIDField({ variabile, valore, mode, onChange, error, anagraficaSlug }: VariantIDFieldProps) {
  const val = valore as string | null
  const [varianti, setVarianti] = useState<Variante[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!anagraficaSlug) return
    setLoading(true)
    fetch(`/api/varianti?anagrafica=${anagraficaSlug}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.varianti)) setVarianti(data.varianti) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [anagraficaSlug])

  const varianteLabel = varianti.find(v => v.id === val)?.nome ?? val

  if (mode === 'view') {
    return (
      <ViewRow label={variabile.nome}>
        {val ? (
          <span className="inline-flex items-center gap-1.5 text-sm px-2.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
            {varianteLabel}
          </span>
        ) : EMPTY}
      </ViewRow>
    )
  }

  const triggerStyle: React.CSSProperties = {
    border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
    backgroundColor: 'var(--color-surface)',
    color: val ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    cursor: 'pointer',
    transition: 'border-color 150ms',
  }

  return (
    <div>
      <FieldLabel label={variabile.nome} obbligatorio={variabile.obbligatorio} />
      <Select.Root value={val ?? '__none__'} onValueChange={v => onChange?.(v === '__none__' ? null : v)}>
        <Select.Trigger style={triggerStyle} aria-label={variabile.nome}>
          <Select.Value placeholder={loading ? 'Caricamento...' : 'Seleziona variante...'}>
            {val ? varianteLabel : (loading ? 'Caricamento...' : 'Seleziona variante...')}
          </Select.Value>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-60" aria-hidden="true" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper" sideOffset={4}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow-lg)',
              padding: '4px',
              zIndex: 9999,
              minWidth: 'var(--radix-select-trigger-width)',
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            <Select.Viewport>
              <Select.Item value="__none__"
                style={{ padding: '6px 10px', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '0.5rem',
                  color: 'var(--color-text-muted)', outline: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select.ItemText>Nessuna variante</Select.ItemText>
              </Select.Item>
              {varianti.map(v => (
                <Select.Item key={v.id} value={v.id}
                  style={{ padding: '6px 10px', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '0.5rem',
                    color: 'var(--color-text-primary)', outline: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Select.ItemIndicator><Check className="w-3 h-3 text-brand shrink-0" /></Select.ItemIndicator>
                  <div>
                    <Select.ItemText>{v.nome}</Select.ItemText>
                    {v.descrizione && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{v.descrizione}</div>
                    )}
                  </div>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <FieldError message={error} />
    </div>
  )
}
