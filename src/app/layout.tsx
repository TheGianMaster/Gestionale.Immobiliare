import type { Metadata } from 'next'
import Script from 'next/script'
import '@/styles/globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: {
    default: 'GianBusiness',
    template: '%s | GianBusiness',
  },
  description: 'Sistema gestionale immobiliare',
  robots: { index: false, follow: false },
}

const restoreScript = "(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');var m=localStorage.getItem('sidebar-mode');if(m==='icons'||m==='hover')document.documentElement.style.setProperty('--sidebar-width','60px');}catch(e){}})()"

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" data-theme="light" suppressHydrationWarning>
      <head>
        <Script
          id="theme-restore"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: restoreScript }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
