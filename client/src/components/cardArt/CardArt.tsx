import { useId } from 'react'
import type { ResourceColor } from '@towers/shared'
import type { ArtStyle } from '../../hooks/useArtStyle'
import { CARD_GEOMETRY } from './geometry'

interface CardArtProps {
  cardName: string
  color: ResourceColor
  artStyle: ArtStyle
}

const MONO_STROKE: Record<ResourceColor, string> = {
  red: '#fca5a5',
  blue: '#93c5fd',
  green: '#86efac',
}
const GLOW_STROKE: Record<ResourceColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
}
const CORE_STROKE: Record<ResourceColor, string> = {
  red: '#fecaca',
  blue: '#dbeafe',
  green: '#dcfce7',
}
const ARCANE_BG: Record<ResourceColor, string> = {
  red: '#450a0a',
  blue: '#172554',
  green: '#14532d',
}

/** Deterministic per-card sparkle positions for the arcane style. */
function sparkles(name: string): Array<{ x: number; y: number; r: number }> {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const pts = []
  for (let i = 0; i < 5; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    pts.push({
      x: 14 + ((h >>> 8) % 180),
      y: 14 + ((h >>> 20) % 52),
      r: i % 2 === 0 ? 1.5 : 1,
    })
  }
  return pts
}

const strokeProps = {
  stroke: 'currentColor',
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function CardArt({ cardName, color, artStyle }: CardArtProps) {
  const id = useId()
  const geo = CARD_GEOMETRY[cardName]

  if (artStyle === 'monoline') {
    return (
      <svg viewBox="0 0 208 80" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
        <rect width={208} height={80} fill="#1c1917" />
        {geo && (
          <g {...strokeProps} strokeWidth={2.5} style={{ color: MONO_STROKE[color] }}>
            {geo}
          </g>
        )}
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 208 80" preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
      <defs>
        <radialGradient id={`${id}bg`} cx="50%" cy="60%" r="85%">
          <stop offset="0%" stopColor={ARCANE_BG[color]} />
          <stop offset="100%" stopColor="#0c0a09" />
        </radialGradient>
        <filter id={`${id}glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <rect width={208} height={80} fill={`url(#${id}bg)`} />
      {geo && (
        <>
          <g
            {...strokeProps}
            strokeWidth={3}
            opacity={0.9}
            filter={`url(#${id}glow)`}
            style={{ color: GLOW_STROKE[color] }}
          >
            {geo}
          </g>
          <g {...strokeProps} strokeWidth={1.4} style={{ color: CORE_STROKE[color] }}>
            {geo}
          </g>
        </>
      )}
      {sparkles(cardName).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={CORE_STROKE[color]} opacity={0.7} />
      ))}
    </svg>
  )
}
