import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Gestionale',
    template: '%s | Gestionale',
  },
  description: 'Sistema gestionale immobiliare',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" data-theme="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
