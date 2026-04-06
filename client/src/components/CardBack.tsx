export function CardBack() {
  return (
    <div className="flex h-40 w-28 flex-shrink-0 items-center justify-center rounded-lg border-2 border-stone-600 bg-gradient-to-b from-stone-700 to-stone-900">
      {/* Ornate pattern placeholder */}
      <div className="flex h-32 w-20 items-center justify-center rounded border border-stone-600 bg-stone-800">
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full border-2 border-amber-700/60 bg-amber-900/30" />
          <div className="h-px w-12 bg-amber-700/40" />
          <div className="text-[8px] font-bold uppercase tracking-widest text-amber-700/50">Towers</div>
          <div className="h-px w-12 bg-amber-700/40" />
          <div className="h-6 w-6 rounded-full border-2 border-amber-700/60 bg-amber-900/30" />
        </div>
      </div>
    </div>
  )
}
