/**
 * src/app/(auth)/layout.tsx
 * Layout per le route di autenticazione (/login, ecc.)
 * Non include sidebar né header — pagine standalone.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
