/**
 * src/models/Evento.ts
 * Evento del calendario (appuntamento, scadenza, attività, ecc.)
 * Memorizzato nel DB Eventi (MONGODB_URI_EVENTI) — traffico separato dal resto.
 *
 * Connessione: DB Eventi (MONGODB_URI_EVENTI)
 */

import { Schema, Document, Model } from 'mongoose'
import { getEventiConnection } from '@/lib/mongodb-eventi'

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

  // ——— Timing ———
  inizio: Date
  fine?: Date
  tuttoIlGiorno: boolean

  // ——— Partecipanti / collegamento ———
  creatoDa: Schema.Types.ObjectId        // userId
  partecipanti: Schema.Types.ObjectId[]  // userIds

  // ——— Collegamento opzionale a scheda ———
  schedaId?: Schema.Types.ObjectId
  anagraficaSlug?: string

  // ——— Aspetto ———
  colore: string   // Hex color per il calendario

  // ——— Stato ———
  completato: boolean
  attivo: boolean   // Soft-delete

  createdAt: Date
  updatedAt: Date
}

export interface IEventoModel extends Model<IEvento> {}

export const EventoSchema = new Schema<IEvento, IEventoModel>(
  {
    titolo: {
      type: String,
      required: [true, 'Titolo obbligatorio'],
      trim: true,
      maxlength: [200, 'Titolo troppo lungo'],
    },
    tipo: {
      type: String,
      required: [true, 'Tipo obbligatorio'],
      enum: { values: TIPI_EVENTO, message: 'Tipo non valido: {VALUE}' },
      default: 'altro',
    },
    descrizione: { type: String, trim: true, maxlength: 2000 },

    inizio: { type: Date, required: [true, 'Data inizio obbligatoria'] },
    fine:   { type: Date },
    tuttoIlGiorno: { type: Boolean, default: false },

    creatoDa: {
      type: Schema.Types.ObjectId,
      required: [true, 'creatoDa obbligatorio'],
    },
    partecipanti: [{ type: Schema.Types.ObjectId }],

    schedaId: { type: Schema.Types.ObjectId },
    anagraficaSlug: { type: String, lowercase: true, trim: true },

    colore: {
      type: String,
      default: '#6366F1',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Colore deve essere un hex valido (#RRGGBB)'],
    },

    completato: { type: Boolean, default: false },
    attivo:     { type: Boolean, default: true },
  },
  { timestamps: true }
)

// ——— INDICI ———
EventoSchema.index({ inizio: 1, attivo: 1 })
EventoSchema.index({ creatoDa: 1, inizio: -1 })
EventoSchema.index({ partecipanti: 1, inizio: 1 })
EventoSchema.index({ schedaId: 1 })  // Trova eventi per una scheda

/**
 * Model registrato sulla connessione eventi.
 */
let _EventoModel: IEventoModel | null = null

export async function getEventoModel(): Promise<IEventoModel> {
  if (_EventoModel) return _EventoModel
  const conn = await getEventiConnection()
  _EventoModel = (conn.models.Evento as IEventoModel | undefined)
    ?? conn.model<IEvento, IEventoModel>('Evento', EventoSchema)
  return _EventoModel
}
