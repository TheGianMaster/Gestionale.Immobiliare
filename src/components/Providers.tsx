'use client'

/**
 * src/components/Providers.tsx
 * Wrapper client-side per i provider globali dell'app.
 * Deve stare nel root layout per essere disponibile ovunque.
 *
 * - SessionProvider: abilita useSession() nei client components
 */

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
