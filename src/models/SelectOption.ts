/**
 * src/models/SelectOption.ts
 * Opzioni per campi di tipo "select" / "multiselect".
 * Ogni gruppo di opzioni è identificato da (anagraficaSlug + variabileSlug).
 *
 * Connessione: DB principale (MONGODB_URI)
 */

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISelectOption extends Document {
  anagraficaSlug: string  // A quale anagrafica appartiene
  variabileSlug: string   // A quale campo appartiene (tipo: select/multiselect)
  valore: string          // Valore salvato nel DB (es: "lombardia")
  etichetta: string       // Testo mostrato all'utente (es: "Lombardia")
  colore?: string         // Colore opzionale per badge (hex)
  ordine: number          // Ordine nel dropdown
  attiva: boolean         // Soft-delete (nasconde l'opzione senza perdere dati storici)
  createdAt: Date
  updatedAt: Date
}

export interface ISelectOptionModel extends Model<ISelectOption> {}

const SelectOptionSchema = new Schema<ISelectOption, ISelectOptionModel>(
  {
    anagraficaSlug: {
      type: String,
      required: [true, 'anagraficaSlug obbligatorio'],
      lowercase: true,
      trim: true,
    },
    variabileSlug: {
      type: String,
      required: [true, 'variabileSlug obbligatorio'],
      lowercase: true,
      trim: true,
    },
    valore: {
      type: String,
      required: [true, 'valore obbligatorio'],
      trim: true,
    },
    etichetta: {
      type: String,
      required: [true, 'etichetta obbligatoria'],
      trim: true,
      maxlength: [200, 'Etichetta troppo lunga'],
    },
    colore: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Colore deve essere un hex valido (#RRGGBB)'],
    },
    ordine: { type: Number, default: 0 },
    attiva: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// ——— INDICI ———
SelectOptionSchema.index({ anagraficaSlug: 1, variabileSlug: 1, valore: 1 }, { unique: true })
SelectOptionSchema.index({ anagraficaSlug: 1, variabileSlug: 1, ordine: 1 })

export const SelectOption = (
  mongoose.models?.SelectOption as ISelectOptionModel | undefined
) ?? mongoose.model<ISelectOption, ISelectOptionModel>('SelectOption', SelectOptionSchema)

export default SelectOption
