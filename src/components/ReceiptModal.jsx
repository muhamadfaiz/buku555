import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ReceiptModal({ url, caption, onClose }) {
  // Lock body scroll and handle ESC key while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Content card — stop click propagation so taps inside don't close */}
      <div
        className="relative w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Close button ──────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white font-mono text-2xl leading-none"
          aria-label="Tutup"
        >
          ✕
        </button>

        {/* ── Polaroid frame ────────────────────────────── */}
        <div className="bg-white p-2 pb-10 shadow-2xl" style={{ transform: 'rotate(-0.5deg)' }}>
          {/* Tape strip at top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 rounded-sm z-10"
            style={{ background: 'rgba(255,235,120,0.80)' }} />

          <img
            src={url}
            alt={caption}
            className="w-full object-contain max-h-[60vh]"
          />

          {/* Caption in handwritten font */}
          {caption && (
            <p className="mt-2 text-center font-hand text-gray-600 text-base leading-tight px-1">
              {caption}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 font-mono text-white/30 text-xs">
        Ketik di luar untuk tutup
      </p>
    </div>,
    document.body
  )
}
