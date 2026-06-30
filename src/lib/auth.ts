/**
 * src/lib/auth.ts
 * Configurazione NextAuth v5 con Credentials Provider.
 *
 * Flusso login:
 * 1. Utente invia email + password
 * 2. authorize() cerca l'utente nel db e verifica la password (bcrypt + pepper)
 * 3. Se valido, aggiorna lastLogin e ritorna i dati utente
 * 4. NextAuth crea un JWT con durata 72 ore (configurabile per utente in futuro — T-090)
 * 5. Il JWT viene esteso con ruolo, nome, cognome nei callbacks
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'
import { authConfig } from '@/lib/auth.config'

/**
 * Configurazione completa con Credentials provider (Node.js runtime).
 * Estende authConfig (edge-compatible) aggiungendo la logica di autenticazione
 * che richiede accesso al database (mongoose, bcrypt).
 * Usato da server components e API routes, NON dal middleware.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          await connectDB()

          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase().trim(),
            attivo: true,
          })

          if (!user) return null

          const passwordValida = await user.comparePassword(
            credentials.password as string
          )

          if (!passwordValida) return null

          // Fire-and-forget — non blocca il login
          User.updateOne({ _id: user._id }, { lastLogin: new Date() })
            .catch((err) => console.error('[auth] Errore lastLogin:', err))

          return {
            id:      user._id.toString(),
            email:   user.email,
            name:    user.nomeCompleto(),
            ruolo:   user.ruolo,
            nome:    user.nome,
            cognome: user.cognome,
          }

        } catch (error) {
          console.error('[auth] Errore durante authorize:', error)
          return null
        }
      },
    }),
  ],
})
