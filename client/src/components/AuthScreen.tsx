import { hostedAuthUrl } from '../auth'

interface AuthScreenProps {
  loading: boolean
  error: string | null
}

export function AuthScreen({ loading, error }: AuthScreenProps) {
  const linkBase = 'rounded px-6 py-2 text-center font-bold transition-colors'

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-stone-700 bg-stone-800 px-6 py-8 sm:px-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">Two Towers</h1>
          <p className="mt-1 text-sm text-stone-400">The card game</p>
        </div>

        {loading ? (
          <p className="text-sm text-stone-400">Checking your account…</p>
        ) : (
          <div className="flex w-full flex-col gap-3">
            {error && (
              <p className="rounded border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <a href={hostedAuthUrl('login')} className={`${linkBase} bg-amber-600 text-white hover:bg-amber-500`}>
              Enter the Tavern
            </a>
            <a href={hostedAuthUrl('signup')} className={`${linkBase} border border-stone-600 text-amber-100 hover:border-amber-500`}>
              Create Account
            </a>
            <p className="text-center text-xs text-stone-500">You'll sign in with your Bevsoft account.</p>
          </div>
        )}
      </div>
    </div>
  )
}
