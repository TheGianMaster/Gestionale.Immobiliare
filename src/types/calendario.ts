// Tipi calendario — modello completo in T-025

export interface IEvento {
  _id: string
  titolo: string
  descrizione?: string
  inizio: Date
  fine: Date
  tuttoIlGiorno: boolean
  colore?: string
  etichette: string[]
  collegamentoScheda?: string
  collegamentoAnagrafica?: string
  createdBy: string
  partecipanti: string[]
  createdAt: Date
  updatedAt: Date
}
