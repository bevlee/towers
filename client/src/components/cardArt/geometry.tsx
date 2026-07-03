import type { ReactNode } from 'react'

// Line geometry for every card, drawn in a 208x80 viewBox. Elements carry no
// stroke/fill of their own (except filled dots) so CardArt can render the same
// shapes as flat monoline strokes or as a glow + core pass for the arcane style.
// Keep important shapes inside y 12-70: the hand-size card crops ~6 units from
// the top and bottom edges (preserveAspectRatio slice).

const Dot = ({ x, y, r = 2 }: { x: number; y: number; r?: number }) => (
  <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />
)

const Star = ({ x, y, s = 4 }: { x: number; y: number; s?: number }) => (
  <path d={`M${x} ${y - s} v${2 * s} M${x - s} ${y} h${2 * s}`} />
)

/** Crenellated brick wall centered on x, sitting on `bottom`. */
function Wall({ rows, w = 96, x = 104, bottom = 68 }: { rows: number; w?: number; x?: number; bottom?: number }) {
  const rowH = rows > 5 ? 7 : 9
  const side = 10
  const merlon = 12
  const gap = (w - 2 * side - 3 * merlon) / 2
  const x0 = x - w / 2
  const yTop = bottom - rows * rowH
  const outline =
    `M${x0} ${bottom} V${yTop} h${side} v-8 h${merlon} v8 h${gap} v-8 h${merlon} v8` +
    ` h${gap} v-8 h${merlon} v8 h${side} V${bottom} Z`
  const lines: string[] = []
  for (let r = 1; r < rows; r++) lines.push(`M${x0} ${bottom - r * rowH} h${w}`)
  for (let r = 0; r < rows; r++) {
    const y = bottom - (r + 1) * rowH
    const joints = r % 2 === 0 ? [0.25, 0.5, 0.75] : [0.125, 0.375, 0.625, 0.875]
    for (const f of joints) lines.push(`M${x0 + f * w} ${y} v${rowH}`)
  }
  return (
    <g>
      <path d={outline} />
      <path d={lines.join(' ')} strokeWidth={1.5} />
    </g>
  )
}

const faery = (
  <g>
    <circle cx={104} cy={26} r={7} />
    <path d="M104 33 v20 M104 40 l-8 8 M104 40 l8 8 M104 53 l-6 12 M104 53 l6 12" />
    <path d="M96 38 C74 26 66 40 92 46 M112 38 c22 -12 30 2 4 8" />
  </g>
)

