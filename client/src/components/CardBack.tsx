export function CardBack() {
  return (
    <div className="flex h-24 w-[4.25rem] flex-shrink-0 items-center justify-center rounded-lg border-2 border-stone-600 bg-gradient-to-b from-stone-700 to-stone-900 sm:h-40 sm:w-28">
      {/* Ornate pattern placeholder */}
      <div className="flex h-[4.5rem] w-12 items-center justify-center rounded border border-stone-600 bg-stone-800 sm:h-32 sm:w-20">
        <div className="flex flex-col items-center gap-1">
          <div className="h-3 w-3 rounded-full border-2 border-amber-700/60 bg-amber-900/30 sm:h-6 sm:w-6" />
          <div className="h-px w-8 bg-amber-700/40 sm:w-12" />
          <div className="text-[6px] font-bold uppercase tracking-widest text-amber-700/50 sm:text-[8px]">Towers</div>
          <div className="h-px w-8 bg-amber-700/40 sm:w-12" />
          <div className="h-3 w-3 rounded-full border-2 border-amber-700/60 bg-amber-900/30 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  )
}
