import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { CAT_META } from '../components/CategoryIcon'

const CATS = [
  { key: 'Makan',      sel: 'bg-amber-100  border-amber-400  text-amber-700' },
  { key: 'Transport',  sel: 'bg-blue-100   border-blue-400   text-blue-700' },
  { key: 'Hutang',     sel: 'bg-red-100    border-red-400    text-red-700' },
  { key: 'Lain-lain',  sel: 'bg-purple-100 border-purple-400 text-purple-700' },
]

const TODAY = new Date().toISOString().slice(0, 10)

export default function AddExpense() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [amount,      setAmount]      = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('Makan')
  const [date,        setDate]        = useState(TODAY)
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const isValid = parseFloat(amount) > 0 && description.trim().length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('expenses').insert({
      user_id:     user.id,
      amount:      parseFloat(amount),
      description: description.trim(),
      category,
      date,
    })

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <Layout title="Tambah Rekod">
      <div className="ruled-paper flex-1 overflow-y-auto page-enter">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pl-14 pr-4 py-6">

          {error && (
            <div className="bg-red-100 border border-red-300 text-nb-red text-xs font-mono rounded px-3 py-2 -ml-10">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
              Jumlah (RM)
            </label>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl text-gray-300">RM</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-4xl font-bold text-nb-blue outline-none placeholder:text-gray-200 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
              Keterangan
            </label>
            <input
              type="text"
              placeholder="Nasi lemak, Grab, bayar balik..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={80}
              className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-hand text-xl text-gray-800 outline-none placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-2">
              Kategori
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATS.map(({ key, sel }) => {
                const { Icon } = CAT_META[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 transition-all text-center ${
                      category === key
                        ? sel
                        : 'bg-white/60 border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span className="w-7 h-7"><Icon /></span>
                    <span className="font-mono text-[10px] leading-tight">{key}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
              Tarikh
            </label>
            <input
              type="date"
              value={date}
              max={TODAY}
              onChange={e => setDate(e.target.value)}
              className="bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-base text-gray-700 outline-none transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-500 font-stamp tracking-wide hover:border-gray-400 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex-1 py-3 rounded-xl bg-nb-blue text-white font-stamp tracking-wide hover:bg-nb-navy transition-colors disabled:opacity-40 shadow-md"
            >
              {saving ? 'Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
