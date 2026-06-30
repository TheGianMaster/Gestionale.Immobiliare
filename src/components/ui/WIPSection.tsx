/**
 * src/components/ui/WIPSection.tsx
 * Placeholder professionale per sezioni in sviluppo nel Pannello di Controllo.
 */

import { Construction } from 'lucide-react'

interface WIPSectionProps {
  nome: string
  descrizione: string
  icona: React.ReactNode
  nota?: string
}

export function WIPSection({ nome, descrizione, icona, nota }: WIPSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 max-w-md mx-auto">
      {/* Icona sezione */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
        {icona}
      </div>

      {/* Badge WIP */}
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
        style={{ backgroundColor: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B50' }}>
        <Construction className="w-3.5 h-3.5" />
        Work in Progress
      </span>

      <h3 className="text-base font-semibold text-text-primary mb-2">{nome}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{descrizione}</p>

      {nota && (
        <div className="mt-4 px-4 py-3 rounded-xl text-sm text-left w-full"
          style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', border: '1px solid var(--color-info-border)' }}>
          <p className="font-medium mb-0.5">Nota</p>
          <p className="text-xs opacity-90">{nota}</p>
        </div>
      )}
    </div>
  )
}
