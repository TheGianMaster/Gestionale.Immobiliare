// Tipi utente — modello completo in T-010

export type UserRole = 'admin' | 'operatore'

export interface IUser {
  _id: string
  email: string
  nome: string
  cognome: string
  ruolo: UserRole
  attivo: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  sessionDuration: number // ore, default 72
}

// Estensione sessione NextAuth — configurata in T-011
declare module 'next-auth' {
  interface Session {
    user: {
      userId: string
      email: string
      nome: string
      cognome: string
      ruolo: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    ruolo: UserRole
    nome: string
    expiresAt: number
  }
}
