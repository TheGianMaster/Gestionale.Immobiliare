/**
 * src/models/TipoCalendario.ts
 * Tipi di appuntamento configurabili dal Pannello Controllo.
 */

import mongoose, { Schema, Document, Model } from 'mongoose'
import connectDB from '@/lib/mongodb'

export interface ITipoCalendario extends Document {
  nome: string
  colore: string
  icona?: string
  ordine: number
  attivo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ITipoCalendarioModel extends Model<ITipoCalendario> {}

const TipoCalendarioSchema = new Schema<ITipoCalendario, ITipoCalendarioModel>(
  {
    nome:   { type: String, required: true, trim: true, maxlength: 100 },
    colore: { type: String, default: '#6366F1', match: /^#[0-9A-Fa-f]{6}$/ },
    icona:  { type: String, trim: true },
    ordine: { type: Number, default: 0 },
    attivo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

TipoCalendarioSchema.index({ ordine: 1, attivo: 1 })

let _Model: ITipoCalendarioModel | null = null

export async function getTipoCalendarioModel(): Promise<ITipoCalendarioModel> {
  if (_Model) return _Model
  await connectDB()
  _Model = (mongoose.models?.TipoCalendario as ITipoCalendarioModel | undefined)
    ?? mongoose.model<ITipoCalendario, ITipoCalendarioModel>('TipoCalendario', TipoCalendarioSchema)
  return _Model
}
