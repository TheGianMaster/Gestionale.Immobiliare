# 📎 DOC-05 — GESTIONE DOCUMENTI (Cloudflare R2)
> **Leggi questo file per:** T-060, T-061
> **File chiave:** `src/lib/r2.ts`, `src/app/api/documenti/`, `src/components/anagrafica/`

---

## 1. ARCHITETTURA STORAGE

```
Browser → Next.js API Route → Cloudflare R2
                          ↓
                     MongoDB (metadati)
```

**Percorso file su R2:**
```
{anagraficaSlug}/{schedaId}/{timestamp}_{nomeFileOriginale}
Esempio: clienti/65abc123/1705680000000_contratto.pdf
```

**Tipi MIME accettati:**
- `image/jpeg` — immagini
- `application/pdf` — documenti PDF
- `text/html` — pagine HTML

**Limite dimensione:** 10MB per file

---

## 2. CLIENT R2 (S3-COMPATIBLE)

```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 è S3-compatible — usa l'SDK AWS con endpoint custom
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET!

// Upload file
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }))
  return key
}

// Genera URL presigned per download (scade dopo 1 ora)
export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 }
  )
}

// Elimina file
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// Genera key R2 univoca
export function generateR2Key(anagraficaSlug: string, schedaId: string, fileName: string): string {
  const timestamp = Date.now()
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${anagraficaSlug}/${schedaId}/${timestamp}_${safeFileName}`
}
```

---

## 3. API DOCUMENTI

### POST /api/documenti/upload
```typescript
// Riceve: FormData con 'file', 'schedaId', 'anagraficaSlug', 'tipoDocumento'
// 1. Valida MIME type e dimensione
// 2. Leggi il buffer del file
// 3. Genera r2Key
// 4. Carica su R2
// 5. Salva metadati in MongoDB
// 6. Risponde con IDocumento creato

// Content-Type: multipart/form-data
// Body: FormData
//   - file: File
//   - schedaId: string
//   - anagraficaSlug: string
//   - tipoDocumento: string

// Validazione:
const MIME_ACCETTATI = ['image/jpeg', 'application/pdf', 'text/html']
const MAX_SIZE = 10 * 1024 * 1024  // 10MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return Response.json({ error: 'File mancante' }, { status: 400 })
  if (!MIME_ACCETTATI.includes(file.type)) {
    return Response.json({ error: 'Tipo file non supportato. Accettati: JPEG, PDF, HTML' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File troppo grande. Massimo 10MB.' }, { status: 400 })
  }
  // ... resto implementazione
}
```

### GET /api/documenti
```typescript
// Query params: schedaId (obbligatorio)
// Response: { data: IDocumento[] }
// Ordinati per caricatoAt DESC
```

### DELETE /api/documenti/[id]
```typescript
// 1. Trova il documento in MongoDB
// 2. Elimina da R2 (deleteFromR2)
// 3. Elimina record MongoDB
// Response: { success: true }
```

### GET /api/documenti/[id]/url
```typescript
// Genera URL presigned per download sicuro
// Response: { url: string, expiresIn: 3600 }
// Il browser usa questo URL per scaricare direttamente da R2
```

---

## 4. UI SEZIONE DOCUMENTI

### Layout
```
┌────────────────────────────────────────────────────────┐
│ ← Dati  [Documenti]                                   │  ← Tab attiva
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │   📁 Trascina i file qui                        │  │  ← Drag & Drop
│  │   oppure                                        │  │
│  │   [Sfoglia file]                                │  │
│  │                                                 │  │
│  │   Formati accettati: JPEG, PDF, HTML · Max 10MB │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  DOCUMENTI CARICATI (3)                               │
│  ┌────┬──────────────┬────────────┬──────┬──────────┐ │
│  │📄  │ contratto.pdf│ Contratto  │ 2.1MB│ 12/01/25 │ │  → [👁][⬇][🗑]
│  │🖼️  │ foto_id.jpg  │ Documento  │ 0.8MB│ 10/01/25 │ │
│  │🌐  │ preventivo.. │ Preventivo │ 45KB │ 08/01/25 │ │
│  └────┴──────────────┴────────────┴──────┴──────────┘ │
└────────────────────────────────────────────────────────┘
```

### Modale selezione tipo documento
```typescript
// Appare dopo la selezione del file, PRIMA dell'upload
// ┌──────────────────────────────────────┐
// │ Tipo documento                        │
// │ ─────────────────────────────────── │
// │ Seleziona il tipo di documento:       │
// │ ┌──────────────────────────────────┐ │
// │ │ Contratto                     ▼  │ │  ← Dropdown tipo
// │ └──────────────────────────────────┘ │
// │                                      │
// │ [Annulla]           [Carica file]    │
// └──────────────────────────────────────┘

// TODO: I tipi documento saranno configurabili dal Pannello Controllo > Documenti (WIP)
// Per ora, usa lista fissa definita in AnagraficaConfig.tipiDocumento
// Se la lista è vuota, usa tipi di default: ["Documento", "Contratto", "Fattura", "Altro"]
```

### Preview in-browser
```typescript
// Click su 👁 (view):
// - PDF: apri in iframe in modale fullscreen o nuova tab
// - JPEG: mostra in modale con <img>
// - HTML: apri in iframe in modale (ATTENZIONE: sandbox per sicurezza)
//   <iframe sandbox="allow-same-origin" src={presignedUrl} />
```

### Icone per tipo MIME
```typescript
const iconaPerMime: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'text/html': '🌐',
}
```

---

## 5. CONFIGURAZIONE R2 — CORS

Nel bucket R2 su Cloudflare Dashboard, aggiungi questa policy CORS:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://tuo-dominio.it"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "MaxAgeSeconds": 86400
  }
]
```

**NOTA:** I file vengono caricati tramite Next.js API (server-side), non direttamente dal browser. Il CORS è necessario solo per i presigned URL di download/preview.
