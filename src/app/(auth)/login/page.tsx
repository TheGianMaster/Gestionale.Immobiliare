'use client'

/**
 * src/app/(auth)/login/page.tsx
 * Pagina di login — accessibile solo a utenti non autenticati.
 * Il middleware (src/middleware.ts) redirige a / se già loggati.
 */

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppLogo } from '@/components/ui/AppLogo'
import { APP_CONFIG } from '@/config/app'

// ——— MESSAGGI ERRORE ———
const ERRORI: Record<string, string> = {
  CredentialsSignin: 'Email o password non corretti. Riprova.',
  AccountDisabled:   'Il tuo account è stato disattivato. Contatta l\'amministratore.',
  default:           'Si è verificato un errore. Riprova tra qualche istante.',
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [errore, setErrore]       = useState<string | null>(null)

  // Legge l'eventuale errore passato da NextAuth nell'URL (?error=...)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setErrore(ERRORI[errorParam] ?? ERRORI.default)
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrore(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setErrore(ERRORI[result.error] ?? ERRORI.default)
        return
      }

      // Login riuscito — navigazione hard per garantire che il cookie
      // di sessione sia letto prima del render del layout dashboard.
      // router.push() + router.refresh() causa loop di compiling in dev.
      const callbackUrl = searchParams.get('callbackUrl') || '/home'
      window.location.href = callbackUrl

    } catch {
      setErrore(ERRORI.default)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md animate-slide-up">

        {/* ——— HEADER ——— */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AppLogo size={48} />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {APP_CONFIG.nome}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Accedi al tuo account
          </p>
        </div>

        {/* ——— CARD ——— */}
        <div
          className="rounded-lg p-8"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Messaggio errore */}
            {errore && (
              <div
                className="flex items-start gap-3 rounded-md p-3 text-sm"
                style={{
                  backgroundColor: 'var(--color-error-light)',
                  color: 'var(--color-error-dark)',
                  border: '1px solid var(--color-error)',
                }}
                role="alert"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errore}</span>
              </div>
            )}

            {/* Campo Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                disabled={loading}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-sm transition-colors',
                  'bg-surface text-text-primary placeholder:text-text-muted',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                style={{
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-focus)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>

            {/* Campo Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={cn(
                    'w-full rounded-md px-3 py-2 pr-10 text-sm transition-colors',
                    'bg-surface text-text-primary placeholder:text-text-muted',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  style={{
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-focus)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
                {/* Toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  disabled={loading}
                  aria-label={showPwd ? 'Nascondi password' : 'Mostra password'}
                  className={cn(
                    'btn-icon absolute right-3 top-1/2 -translate-y-1/2',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  {/* Spinner */}
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Accesso in corso...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Accedi</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* ——— NOTA SESSIONE ——— */}
        <div
          className="mt-4 flex items-start gap-2 rounded-md px-4 py-3 text-xs"
          style={{
            backgroundColor: 'var(--color-info-light)',
            color: 'var(--color-info-dark)',
            border: '1px solid var(--color-info)',
          }}
        >
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            La sessione rimane attiva per <strong>72 ore</strong> dal login.
            Il tempo di logout automatico sarà configurabile dal{' '}
            <em>Pannello Controllo → Utenze</em>.
          </span>
        </div>

      </div>
    </div>
  )
}
