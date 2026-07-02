/**
 * scripts/reset-tutte-schede.ts
 * Elimina TUTTE le schede e i documenti di OGNI anagrafica.
 * Le configurazioni (AnagraficaConfig, Variabile, SelectOption) non vengono toccate.
 *
 * USO: npm run reset:tutte-schede
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import mongoose from 'mongoose'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const ok   = (msg: string) => console.log('  \x1b[32mOK\x1b[0m  ' + msg)
const log  = (msg: string) => console.log('  --  ' + msg)
const warn = (msg: string) => console.log('  \x1b[33m!!\x1b[0m  ' + msg)
const err  = (msg: string) => console.log('  \x1b[31mERR\x1b[0m ' + msg)

// ── Conferma interattiva ───────────────────────────────────────────────────────
async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(
      '\n\x1b[31mATTENZIONE\x1b[0m: stai per eliminare TUTTE le schede di TUTTE le anagrafiche.\n' +
      '  Le configurazioni (variabili, select options, ecc.) resteranno intatte.\n' +
      '  Digita "ELIMINA TUTTO" per confermare: ',
      ans => { rl.close(); resolve(ans.trim() === 'ELIMINA TUTTO') }
    )
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!(await confirm())) {
    console.log('\n  Operazione annullata.\n')
    process.exit(0)
  }

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI non trovata in .env.local')
  const dbName = process.env.MONGODB_DB ?? 'gestionale'

  console.log('\n--- Connessione DB ---')
  await mongoose.connect(uri, { dbName })
  ok(`Connesso a "${dbName}"`)

  const db = mongoose.connection.db!

  // ── Leggi tutte le anagrafiche attive ────────────────────────────────────────
  const anagraficheCol = db.collection('anagraficaconfigs')
  const anagrafiche = await anagraficheCol.find({}, { projection: { slug: 1 } }).toArray()
  const slugs = anagrafiche.map(a => a.slug as string).filter(Boolean)

  if (slugs.length === 0) {
    warn('Nessuna anagrafica trovata nel DB. Niente da fare.')
    await mongoose.disconnect()
    process.exit(0)
  }

  log(`Anagrafiche trovate: ${slugs.join(', ')}`)

  // ── Lista collection esistenti nel DB ────────────────────────────────────────
  const allColls = (await db.listCollections().toArray()).map(c => c.name)

  // ── R2 setup ─────────────────────────────────────────────────────────────────
  const r2Key    = process.env.R2_ACCESS_KEY_ID
  const r2Secret = process.env.R2_SECRET_ACCESS_KEY
  const r2Bucket = process.env.R2_BUCKET_NAME
  const r2Url    = process.env.R2_ENDPOINT_URL
  const r2Ready  = !!(r2Key && r2Secret && r2Bucket && r2Url)

  let s3: S3Client | null = null
  if (r2Ready) {
    s3 = new S3Client({
      region: 'auto',
      endpoint: r2Url,
      credentials: { accessKeyId: r2Key!, secretAccessKey: r2Secret! },
    })
  } else {
    warn('R2 non configurato — i file allegati NON verranno eliminati da R2')
  }

  const docsColl = db.collection('documenti')

  let totalSchede = 0
  let totalDocs   = 0
  let totalR2     = 0

  // ── Per ogni anagrafica ───────────────────────────────────────────────────────
  for (const slug of slugs) {
    console.log(`\n  · ${slug.toUpperCase()}`)

    const collName = `schede_${slug}`
    // Trova la collection reale (Mongoose potrebbe aver pluralizzato)
    const realColl = allColls.includes(collName)
      ? collName
      : allColls.includes(collName + 's')
        ? collName + 's'
        : null

    // 1. Raccolta documenti PRIMA di eliminare le schede
    const docs = await docsColl
      .find({ anagraficaSlug: slug }, { projection: { s3Key: 1 } })
      .toArray()

    // 2. Elimina schede
    if (!realColl) {
      log(`    schede: collection non trovata — skip`)
    } else {
      const res = await db.collection(realColl).deleteMany({})
      ok(`    schede (${realColl}): ${res.deletedCount} eliminate`)
      totalSchede += res.deletedCount
    }

    // 3. Elimina documenti
    if (docs.length === 0) {
      log(`    documenti: nessuno`)
    } else {
      const resDocs = await docsColl.deleteMany({ anagraficaSlug: slug })
      ok(`    documenti: ${resDocs.deletedCount} eliminati`)
      totalDocs += resDocs.deletedCount
    }

    // 4. Elimina file R2
    if (docs.length > 0) {
      if (!s3) {
        warn(`    R2: ${docs.length} file non eliminati (R2 non configurato)`)
      } else {
        let deleted = 0, errors = 0
        for (const doc of docs) {
          const key = doc.s3Key as string
          if (!key) continue
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: r2Bucket!, Key: key }))
            deleted++
          } catch (e) {
            warn(`    R2 errore su ${key}: ${e}`)
            errors++
          }
        }
        ok(`    R2: ${deleted} file eliminati${errors > 0 ? ` (${errors} errori)` : ''}`)
        totalR2 += deleted
      }
    }
  }

  await mongoose.disconnect()

  console.log('\n' + '─'.repeat(50))
  console.log(`\x1b[32mReset completato.\x1b[0m`)
  console.log(`  Schede eliminate : ${totalSchede}`)
  console.log(`  Documenti        : ${totalDocs}`)
  if (r2Ready) console.log(`  File R2          : ${totalR2}`)
  console.log('')
  process.exit(0)
}

main().catch(e => { err(String(e)); process.exit(1) })
