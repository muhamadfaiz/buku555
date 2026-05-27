import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAT_META } from './CategoryIcon'
import ReceiptModal from './ReceiptModal'

// Width of the revealed action strip (px)
const ACTION_W = 136

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pinRotation(id = '') {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ((h % 11) - 5) * 0.7
}

function resolveMeta(expense) {
  const tags = expense.tags ?? []
  const fromTag = tags.find(t => CAT_META[t])
  if (fromTag) return CAT_META[fromTag]
  return CAT_META[expense.category] ?? CAT_META['Lain-lain']
}

export default function ExpenseRow({ expense, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [swipeX,    setSwipeX]    = useState(0)       // 0 = closed, -ACTION_W = open
  const [snapping,  setSnapping]  = useState(false)   // true = CSS transition active
  const [dragging,  setDragging]  = useState(false)

  const navigate       = useNavigate()
  const rowRef         = useRef(null)
  const startClientX   = useRef(0)
  const startClientY   = useRef(0)
  const startSwipeX    = useRef(0)
  const isHorizontal   = useRef(null)   // null=undecided, true/false=locked

  const meta       = resolveMeta(expense)
  const { Icon }   = meta
  const pending    = expense.is_pending
  const hasPhoto   = !!expense.receipt_url
  const rot        = pinRotation(expense.id)

  const displayTags = (expense.tags?.length > 0)
    ? expense.tags
    : [expense.category].filter(Boolean)

  // ── Snap helper ──────────────────────────────────────────────
  const snapTo = useCallback((x) => {
    setSnapping(true)
    setSwipeX(x)
    setTimeout(() => setSnapping(false), 250)
  }, [])

  const close = useCallback(() => snapTo(0), [snapTo])
  const open  = useCallback(() => snapTo(-ACTION_W), [snapTo])

  // ── Drag start ───────────────────────────────────────────────
  function onDragStart(clientX, clientY) {
    isHorizontal.current = null
    startClientX.current = clientX
    startClientY.current = clientY
    startSwipeX.current  = swipeX
    setDragging(true)
  }

  // ── Drag move (attached to document while dragging) ──────────
  const onDragMove = useCallback((clientX, clientY) => {
    const dx = clientX - startClientX.current
    const dy = clientY - startClientY.current

    // Decide horizontal vs vertical on first significant movement
    if (isHorizontal.current === null && Math.abs(dx) + Math.abs(dy) > 6) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy)
    }
    if (!isHorizontal.current) return

    const next = Math.max(-ACTION_W, Math.min(0, startSwipeX.current + dx))
    setSwipeX(next)
  }, [])

  // ── Drag end ─────────────────────────────────────────────────
  const onDragEnd = useCallback(() => {
    setDragging(false)
    isHorizontal.current = null
    setSwipeX(prev => {
      const target = prev < -ACTION_W / 2 ? -ACTION_W : 0
      setSnapping(true)
      setTimeout(() => setSnapping(false), 250)
      return target
    })
  }, [])

  // ── Attach / detach document-level drag listeners ────────────
  useEffect(() => {
    if (!dragging) return
    const onMouseMove = e => onDragMove(e.clientX, e.clientY)
    const onTouchMove = e => onDragMove(e.touches[0].clientX, e.touches[0].clientY)
    document.addEventListener('mousemove',  onMouseMove)
    document.addEventListener('touchmove',  onTouchMove, { passive: true })
    document.addEventListener('mouseup',    onDragEnd)
    document.addEventListener('touchend',   onDragEnd)
    return () => {
      document.removeEventListener('mousemove',  onMouseMove)
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('mouseup',    onDragEnd)
      document.removeEventListener('touchend',   onDragEnd)
    }
  }, [dragging, onDragMove, onDragEnd])

  // ── Close on outside click when open ─────────────────────────
  useEffect(() => {
    if (swipeX === 0) return
    const handler = e => {
      if (rowRef.current && !rowRef.current.contains(e.target)) close()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [swipeX, close])

  // ── Handlers ─────────────────────────────────────────────────
  const onMouseDown = e => {
    // Only drag on main mouse button; ignore clicks on buttons/links
    if (e.button !== 0) return
    if (e.target.closest('button, a')) return
    onDragStart(e.clientX, e.clientY)
  }

  const onTouchStart = e => {
    if (e.target.closest('button, a')) return
    onDragStart(e.touches[0].clientX, e.touches[0].clientY)
  }

  const isOpen = swipeX <= -ACTION_W / 2

  return (
    <>
      {/* ── Swipe wrapper ──────────────────────────────────── */}
      <div
        ref={rowRef}
        className={`relative overflow-hidden border-b border-nb-line/40 ${pending ? 'opacity-60' : ''}`}
      >
        {/* ── Action strip (revealed on swipe left) ─────────── */}
        <div
          className="absolute inset-y-0 right-0 flex"
          style={{ width: ACTION_W }}
        >
          {/* Edit */}
          <button
            type="button"
            onClick={() => { close(); navigate(`/edit/${expense.id}`) }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-nb-blue hover:bg-nb-navy active:brightness-90 transition-colors"
          >
            <span className="text-white text-lg leading-none">✎</span>
            <span className="text-white/80 font-mono text-[9px] uppercase tracking-wider">Edit</span>
          </button>

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={() => { close(); onDelete(expense.id) }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-nb-red hover:brightness-90 active:brightness-75 transition-all"
            >
              <span className="text-white text-base leading-none">✕</span>
              <span className="text-white/80 font-mono text-[9px] uppercase tracking-wider">Padam</span>
            </button>
          )}
        </div>

        {/* ── Row content (slides left) ──────────────────────── */}
        <div
          className="relative flex items-center gap-2.5 pl-14 pr-3 py-2 bg-white select-none"
          style={{
            transform:  `translateX(${swipeX}px)`,
            transition: snapping ? 'transform 220ms cubic-bezier(.25,.8,.25,1)' : 'none',
            cursor:     dragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          {/* ── Category icon badge ────────────────────────── */}
          <span className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center p-1.5 ${meta.cls}`}>
            <Icon />
            {pending && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-white flex items-center justify-center text-[7px]">
                ⏳
              </span>
            )}
          </span>

          {/* ── Description + tags ────────────────────────── */}
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
            {/* Tag chips */}
            <div className="flex flex-wrap gap-1 mt-0.5">
              {displayTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={e => { e.stopPropagation(); navigate(`/tag/${encodeURIComponent(tag)}`) }}
                  className="font-mono text-[9px] text-gray-400 leading-none hover:text-nb-blue hover:underline transition-colors"
                >
                  #{tag}
                </button>
              ))}
              {pending && (
                <span className="font-mono text-[9px] text-amber-500 leading-none ml-1">
                  · BELUM SELESAI
                </span>
              )}
            </div>
          </div>

          {/* ── Amount ────────────────────────────────────── */}
          <span className={`font-stamp text-base flex-shrink-0 ${
            pending
              ? 'text-gray-400 line-through decoration-amber-400'
              : expense.category === 'Hutang' || expense.tags?.includes('Hutang')
                ? 'text-nb-red'
                : 'text-nb-blue'
          }`}>
            RM {fmt(expense.amount)}
          </span>

          {/* ── Swipe hint arrow (shows when closed) ──────── */}
          <span
            className={`flex-shrink-0 text-gray-300 text-xs font-mono transition-opacity duration-200 pointer-events-none select-none ${
              isOpen ? 'opacity-0' : 'opacity-40'
            }`}
            aria-hidden
          >
            ‹
          </span>

          {/* ── Receipt polaroid ──────────────────────────── */}
          {hasPhoto && (
            <div className="relative flex-shrink-0 ml-1">
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-3.5 z-10 rounded-sm pointer-events-none"
                style={{ background: 'rgba(255,228,100,0.80)' }}
              />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setModalOpen(true) }}
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
      </div>

      {/* ── Full-screen receipt modal ─────────────────────── */}
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
