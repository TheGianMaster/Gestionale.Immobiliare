'use client'

/**
 * src/components/variabili/FieldRenderer.tsx
 * Dispatcher centrale per i tipi di campo delle anagrafiche.
 * Riceve una Variabile e renderizza il componente corretto in modalita' view o edit.
 */

import type { IVariabile } from '@/types/variabili'
import { TextField } from './fields/TextField'
import { TextAreaField } from './fields/TextAreaField'
import { NumberField } from './fields/NumberField'
import { MailField } from './fields/MailField'
import { PhoneField } from './fields/PhoneField'
import { DateField } from './fields/DateField'
import { SelectField } from './fields/SelectField'
import { ReferenceField } from './fields/ReferenceField'
import { MultiReferenceField } from './fields/MultiReferenceField'
import { VariantIDField } from './fields/VariantIDField'

export interface FieldRendererProps {
  variabile: IVariabile
  valore: unknown
  mode: 'view' | 'edit'
  onChange?: (slug: string, valore: unknown) => void
  error?: string
  oscurato?: boolean
  anagraficaSlug?: string
}

export function FieldRenderer({
  variabile, valore, mode, onChange, error, oscurato, anagraficaSlug,
}: FieldRendererProps) {
  if (oscurato) return null

  const sharedProps = {
    variabile,
    valore,
    mode,
    onChange: onChange ? (v: unknown) => onChange(variabile.slug, v) : undefined,
    error,
  }

  switch (variabile.tipo) {
    case 'text':
      return <TextField {...sharedProps} />
    case 'text-area':
      return <TextAreaField {...sharedProps} />
    case 'numbers':
      return <NumberField {...sharedProps} />
    case 'mail':
      return <MailField {...sharedProps} />
    case 'phone':
      return <PhoneField {...sharedProps} />
    case 'data':
      return <DateField {...sharedProps} />
    case 'select':
      return <SelectField {...sharedProps} anagraficaSlug={anagraficaSlug} />
    case 'reference':
      return <ReferenceField {...sharedProps} anagraficaSlug={anagraficaSlug} />
    case 'multi-reference':
      return <MultiReferenceField {...sharedProps} anagraficaSlug={anagraficaSlug} />
    case 'variantID':
      return <VariantIDField {...sharedProps} anagraficaSlug={anagraficaSlug} />
    default:
      return (
        <div className="text-xs text-text-muted italic py-1">
          Tipo non supportato: {variabile.tipo}
        </div>
      )
  }
}
