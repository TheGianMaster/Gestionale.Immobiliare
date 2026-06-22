/**
 * scripts/seed-admin.ts
 * Crea il primo utente admin nel sistema.
 *
 * Uso: npm run seed:admin
 * Richiede: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, MONGODB_URI in .env.local
 *
 * Idempotente: non ricrea l'admin se esiste già.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import mongoose from 'mongoose'

// Carica .env.local dalla root del progetto
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Importa il modello dopo aver caricato le env (il modello legge INVITE_TOKEN_PEPPER)
async function main() {
  const email    = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  const mongoUri = process.env.MONGODB_URI
  const mongoDB  = process.env.MONGODB_DB || 'gestionale'

  // ——— VALIDAZIONE ENV ———
  if (!email || !password) {
    console.error('❌ SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD richiesti nel .env.local')
    process.exit(1)
  }
  if (!mongoUri) {
    console.error('❌ MONGODB_URI richiesta nel .env.local')
    process.exit(1)
  }
  if (!process.env.INVITE_TOKEN_PEPPER) {
    console.error('❌ INVITE_TOKEN_PEPPER richiesta nel .env.local')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('❌ SEED_ADMIN_PASSWORD deve essere di almeno 8 caratteri')
    process.exit(1)
  }

  // ——— CONNESSIONE DB ———
  console.log('🔌 Connessione a MongoDB...')
  await mongoose.connect(mongoUri, { dbName: mongoDB })
  console.log(`✅ Connesso al DB: ${mongoDB}`)

  // Importa il modello User (dopo la connessione per evitare problemi di timing)
  const { User } = await import('../src/models/User')

  // ——— CONTROLLO ESISTENZA ———
  const esistente = await User.findOne({ email: email.toLowerCase() })
  if (esistente) {
    console.log(`ℹ️  Admin già esistente: ${email}`)
    console.log(`   Ruolo: ${esistente.ruolo} | Attivo: ${esistente.attivo}`)
    await mongoose.disconnect()
    return
  }

  // ——— CREAZIONE ADMIN ———
  // passwordHash riceve il plain text — l'hook pre('save') lo trasforma in hash bcrypt+pepper
  const admin = new User({
    email:        email.toLowerCase(),
    passwordHash: password,
    nome:         'Admin',
    cognome:      'Sistema',
    ruolo:        'admin',
    attivo:       true,
  })

  await admin.save()

  console.log('✅ Admin creato con successo!')
  console.log(`   Email:  ${admin.email}`)
  console.log(`   Nome:   ${admin.nomeCompleto()}`)
  console.log(`   Ruolo:  ${admin.ruolo}`)
  console.log(`   ID:     ${admin._id}`)

  await mongoose.disconnect()
  console.log('🔌 Disconnesso da MongoDB')
}

main().catch((err) => {
  console.error('❌ Errore durante il seed:', err)
  process.exit(1)
})
