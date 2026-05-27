import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/dashboard', icon: '📒', label: 'Utama'   },
  { to: '/add',       icon: '✏️',  label: 'Tambah'  },
  { to: '/hutang',    icon: '💸',  label: 'Hutang'  },
  { to: '/monthly',   icon: '📊',  label: 'Bulanan' },
]

// Approximate nav bar height in px — used for content padding
const NAV_H = 56

export default function Layout({ children, title }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [navHidden, setNavHidden] = useState(false)
  const lastScrollTop = useRef(0)

  // ── Listen for scroll on any child element (capture phase) ───
  useEffect(() => {
    const handler = (e) => {
      const el = e.target
      if (!el || typeof el.scrollTop !== 'number') return

      const curr  = el.scrollTop
      const delta = curr - lastScrollTop.current

      if      (delta >  10 && curr > 60) setNavHidden(true)   // scrolling down
      else if (delta < -10)              setNavHidden(false)   // scrolling up

      lastScrollTop.current = curr
    }

    document.addEventListener('scroll', handler, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', handler, { capture: true })
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto shadow-2xl">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="bg-nb-blue px-4 py-3 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="border-2 border-nb-red rounded px-2 py-0.5 font-stamp text-nb-red text-sm leading-none">
            555
          </div>
          <span className="font-stamp text-white text-base tracking-wide">
            {title || 'Buku Perbelanjaan'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-white/60 hover:text-white text-xs font-mono transition-colors px-2 py-1 rounded hover:bg-white/10"
          title="Log keluar"
        >
          Keluar
        </button>
      </header>

      {/* ── Page content ─────────────────────────────────── */}
      {/* pb keeps content above the fixed nav; transitions with nav */}
      <main
        className="flex-1 overflow-hidden flex flex-col transition-[padding-bottom] duration-300"
        style={{ paddingBottom: navHidden ? 0 : NAV_H }}
      >
        {children}
      </main>

      {/* ── Bottom nav (fixed, auto-hides on scroll down) ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-nb-navy flex border-t border-nb-blue/50 z-40"
        style={{
          transform:  navHidden ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-mono transition-colors border-b-2 ${
                isActive
                  ? 'text-white border-white bg-white/8'
                  : 'text-white/50 border-transparent hover:text-white/80'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
