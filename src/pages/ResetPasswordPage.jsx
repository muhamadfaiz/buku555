import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const LBL = 'block font-mono text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1'
const INP = 'w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-base text-gray-800 outline-none placeholder:text-gray-400 transition-colors'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [ready,    setReady]    = useState(false)   // token received from email link

  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link.
  // The SDK automatically exchanges the URL hash tokens and sets the session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Also check if session already active (e.g. page refreshed after redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Kata laluan tidak sepadan.')
      return
    }
    if (password.length < 6) {
      setError('Kata laluan mesti sekurang-kurangnya 6 aksara.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nb-blue flex flex-col items-center justify-center px-4 py-8">

      {/* ── Stamp header ─────────────────────────────────── */}
      <div className="flex flex-col items-center mb-8 select-none">
        <div className="border-4 border-nb-red rounded-xl px-8 py-5 mb-4 relative"
          style={{ transform: 'rotate(-2deg)', boxShadow: '3px 3px 0 rgba(0,0,0,0.25)' }}>
          <span className="font-stamp text-nb-red text-6xl" style={{ letterSpacing: '-2px' }}>
            555
          </span>
          <span className="absolute bottom-2 left-0 right-0 text-center font-mono text-nb-red text-[8px] tracking-[3px]">
            BUKU REKOD
          </span>
        </div>
        <h1 className="font-stamp text-white text-2xl tracking-wide">Tetapkan Kata Laluan Baru</h1>
      </div>

      {/* ── Card ─────────────────────────────────────────── */}
      <div className="w-full max-w-sm bg-nb-cream rounded-2xl overflow-hidden shadow-2xl">

        <div className="bg-nb-navy py-3 px-4 font-stamp text-base text-white text-center border-b-2 border-white">
          Tetapkan Semula
        </div>

        <form onSubmit={handleSubmit} className="ruled-paper p-6 flex flex-col gap-5">

          {!ready && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm font-mono rounded px-3 py-2">
              Menunggu pengesahan pautan... Sila pastikan anda membuka halaman ini dari pautan emel.
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-300 text-nb-red text-sm font-mono rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="pl-10">
            <label htmlFor="new-password" className={LBL}>Kata Laluan Baru</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              disabled={!ready}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={INP}
            />
          </div>

          <div className="pl-10">
            <label htmlFor="confirm-password" className={LBL}>Sahkan Kata Laluan</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              disabled={!ready}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={INP}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            className="mt-2 w-full bg-nb-blue hover:bg-nb-navy text-white font-stamp text-xl tracking-wide py-3 rounded-xl transition-colors disabled:opacity-50 shadow-md"
          >
            {loading ? 'Menyimpan...' : 'Simpan Kata Laluan'}
          </button>

        </form>
      </div>
    </div>
  )
}
