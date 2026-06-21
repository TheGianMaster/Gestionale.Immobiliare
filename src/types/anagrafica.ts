// Tipi anagrafica — modelli completi in T-020, T-021, T-022, T-023

// Placeholder — da completare nelle fasi successive
export interface IAnagraficaConfig {
  _id: string
  slug: string
  nome: string
  descrizione?: string
  icona?: string
  colore?: string
  attiva: boolean
  ordine: number
}

export interface IScheda {
  _id: string
  anagraficaSlug: string
  variantID?: string
  dati: Record<string, unknown>
  attiva: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}
