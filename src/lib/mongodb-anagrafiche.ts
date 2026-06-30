/**
 * src/lib/mongodb-anagrafiche.ts
 * Connessione DB anagrafiche — ora usa lo stesso MONGODB_URI del DB principale.
 * Tutte le collection (schede_*, variabili, ecc.) vivono nello stesso cluster.
 */

import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'

/**
 * Ritorna la connessione mongoose principale.
 * Mantiene la stessa firma della versione multi-cluster per
 * compatibilità con Scheda.ts, Variante.ts, Documento.ts.
 */
export async function getAnagraficheConnection(): Promise<mongoose.Connection> {
  await connectDB()
  return mongoose.connection
}

export default getAnagraficheConnection
