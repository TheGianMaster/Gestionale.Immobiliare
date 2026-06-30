/**
 * src/models/Evento.ts
 * Evento del calendario.
 * Connessione: DB principale (MONGODB_URI) tramite getEventiConnection().
 */

import mongoose, { Schema, Document, Model } from 'mongoose'
import connectDB from '@/lib/mongodb'

export type TipoEvento =
  | 'appuntamento'
  | 'scadenza'
  | 'attivita'
  | 'promemoria'
  | 'altro'

const TIPI_EVENTO: TipoEvento[] = [
  'appuntamento', 'scadenza', 'attivita', 'promemoria', 'altro',
]

export interface IEvento extends Document {
  titolo: string
  tipo: TipoEvento
  descrizione?: string
  inizio: Date
  fine?: Date
  tuttoIlGiorno: boolean
  creatoDa: Schema.Types.ObjectId
  partecipanti: Schema.Types.ObjectId[]
  schedaId?: Schema.Types.ObjectId
  anagraficaSlug?: string
  colore: string
  etichette: string[]
  ricorrenza?: {
    tipo: 'annuale' | 'mensile' | 'settimanale'
    fine: Date
  }
  completato: boolean
  attivo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IEventoModel extends Model<IEvento> {}

export const EventoSchema = new Schema<IEvento, IEventoModel>(
  {
    titolo:        { type: String, required: true, trim: true, maxlength: 200 },
    tipo:          { type: String, enum: TIPI_EVENTO, default: 'altro' },
    descrizione:   { type: String, trim: true, maxlength: 2000 },
    inizio:        { type: Date, required: true },
    fine:          { type: Date },
    tuttoIlGiorno: { type: Boolean, default: false },
    creatoDa:      { type: Schema.Types.ObjectId, required: true },
    partecipanti:  [{ type: Schema.Types.ObjectId }],
    schedaId:      { type: Schema.Types.ObjectId },
    anagraficaSlug:{ type: String, lowercase: true, trim: true },
    colore:        { type: String, default: '#6366F1', match: /^#[0-9A-Fa-f]{6}$/ },
    etichette:     [{ type: String, trim: true }],
    ricorrenza: {
      tipo: { type: String, enum: ['annuale', 'mensile', 'settimanale'] },
      fine: { type: Date },
    },
    completato:    { type: Boolean, default: false },
    attivo:        { type: Boolean, default: true },
  },
  { timestamps: true }
)

EventoSchema.index({ inizio: 1, attivo: 1 })
EventoSchema.index({ creatoDa: 1, inizio: -1 })
EventoSchema.index({ partecipanti: 1, inizio: 1 })

let _EventoModel: IEventoModel | null = null

export async function getEventoModel(): Promise<IEventoModel> {
  if (_EventoModel) return _EventoModel
  await connectDB()
  _EventoModel = (mongoose.models?.Evento as IEventoModel | undefined)
    ?? mongoose.model<IEvento, IEventoModel>('Evento', EventoSchema)
  return _EventoModel
}
