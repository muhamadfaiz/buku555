const CAT = {
  Makan:     { icon: '🍚', cls: 'bg-amber-100  text-amber-800'  },
  Transport: { icon: '🚌', cls: 'bg-blue-100   text-blue-800'   },
  Hutang:    { icon: '💸', cls: 'bg-red-100    text-red-800'    },
  'Lain-lain':{ icon: '📦', cls: 'bg-purple-100 text-purple-800' },
}

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ExpenseRow({ expense, onDelete }) {
  const meta = CAT[expense.category] ?? CAT['Lain-lain']

  return (
    <div className="flex items-center gap-3 pl-14 pr-3 py-2 border-b border-nb-line/40 group">
      {/* Category badge */}
      <span className={`text-lg flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${meta.cls}`}>
        {meta.icon}
      </span>

      {/* Description + category */}
      <div className="flex-1 min-w-0">
        <p className="font-hand text-base text-gray-800 truncate leading-tight">
          {expense.description || expense.category}
        </p>
        <p className="text-xs text-gray-400 font-mono">{expense.category}</p>
      </div>

      {/* Amount */}
      <span className={`font-mono font-bold text-sm flex-shrink-0 ${
        expense.category === 'Hutang' ? 'text-nb-red' : 'text-nb-blue'
      }`}>
        RM {fmt(expense.amount)}
      </span>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(expense.id)}
          className="text-gray-300 hover:text-nb-red text-xs opacity-0 group-hover:opacity-100 transition-all ml-1 flex-shrink-0"
          title="Padam"
        >
          ✕
        </button>
      )}
    </div>
  )
}
