import { useState } from 'react'
import { usernameError } from '@towers/shared'

interface NameFormProps {
  submitLabel: string
  /** Resolves to an error message to show, or null on success. */
  onSubmit: (username: string) => Promise<string | null>
}

export function NameForm({ submitLabel, onSubmit }: NameFormProps) {
  const [name, setName]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const username = name.trim()
    const problem = usernameError(username)
    if (problem) return setError(problem)
    setPending(true)
    setError(await onSubmit(username))
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-stone-400">Player name</span>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          maxLength={20}
          autoComplete="nickname"
          autoFocus
          placeholder="3–20 letters, numbers, _ or -"
          className={`rounded border bg-stone-700 px-3 py-2 text-amber-100 placeholder-stone-500 outline-none ${
            error ? 'border-red-700 focus:border-red-500' : 'border-stone-600 focus:border-amber-500'
          }`}
        />
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded bg-amber-600 px-6 py-2 font-bold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Please wait…' : submitLabel}
      </button>
    </form>
  )
}
