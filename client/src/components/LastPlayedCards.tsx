import { AnimatePresence, motion } from 'motion/react'
import type { GameHistoryEntry } from '@towers/shared'
import { CARD_MAP } from '@towers/shared'
import { describeEffects } from '../utils/cardText'
import { CardFace } from './CardFace'

interface LastPlayedCardsProps {
  history: GameHistoryEntry[]
  yourPlayerId: string
}

/** Collect the most recent consecutive actions by the same player from end of history. */
function getLastTurnCards(history: GameHistoryEntry[]): GameHistoryEntry[] {
  if (history.length === 0) return []

  const lastPlayer = history[history.length - 1].playerId
  const cards: GameHistoryEntry[] = []

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].playerId === lastPlayer) {
      cards.unshift(history[i])
    } else {
      break
    }
  }

  return cards
}

function PlayedCard({ entry }: { entry: GameHistoryEntry }) {
  const def = CARD_MAP[entry.cardName]
  if (!def) return null

  const isDiscard = entry.action !== 'play'

  return (
    <CardFace
      cardName={entry.cardName}
      color={def.color}
      cost={def.cost}
      effectText={describeEffects(def)}
      className={`flex-shrink-0 ${isDiscard ? 'opacity-50' : ''}`}
    >
      {isDiscard && (
        <div className="absolute bottom-1 left-1">
          <span className="px-1 py-0.5 text-[9px] font-bold uppercase text-stone-300/80 sm:px-2 sm:text-[10px]">
            discarded
          </span>
        </div>
      )}
    </CardFace>
  )
}

export function LastPlayedCards({ history, yourPlayerId }: LastPlayedCardsProps) {
  const cards = getLastTurnCards(history)

  if (cards.length === 0) return null

  const isYou = cards[0].playerId === yourPlayerId
  const label = isYou ? 'You played' : `${cards[0].username} played`

  const stackOffsetPx = 18
  const lastIndex = cards.length - 1
  const earlier = cards.slice(0, lastIndex)
  const current = cards[lastIndex]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] uppercase tracking-wider text-stone-400">{label}</div>
      <div className="relative" style={{ paddingTop: earlier.length * stackOffsetPx }}>
        <AnimatePresence mode="popLayout">
          {earlier.map((entry, i) => (
            <motion.div
              key={`${entry.cardName}-${entry.playerId}-${i}`}
              layout
              initial={{ y: -20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="absolute left-0 right-0"
              style={{ top: i * stackOffsetPx, zIndex: i }}
            >
              <PlayedCard entry={entry} />
            </motion.div>
          ))}
          <motion.div
            key={`${current.cardName}-${current.playerId}-${lastIndex}`}
            layout
            initial={{ y: -20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative"
            style={{ zIndex: cards.length }}
          >
            <PlayedCard entry={current} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
