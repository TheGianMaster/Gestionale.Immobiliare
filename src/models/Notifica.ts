/**
 * src/models/Notifica.ts
 * Notifica in-app per un utente (es: "Scheda aggiornata", "Evento imminente").
 * TTL 30 giorni: MongoDB elimina automaticamente i documenti scaduti.
 *
 * Connessione: DB principale (MONGODB_URI)
 */

import mongoose, { Schema, Document, Model } from 'mongoose'

export type TipoNotifica =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

export type AzioneNotifica =
  | 'scheda_creata'
  | 'scheda_modificata'
  | 'scheda_eliminata'
  | 'documento_caricato'
  | 'evento_imminente'
  | 'evento_creato'
  | 'utente_invitato'
  | 'sistema'

const TIPI_NOTIFICA: TipoNotifica[] = ['info', 'success', 'warning', 'error']
const AZIONI_NOTIFICA: AzioneNotifica[] = [
  'scheda_creata', 'scheda_modificata', 'scheda_eliminata',
  'documento_caricato', 'evento_imminente', 'evento_creato',
  'utente_invitato', 'sistema',
]

export interface INotifica extends Document {
  userId: Schema.Types.ObjectId        // Destinatario
  tipo: TipoNotifica
  azione: AzioneNotifica
  titolo: string
  messaggio?: string
  letta: boolean

  // ——— Collegamento opzionale a risorsa ———
  schedaId?: Schema.Types.ObjectId
  anagraficaSlug?: string
  eventoId?: Schema.Types.ObjectId

  // TTL: il campo scadenza permette a MongoDB di eliminare auto dopo 30gg
  scadenzaTTL: Date

  createdAt: Date
  updatedAt: Date
}

export interface INotificaModel extends Model<INotifica> {}

const NotificaSchema = new Schema<INotifica, INotificaModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'userId obbligatorio'],
    },
    tipo: {
      type: String,
      required: [true, 'tipo obbligatorio'],
      enum: { values: TIPI_NOTIFICA, message: 'Tipo non valido: {VALUE}' },
      default: 'info',
    },
    azione: {
      type: String,
      required: [true, 'azione obbligatoria'],
      enum: { values: AZIONI_NOTIFICA, message: 'Azione non valida: {VALUE}' },
    },
    titolo: {
      type: String,
      required: [true, 'Titolo obbligatorio'],
      trim: true,
      maxlength: [200, 'Titolo troppo lungo'],
    },
    messaggio: { type: String, trim: true, maxlength: 1000 },
    letta: { type: Boolean, default: false },

    // Risorse collegate
    schedaId:       { type: Schema.Types.ObjectId },
    anagraficaSlug: { type: String, lowercase: true, trim: true },
    eventoId:       { type: Schema.Types.ObjectId },

    // TTL: impostato automaticamente a createdAt + 30 giorni nel pre-save
    scadenzaTTL: { type: Date, required: true },
  },
  { timestamps: true }
)

// ——— TTL INDEX — MongoDB elimina dopo 0 secondi dalla scadenzaTTL ———
NotificaSchema.index({ scadenzaTTL: 1 }, { expireAfterSeconds: 0 })

// ——— ALTRI INDICI ———
NotificaSchema.index({ userId: 1, letta: 1, createdAt: -1 })
NotificaSchema.index({ userId: 1, createdAt: -1 })

// ——— PRE-SAVE: imposta scadenzaTTL automaticamente ———
NotificaSchema.pre('save', function (next) {
  if (this.isNew && !this.scadenzaTTL) {
    const TTL_GIORNI = 30
    const scadenza = new Date(this.createdAt ?? Date.now())
    scadenza.setDate(scadenza.getDate() + TTL_GIORNI)
    this.scadenzaTTL = scadenza
  }
  next()
})

export const Notifica = (
  mongoose.models?.Notifica as INotificaModel | undefined
) ?? mongoose.model<INotifica, INotificaModel>('Notifica', NotificaSchema)

export default Notifica
