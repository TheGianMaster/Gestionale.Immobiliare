/**
 * src/types/variabili.ts
 * Tipo frontend per IVariabile — usato da FieldRenderer e tutti i field components.
 * Corrisponde al documento Mongoose in src/models/Variabile.ts.
 */

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
  | 'line-items'

/** Definizione di una colonna all'interno di un campo line-items */
export interface IColonnaLineItems {
  slug:         string
  nome:         string
  tipo:         'text' | 'numbers' | 'reference'
  referenceTo?: string    // solo se tipo === 'reference'
  decimali?:    boolean   // solo se tipo === 'numbers'
  placeholder?: string
}

/** Valore di una singola riga line-items */
export type LineItemRow = Record<string, unknown>

export interface IVariabile {
  _id?:             string
  slug:             string         // Identificativo campo, es: "nome", "data_nascita"
  nome:             string         // Etichetta visualizzata nel form/lista
  tipo:             TipoVariabile
  anagraficaSlug:   string
  obbligatorio:     boolean
  descrizione?:     string         // Tooltip/help
  placeholder?:     string

  // Validazione testo
  maxLength?:       number

  // Validazione numeri
  min?:             number
  max?:             number
  decimali?:        boolean        // true = 2 decimali, false = intero

  // Reference
  referenceTo?:     string         // Slug anagrafica target (tipo: reference / multi-reference)

  // Line-items (righe ripetibili)
  colonne?:         IColonnaLineItems[]  // definizione colonne (solo se tipo === 'line-items')

  // Varianti
  soloPerVarianti?: string[]       // Se impostato, campo visibile solo per queste varianteID

  ordine?:          number
  visibileInPreview?: boolean
}
