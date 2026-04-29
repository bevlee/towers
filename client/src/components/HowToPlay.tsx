import { useState } from 'react'

export function HowToPlay() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 rounded border border-stone-700 bg-stone-800/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-800 focus:outline-none"
        aria-expanded={open}
      >
        <span className="font-bold text-amber-400">How to Play</span>
        <svg
          className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-stone-700 px-4 py-4 text-sm text-stone-300 space-y-4">

          {/* Goal */}
          <section>
            <h3 className="mb-1 font-semibold text-amber-200">Goal</h3>
            <p>Be the first to meet one of three win conditions:</p>
            <ul className="mt-1 space-y-0.5 pl-4 list-disc">
              <li>Reduce your opponent&rsquo;s tower to <span className="text-red-400 font-medium">0</span></li>
              <li>Build your tower to <span className="text-amber-300 font-medium">50</span></li>
              <li>Accumulate <span className="text-amber-300 font-medium">150</span> of all three resources simultaneously</li>
            </ul>
          </section>

          {/* Tower & Wall */}
          <section>
            <h3 className="mb-1 font-semibold text-amber-200">Tower &amp; Wall</h3>
            <p>
              You start with a tower of <span className="text-amber-300 font-medium">20</span> and a wall of{' '}
              <span className="text-amber-300 font-medium">5</span>. Your wall absorbs incoming attacks first —
              only damage that exceeds your current wall carries over to your tower. Direct attacks bypass the
              wall entirely and hit your tower straight away.
            </p>
          </section>

          {/* Resources */}
          <section>
            <h3 className="mb-1 font-semibold text-amber-200">Resources</h3>
            <p className="mb-2">Three resources fuel your cards. Each has a source building that generates it every turn.</p>
            <div className="rounded border border-stone-600 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-600 bg-stone-700/50 text-stone-400">
                    <th className="px-3 py-2 text-left">Resource</th>
                    <th className="px-3 py-2 text-left">Card colour</th>
                    <th className="px-3 py-2 text-left">Source building</th>
                    <th className="px-3 py-2 text-left">Starting level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-700/50">
                    <td className="px-3 py-2 font-medium text-red-300">Ore</td>
                    <td className="px-3 py-2 text-red-400">Red</td>
                    <td className="px-3 py-2">Mine</td>
                    <td className="px-3 py-2">2 / turn</td>
                  </tr>
                  <tr className="border-b border-stone-700/50">
                    <td className="px-3 py-2 font-medium text-blue-300">Mana</td>
                    <td className="px-3 py-2 text-blue-400">Blue</td>
                    <td className="px-3 py-2">Monastery</td>
                    <td className="px-3 py-2">2 / turn</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-green-300">Troops</td>
                    <td className="px-3 py-2 text-green-400">Green</td>
                    <td className="px-3 py-2">Barracks</td>
                    <td className="px-3 py-2">2 / turn</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-stone-400">You start with <span className="text-amber-300">5</span> of each resource.</p>
          </section>

          {/* Turn structure */}
          <section>
            <h3 className="mb-1 font-semibold text-amber-200">How a Turn Works</h3>
            <ol className="space-y-1 pl-4 list-decimal">
              <li><span className="text-stone-200">Resources generate</span> — your source levels are added to each resource automatically.</li>
              <li>
                <span className="text-stone-200">Play or discard a card</span> — playing a card costs its resource amount (matching the card&rsquo;s colour).
                If you can&rsquo;t or don&rsquo;t want to play, you may discard instead.
              </li>
              <li><span className="text-stone-200">Draw a replacement</span> — your hand refills to <span className="text-amber-300">6</span> cards.</li>
              <li><span className="text-stone-200">Turn passes</span> to your opponent.</li>
            </ol>
            <p className="mt-2 text-stone-400">Some cards have a &ldquo;play again&rdquo; effect — you draw a replacement and immediately take another turn.</p>
          </section>

          {/* Card types */}
          <section>
            <h3 className="mb-1 font-semibold text-amber-200">Card Types</h3>
            <ul className="space-y-1 pl-4 list-disc">
              <li><span className="text-red-300 font-medium">Red (Ore)</span> — build walls, upgrade your Mine, manipulate ore.</li>
              <li><span className="text-blue-300 font-medium">Blue (Mana)</span> — build your tower, upgrade your Monastery, cast spells.</li>
              <li><span className="text-green-300 font-medium">Green (Troops)</span> — attack your opponent, upgrade your Barracks.</li>
            </ul>
            <p className="mt-2 text-stone-400">
              <span className="text-stone-200">Indirect damage</span> hits your wall first; overflow reaches your tower.{' '}
              <span className="text-stone-200">Direct damage</span> bypasses walls and hits your tower straight away.
            </p>
          </section>

        </div>
      )}
    </div>
  )
}
