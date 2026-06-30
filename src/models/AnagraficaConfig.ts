/**
 * src/models/AnagraficaConfig.ts
 * Configurazione di una tipologia di anagrafica.
 * Connessione: DB principale (MONGODB_URI)
 */

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IVarianteConfig {
  id:           string
  nome:         string
  descrizione?: string
}

export interface IAnagraficaConfig extends Document {
  slug:           string
  nome:           string
  descrizione?:   string
  icona:          string
  colore:         string
  variabili:      string[]
  previewColumns: string[]
  varianti:       IVarianteConfig[]
  tipiDocumento:  string[]
  maxDocumentoMB: number
  attiva:         boolean
  ordine:         number
  createdAt:      Date
  updatedAt:      Date
}

export interface IAnagraficaConfigModel extends Model<IAnagraficaConfig> {}

const VarianteConfigSchema = new Schema<IVarianteConfig>(
  {
    id:           { type: String, required: true, trim: true },
    nome:         { type: String, required: true, trim: true },
    descrizione:  { type: String, trim: true },
  },
  { _id: false }
)

const AnagraficaConfigSchema = new Schema<IAnagraficaConfig, IAnagraficaConfigModel>(
  {
    slug: {
      type: String, required: [true, 'Slug obbligatorio'], unique: true,
      lowercase: true, trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug: solo lettere minuscole, numeri e trattini'],
    },
    nome: {
      type: String, required: [true, 'Nome obbligatorio'],
      trim: true, maxlength: [100, 'Nome troppo lungo'],
    },
    descrizione:    { type: String, trim: true },
    icona:          { type: String, default: 'FileText' },
    colore:         { type: String, default: '#6366F1', match: [/^#[0-9A-Fa-f]{6}$/, 'Colore hex non valido'] },
    variabili:      [{ type: String }],
    previewColumns: [{ type: String }],
    varianti:       [VarianteConfigSchema],
    tipiDocumento:  [{ type: String }],
    maxDocumentoMB: { type: Number, default: 10, min: 1, max: 100 },
    attiva:         { type: Boolean, default: true },
    ordine:         { type: Number, default: 0 },
  },
  { timestamps: true }
)

AnagraficaConfigSchema.index({ attiva: 1, ordine: 1 })

export const AnagraficaConfig = (
  mongoose.models?.AnagraficaConfig as IAnagraficaConfigModel | undefined
) ?? mongoose.model<IAnagraficaConfig, IAnagraficaConfigModel>('AnagraficaConfig', AnagraficaConfigSchema)

export default AnagraficaConfig
