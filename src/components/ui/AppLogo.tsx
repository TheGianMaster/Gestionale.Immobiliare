'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { APP_CONFIG } from '@/config/app'

interface AppLogoProps {
  /** Quadrato fisso (modalita icona/collapsed) */
  size?: number
  /** Larghezza al 100% del contenitore, altezza auto (modalita espansa full-width) */
  fullWidth?: boolean
  /** Altezza fissa con larghezza auto */
  height?: number
  maxWidth?: number
  className?: string
}

export function AppLogo({ size, fullWidth, height, maxWidth, className = '' }: AppLogoProps) {
  const [error, setError] = useState(false)

  const fallbackSize = size ?? height ?? 40

  if (!error) {
    const style = fullWidth
      ? { width: '100%', height: 'auto', display: 'block' }
      : height
        ? { height, width: 'auto', maxWidth: maxWidth ?? 200 }
        : { width: fallbackSize, height: fallbackSize }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={APP_CONFIG.logo}
        alt={APP_CONFIG.nome}
        onError={() => setError(true)}
        className={cn('object-contain shrink-0', className)}
        style={style}
      />
    )
  }

  // Placeholder fallback
  if (fullWidth) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-lg font-bold w-full', className)}
        style={{
          height: 64,
          fontSize: 28,
          backgroundColor: 'var(--color-brand)',
          color: 'var(--color-text-on-brand)',
        }}
      >
        {APP_CONFIG.logoFallback}
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center justify-center rounded-lg font-bold shrink-0', className)}
      style={{
        width: size ?? (maxWidth ? Math.min(maxWidth, fallbackSize * 2) : fallbackSize),
        height: fallbackSize,
        fontSize: fallbackSize * 0.42,
        backgroundColor: 'var(--color-brand)',
        color: 'var(--color-text-on-brand)',
      }}
    >
      {APP_CONFIG.logoFallback}
    </div>
  )
}
