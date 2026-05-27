import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAT_META } from './CategoryIcon'
import ReceiptModal from './ReceiptModal'

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Deterministic small rotation so each polaroid looks hand-pinned */
function pinRotation(id = '') {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ((h % 11) - 5) * 0.7   // range ≈ −3.5° … +3.5°
}

/** Derive the category icon from tags or fall back to category column */
function resolveMeta(expense) {
  const tags = expense.tags ?? []
  const fromTag = tags.find(t => CAT_META[t])
  if (fromTag) return CAT_META[fromTag]
  return CAT_META[expense.category] ?? CAT_META['Lain-lain']
}

export default function ExpenseRow({ expense, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  const meta    = resolveMeta(expense)
  const { Icon } = meta
  const pending  = expense.is_pending
  const hasPhoto = !!expense.receipt_url
  const rot      = pinRotation(expense.id)

  // Tags to display: use tags[] if present, else fall back to category string
  const displayTags = (expense.tags?.length > 0)
    ? expense.tags
    : [expense.category].filter(Boolean)

  return (
    <>
      <div className={`flex items-center gap-2.5 pl-14 pr-3 py-2 border-b border-nb-line/40 group ${
        pending ? 'opacity-60' : ''
      }`}>

        {/* ── Category icon badge ──────────────────────── */}
        <span className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center p-1.5 ${meta.cls}`}>
          <Icon />
          {pending && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-white flex items-center justify-center text-[7px]">
              ⏳
            </span>
          )}
        </span>

        {/* ── Description + tags ──────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className={`font-hand text-base leading-tight truncate ${
              pending ? 'text-gray-500' : 'text-gray-800'
            }`}>
              {expense.description || expense.category}
            </p>
            {expense.label && (
              <span className="font-mono text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">
                {expense.label}
              </span>
            )}
          </div>
          {/* Tag chips row */}
          <div className="flex flex-wrap gap-1 mt-0.5">
            {displayTags.map(tag => (
              <span
                key={tag}
                className="font-mono text-[9px] text-gray-400 leading-none"
              >
                #{tag}
              </span>
            ))}
            {pending && (
              <span className="font-mono text-[9px] text-amber-500 leading-none ml-1">
                · BELUM SELESAI
              </span>
            )}
          </div>
        </div>

        {/* ── Amount ──────────────────────────────────── */}
        <span className={`font-mono font-bold text-sm flex-shrink-0 ${
          pending
            ? 'text-gray-400 line-through decoration-amber-400'
            : expense.category === 'Hutang' || expense.tags?.includes('Hutang')
              ? 'text-nb-red'
              : 'text-nb-blue'
        }`}>
          RM {fmt(expense.amount)}
        </span>

        {/* ── Edit + Delete buttons (visible on hover) ─── */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <button
            onClick={() => navigate(`/edit/${expense.id}`)}
            className="text-gray-300 hover:text-nb-blue text-sm px-1"
            title="Edit"
          >
            ✎
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(expense.id)}
              className="text-gray-300 hover:text-nb-red text-xs px-1"
              title="Padam"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Receipt thumbnail (polaroid taped to page) ── */}
        {hasPhoto && (
          <div className="relative flex-shrink-0 ml-1">
            {/* Tape strip */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-3.5 z-10 rounded-sm pointer-events-none"
              style={{ background: 'rgba(255,228,100,0.80)' }}
            />
            {/* Polaroid frame */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="block bg-white p-[3px] pb-[10px] shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
              style={{ transform: `rotate(${rot}deg)` }}
              title="Lihat resit"
            >
              <img
                src={expense.receipt_url}
                alt="Resit"
                className="w-12 h-12 object-cover"
                loading="lazy"
              />
            </button>
          </div>
        )}
      </div>

      {/* ── Full-screen receipt modal ─────────────────── */}
      {modalOpen && (
        <ReceiptModal
          url={expense.receipt_url}
          caption={expense.description}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
