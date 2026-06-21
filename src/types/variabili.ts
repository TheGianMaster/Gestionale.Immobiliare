// Tipi variabili (field types) — modello completo in T-021

export type TipoVariabile =
  | 'text'
  | 'text-area'
  | 'numbers'
  | 'mail'
  | 'phone'
  | 'data'
  | 'select'
  | 'reference'
  | 'multi-reference'
  | 'variantID'

export interface IVariabile {
  _id: string
  slug: string
  label: string
  tipo: TipoVariabile
  obbligatorio: boolean
  descrizione?: string
  placeholder?: string
  anagraficaRef: string
  visibileInPreview: boolean
  ordine: number
  // Campi tipo-specifici
  maxLength?: number     // text
  min?: number           // numbers
  max?: number           // numbers
  decimali?: boolean     // numbers
  targetAnagrafica?: string  // reference, multi-reference
  displayField?: string      // reference, multi-reference
}
