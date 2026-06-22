/**
 * src/models/AnagraficaConfig.ts
 * Configurazione di una tipologia di anagrafica (es: Clienti, Fornitori, Immobili).
 * Definisce quali variabili/campi ha, quali mostrare in preview, icona, colore ecc.
 *
 * Connessione: DB principale (MONGODB_URI)
 */

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAnagraficaConfig extends Document {
  slug: string           // URL-safe, es: "clienti", "fornitori" — usato nelle route
  nome: string           // Nome visualizzato, es: "Clienti"
  descrizione?: string
  icona: string          // Nome icona Lucide, es: "Users", "Building2"
  colore: string         // Hex color per badge e sidebar, es: "#6366F1"
  variabili: string[]    // Slug variabili in ordine di visualizzazione nel form
  previewColumns: string[] // Slug variabili da mostrare nella lista anteprima
  // TODO: tipiDocumento sarà gestito dal Pannello Controllo > Documenti (WIP — T-090)
  tipiDocumento: string[]
  attiva: boolean
  ordine: number         // Ordine nella sidebar (crescente)
  createdAt: Date
  updatedAt: Date
}

export interface IAnagraficaConfigModel extends Model<IAnagraficaConfig> {}

const AnagraficaConfigSchema = new Schema<IAnagraficaConfig, IAnagraficaConfigModel>(
  {
    slug: {
      type: String,
      required: [true, 'Slug obbligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug deve contenere solo lettere minuscole, numeri e trattini'],
    },
    nome: {
      type: String,
      required: [true, 'Nome obbligatorio'],
      trim: true,
      maxlength: [100, 'Nome troppo lungo'],
    },
    descrizione: { type: String, trim: true },
    icona: { type: String, default: 'FileText' },
    colore: {
      type: String,
      default: '#6366F1',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Colore deve essere un hex valido (#RRGGBB)'],
    },
    variabili: [{ type: String }],
    previewColumns: [{ type: String }],
    tipiDocumento: [{ type: String }],
    attiva: { type: Boolean, default: true },
    ordine: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// ——— INDICI ———
// slug ha già unique:true nella definizione del campo
AnagraficaConfigSchema.index({ attiva: 1, ordine: 1 })

export const AnagraficaConfig = (
  mongoose.models?.AnagraficaConfig as IAnagraficaConfigModel | undefined
) ?? mongoose.model<IAnagraficaConfig, IAnagraficaConfigModel>('AnagraficaConfig', AnagraficaConfigSchema)

export default AnagraficaConfig
