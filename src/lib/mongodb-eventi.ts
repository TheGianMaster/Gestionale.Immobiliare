/**
 * src/lib/mongodb-eventi.ts
 * Connessione al DB principale per la collection eventi.
 * Delegato a connectDB() per mantenere una singola connessione MongoDB.
 */

import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'

export async function getEventiConnection(): Promise<mongoose.Connection> {
  await connectDB()
  return mongoose.connection
}

export default getEventiConnection
