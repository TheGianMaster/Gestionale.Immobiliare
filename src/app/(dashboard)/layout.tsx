import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  const user = {
    id:      session?.user?.id      ?? '',
    email:   session?.user?.email   ?? '',
    nome:    session?.user?.nome    ?? '',
    cognome: session?.user?.cognome ?? '',
    ruolo:   session?.user?.ruolo   ?? 'operatore',
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar ruolo={user.ruolo as 'admin' | 'operatore'} />
      <div
        className="flex flex-col flex-1 min-w-0 lg:pl-sidebar"
        style={{ transition: 'padding-left 250ms ease' }}
      >
        <Header user={user} />
        <main className="flex-1 overflow-y-auto mt-header">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
