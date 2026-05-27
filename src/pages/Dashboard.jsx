import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import ExpenseRow from '../components/ExpenseRow'

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function groupByDate(expenses) {
  const groups = {}
  expenses.forEach(e => {
    if (!groups[e.date]) groups[e.date] = []
    groups[e.date].push(e)
  })
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

function fmtDate(dateStr) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today)     return 'Hari Ini'
  if (dateStr === yesterday) return 'Semalam'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ms-MY', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  const fetchExpenses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${thisMonth}-01`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (err) {
      // Table may not exist yet — show setup notice instead of crashing
      if (err.code === '42P01') {
        setError('setup')
      } else {
        setError(err.message)
      }
    } else {
      setExpenses(data || [])
    }
    setLoading(false)
  }, [user, thisMonth])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function handleDelete(id) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const total      = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const grouped    = groupByDate(expenses)
  const monthName  = new Date().toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })

  return (
    <Layout title="Buku Perbelanjaan">
      {/* ── Month total banner ──────────────────────────── */}
      <div className="bg-nb-blue px-4 pt-2 pb-5 flex-shrink-0">
        <p className="font-mono text-white/60 text-[10px] uppercase tracking-[2px] mb-1">
          {monthName}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="font-stamp text-white/70 text-2xl">RM</span>
          <span className="font-stamp text-white text-5xl">{fmt(total)}</span>
        </div>
        <p className="font-mono text-white/50 text-xs mt-1">
          {expenses.length} transaksi bulan ini
        </p>
      </div>

      {/* ── Expense list ────────────────────────────────── */}
      <div className="ruled-paper flex-1 min-h-0 overflow-y-auto page-enter">

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'setup' && (
          <div className="pl-14 pr-4 py-8">
            <p className="font-stamp text-nb-red text-lg mb-2">Persediaan Diperlukan</p>
            <p className="font-mono text-xs text-gray-600 mb-3">
              Jadual pangkalan data belum dicipta. Jalankan SQL berikut di Supabase SQL Editor:
            </p>
            <pre className="bg-white/80 rounded p-3 text-[10px] font-mono text-gray-700 overflow-x-auto border border-nb-line">
{`-- Jalankan di: supabase.com → SQL Editor

create table profiles (
  id uuid references auth.users primary key,
  email text,
  created_at timestamptz default now()
);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount numeric(10,2) not null,
  description text,
  category text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table expenses enable row level security;
create policy "own" on expenses
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`}
            </pre>
          </div>
        )}

        {!loading && !error && expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 pl-14 pr-4 gap-3 opacity-50">
            <span className="text-4xl">📒</span>
            <p className="font-hand text-lg text-gray-600 text-center">
              Tiada rekod lagi.<br />Tekan Tambah untuk mula.
            </p>
          </div>
        )}

        {!loading && !error && grouped.map(([date, exps]) => {
          const dayTotal = exps.reduce((s, e) => s + Number(e.amount), 0)
          return (
            <div key={date} className="mb-2">
              {/* Date header row */}
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

      {/* ── FAB ─────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/add')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-nb-blue rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-nb-navy active:scale-95 transition-all z-50"
        aria-label="Tambah perbelanjaan"
      >
        +
      </button>
    </Layout>
  )
}
