import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const [tab,      setTab]      = useState('login')   // 'login' | 'signup'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState('')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

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

      {/* ── Stamp header ───────────────────────────────────── */}
      <div className="flex flex-col items-center mb-8 select-none">
        <div className="border-4 border-nb-red rounded-xl px-8 py-5 mb-4 relative"
          style={{ transform: 'rotate(-2deg)', boxShadow: '3px 3px 0 rgba(0,0,0,0.25)' }}>
          <span className="font-stamp text-nb-red text-6xl tracking-tight" style={{ letterSpacing: '-3px' }}>
            555
          </span>
          <span className="absolute bottom-2 left-0 right-0 text-center font-stamp text-nb-red text-[8px] tracking-[3px]">
            BUKU REKOD
          </span>
        </div>
        <h1 className="font-stamp text-white text-xl tracking-wide">Rekod Perbelanjaan</h1>
        <p className="text-white/50 text-xs font-mono mt-1">Simpan rekod harian anda</p>
      </div>

      {/* ── Auth card ──────────────────────────────────────── */}
      <div className="w-full max-w-sm bg-nb-cream rounded-2xl overflow-hidden shadow-2xl">

        {/* Tab bar */}
        <div className="flex bg-nb-navy">
          {[['login', 'Log Masuk'], ['signup', 'Daftar']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(''); setSuccess('') }}
              className={`flex-1 py-3 font-mono text-sm transition-colors border-b-2 ${
                tab === key
                  ? 'text-white border-white bg-white/8'
                  : 'text-white/50 border-transparent hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form — ruled paper */}
        <form onSubmit={handleSubmit} className="ruled-paper p-6 flex flex-col gap-5">

          {/* Success banner */}
          {success && (
            <div className="bg-green-100 border border-green-300 text-green-800 text-xs font-mono rounded px-3 py-2">
              {success}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-nb-red text-xs font-mono rounded px-3 py-2">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="pl-10">
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
              Emel
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-base text-gray-800 outline-none placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="pl-10">
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
              Kata Laluan
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-base text-gray-800 outline-none placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* Confirm password (signup only) */}
          {tab === 'signup' && (
            <div className="pl-10">
              <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
                Sahkan Kata Laluan
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-base text-gray-800 outline-none placeholder:text-gray-300 transition-colors"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-nb-blue hover:bg-nb-navy text-white font-stamp tracking-wide py-3 rounded-xl transition-colors disabled:opacity-50 shadow-md"
          >
            {loading
              ? 'Menunggu...'
              : tab === 'login' ? 'Log Masuk' : 'Daftar Akaun'}
          </button>
        </form>
      </div>
    </div>
  )
}
