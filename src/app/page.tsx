/**
 * src/app/page.tsx
 * Route radice — reindirizza a /home (dashboard).
 * Non fare mai redirect('/login') qui: crea un loop con il middleware.
 * L'autenticazione è gestita dal middleware (src/middleware.ts).
 */
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/home')
}
