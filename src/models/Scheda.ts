/**
 * src/models/Scheda.ts
 * Record anagrafico — un'istanza di una AnagraficaConfig (es: un cliente specifico).
 * Memorizzata nel DB Anagrafiche, nella collection dinamica "schede_{anagraficaSlug}".
 *
 * Connessione: DB Anagrafiche (MONGODB_URI_ANAGRAFICHE)
 */

import { Schema, Document, Model } from 'mongoose'
import { getAnagraficheConnection } from '@/lib/mongodb-anagrafiche'

export interface IScheda extends Document {
  anagraficaSlug: string             // Slug della tipologia (es: "clienti")
  dati: Record<string, unknown>      // Valori dei campi (chiave = slug variabile)
  attiva: boolean                    // Soft-delete
  versione: number                   // Numero versione corrente (sync con Variante)
  creataDa: Schema.Types.ObjectId    // userId
  modificataDa: Schema.Types.ObjectId
  tags: string[]                     // Tag liberi per ricerche rapide
  createdAt: Date
  updatedAt: Date
}

export interface ISchedaModel extends Model<IScheda> {}

export const SchedaSchema = new Schema<IScheda, ISchedaModel>(
  {
    anagraficaSlug: {
      type: String,
      required: [true, 'anagraficaSlug obbligatorio'],
      lowercase: true,
      trim: true,
    },
    dati: {
      type: Schema.Types.Mixed,
      default: {},
    },
    attiva: { type: Boolean, default: true },
    versione: { type: Number, default: 1, min: 1 },
    creataDa: {
      type: Schema.Types.ObjectId,
      required: [true, 'creataDa obbligatorio'],
    },
    modificataDa: {
      type: Schema.Types.ObjectId,
      required: [true, 'modificataDa obbligatorio'],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
)

// ——— INDICI ———
SchedaSchema.index({ anagraficaSlug: 1, attiva: 1 })
SchedaSchema.index({ anagraficaSlug: 1, createdAt: -1 })
SchedaSchema.index({ tags: 1 })
// Indice full-text su tags (utile per ricerca rapida)
SchedaSchema.index({ tags: 'text' })

/**
 * Ritorna il model Scheda per una specifica anagrafica.
 * Ogni anagrafica usa la propria collection: "schede_{slug}".
 * Il model viene registrato sulla connessione anagrafiche.
 */
const _schedaModels: Map<string, ISchedaModel> = new Map()

export async function getSchedaModel(anagraficaSlug: string): Promise<ISchedaModel> {
  if (_schedaModels.has(anagraficaSlug)) {
    return _schedaModels.get(anagraficaSlug)!
  }

  const conn = await getAnagraficheConnection()
  const collectionName = `schede_${anagraficaSlug}`

  // Terzo argomento: forza il nome collection (Mongoose altrimenti pluralizza)
  const model = (conn.models[collectionName] as ISchedaModel | undefined)
    ?? conn.model<IScheda, ISchedaModel>(collectionName, SchedaSchema, collectionName)

  _schedaModels.set(anagraficaSlug, model)
  return model
}
