import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import ExpenseRow from '../components/ExpenseRow'
import CategoryBreakdown from '../components/CategoryBreakdown'

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getMonthStr(offset) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 7)
}

function monthName(monthStr) {
  const [y, m] = monthStr.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })
}

function groupByDate(expenses) {
  const g = {}
  expenses.forEach(e => {
    if (!g[e.date]) g[e.date] = []
    g[e.date].push(e)
  })
  return Object.entries(g).sort(([a], [b]) => b.localeCompare(a))
}

function fmtDay(dateStr) {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function MonthlyPage() {
  const { user } = useAuth()
  const [offset,   setOffset]   = useState(0)
  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)

  const month = getMonthStr(offset)

  const fetchMonth = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const start = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const endDate = new Date(y, m, 0) // last day of month
    const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    setExpenses(data || [])
    setLoading(false)
  }, [user, month])

  useEffect(() => { fetchMonth() }, [fetchMonth])

  const total   = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const grouped = groupByDate(expenses)
  const days    = grouped.length
  const avgDay  = days > 0 ? total / days : 0

  return (
    <Layout title="Ringkasan Bulanan">
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── Month selector ──────────────────────────────── */}
        <div className="bg-nb-blue/90 flex items-center justify-between px-4 py-3 flex-shrink-0">
          <button
            onClick={() => setOffset(o => o - 1)}
            className="text-white/70 hover:text-white text-xl px-2 transition-colors"
            aria-label="Bulan sebelum"
          >‹</button>
          <span className="font-stamp text-white tracking-wide">{monthName(month)}</span>
          <button
            onClick={() => setOffset(o => Math.min(0, o + 1))}
            disabled={offset >= 0}
            className="text-white/70 hover:text-white text-xl px-2 transition-colors disabled:opacity-25"
            aria-label="Bulan hadapan"
          >›</button>
        </div>

        {/* ── Summary cards ───────────────────────────────── */}
        <div className="bg-nb-blue pb-4 px-4 flex gap-3 flex-shrink-0">
          {/* Total card */}
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="font-mono text-white/60 text-[10px] uppercase tracking-wider">Jumlah</p>
            <p className="font-mono text-white font-bold text-xl">RM {fmt(total)}</p>
          </div>
          {/* Average card */}
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="font-mono text-white/60 text-[10px] uppercase tracking-wider">Purata/Hari</p>
            <p className="font-mono text-white font-bold text-xl">RM {fmt(avgDay)}</p>
            <p className="font-mono text-white/40 text-[10px]">{days} hari aktif</p>
          </div>
          {/* Transactions card */}
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="font-mono text-white/60 text-[10px] uppercase tracking-wider">Transaksi</p>
            <p className="font-mono text-white font-bold text-xl">{expenses.length}</p>
          </div>
        </div>

        {/* ── Paper content ────────────────────────────────── */}
        <div className="ruled-paper flex-1 overflow-y-auto page-enter">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin" />
            </div>
          )}

          {!loading && expenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-50">
              <span className="text-4xl">📅</span>
              <p className="font-hand text-lg text-gray-500">Tiada rekod untuk bulan ini.</p>
            </div>
          )}

          {!loading && expenses.length > 0 && (
            <>
              {/* Category breakdown */}
              <CategoryBreakdown expenses={expenses} />

              {/* Divider */}
              <div className="border-t-2 border-dashed border-nb-line/50 mx-4 mb-2" />

              {/* Daily entries */}
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest pl-14 py-1">
                Rekod Harian
              </p>

              {grouped.map(([date, exps]) => {
                const dayTotal = exps.reduce((s, e) => s + Number(e.amount), 0)
                return (
                  <div key={date} className="mb-1">
                    <div className="flex justify-between items-center pl-14 pr-4 py-1.5 border-b border-nb-line/50">
                      <span className="font-stamp text-xs text-gray-500 uppercase">{fmtDay(date)}</span>
                      <span className="font-mono text-xs text-gray-500">RM {fmt(dayTotal)}</span>
                    </div>
                    {exps.map(exp => <ExpenseRow key={exp.id} expense={exp} />)}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
