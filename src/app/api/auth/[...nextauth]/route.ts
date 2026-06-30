/**
 * src/app/api/auth/[...nextauth]/route.ts
 * Route handler NextAuth — gestisce tutte le richieste /api/auth/*
 * (login, logout, session, csrf, ecc.)
 */

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
