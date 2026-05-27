import { CAT_META, IconTag } from './CategoryIcon'

// ── Known-category bar colours ───────────────────────────────
const PRESET_BAR = {
  Makan:       'bg-amber-400',
  Transport:   'bg-blue-400',
  Hutang:      'bg-red-500',
  'Lain-lain': 'bg-purple-400',
}

// ── Palette for AI / custom tags (deterministic by tag name) ─
const CUSTOM_PALETTES = [
  { cls: 'bg-teal-100   text-teal-700',    bar: 'bg-teal-500'    },
  { cls: 'bg-green-100  text-green-700',   bar: 'bg-green-500'   },
  { cls: 'bg-orange-100 text-orange-700',  bar: 'bg-orange-500'  },
  { cls: 'bg-cyan-100   text-cyan-700',    bar: 'bg-cyan-500'    },
  { cls: 'bg-rose-100   text-rose-700',    bar: 'bg-rose-500'    },
  { cls: 'bg-indigo-100 text-indigo-700',  bar: 'bg-indigo-500'  },
  { cls: 'bg-lime-100   text-lime-700',    bar: 'bg-lime-500'    },
  { cls: 'bg-fuchsia-100 text-fuchsia-700',bar: 'bg-fuchsia-500' },
]

function paletteFor(tag) {
  const h = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return CUSTOM_PALETTES[h % CUSTOM_PALETTES.length]
}

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CategoryBreakdown({ expenses }) {
  // ── Aggregate amount per tag ─────────────────────────────
  // Each expense is counted once per tag it carries, so tags can overlap —
  // that's intentional: "Food & Beverage" and "Restaurant" can both total 59.90.
  const totals    = {}   // tag → total RM
  const tagOrder  = []   // insertion order (first seen = highest priority)

  expenses.forEach(e => {
    const tags = e.tags?.length > 0
      ? e.tags
      : [e.category].filter(Boolean)

    tags.forEach(tag => {
      if (!(tag in totals)) {
        totals[tag] = 0
        tagOrder.push(tag)
      }
      totals[tag] += Number(e.amount)
    })
  })

  // Sort by descending amount
  const sorted = [...tagOrder].sort((a, b) => totals[b] - totals[a])
  const maxAmt = Math.max(...Object.values(totals), 1)

  if (sorted.length === 0) return null

  return (
    <div className="px-4 pt-2 pb-3">
      <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-3 pl-14">
        Mengikut Tag
      </p>

      {sorted.map(tag => {
        const amt  = totals[tag]
        const pct  = (amt / maxAmt) * 100
        const meta = CAT_META[tag]

        // Known category: use its hand-drawn icon + colours
        // Custom / AI tag: use IconTag + deterministic palette
        const Icon    = meta?.Icon  ?? IconTag
        const badgeCls = meta?.cls  ?? paletteFor(tag).cls
        const barCls   = PRESET_BAR[tag] ?? paletteFor(tag).bar

        return (
          <div
            key={tag}
            className="flex items-center gap-3 pl-14 pr-2 py-2 border-b border-nb-line/30"
          >
            {/* Hand-drawn icon badge */}
            <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center p-1.5 ${badgeCls}`}>
              <Icon />
            </span>

            {/* Tag name */}
            <span className="w-28 flex-shrink-0 font-mono text-xs text-gray-600 truncate">
              {tag}
            </span>

            {/* Bar */}
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Amount */}
            <span className="font-stamp text-base text-nb-blue flex-shrink-0 min-w-[80px] text-right">
              RM {fmt(amt)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
