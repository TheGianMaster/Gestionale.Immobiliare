/**
 * src/models/Documento.ts
 * Allegato/documento associato a una Scheda.
 * Il file fisico risiede su Cloudflare R2 -- qui teniamo solo i metadati.
 */

import mongoose, { Schema, Document, Model } from 'mongoose'
import connectDB from '@/lib/mongodb'

export interface IDocumento extends Document {
  schedaId: Schema.Types.ObjectId
  anagraficaSlug: string
  tipo: string
  nome: string
  mimeType: string
  dimensione: number
  s3Key: string
  s3Bucket: string
  note?: string
  caricatoDa: Schema.Types.ObjectId
  attivo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IDocumentoModel extends Model<IDocumento> {}

export const DocumentoSchema = new Schema<IDocumento, IDocumentoModel>(
  {
    schedaId:       { type: Schema.Types.ObjectId, required: true },
    anagraficaSlug: { type: String, required: true, lowercase: true, trim: true },
    tipo:           { type: String, required: true, trim: true, lowercase: true },
    nome:           { type: String, required: true, trim: true, maxlength: 255 },
    mimeType:       { type: String, required: true, trim: true },
    dimensione:     { type: Number, required: true, min: 0 },
    s3Key:          { type: String, required: true, trim: true },
    s3Bucket:       { type: String, required: true, trim: true },
    note:           { type: String, trim: true, maxlength: 1000 },
    caricatoDa:     { type: Schema.Types.ObjectId, required: true },
    attivo:         { type: Boolean, default: true },
  },
  { timestamps: true }
)

DocumentoSchema.index({ schedaId: 1, attivo: 1 })
DocumentoSchema.index({ s3Key: 1 }, { unique: true })

let _DocumentoModel: IDocumentoModel | null = null

export async function getDocumentoModel(): Promise<IDocumentoModel> {
  if (_DocumentoModel) return _DocumentoModel
  await connectDB()
  _DocumentoModel = (mongoose.models?.Documento as IDocumentoModel | undefined)
    ?? mongoose.model<IDocumento, IDocumentoModel>('Documento', DocumentoSchema)
  return _DocumentoModel
}
