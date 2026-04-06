interface DeckInfoProps {
  deckSize: number
}

export function DeckInfo({ deckSize }: DeckInfoProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Face-down card */}
      <div className="flex h-20 w-16 items-center justify-center rounded-lg border-2 border-stone-600 bg-gradient-to-b from-stone-700 to-stone-900">
        <div className="text-2xl text-stone-500">?</div>
      </div>
      <div className="text-sm text-stone-400">
        {deckSize} cards left
      </div>
    </div>
  )
}
