/**
 * src/lib/r2.ts
 * Client Cloudflare R2 (S3-compatible) per upload/download/delete file.
 * Le variabili R2_* sono opzionali -- il sistema degrada gracefully se non configurate.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ENDPOINT       = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID  = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_KEY     = process.env.R2_SECRET_ACCESS_KEY
export const R2_BUCKET  = process.env.R2_BUCKET ?? 'gestionale'

export function getR2Client(): S3Client {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_KEY) {
    throw new Error(
      '[r2] Variabili R2 mancanti. Configura R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in .env.local'
    )
  }
  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId:     R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_KEY,
    },
  })
}

/** Carica un Buffer su R2. Ritorna la s3Key. */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  const client = getR2Client()
  await client.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
  }))
  return key
}

/** Genera URL presigned per accesso diretto (scade dopo expiresIn secondi). */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getR2Client()
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn }
  )
}

/** Elimina un oggetto da R2. */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client()
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}

/** Genera una chiave R2 univoca per il file. */
export function generateR2Key(anagraficaSlug: string, schedaId: string, fileName: string): string {
  const timestamp = Date.now()
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${anagraficaSlug}/${schedaId}/${timestamp}_${safe}`
}

/** Tipi MIME accettati e relativi label */
export const MIME_ACCETTATI: Record<string, string> = {
  'image/jpeg':      'Immagine JPEG',
  'image/png':       'Immagine PNG',
  'application/pdf': 'PDF',
  'text/html':       'HTML',
}

export const MAX_FILE_SIZE_DEFAULT = 10 * 1024 * 1024 // 10 MB
export const MAX_FILE_SIZE = MAX_FILE_SIZE_DEFAULT

export function getMaxFileSize(maxMB: number): number {
  return maxMB * 1024 * 1024
}

/** Ritorna true se R2 e configurato (tutte le variabili env presenti). */
export function isR2Configured(): boolean {
  return !!(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_KEY)
}
