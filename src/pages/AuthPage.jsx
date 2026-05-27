import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LBL = 'block font-mono text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1'
const INP = 'w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-base text-gray-800 outline-none placeholder:text-gray-400 transition-colors'

export default function AuthPage() {
  const [tab,      setTab]      = useState('login')
  const [mode,     setMode]     = useState('form')   // 'form' | 'forgot'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState('')

  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()

  function switchTab(key) {
    setTab(key); setMode('form'); setError(''); setSuccess('')
  }
  function openForgot() {
    setMode('forgot'); setError(''); setSuccess('')
  }
  function backToLogin() {
    setMode('form'); setTab('login'); setError(''); setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // ── Forgot password ───────────────────────────────────────
    if (mode === 'forgot') {
      setLoading(true)
      try {
        await resetPassword(email)
        setSuccess('Pautan tetapan semula telah dihantar! Sila semak emel anda.')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    // ── Login / Signup ────────────────────────────────────────
    if (tab === 'signup' && password !== confirm) {
      setError('Kata laluan tidak sepadan.')
      return
    }
    if (password.length < 6) {
      setError('Kata laluan mesti sekurang-kurangnya 6 aksara.')
      return
    }

    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn(email, password)
        navigate('/dashboard')
      } else {
        await signUp(email, password)
        setSuccess('Akaun dicipta! Sila semak emel anda untuk pengesahan, kemudian log masuk.')
        setTab('login')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Emel atau kata laluan salah.'
        : err.message)
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
        <h1 className="font-stamp text-white text-2xl tracking-wide">Rekod Perbelanjaan</h1>
        <p className="text-white/60 text-sm font-mono mt-1">Simpan rekod harian anda</p>
      </div>

      {/* ── Auth card ────────────────────────────────────── */}
      <div className="w-full max-w-sm bg-nb-cream rounded-2xl overflow-hidden shadow-2xl">

        {/* Tab bar */}
        <div className="flex bg-nb-navy">
          {mode === 'forgot' ? (
            <div className="flex-1 py-3 font-stamp text-base text-center text-white border-b-2 border-white bg-white/8">
              Lupa Kata Laluan
            </div>
          ) : (
            [['login', 'Log Masuk'], ['signup', 'Daftar']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`flex-1 py-3 font-stamp text-base transition-colors border-b-2 ${
                  tab === key
                    ? 'text-white border-white bg-white/8'
                    : 'text-white/50 border-transparent hover:text-white/80'
                }`}
              >
                {label}
              </button>
            ))
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="ruled-paper p-6 flex flex-col gap-5"
          autoComplete="on"
        >
          {success && (
            <div className="bg-green-100 border border-green-300 text-green-800 text-sm font-mono rounded px-3 py-2">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-300 text-nb-red text-sm font-mono rounded px-3 py-2">
              {error}
            </div>
          )}

          {/* ── Forgot-password mode ───────────────────────── */}
          {mode === 'forgot' ? (
            <>
              <p className="pl-10 font-mono text-xs text-gray-500 leading-relaxed">
                Masukkan emel anda dan kami akan hantar pautan untuk menetapkan semula kata laluan.
              </p>
              <div className="pl-10">
                <label htmlFor="email-forgot" className={LBL}>Emel</label>
                <input
                  id="email-forgot"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@contoh.com"
                  className={INP}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !!success}
                className="mt-2 w-full bg-nb-blue hover:bg-nb-navy text-white font-stamp text-xl tracking-wide py-3 rounded-xl transition-colors disabled:opacity-50 shadow-md"
              >
                {loading ? 'Menghantar...' : 'Hantar Pautan Reset'}
              </button>
              <button
                type="button"
                onClick={backToLogin}
                className="text-center font-mono text-xs text-nb-blue hover:underline"
              >
                ← Kembali ke Log Masuk
              </button>
            </>
          ) : (
            <>
              {/* ── Email ──────────────────────────────────── */}
              <div className="pl-10">
                <label htmlFor="email" className={LBL}>Emel</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@contoh.com"
                  className={INP}
                />
              </div>

              {/* ── Password ───────────────────────────────── */}
              <div className="pl-10">
                <label htmlFor="password" className={LBL}>Kata Laluan</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={INP}
                />
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={openForgot}
                    className="mt-1.5 font-mono text-[11px] text-gray-400 hover:text-nb-blue hover:underline transition-colors"
                  >
                    Lupa kata laluan?
                  </button>
                )}
              </div>

              {/* ── Confirm password (signup only) ─────────── */}
              {tab === 'signup' && (
                <div className="pl-10">
                  <label htmlFor="confirm" className={LBL}>Sahkan Kata Laluan</label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={INP}
                  />
                </div>
              )}

              {/* ── Submit ─────────────────────────────────── */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-nb-blue hover:bg-nb-navy text-white font-stamp text-xl tracking-wide py-3 rounded-xl transition-colors disabled:opacity-50 shadow-md"
              >
                {loading ? 'Menunggu...' : tab === 'login' ? 'Log Masuk' : 'Daftar Akaun'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
