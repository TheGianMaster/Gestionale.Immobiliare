/**
 * scripts/reset-anagrafiche.ts
 * Elimina TUTTE le anagrafiche, le variabili, le schede, i select options
 * e i documenti (MongoDB + R2).
 *
 * USO: npm run reset:anagrafiche
 * RICHIEDE: digitare "ELIMINA" per confermare.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import mongoose from 'mongoose'
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const ok  = (msg: string) => console.log('  OK  ' + msg)
const log = (msg: string) => console.log('  --  ' + msg)

async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question('\nATTENZIONE: questa operazione elimina TUTTE le anagrafiche e i dati collegati.\n   Digita "ELIMINA" per confermare: ', ans => {
      rl.close()
      resolve(ans.trim() === 'ELIMINA')
    })
  })
}

async function connectMain() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI non trovata in .env.local')
  const db = process.env.MONGODB_DB ?? 'gestionale'
  const conn = await mongoose.createConnection(uri, { dbName: db }).asPromise()
  ok('DB principale connesso (' + db + ')')
  return conn
}

async function connectAnagrafiche() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI non trovata in .env.local')
  const db = process.env.MONGODB_DB_ANAGRAFICHE ?? 'anagrafiche'
  const conn = await mongoose.createConnection(uri, { dbName: db }).asPromise()
  ok('DB anagrafiche connesso (' + db + ')')
  return conn
}

async function main() {
  if (!(await confirm())) {
    console.log('\n  Operazione annullata.\n')
    process.exit(0)
  }

  console.log('\n--- Connessione DB ---')
  const mainConn = await connectMain()
  const anaConn  = await connectAnagrafiche()

  console.log('\n--- Pulizia DB principale ---')
  for (const coll of ['anagraficaconfigs', 'variabiles', 'selectoptions', 'documenti', 'variantes']) {
    try {
      const c = mainConn.collection(coll)
      const res = await c.deleteMany({})
      ok(coll + ': ' + res.deletedCount + ' documenti eliminati')
    } catch {
      log(coll + ': collection non trovata o vuota')
    }
  }

  console.log('\n--- Pulizia schede (DB anagrafiche) ---')
  const collections = await anaConn.db.listCollections().toArray()
  for (const c of collections) {
    if (c.name.startsWith('schede_')) {
      const res = await anaConn.collection(c.name).deleteMany({})
      ok(c.name + ': ' + res.deletedCount + ' schede eliminate')
    }
  }

  const r2Key    = process.env.R2_ACCESS_KEY_ID
  const r2Secret = process.env.R2_SECRET_ACCESS_KEY
  const r2Bucket = process.env.R2_BUCKET_NAME
  const r2Url    = process.env.R2_ENDPOINT_URL

  if (r2Key && r2Secret && r2Bucket && r2Url) {
    console.log('\n--- Pulizia R2 ---')
    const s3 = new S3Client({
      region: 'auto',
      endpoint: r2Url,
      credentials: { accessKeyId: r2Key, secretAccessKey: r2Secret },
    })
    let continuationToken: string | undefined
    let totalDeleted = 0
    do {
      const list = await s3.send(new ListObjectsV2Command({
        Bucket: r2Bucket,
        ContinuationToken: continuationToken,
      }))
      for (const obj of list.Contents ?? []) {
        if (obj.Key) {
          await s3.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: obj.Key }))
          totalDeleted++
        }
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
    } while (continuationToken)
    ok('R2: ' + totalDeleted + ' file eliminati')
  } else {
    log('R2 non configurato -- skip')
  }

  await mainConn.close()
  await anaConn.close()

  console.log('\nReset completato.\n')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
