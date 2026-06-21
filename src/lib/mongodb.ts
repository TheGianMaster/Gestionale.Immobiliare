/**
 * src/lib/mongodb.ts
 * Connessione principale MongoDB (users, anagrafiche_config, variabili, notifiche)
 *
 * Usa pattern singleton con cache globale per evitare riconnessioni
 * multiple durante l'hot-reload di Next.js in sviluppo.
 */

import mongoose from 'mongoose'

// ——— VARIABILI ENV ———
const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB || 'gestionale'

if (!MONGODB_URI) {
  throw new Error(
    '[mongodb] MONGODB_URI non definita in .env.local\n' +
    'Aggiungi: MONGODB_URI=mongodb+srv://...'
  )
}

// ——— CACHE GLOBALE (persiste tra hot-reload in sviluppo) ———
declare global {
  // eslint-disable-next-line no-var
  var _mongooseMain: Promise<typeof mongoose> | undefined
}

/**
 * Connette al DB principale e ritorna l'istanza mongoose.
 * In sviluppo usa la cache globale per evitare connessioni multiple.
 */
async function connectDB(): Promise<typeof mongoose> {
  // Già connesso — ritorna subito
  if (mongoose.connection.readyState === 1) {
    return mongoose
  }

  const options: mongoose.ConnectOptions = {
    dbName: MONGODB_DB,
    // Timeout di connessione configurabile via env (default 10s)
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT_MS || '10000'),
    maxPoolSize: 10,
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      // In sviluppo: riusa la connessione esistente tra hot-reload
      if (!global._mongooseMain) {
        global._mongooseMain = mongoose.connect(MONGODB_URI!, options)
      }
      return await global._mongooseMain
    }

    // In produzione: connessione diretta
    return await mongoose.connect(MONGODB_URI!, options)

  } catch (error) {
    console.error('[mongodb] Errore connessione DB principale:', error)
    throw error
  }
}

export default connectDB
