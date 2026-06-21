import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Abilita strict mode React per individuare bug in sviluppo
  reactStrictMode: true,

  // Ottimizzazione immagini
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Header di sicurezza (completati in T-130)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
