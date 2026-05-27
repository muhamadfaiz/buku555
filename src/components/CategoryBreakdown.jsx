const CATS = [
  { key: 'Makan',     icon: '🍚', bar: 'bg-amber-400' },
  { key: 'Transport', icon: '🚌', bar: 'bg-blue-400'  },
  { key: 'Hutang',    icon: '💸', bar: 'bg-red-500'   },
  { key: 'Lain-lain', icon: '📦', bar: 'bg-purple-400'},
]

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CategoryBreakdown({ expenses }) {
  const totals = {}
  CATS.forEach(c => { totals[c.key] = 0 })
  expenses.forEach(e => { totals[e.category] = (totals[e.category] ?? 0) + Number(e.amount) })

  const maxAmt = Math.max(...Object.values(totals), 1)

  return (
    <div className="px-4 pt-2 pb-3">
      <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-3 pl-14">
        Mengikut Kategori
      </p>
      {CATS.map(({ key, icon, bar }) => {
        const amt = totals[key]
        const pct = (amt / maxAmt) * 100
        return (
          <div key={key} className="flex items-center gap-3 pl-14 pr-2 py-2 border-b border-nb-line/30">
            <span className="text-base flex-shrink-0">{icon}</span>
            <span className="w-24 flex-shrink-0 font-mono text-xs text-gray-600">{key}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-sm font-bold text-nb-blue flex-shrink-0 min-w-[80px] text-right">
              RM {fmt(amt)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
