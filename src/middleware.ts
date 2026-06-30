/**
 * src/middleware.ts
 * Middleware Next.js — protezione route tramite NextAuth v5.
 *
 * IMPORTANTE: importa solo authConfig (edge-compatible), NON auth.ts.
 * auth.ts importa mongoose/bcrypt che non sono compatibili con l'Edge Runtime.
 * Il middleware usa solo la verifica JWT (nessun accesso al DB).
 *
 * Logica:
 * - Route pubbliche (/login): accessibili senza auth; se già loggato → redirect /
 * - Route protette (/*): richiedono auth → redirect /login
 * - Route admin (/controllo/*): richiedono ruolo admin → redirect / se operatore
 */

import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Istanza NextAuth edge-compatible (solo JWT, nessun DB)
const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = ['/login']
const ADMIN_ROUTES  = ['/controllo']

export default auth((req: NextRequest & { auth?: { user?: { ruolo?: string } } }) => {
  const { pathname }     = req.nextUrl
  const isAuthenticated  = !!req.auth

  // ——— ROUTE PUBBLICHE ———
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
    return NextResponse.next()
  }

  // ——— ROUTE PROTETTE ———
  if (!isAuthenticated) {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // ——— ROUTE ADMIN ———
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (req.auth?.user?.ruolo !== 'admin') {
      return NextResponse.redirect(new URL('/home', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
}
