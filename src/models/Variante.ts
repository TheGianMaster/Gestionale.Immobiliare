/**
 * src/models/Variante.ts
 * Variante di una Scheda — versione snapshot dei dati in un certo momento.
 * Usato per storico modifiche / audit trail.
 *
 * Connessione: DB Anagrafiche (MONGODB_URI_ANAGRAFICHE)
 * Nota: il model va registrato sulla connessione anagrafiche, non su quella default.
 */

import { Schema, Document, Model } from 'mongoose'
import { getAnagraficheConnection } from '@/lib/mongodb-anagrafiche'

export interface IVariante extends Document {
  schedaId: Schema.Types.ObjectId  // Riferimento alla Scheda originale
  anagraficaSlug: string           // Slug anagrafica (es: "clienti") — per query senza join
  dati: Record<string, unknown>    // Snapshot completo dei campi al momento del salvataggio
  versione: number                 // Numero progressivo (1, 2, 3, …)
  modificataDa: Schema.Types.ObjectId  // userId autore della modifica
  noteModifica?: string            // Commento opzionale sulla modifica
  createdAt: Date
  updatedAt: Date
}

export interface IVarianteModel extends Model<IVariante> {}

export const VarianteSchema = new Schema<IVariante, IVarianteModel>(
  {
    schedaId: {
      type: Schema.Types.ObjectId,
      required: [true, 'schedaId obbligatorio'],
      index: true,
    },
    anagraficaSlug: {
      type: String,
      required: [true, 'anagraficaSlug obbligatorio'],
      lowercase: true,
      trim: true,
    },
    dati: {
      type: Schema.Types.Mixed,
      required: [true, 'dati obbligatori'],
      default: {},
    },
    versione: {
      type: Number,
      required: [true, 'versione obbligatoria'],
      min: [1, 'versione minima è 1'],
    },
    modificataDa: {
      type: Schema.Types.ObjectId,
      required: [true, 'modificataDa obbligatorio'],
    },
    noteModifica: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
)

// ——— INDICI ———
VarianteSchema.index({ schedaId: 1, versione: -1 })  // Ultime versioni prima
VarianteSchema.index({ anagraficaSlug: 1, createdAt: -1 })

/**
 * Lazy-register del model sulla connessione anagrafiche.
 * Non usiamo mongoose.model() default per non inquinare la connessione principale.
 */
let _VarianteModel: IVarianteModel | null = null

export async function getVarianteModel(): Promise<IVarianteModel> {
  if (_VarianteModel) return _VarianteModel
  const conn = await getAnagraficheConnection()
  _VarianteModel = (conn.models.Variante as IVarianteModel | undefined)
    ?? conn.model<IVariante, IVarianteModel>('Variante', VarianteSchema)
  return _VarianteModel
}
