/**
 * src/lib/auth.config.ts
 * Configurazione NextAuth edge-compatible — usata dal middleware.
 * NON importa mongoose, mongodb, bcrypt o altri moduli Node.js-only.
 * Contiene solo la logica JWT/session che il middleware necessita per
 * verificare i token senza accedere al database.
 */

import type { NextAuthConfig } from 'next-auth'
import type { UserRole } from '@/types/user'

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 72 * 60 * 60,
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId  = user.id
        token.ruolo   = (user as { ruolo: UserRole }).ruolo
        token.nome    = (user as { nome: string }).nome
        token.cognome = (user as { cognome: string }).cognome
      }
      return token
    },

    session({ session, token }) {
      if (token && session.user) {
        session.user.id      = token.userId  as string
        session.user.ruolo   = token.ruolo   as UserRole
        session.user.nome    = token.nome    as string
        session.user.cognome = token.cognome as string
      }
      return session
    },
  },

  // I providers vengono aggiunti in auth.ts (Node.js) — qui non servono
  // perché il middleware usa solo la verifica JWT, non l'autenticazione.
  providers: [],
}