export const CARD_GEOMETRY: Record<string, ReactNode> = {
  // ============ RED — ore / mine / walls ============
  'Strip Mine': (
    <g>
      <path d="M56 20 L96 52 h16 L152 20" />
      <path d="M72 20 L100 42 h8 L136 20" />
      <Dot x={100} y={60} r={2.5} />
      <Dot x={110} y={62} r={2} />
      <Dot x={104} y={66} r={2} />
    </g>
  ),
  'Lucky Cache': (
    <g>
      <path d="M78 42 a26 16 0 0 1 52 0" />
      <path d="M78 42 h52 v22 h-52 Z" />
      <path d="M101 46 h6 v8 h-6 Z" />
      <Star x={64} y={24} />
      <Star x={144} y={28} />
    </g>
  ),
  'Brick Shortage': (
    <g>
      <path d="M76 34 h26 v13 h-26 Z M106 34 h26 v13 h-26 Z M91 51 h26 v13 h-26 Z" />
      <path d="M66 68 L142 16" />
    </g>
  ),
  Earthquake: (
    <g>
      <path d="M84 66 V24 h6 v-6 h8 v6 h12 v-6 h8 v6 h6 v42" />
      <path d="M104 24 l-8 12 10 8 -9 12 8 10" />
      <path d="M40 66 h34 M96 66 h-6 M126 66 h-10 M168 66 h-28" />
      <path d="M78 66 l6 5 M116 66 l-5 5" />
      <path d="M30 46 l12 -3 M178 46 l-12 -3 M36 32 l10 2 M172 32 l-10 2" />
    </g>
  ),
  'Friendly Terrain': (
    <g>
      <path d="M52 64 a28 24 0 0 1 56 0" />
      <path d="M92 64 a32 26 0 0 1 64 0" />
      <path d="M124 22 v16 M124 22 l13 4 -13 5" />
    </g>
  ),
  'Work Overtime': (
    <g>
      <path d="M78 62 L112 34" />
      <path d="M104 26 l20 14 -8 11 -20 -14 Z" />
      <path d="M130 20 c6 5 9 12 9 19" />
      <path d="M56 14 a9 9 0 1 0 7 15 a7 7 0 0 1 -7 -15" />
    </g>
  ),
  'Basic Wall': <Wall rows={3} />,
  Innovations: (
    <g>
      <circle cx={104} cy={42} r={11} />
      <circle cx={104} cy={42} r={3.5} />
      <path d="M104 27 v-6 M104 57 v6 M89 42 h-6 M119 42 h6 M93 31 l-4 -4 M115 31 l4 -4 M93 53 l-4 4 M115 53 l4 4" />
      <Star x={140} y={24} />
    </g>
  ),
  'Sturdy Wall': (
    <g>
      <Wall rows={4} />
      <path d="M44 68 L56 48 M164 68 L152 48" />
    </g>
  ),
  Foundations: (
    <g>
      <path d="M60 44 h88" />
      <path d="M84 44 V32 h6 v-5 h8 v5 h12 v-5 h8 v5 h6 V44" />
      <path d="M84 44 v14 h40 v-14" />
      <path d="M90 58 l10 -14 M102 58 l10 -14 M114 58 l8 -11" strokeWidth={1.5} />
    </g>
  ),
  Miners: (
    <g>
      <path d="M76 62 L130 22 M132 62 L78 22" />
      <path d="M120 14 c9 2 15 8 17 17 M88 14 c-9 2 -15 8 -17 17" />
    </g>
  ),
  'Collapse!': (
    <g>
      <path d="M74 64 V42 a30 30 0 0 1 60 0 V64" />
      <path d="M104 12 l-5 9 7 7 -5 9" />
      <Dot x={96} y={52} r={3} />
      <Dot x={110} y={56} r={2.5} />
      <Dot x={102} y={61} r={2} />
    </g>
  ),
  'Mother Lode': (
    <g>
      <path d="M80 50 l8 -18 20 -8 20 6 8 16 -12 16 -30 2 Z" />
      <path d="M108 24 l2 16 -14 10 M110 40 l14 8" strokeWidth={1.5} />
      <path d="M74 26 l7 5 M104 12 v8 M134 26 l-7 5" />
    </g>
  ),
  'Copping the Tech': (
    <g>
      <path d="M66 60 L102 42 M72 68 L108 50 M66 60 l6 8 M102 42 l6 8" />
      <path d="M102 42 L126 30 M108 50 L132 38 M126 30 l6 8" />
      <path d="M136 26 l22 -8" strokeDasharray="5 4" />
      <Star x={166} y={14} />
    </g>
  ),
  'Big Wall': <Wall rows={5} w={112} />,
  'New Equipment': (
    <g>
      <path d="M76 60 L124 28" />
      <path d="M114 18 c10 2 17 9 19 19" />
      <path d="M84 22 L120 54" />
      <path d="M116 50 l14 14 -4 6 -8 -2 -2 -8 Z" />
      <Star x={146} y={22} />
    </g>
  ),
  'Dwarven Miners': (
    <g>
      <path d="M86 38 a18 15 0 0 1 36 0" />
      <path d="M82 38 h44 M104 38 v10" />
      <Dot x={96} y={44} r={1.8} />
      <Dot x={112} y={44} r={1.8} />
      <path d="M90 42 c-1 12 5 20 14 20 s15 -8 14 -20" />
      <path d="M136 60 L164 40 M158 32 c8 2 13 7 15 15" />
    </g>
  ),
  'Forced Labor': (
    <g>
      <circle cx={86} cy={42} r={10} />
      <circle cx={104} cy={51} r={5} />
      <circle cx={116} cy={58} r={5} />
      <circle cx={128} cy={64} r={5} />
      <path d="M136 66 V57 h30 V66 M151 57 V66 M141 48 h16 v9 h-16 Z" />
    </g>
  ),
  Tremors: (
    <g>
      <path d="M56 54 l16 -9 13 10 15 -12 13 10 16 -10 13 8" />
      <g transform="rotate(-12 88 30)">
        <path d="M78 25 h20 v10 h-20 Z" />
      </g>
      <g transform="rotate(9 128 26)">
        <path d="M118 21 h20 v10 h-20 Z" />
      </g>
      <path d="M62 34 l-7 -4 M148 40 l7 -4" />
    </g>
  ),
  'Reinforced Wall': (
    <g>
      <Wall rows={4} />
      <path d="M64 38 l30 24 M94 38 l-30 24 M114 38 l30 24 M144 38 l-30 24" strokeWidth={1.5} />
    </g>
  ),
  'Secret Room': (
    <g>
      <path d="M64 34 h80 M64 48 h80 M64 62 h80" strokeWidth={1.5} />
      <path d="M80 34 v14 M124 34 v14 M96 48 v14 M136 48 v14" strokeWidth={1.5} />
      <path d="M92 66 V46 a12 12 0 0 1 24 0 V66" strokeDasharray="4 4" />
      <circle cx={104} cy={52} r={3} />
      <path d="M104 55 v5" />
    </g>
  ),
  'Crystal Rocks': (
    <g>
      <path d="M72 66 l6 -14 14 -8 20 2 16 10 6 10 Z" />
      <path d="M98 44 l3 -13 6 9 M116 46 l5 -11 5 9" />
      <Star x={140} y={22} />
    </g>
  ),
  Portcullis: (
    <g>
      <path d="M76 66 V42 a28 28 0 0 1 56 0 V66" />
      <path d="M90 66 V27 M104 66 V16 M118 66 V27" />
      <path d="M78 46 h52 M78 58 h52" strokeWidth={1.5} />
    </g>
  ),
  'Harmonic Ore': (
    <g>
      <path d="M70 58 l6 -16 16 -8 18 6 8 14 -10 12 -28 0 Z" />
      <path d="M92 34 l4 14 -12 10" strokeWidth={1.5} />
      <path d="M138 30 c8 8 8 16 0 24 M148 24 c11 11 11 25 0 36" />
    </g>
  ),
  'Mondo Wall': <Wall rows={7} w={120} />,
  'Focused Designs': (
    <g>
      <path d="M104 20 L86 62 M104 20 L122 62" />
      <circle cx={104} cy={19} r={4} />
      <path d="M86 62 c10 -8 26 -8 36 0" strokeDasharray="5 4" />
      <Dot x={86} y={62} r={2} />
      <Dot x={122} y={62} r={2} />
    </g>
  ),
  'Great Wall': (
    <g>
      <path d="M30 68 V32 h5 v-6 h6 v6 h6 v-6 h6 v6 h5 V68" />
      <path d="M150 68 V32 h5 v-6 h6 v6 h6 v-6 h6 v6 h5 V68" />
      <Wall rows={3} w={92} />
    </g>
  ),
  'Phase Shift': (
    <g>
      <path d="M54 62 V44 h6 v-5 h8 v5 h8 v-5 h8 v5 h6 V62 Z" />
      <path d="M118 62 V44 h6 v-5 h8 v5 h8 v-5 h8 v5 h6 V62 Z" />
      <path d="M96 38 c6 -8 18 -8 24 0 M116 34 l4 6 -6 1" />
      <path d="M112 54 c-6 8 -18 8 -24 0 M92 58 l-4 -6 6 -1" />
    </g>
  ),
  'Rock Launcher': (
    <g>
      <path d="M70 62 h52" />
      <circle cx={82} cy={62} r={5} />
      <circle cx={110} cy={62} r={5} />
      <path d="M86 58 L130 24 M104 58 L96 42" />
      <path d="M128 16 a6 6 0 1 0 9 7" />
      <Dot x={148} y={18} r={2.5} />
      <Dot x={160} y={14} r={2} />
      <Dot x={171} y={12} r={1.5} />
    </g>
  ),
  "Dragon's Heart": (
    <g>
      <path d="M104 62 C86 50 80 34 91 27 c6 -4 13 0 13 7 c0 -7 7 -11 13 -7 c11 7 5 23 -13 35 Z" />
      <path d="M104 52 c-7 -7 -7 -13 0 -18 c7 5 7 11 0 18 Z" />
      <Dot x={76} y={24} r={1.8} />
      <Dot x={134} y={22} r={1.8} />
    </g>
  ),

  // ============ BLUE — mana / monastery / towers ============
  Quartz: (
    <g>
      <path d="M92 64 V36 L102 20 L112 36 V64" />
      <path d="M102 20 V64" strokeWidth={1.5} />
      <path d="M118 64 V50 L124 42 L130 50 V64" />
    </g>
  ),
  'Gemstone Flaw': (
    <g>
      <path d="M90 28 h28 l10 12 -24 24 -24 -24 Z" />
      <path d="M104 28 l-5 10 7 8 -6 10 5 8" />
    </g>
  ),
  Prism: (
    <g>
      <path d="M104 14 L78 62 h52 Z" />
      <path d="M28 40 h44" strokeDasharray="6 5" />
      <path d="M118 34 l60 -15 M121 40 h57 M118 46 l60 15" />
      <circle cx={104} cy={44} r={3} />
    </g>
  ),
  Amethyst: (
    <g>
      <path d="M76 64 L86 38 L94 54 L104 22 L114 54 L122 38 L132 64 Z" />
      <path d="M104 22 V64 M86 38 L84 64 M122 38 L124 64" strokeWidth={1.5} />
    </g>
  ),
  'Smoky Quartz': (
    <g>
      <path d="M88 64 V38 L98 24 L108 38 V64" />
      <path d="M98 24 V64" strokeWidth={1.5} />
      <path d="M122 40 c5 -5 1 -9 6 -14 M132 46 c5 -5 1 -9 6 -14" />
    </g>
  ),
  'Power Burn': (
    <g>
      <path d="M104 16 c9 11 15 17 15 26 a15 15 0 0 1 -30 0 c0 -9 6 -15 15 -26 Z" />
      <path d="M104 34 c4 5 7 8 7 12 a7 7 0 0 1 -14 0 c0 -4 3 -7 7 -12 Z" />
    </g>
  ),
  'Spell Weavers': (
    <g>
      <circle cx={94} cy={36} r={12} />
      <circle cx={114} cy={36} r={12} />
      <circle cx={104} cy={52} r={12} />
      <Dot x={104} y={41} r={2} />
      <Star x={140} y={20} />
      <Star x={66} y={58} />
    </g>
  ),
  Ruby: (
    <g>
      <path d="M104 24 L121 34 V54 L104 64 L87 54 V34 Z" />
      <path d="M87 34 L104 44 L121 34 M104 44 V64" strokeWidth={1.5} />
    </g>
  ),
  "Quarry's Help": (
    <g>
      <path d="M82 66 V56 h44 V66 M104 56 V66 M82 56 V47 h44 V56 M93 47 v9 M115 47 v9" />
      <path d="M96 26 L104 18 L112 26 L104 40 Z M96 26 h16" />
      <path d="M104 52 V44 M100 48 l4 -4 4 4" />
    </g>
  ),
  'Gem Spear': (
    <g>
      <path d="M56 62 L138 22 L148 16 L142 28 L62 68 Z" />
      <path d="M66 42 l22 -11 M84 54 l22 -11" strokeWidth={1.5} />
    </g>
  ),
  'Solar Flare': (
    <g>
      <circle cx={104} cy={40} r={11} />
      <path d="M104 22 v-6 M104 58 v6 M86 40 h-6 M122 40 h6 M91 27 l-4 -4 M117 27 l4 -4 M91 53 l-4 4 M117 53 l4 4" />
      <path d="M122 28 c12 6 14 18 6 28" />
    </g>
  ),
  Discord: (
    <g>
      <path d="M62 22 v42 M56 22 h12 M146 22 v42 M140 22 h12" />
      <path d="M82 30 l18 10 -12 8 20 10 -10 12" />
      <path d="M118 32 l10 8 -8 6" />
    </g>
  ),
  Lodestone: (
    <g>
      <path d="M88 22 v20 a16 16 0 0 0 32 0 V22" />
      <path d="M96 22 v20 a8 8 0 0 0 16 0 V22" strokeWidth={1.5} />
      <path d="M84 22 h12 M112 22 h12" />
      <path d="M96 68 l4 -6 M112 68 l-4 -6 M104 70 v-8" />
    </g>
  ),
  Emerald: (
    <g>
      <path d="M84 28 h40 l8 8 v16 l-8 8 h-40 l-8 -8 v-16 Z" />
      <path d="M92 36 h24 v16 h-24 Z" strokeWidth={1.5} />
    </g>
  ),
  'Crystal Matrix': (
    <g>
      <path d="M104 26 L118 34 V50 L104 58 L90 50 V34 Z" />
      <path d="M104 42 L104 26 M104 42 L118 34 M104 42 L118 50 M104 42 L104 58 M104 42 L90 50 M104 42 L90 34" strokeWidth={1.5} />
      <path d="M90 34 L74 26 M118 50 L134 58" strokeWidth={1.5} />
      <Dot x={104} y={42} r={2.5} />
      <Dot x={74} y={26} r={2} />
      <Dot x={134} y={58} r={2} />
    </g>
  ),
  'Harmonic Vibe': (
    <g>
      <path d="M96 20 v16 a8 8 0 0 0 16 0 V20 M104 44 v18 M98 62 h12" />
      <path d="M80 28 c-6 7 -6 17 0 24 M128 28 c6 7 6 17 0 24" />
    </g>
  ),
  'Magic Drain': (
    <g>
      <path d="M99 20 h10 M101 20 v8 l-9 16 a13 13 0 1 0 24 0 l-9 -16 V20" />
      <Dot x={130} y={50} r={2.5} />
      <Dot x={138} y={58} r={2} />
      <Dot x={132} y={66} r={1.5} />
    </g>
  ),
  Sapphire: (
    <g>
      <ellipse cx={104} cy={44} rx={26} ry={17} />
      <ellipse cx={104} cy={44} rx={13} ry={8} strokeWidth={1.5} />
      <path d="M86 32 l10 6 M122 32 l-10 6 M86 56 l10 -6 M122 56 l-10 -6" strokeWidth={1.5} />
    </g>
  ),
  Crystallize: (
    <g>
      <path d="M104 20 v44 M87 32 l34 20 M87 52 l34 -20" />
      <path d="M100 26 l4 4 4 -4 M100 58 l4 -4 4 4" strokeWidth={1.5} />
      <circle cx={104} cy={42} r={4} />
    </g>
  ),
  Thief: (
    <g>
      <path d="M82 38 c8 -10 36 -10 44 0 c0 10 -9 16 -16 11 c-3 -2 -9 -2 -12 0 c-7 5 -16 -1 -16 -11 Z" />
      <ellipse cx={95} cy={41} rx={4} ry={3} strokeWidth={1.5} />
      <ellipse cx={113} cy={41} rx={4} ry={3} strokeWidth={1.5} />
      <circle cx={146} cy={57} r={9} />
      <path d="M142 49 l3 -5 h4 l3 5" />
    </g>
  ),
  'Magic Vault': (
    <g>
      <circle cx={104} cy={42} r={19} />
      <circle cx={104} cy={42} r={7} />
      <path d="M104 35 v-10 M104 49 v10 M97 42 h-10 M111 42 h10" />
      <Dot x={116} y={30} r={1.8} />
      <Dot x={92} y={30} r={1.8} />
      <Dot x={92} y={54} r={1.8} />
      <Dot x={116} y={54} r={1.8} />
    </g>
  ),
  Succubus: (
    <g>
      <path d="M104 58 C90 48 86 36 94 30 c5 -3 10 0 10 5 c0 -5 5 -8 10 -5 c8 6 4 18 -10 28 Z" />
      <path d="M88 38 l-16 -10 5 10 -11 1 9 7 -5 8 14 -6" />
      <path d="M120 38 l16 -10 -5 10 11 1 -9 7 5 8 -14 -6" />
    </g>
  ),
  Diamond: (
    <g>
      <path d="M80 34 L92 22 h24 l12 12 -24 30 Z" />
      <path d="M80 34 h48 M92 22 L98 34 L104 22 L110 34 L116 22 M98 34 L104 64 L110 34" strokeWidth={1.5} />
    </g>
  ),
  'Tower Surge': (
    <g>
      <path d="M74 66 V30 h6 v-6 h8 v6 h10 v-6 h8 v6 h6 V66" />
      <path d="M136 60 V28 M127 37 l9 -9 9 9" />
      <path d="M150 54 V40" />
    </g>
  ),

  // ============ GREEN — troops / barracks / damage ============
  'Full Moon': (
    <g>
      <circle cx={104} cy={40} r={17} />
      <circle cx={98} cy={34} r={3} strokeWidth={1.5} />
      <circle cx={112} cy={44} r={2} strokeWidth={1.5} />
      <Star x={62} y={26} />
      <Star x={148} y={54} />
      <Star x={144} y={20} s={3} />
    </g>
  ),
  'Mad Cow Disease': (
    <g>
      <path d="M90 30 c0 -6 28 -6 28 0 l6 10 -8 6 v10 c0 6 -24 6 -24 0 v-10 l-8 -6 Z" />
      <path d="M90 28 c-6 -8 -14 -6 -16 0 M118 28 c6 -8 14 -6 16 0" />
      <path d="M95 38 l6 6 M101 38 l-6 6 M107 38 l6 6 M113 38 l-6 6" strokeWidth={1.5} />
      <Dot x={99} y={53} r={1.5} />
      <Dot x={109} y={53} r={1.5} />
    </g>
  ),
  'Moody Goblins': (
    <g>
      <circle cx={104} cy={44} r={11} />
      <path d="M93 40 l-14 -8 8 12 M115 40 l14 -8 -8 12" />
      <path d="M96 38 l8 4 M112 38 l-8 4" strokeWidth={1.5} />
      <Dot x={99} y={45} r={1.8} />
      <Dot x={109} y={45} r={1.8} />
      <path d="M99 52 c3 -3 7 -3 10 0" strokeWidth={1.5} />
    </g>
  ),
  Faery: (
    <g>
      {faery}
      <Star x={52} y={26} />
      <Star x={156} y={52} />
      <Star x={146} y={20} s={3} />
    </g>
  ),
  'Elven Scout': (
    <g>
      <path d="M92 18 c24 10 24 38 0 48 M92 18 V66" />
      <path d="M78 42 h52 M124 36 l10 6 -10 6" />
      <path d="M80 38 l-6 -5 M80 46 l-6 5" strokeWidth={1.5} />
    </g>
  ),
  'Goblin Mob': (
    <g>
      <circle cx={78} cy={48} r={8} />
      <circle cx={104} cy={34} r={9} />
      <circle cx={130} cy={48} r={8} />
      <path d="M71 44 l-9 -5 5 8 M85 44 l9 -5 -5 8 M96 30 l-9 -6 5 9 M112 30 l9 -6 -5 9 M123 44 l-9 -5 5 8 M137 44 l9 -5 -5 8" strokeWidth={1.5} />
      <Dot x={75} y={48} r={1.4} />
      <Dot x={81} y={48} r={1.4} />
      <Dot x={100} y={34} r={1.5} />
      <Dot x={108} y={34} r={1.5} />
      <Dot x={127} y={48} r={1.4} />
      <Dot x={133} y={48} r={1.4} />
    </g>
  ),
  Husbandry: (
    <g>
      <path d="M80 64 V40 l24 -16 24 16 V64 Z M80 40 h48" />
      <path d="M98 64 V52 h12 V64" />
      <path d="M140 64 v-10 M150 64 v-10 M136 58 h18" />
    </g>
  ),
  Orc: (
    <g>
      <path d="M90 26 h28 l7 14 -9 22 h-24 l-9 -22 Z" />
      <path d="M96 54 h16 M98 54 v-7 M110 54 v-7" />
      <path d="M94 38 l9 4 M114 38 l-9 4" strokeWidth={1.5} />
      <Dot x={101} y={47} r={1.4} />
      <Dot x={107} y={47} r={1.4} />
    </g>
  ),
  'Goblin Archers': (
    <g>
      <path d="M132 22 c18 10 18 30 0 40 M132 22 V62" />
      <path d="M110 42 h38 M142 37 l8 5 -8 5" />
      <circle cx={80} cy={46} r={8} />
      <path d="M73 42 l-9 -5 5 8 M87 42 l9 -5 -5 8" strokeWidth={1.5} />
      <Dot x={77} y={46} r={1.4} />
      <Dot x={83} y={46} r={1.4} />
    </g>
  ),
  Slasher: (
    <g>
      <path d="M76 54 L130 18 M80 58 L134 22 M130 18 L134 22" />
      <path d="M70 48 l14 12 M73 51 l-9 8" />
      <Dot x={62} y={61} r={2.5} />
      <path d="M88 18 c18 -4 34 2 44 14" strokeDasharray="5 4" />
    </g>
  ),
  Dwarves: (
    <g>
      <path d="M86 36 a18 14 0 0 1 36 0" />
      <path d="M82 36 h44 M104 36 v10" />
      <Dot x={96} y={42} r={1.8} />
      <Dot x={112} y={42} r={1.8} />
      <path d="M90 40 c-1 12 5 20 14 20 s15 -8 14 -20" />
      <path d="M98 48 c3 3 9 3 12 0" strokeWidth={1.5} />
    </g>
  ),
  Imp: (
    <g>
      <path d="M104 66 V30 M92 22 v6 c0 7 5 10 12 10 s12 -3 12 -10 v-6 M104 20 v18" />
      <path d="M112 62 c12 2 18 -6 10 -12 M121 49 l6 -5" />
    </g>
  ),
  Ogre: (
    <g>
      <path d="M74 64 L108 32" />
      <circle cx={118} cy={26} r={13} />
      <path d="M128 15 l5 -7 M131 30 l8 1 M118 13 v-8 M107 19 l-6 -6" />
      <path d="M80 36 c-6 8 -8 18 -3 27" strokeDasharray="5 4" />
    </g>
  ),
  'Little Snakes': (
    <g>
      <path d="M66 56 c12 -12 20 8 32 -2 c8 -7 2 -16 -5 -13" />
      <circle cx={63} cy={55} r={3.5} />
      <path d="M59 53 l-6 -2 M59 57 l-6 2" strokeWidth={1.5} />
      <path d="M142 62 c-12 -12 -20 8 -32 -2 c-8 -7 -2 -16 5 -13" />
      <circle cx={145} cy={61} r={3.5} />
      <path d="M149 59 l6 -2 M149 63 l6 2" strokeWidth={1.5} />
    </g>
  ),
  'Rapid Sheep': (
    <g>
      <path d="M86 58 c-7 0 -9 -9 -2 -12 c-3 -8 7 -14 13 -9 c4 -7 15 -6 18 1 c8 -4 16 4 11 11 c6 3 3 9 -3 9 Z" />
      <circle cx={80} cy={46} r={6} />
      <path d="M76 41 l-4 -4" />
      <Dot x={78} y={45} r={1.5} />
      <path d="M96 58 v7 M114 58 v7" />
      <path d="M50 42 h16 M46 50 h16 M50 58 h16" strokeWidth={1.5} />
    </g>
  ),
  'Shadow Faerie': (
    <g>
      {faery}
      <path d="M148 12 a10 10 0 1 0 8 17 a8 8 0 0 1 -8 -17" />
      <Star x={58} y={30} s={3} />
    </g>
  ),
  'Troll Keeper': (
    <g>
      <path d="M96 64 V28 a10 10 0 1 1 19 4" />
      <circle cx={134} cy={50} r={9} />
      <path d="M130 42 l-2 -6 M136 41 v-6 M141 44 l3 -5" strokeWidth={1.5} />
      <Dot x={131} y={50} r={1.5} />
      <Dot x={137} y={50} r={1.5} />
    </g>
  ),
  Spizzer: (
    <g>
      <path d="M110 14 L88 42 h13 L90 66 L122 36 h-13 L124 14 Z" />
      <path d="M78 24 l-8 -6 M82 52 l-9 4 M132 46 l8 6" />
    </g>
  ),
  'Tower Gremlin': (
    <g>
      <path d="M92 66 V38 h24 V66 M92 38 v-6 h6 v6 M110 38 v-6 h6 v6" />
      <path d="M101 58 a3 3 0 0 1 6 0 v8" strokeWidth={1.5} />
      <circle cx={104} cy={24} r={8} />
      <path d="M97 20 l-9 -9 3 11 M111 20 l9 -9 -3 11" />
      <Dot x={101} y={24} r={1.5} />
      <Dot x={107} y={24} r={1.5} />
    </g>
  ),
  Unicorn: (
    <g>
      <path d="M88 64 C88 44 98 34 112 34 L132 42 L124 48 c0 8 -8 12 -18 12" />
      <path d="M112 34 L124 14 M115 29 l4 2 M118 24 l4 2" />
      <path d="M104 34 l2 -8 6 6" />
      <Dot x={113} y={41} r={1.8} />
      <path d="M96 40 c-4 4 -6 10 -6 16 M102 36 c-4 6 -5 12 -5 18" strokeWidth={1.5} />
    </g>
  ),
  Werewolf: (
    <g>
      <path d="M86 16 l4 14 c-5 7 -5 15 1 21 l13 9 13 -9 c6 -6 6 -14 1 -21 l4 -14 -12 8 c-4 -2 -8 -2 -12 0 Z" />
      <Dot x={97} y={36} r={1.8} />
      <Dot x={111} y={36} r={1.8} />
      <path d="M101 44 h6 l-3 4 Z" strokeWidth={1.5} />
      <path d="M99 52 v5 M109 52 v5" strokeWidth={1.5} />
    </g>
  ),
  'Stone Giant': (
    <g>
      <path d="M74 66 c-2 -18 10 -32 30 -32 s32 14 30 32" />
      <path d="M94 34 a10 10 0 0 1 20 0" />
      <Dot x={100} y={30} r={1.8} />
      <Dot x={108} y={30} r={1.8} />
      <path d="M74 56 l-14 8 M134 56 l14 8" />
      <path d="M100 48 l6 6 -4 8 M118 44 l-4 6" strokeWidth={1.5} />
    </g>
  ),
  Vampire: (
    <g>
      <ellipse cx={104} cy={44} rx={5} ry={8} />
      <circle cx={104} cy={32} r={4.5} />
      <path d="M100 29 l-3 -6 M108 29 l3 -6" />
      <path d="M99 40 C89 32 77 32 69 40 c5 1 7 4 7 8 c5 -3 10 -2 13 2 c3 -2 7 -3 10 -2" />
      <path d="M109 40 C119 32 131 32 139 40 c-5 1 -7 4 -7 8 c-5 -3 -10 -2 -13 2 c-3 -2 -7 -3 -10 -2" />
      <path d="M102 37 v4 M106 37 v4" strokeWidth={1.5} />
    </g>
  ),
  Dragon: (
    <g>
      <path d="M82 40 c2 -12 14 -20 28 -18 l14 4 12 -6 -4 10 6 6 -10 4 c-2 10 -12 16 -24 14 l-22 -4 Z" />
      <path d="M100 22 l-6 -10 M110 23 l-2 -10" />
      <Dot x={114} y={34} r={1.8} />
      <path d="M138 40 c10 -4 18 -2 24 4 M138 46 c8 2 12 6 14 10" />
      <Dot x={168} y={48} r={2} />
    </g>
  ),
}
