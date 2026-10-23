import { useState } from 'react'
import { hostedAuthUrl } from '../auth'
import { NameForm } from './NameForm'

interface AuthScreenProps {
  loading: boolean
  error: string | null
  onPlayAsGuest: (username: string) => Promise<string | null>
}

export function AuthScreen({ loading, error, onPlayAsGuest }: AuthScreenProps) {
  const [guest, setGuest] = useState(false)
  const linkBase = 'rounded px-6 py-2 text-center font-bold transition-colors'

  return (
    <AuthCard>
      {loading ? (
        <p className="text-sm text-stone-400">Checking your account…</p>
      ) : guest ? (
        <div className="flex w-full flex-col gap-4">
          <p className="rounded border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            Guest games aren't saved. Your wins, losses and match history won't be recorded,
            and your name isn't reserved. Create an account to keep them.
          </p>
          <NameForm submitLabel="Play as guest" onSubmit={onPlayAsGuest} />
          <button onClick={() => setGuest(false)} className="text-xs text-stone-400 hover:text-stone-200">
            Back
          </button>
        </div>
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
          <button onClick={() => setGuest(true)} className="mt-2 text-sm text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline">
            Play as guest
          </button>
        </div>
      )}
    </AuthCard>
  )
}

interface NameScreenProps {
  onChooseName: (username: string) => Promise<string | null>
  onSignOut: () => void
}

/** First sign-in: an account picks the public name used for its profile and history. */
export function NameScreen({ onChooseName, onSignOut }: NameScreenProps) {
  return (
    <AuthCard>
      <div className="flex w-full flex-col gap-4">
        <div className="text-center">
          <h2 className="font-bold text-amber-200">Choose your player name</h2>
          <p className="mt-1 text-xs text-stone-400">
            Other players see it in games, and it's your profile address. You can't change it later.
          </p>
        </div>
        <NameForm submitLabel="Enter the Tavern" onSubmit={onChooseName} />
        <button onClick={onSignOut} className="text-xs text-stone-400 hover:text-stone-200">
          Sign out
        </button>
      </div>
    </AuthCard>
  )
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-stone-700 bg-stone-800 px-6 py-8 sm:px-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">Two Towers</h1>
          <p className="mt-1 text-sm text-stone-400">The card game</p>
        </div>
        {children}
      </div>
    </div>
  )
}
