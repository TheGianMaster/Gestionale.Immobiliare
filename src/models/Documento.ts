/**
 * src/models/Documento.ts
 * Allegato/documento associato a una Scheda.
 * Il file fisico risiede su S3/R2 — qui teniamo solo i metadati.
 *
 * Connessione: DB Anagrafiche (MONGODB_URI_ANAGRAFICHE), collection "documenti"
 */

import { Schema, Document, Model } from 'mongoose'
import { getAnagraficheConnection } from '@/lib/mongodb-anagrafiche'

export interface IDocumento extends Document {
  schedaId: Schema.Types.ObjectId    // Scheda a cui appartiene il documento
  anagraficaSlug: string             // Slug anagrafica — per query dirette
  tipo: string                       // Tipo documento (es: "contratto", "visura", "foto")
  nome: string                       // Nome originale del file (es: "contratto_2024.pdf")
  mimeType: string                   // MIME type (es: "application/pdf", "image/jpeg")
  dimensione: number                 // Dimensione in byte
  s3Key: string                      // Chiave oggetto S3/R2 (path nel bucket)
  s3Bucket: string                   // Nome bucket S3/R2
  urlPresigned?: string              // URL firmato (non persistere — generare on-demand)
  note?: string                      // Note libere sull'allegato
  caricatoDa: Schema.Types.ObjectId  // userId
  attivo: boolean                    // Soft-delete
  createdAt: Date
  updatedAt: Date
}

export interface IDocumentoModel extends Model<IDocumento> {}

export const DocumentoSchema = new Schema<IDocumento, IDocumentoModel>(
  {
    schedaId: {
      type: Schema.Types.ObjectId,
      required: [true, 'schedaId obbligatorio'],
    },
    anagraficaSlug: {
      type: String,
      required: [true, 'anagraficaSlug obbligatorio'],
      lowercase: true,
      trim: true,
    },
    tipo: {
      type: String,
      required: [true, 'tipo obbligatorio'],
      trim: true,
      lowercase: true,
    },
    nome: {
      type: String,
      required: [true, 'nome file obbligatorio'],
      trim: true,
      maxlength: [255, 'Nome file troppo lungo'],
    },
    mimeType: {
      type: String,
      required: [true, 'mimeType obbligatorio'],
      trim: true,
    },
    dimensione: {
      type: Number,
      required: [true, 'dimensione obbligatoria'],
      min: [0, 'dimensione non può essere negativa'],
    },
    s3Key: {
      type: String,
      required: [true, 's3Key obbligatorio'],
      trim: true,
    },
    s3Bucket: {
      type: String,
      required: [true, 's3Bucket obbligatorio'],
      trim: true,
    },
    // urlPresigned NON va salvato — è sempre generato runtime
    urlPresigned: { type: String, select: false },
    note: { type: String, trim: true, maxlength: 1000 },
    caricatoDa: {
      type: Schema.Types.ObjectId,
      required: [true, 'caricatoDa obbligatorio'],
    },
    attivo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// ——— INDICI ———
DocumentoSchema.index({ schedaId: 1, attivo: 1 })
DocumentoSchema.index({ anagraficaSlug: 1, tipo: 1 })
DocumentoSchema.index({ s3Key: 1 }, { unique: true })

/**
 * Model registrato sulla connessione anagrafiche.
 * Tutti i documenti vanno nella collection "documenti" (non per-anagrafica).
 */
let _DocumentoModel: IDocumentoModel | null = null

export async function getDocumentoModel(): Promise<IDocumentoModel> {
  if (_DocumentoModel) return _DocumentoModel
  const conn = await getAnagraficheConnection()
  _DocumentoModel = (conn.models.Documento as IDocumentoModel | undefined)
    ?? conn.model<IDocumento, IDocumentoModel>('Documento', DocumentoSchema)
  return _DocumentoModel
}
