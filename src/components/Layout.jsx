import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/dashboard', icon: '📒', label: 'Utama'   },
  { to: '/add',       icon: '✏️',  label: 'Tambah'  },
  { to: '/monthly',   icon: '📊',  label: 'Bulanan' },
]

export default function Layout({ children, title }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto shadow-2xl">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="bg-nb-blue px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Mini stamp badge */}
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
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>

      {/* ── Bottom nav ───────────────────────────────────── */}
      <nav className="bg-nb-navy flex-shrink-0 flex border-t border-nb-blue/50">
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
