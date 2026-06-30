/**
 * src/models/Variabile.ts
 * Definisce un campo di un'anagrafica.
 * Connessione: DB principale (MONGODB_URI)
 */

import mongoose, { Schema, Document, Model } from 'mongoose'
import type { TipoVariabile } from '@/types/variabili'

export type { TipoVariabile }

const TIPI_VARIABILE: TipoVariabile[] = [
  'text', 'text-area', 'numbers', 'mail', 'phone',
  'data', 'select', 'reference', 'multi-reference', 'variantID', 'line-items',
]

export interface IColonnaLineItems {
  slug:         string
  nome:         string
  tipo:         'text' | 'numbers' | 'reference'
  referenceTo?: string
  decimali?:    boolean
  placeholder?: string
}

export interface IVariabile extends Document {
  slug:             string
  nome:             string
  tipo:             TipoVariabile
  anagraficaSlug:   string
  obbligatorio:     boolean
  descrizione?:     string
  placeholder?:     string

  maxLength?:       number
  min?:             number
  max?:             number
  decimali?:        boolean

  referenceTo?:     string
  colonne?:         IColonnaLineItems[]
  soloPerVarianti?: string[]

  ordine:           number
  visibileInPreview: boolean

  createdAt: Date
  updatedAt: Date
}

export interface IVariabileModel extends Model<IVariabile> {}

const VariabileSchema = new Schema<IVariabile, IVariabileModel>(
  {
    slug: {
      type: String, required: [true, 'Slug obbligatorio'],
      lowercase: true, trim: true,
      match: [/^[a-z0-9_]+$/, 'Slug: solo lettere minuscole, numeri e underscore'],
    },
    nome: {
      type: String, required: [true, 'Nome obbligatorio'],
      trim: true, maxlength: [100, 'Nome troppo lungo'],
    },
    tipo: {
      type: String, required: [true, 'Tipo obbligatorio'],
      enum: { values: TIPI_VARIABILE, message: 'Tipo non valido: {VALUE}' },
    },
    anagraficaSlug: {
      type: String, required: [true, 'anagraficaSlug obbligatorio'],
      lowercase: true, trim: true,
    },
    obbligatorio:     { type: Boolean, default: false },
    descrizione:      { type: String, trim: true },
    placeholder:      { type: String, trim: true },
    maxLength:        { type: Number, min: 1 },
    min:              { type: Number },
    max:              { type: Number },
    decimali:         { type: Boolean, default: false },
    referenceTo:      { type: String, lowercase: true, trim: true },
    colonne: [{
      _id: false,
      slug:        { type: String, required: true, trim: true },
      nome:        { type: String, required: true, trim: true },
      tipo:        { type: String, enum: ['text', 'numbers', 'reference'], required: true },
      referenceTo: { type: String, lowercase: true, trim: true },
      decimali:    { type: Boolean, default: false },
      placeholder: { type: String, trim: true },
    }],
    soloPerVarianti:  [{ type: String }],
    ordine:           { type: Number, default: 0 },
    visibileInPreview:{ type: Boolean, default: false },
  },
  { timestamps: true }
)

VariabileSchema.index({ anagraficaSlug: 1, slug: 1 }, { unique: true })
VariabileSchema.index({ anagraficaSlug: 1, ordine: 1 })

export const Variabile = (
  mongoose.models?.Variabile as IVariabileModel | undefined
) ?? mongoose.model<IVariabile, IVariabileModel>('Variabile', VariabileSchema)

export default Variabile
