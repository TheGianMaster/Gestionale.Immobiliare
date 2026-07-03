/**
 * src/app/(dashboard)/bilancio/overview/page.tsx
 * Route: /bilancio/overview
 */

import { BarChart2 } from 'lucide-react'

export default function BilancioOverviewPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-brand-light)' }}
      >
        <BarChart2 className="w-7 h-7" style={{ color: 'var(--color-brand)' }} />
      </div>
      <h1 className="text-xl font-semibold text-text-primary">Bilancio — Overview</h1>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Work in progress
      </p>
    </div>
  )
}
