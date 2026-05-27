/**
 * Hand-drawn SVG icons for each expense category.
 * All paths use bezier curves + round caps/joins so they feel
 * like pencil sketches on the notebook paper.
 */

// ── shared SVG props ─────────────────────────────────────────
const SP = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  filter: 'url(#pencil-sketch)',
}

// ── Makan — rice bowl with steam wisps ──────────────────────
export function IconMakan({ className = 'w-full h-full' }) {
  return (
    <svg {...SP} className={className}>
      {/* Steam — slight S-curve each wisp */}
      <path d="M9 10C8.3 8.3 9.4 7.2 8.7 5.4"/>
      <path d="M12 9C11.3 7.3 12.4 6.2 11.7 4.4"/>
      <path d="M15 10C14.3 8.3 15.4 7.2 14.7 5.4"/>
      {/* Rim — gentle arc */}
      <path d="M4 13C5.6 11.1 8.9 10.4 12 10.4C15.1 10.4 18.4 11.1 20 13"/>
      {/* Bowl body */}
      <path d="M4 13C4.3 18.6 7.9 22 12 22C16.1 22 19.7 18.6 20 13"/>
      {/* Base plate — slight bow */}
      <path d="M8.5 22C10 22.6 14 22.6 15.5 22"/>
    </svg>
  )
}

// ── Transport — side-view bus ────────────────────────────────
export function IconTransport({ className = 'w-full h-full' }) {
  return (
    <svg {...SP} className={className}>
      {/* Bus body */}
      <path d="M2.5 7.5C2.5 6.5 3.5 6 4.5 6L19.5 6C20.5 6 21.5 6.5 21.5 7.5L21.5 16C21.5 17 20.5 17.5 19.5 17.5L4.5 17.5C3.5 17.5 2.5 17 2.5 16Z"/>
      {/* Centre divider — slight wobble */}
      <path d="M12 6C12.2 8.8 11.8 10.8 12 13"/>
      {/* Seat-line across middle */}
      <path d="M2.5 13C7.5 12.7 16.5 13.3 21.5 13"/>
      {/* Wheels — hand-drawn circles */}
      <circle cx="7" cy="19.5" r="2"/>
      <circle cx="17" cy="19.5" r="2"/>
    </svg>
  )
}

// ── Hutang — banknote + down-arrow (money owed) ──────────────
export function IconHutang({ className = 'w-full h-full' }) {
  return (
    <svg {...SP} className={className}>
      {/* Bill outline */}
      <path d="M2 8C2 7 2.9 6.5 4 6.5L20 6.5C21.1 6.5 22 7 22 8L22 15C22 16 21.1 16.5 20 16.5L4 16.5C2.9 16.5 2 16 2 15Z"/>
      {/* Coin circle */}
      <circle cx="12" cy="11.5" r="2.8"/>
      {/* Left decorative dashes */}
      <line x1="4"    y1="10"   x2="6.5"  y2="10"/>
      <line x1="4"    y1="13"   x2="6.5"  y2="13"/>
      {/* Right decorative dashes */}
      <line x1="17.5" y1="10"   x2="20"   y2="10"/>
      <line x1="17.5" y1="13"   x2="20"   y2="13"/>
      {/* Down arrow stem — slight curve */}
      <path d="M12 17.5C11.8 19 12.2 20 12 20.5"/>
      {/* Arrow head */}
      <path d="M9.5 19L12 21.5L14.5 19"/>
    </svg>
  )
}

// ── Lain-lain — price-tag label ──────────────────────────────
export function IconLainLain({ className = 'w-full h-full' }) {
  return (
    <svg {...SP} className={className}>
      {/* Tag outline */}
      <path d="M3 3.5L14 3.5L20.5 10L14 16.5L3 16.5C2.2 16.5 2 15.8 2 15.5L2 4.5C2 4.2 2.2 3.5 3 3.5Z"/>
      {/* Hole */}
      <circle cx="5.5" cy="10" r="1.5"/>
      {/* Wavy text lines — slightly bowed */}
      <path d="M9 7.5C11 7.3 13.5 7.7 16 7.5"/>
      <path d="M9 10C11 9.8 13 10.2 15 10"/>
      <path d="M9 12.5C10.5 12.3 12.5 12.7 14 12.5"/>
    </svg>
  )
}

// ── Meta map used across the app ─────────────────────────────
export const CAT_META = {
  Makan:       { Icon: IconMakan,      cls: 'bg-amber-100  text-amber-700'  },
  Transport:   { Icon: IconTransport,  cls: 'bg-blue-100   text-blue-700'   },
  Hutang:      { Icon: IconHutang,     cls: 'bg-red-100    text-red-700'    },
  'Lain-lain': { Icon: IconLainLain,   cls: 'bg-purple-100 text-purple-700' },
}
