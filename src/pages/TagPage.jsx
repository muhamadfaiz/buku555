import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import ExpenseRow from '../components/ExpenseRow'

// ── Tag header colours (mirrors TagInput / ExpenseRow palette) ──
const TAG_BANNER = {
  Makan:       'bg-amber-500',
  Transport:   'bg-blue-600',
  Hutang:      'bg-red-600',
  'Lain-lain': 'bg-purple-600',
}
function bannerCls(t) { return TAG_BANNER[t] ?? 'bg-nb-blue' }

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function groupByDate(expenses) {
  const g = {}
  expenses.forEach(e => {
    if (!g[e.date]) g[e.date] = []
    g[e.date].push(e)
  })
  return Object.entries(g).sort(([a], [b]) => b.localeCompare(a))
}

function fmtDate(dateStr) {
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today)     return 'Hari Ini'
  if (dateStr === yesterday) return 'Semalam'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ms-MY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function TagPage() {
  const { tag }  = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user || !tag) return
    ;(async () => {
      setLoading(true)
      // Match records where tags[] contains this tag OR legacy category column equals it
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .or(`tags.cs.{"${tag}"},category.eq."${tag}"`)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      setExpenses(data || [])
      setLoading(false)
    })()
  }, [user, tag])

  async function handleDelete(id) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const total   = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const grouped = groupByDate(expenses)

  return (
    <Layout title={`#${tag}`}>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Coloured tag banner ──────────────────────────── */}
        <div className={`${bannerCls(tag)} px-4 pt-2 pb-5 flex-shrink-0`}>
          {/* Back link */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/70 hover:text-white font-mono text-xs mb-3 transition-colors"
          >
            ← Kembali
          </button>

          {/* Tag label */}
          <p className="font-mono text-white/60 text-[10px] uppercase tracking-[2px] mb-0.5">Tag</p>
          <p className="font-stamp text-white text-4xl leading-none mb-3">#{tag}</p>

          {/* Stats row */}
          <div className="flex gap-4">
            <div>
              <p className="font-mono text-white/50 text-[10px] uppercase tracking-wider">Jumlah</p>
              <p className="font-stamp text-white text-xl">RM {fmt(total)}</p>
            </div>
            <div>
              <p className="font-mono text-white/50 text-[10px] uppercase tracking-wider">Transaksi</p>
              <p className="font-stamp text-white text-xl">{expenses.length}</p>
            </div>
          </div>
        </div>

        {/* ── Expense list ─────────────────────────────────── */}
        <div className="ruled-paper flex-1 min-h-0 overflow-y-auto page-enter">

          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin" />
            </div>
          )}

          {!loading && expenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
              <span className="text-4xl">🏷️</span>
              <p className="font-hand text-lg text-gray-500 text-center">
                Tiada rekod untuk tag<br />
                <span className="font-mono text-base">#{tag}</span>
              </p>
            </div>
          )}

                    {!loading && grouped.map(([date, exps]) => {
            const dayTotal = exps.reduce((s, e) => s + Number(e.amount), 0)
            return (
              <div key={date} className="mb-2">
                <div className="flex justify-between items-center pl-14 pr-4 py-2 border-b border-nb-line/60">
                  <span className="font-stamp text-xs text-gray-500 uppercase tracking-wider">
                    {fmtDate(date)}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    RM {fmt(dayTotal)}
                  </span>
                </div>
                {exps.map(exp => (
                  <ExpenseRow key={exp.id} expense={exp} onDelete={handleDelete} />
                ))}
              </div>
            )
          })}

        </div>
      </div>
    </Layout>
  )
}
