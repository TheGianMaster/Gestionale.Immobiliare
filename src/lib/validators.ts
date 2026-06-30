/**
 * src/lib/validators.ts
 * Generatore dinamico di schema Zod per i dati di una scheda.
 * Usato lato server (API route) e lato client (SchedaForm) per validazione uniforme.
 */

import { z } from 'zod'
import type { IVariabile } from '@/types/variabili'

const refValueSchema = z.object({ id: z.string(), label: z.string() })

function fieldSchema(v: IVariabile): z.ZodTypeAny {
  let base: z.ZodTypeAny

  switch (v.tipo) {
    case 'text':
      base = z.string()
      if (v.maxLength) base = (base as z.ZodString).max(v.maxLength, `Massimo ${v.maxLength} caratteri`)
      break

    case 'text-area':
      base = z.string()
      if (v.maxLength) base = (base as z.ZodString).max(v.maxLength, `Massimo ${v.maxLength} caratteri`)
      break

    case 'numbers': {
      let n = z.number({ invalid_type_error: 'Deve essere un numero' })
      if (v.min !== undefined) n = n.min(v.min, `Minimo ${v.min}`)
      if (v.max !== undefined) n = n.max(v.max, `Massimo ${v.max}`)
      base = n
      break
    }

    case 'mail':
      base = z.string().email('Email non valida')
      break

    case 'phone':
      base = z.string().regex(/^[0-9+\s\-(). ]{5,20}$/, 'Numero di telefono non valido')
      break

    case 'data':
      base = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida (YYYY-MM-DD)')
      break

    case 'select':
      base = z.string()
      break

    case 'reference':
      base = refValueSchema
      break

    case 'multi-reference':
      base = z.array(refValueSchema)
      break

    case 'variantID':
      base = z.string()
      break

    case 'line-items':
      // Array di righe; ogni riga e' un oggetto libero — validazione strutturata lato campo
      base = z.array(z.record(z.unknown()))
      break

    default:
      base = z.unknown()
  }

  if (!v.obbligatorio) {
    if (v.tipo === 'multi-reference' || v.tipo === 'line-items') {
      return (base as z.ZodArray<z.ZodTypeAny>).optional().nullable()
    }
    return base.optional().nullable()
  }

  if (v.tipo === 'multi-reference') {
    return (base as z.ZodArray<z.ZodTypeAny>).min(1, `${v.nome} e obbligatorio`)
  }

  if (typeof (base as z.ZodString).min === 'function' && ['text', 'text-area', 'mail', 'phone', 'data', 'select', 'variantID'].includes(v.tipo)) {
    return (base as z.ZodString).min(1, `${v.nome} e obbligatorio`)
  }

  return base
}

export function buildSchedaSchema(
  variabili: IVariabile[],
  variantIDSlug?: string,
  varianteID?: string | null,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const v of variabili) {
    const isVisible = !variantIDSlug || !v.soloPerVarianti
      || (varianteID && v.soloPerVarianti.includes(varianteID))
    if (!isVisible) continue
    shape[v.slug] = fieldSchema(v)
  }

  return z.object(shape)
}
