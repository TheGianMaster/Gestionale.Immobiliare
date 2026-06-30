/**
 * src/app/(dashboard)/calendario/page.tsx
 * Pagina Calendario.
 */

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { CalendarioClient } from '@/components/calendario/CalendarioClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Calendario' }

export default function CalendarioPage() {
  return (
    <div className="p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand)' }} />
        </div>
      }>
        <CalendarioClient />
      </Suspense>
    </div>
  )
}
