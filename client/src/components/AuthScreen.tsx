import { useState } from 'react'

interface AuthScreenProps {
  onLogin: (usernameOrEmail: string, password: string) => Promise<void>
  onRegister: (username: string, email: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
  onClearError: () => void
}

export function AuthScreen({ onLogin, onRegister, loading, error, onClearError }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  function switchTab(next: 'login' | 'register') {
    setTab(next)
    setLocalError(null)
    onClearError()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    onClearError()

    if (tab === 'register' && password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (tab === 'login') {
      await onLogin(username.trim(), password)
    } else {
      await onRegister(username.trim(), email.trim(), password)
    }
  }

  const displayError = localError ?? error

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900">
      <div className="flex w-80 flex-col items-center gap-6 rounded-xl border border-stone-700 bg-stone-800 px-10 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">Two Towers</h1>
          <p className="mt-1 text-sm text-stone-400">The card game</p>
        </div>

        {/* Tab switcher */}
        <div className="flex w-full overflow-hidden rounded-lg border border-stone-600">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-stone-400">
              {tab === 'login' ? 'Username or Email' : 'Username'}
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded border border-stone-600 bg-stone-700 px-3 py-2 text-amber-100 placeholder-stone-500 outline-none focus:border-amber-500"
              placeholder={tab === 'login' ? 'your_name or you@example.com' : 'your_name'}
              autoFocus
              maxLength={tab === 'login' ? undefined : 20}
              required
            />
          </label>

          {tab === 'register' && (
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-stone-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded border border-stone-600 bg-stone-700 px-3 py-2 text-amber-100 placeholder-stone-500 outline-none focus:border-amber-500"
                placeholder="you@example.com"
                required
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-stone-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-stone-600 bg-stone-700 px-3 py-2 text-amber-100 placeholder-stone-500 outline-none focus:border-amber-500"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </label>

          {tab === 'register' && (
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-stone-400">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded border border-stone-600 bg-stone-700 px-3 py-2 text-amber-100 placeholder-stone-500 outline-none focus:border-amber-500"
                placeholder="••••••••"
                required
              />
            </label>
          )}

          {displayError && (
            <p className="rounded border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded bg-amber-600 px-6 py-2 font-bold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Enter the Tavern' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
