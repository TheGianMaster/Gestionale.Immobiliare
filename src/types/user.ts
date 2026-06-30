/**
 * src/types/user.ts
 * Tipi TypeScript per utenti e sessioni NextAuth.
 * Il modello Mongoose completo è in src/models/User.ts
 */

export type UserRole = 'admin' | 'operatore'

// Tipo utente serializzato (senza metodi Mongoose, usabile client-side)
export interface IUserSerialized {
  _id: string
  email: string
  nome: string
  cognome: string
  ruolo: UserRole
  attivo: boolean
  lastLogin?: string
  sessionDuration: number
  createdAt: string
  updatedAt: string
}

// ——— AUGMENT NEXTAUTH ———
// Estende i tipi Session e JWT di NextAuth con i campi custom del gestionale.

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      nome: string
      cognome: string
      ruolo: UserRole
    }
  }

  interface User {
    ruolo: UserRole
    nome: string
    cognome: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    ruolo: UserRole
    nome: string
    cognome: string
  }
}
