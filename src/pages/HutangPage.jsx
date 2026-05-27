import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

function fmt(n) {
  return Number(n).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ACTION_W = 80

// ── Custom Swipable Row for Hutang Transactions ────────────────
function HutangRow({ debt, onDelete, onToggleSettle, onEdit }) {
  const rowRef = useRef(null)
  
  const [swipeX,    setSwipeX]    = useState(0)
  const [snapping,  setSnapping]  = useState(false)
  const [dragging,  setDragging]  = useState(false)

  const startClientX = useRef(0)
  const startClientY = useRef(0)
  const startSwipeX  = useRef(0)
  const isHorizontal = useRef(null)
  const actionTriggered = useRef(false)

  const isPiutang = debt.debt_type === 'piutang'
  const isSettled = !debt.is_pending

  // ── Snap ─────────────────────────────────────────────────────
  const snapTo = useCallback((x) => {
    setSnapping(true)
    setSwipeX(x)
    setTimeout(() => setSnapping(false), 250)
  }, [])

  const close = useCallback(() => snapTo(0), [snapTo])

  // ── Drag start ───────────────────────────────────────────────
  function onDragStart(clientX, clientY) {
    isHorizontal.current = null
    actionTriggered.current = false
    startClientX.current = clientX
    startClientY.current = clientY
    startSwipeX.current  = swipeX
    setDragging(true)
  }

  // ── Drag move ────────────────────────────────────────────────
  const onDragMove = useCallback((clientX, clientY) => {
    const dx = clientX - startClientX.current
    const dy = clientY - startClientY.current

    if (isHorizontal.current === null && Math.abs(dx) + Math.abs(dy) > 6) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy)
    }
    if (!isHorizontal.current) return

    const rawNext = startSwipeX.current + dx
    const maxSwipe = rowRef.current ? rowRef.current.clientWidth : 400
    setSwipeX(rawNext < 0 ? Math.max(-maxSwipe, rawNext) : Math.min(maxSwipe, rawNext))
  }, [])

  // ── Drag end ─────────────────────────────────────────────────
  const onDragEnd = useCallback(() => {
    setDragging(false)
    isHorizontal.current = null
    if (actionTriggered.current) return
    
    const threshold = 150
    const rowWidth = rowRef.current ? rowRef.current.clientWidth : 400

    setSwipeX(prev => {
      let target = 0
      if (prev < -threshold) {
        actionTriggered.current = true
        target = -rowWidth   // slide left to toggle settle status
        setSnapping(true)
        setTimeout(() => {
          setSnapping(false)
          onToggleSettle(debt.id, !isSettled)
        }, 220)
        return target
      } else if (prev < -ACTION_W / 2) {
        target = -ACTION_W   // snap open → reveal settle button
      } else if (prev > threshold) {
        actionTriggered.current = true
        target = rowWidth    // slide right to delete
        setSnapping(true)
        setTimeout(() => {
          setSnapping(false)
          onDelete(debt.id)
        }, 220)
        return target
      } else if (prev > ACTION_W / 2) {
        target = ACTION_W    // snap open → reveal delete button
      }
      
      setSnapping(true)
      setTimeout(() => setSnapping(false), 250)
      return target
    })
  }, [debt.id, isSettled, onDelete, onToggleSettle])

  useEffect(() => {
    if (!dragging) return
    const onMouseMove = e => onDragMove(e.clientX, e.clientY)
    const onTouchMove = e => onDragMove(e.touches[0].clientX, e.touches[0].clientY)
    document.addEventListener('mousemove',  onMouseMove)
    document.addEventListener('touchmove',  onTouchMove, { passive: true })
    document.addEventListener('mouseup',    onDragEnd)
    document.addEventListener('touchend',   onDragEnd)
    return () => {
      document.removeEventListener('mousemove',  onMouseMove)
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('mouseup',    onDragEnd)
      document.removeEventListener('touchend',   onDragEnd)
    }
  }, [dragging, onDragMove, onDragEnd])

  useEffect(() => {
    if (swipeX === 0) return
    const handler = e => {
      if (rowRef.current && !rowRef.current.contains(e.target)) close()
    }
    document.addEventListener('mousedown',  handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown',  handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [swipeX, close])

  const onMouseDown = e => {
    if (e.button !== 0) return
    if (e.target.closest('button, a')) return
    onDragStart(e.clientX, e.clientY)
  }
  const onTouchStart = e => {
    if (e.target.closest('button, a')) return
    onDragStart(e.touches[0].clientX, e.touches[0].clientY)
  }

  return (
    <div
      ref={rowRef}
      className={`relative overflow-hidden border-b border-nb-line/20 bg-white ${isSettled ? 'bg-gray-50/50' : ''}`}
    >
      {/* ── LEFT action: Delete (revealed by swiping right) ─── */}
      <div
        className="absolute inset-y-0 left-0 flex items-stretch bg-nb-red overflow-hidden"
        style={{ width: swipeX > 0 ? `${swipeX}px` : 0 }}
      >
        <button
          type="button"
          onClick={() => { close(); onDelete(debt.id) }}
          className="w-full flex items-center gap-3 px-6 text-white hover:brightness-95 active:brightness-90 transition-all whitespace-nowrap"
        >
          <span 
            className="text-white text-lg leading-none transition-transform duration-200"
            style={{ transform: `scale(${swipeX > 150 ? 1.3 : 1})` }}
          >
            ✕
          </span>
          <span 
            className="font-mono text-[11px] uppercase tracking-wider transition-all duration-200"
            style={{ 
              fontWeight: swipeX > 150 ? 'bold' : 'normal',
              opacity: swipeX > 40 ? 1 : 0 
            }}
          >
            {swipeX > 150 ? 'Lepas untuk Padam' : 'Padam'}
          </span>
        </button>
      </div>

      {/* ── RIGHT action: Toggle Settle (revealed by swiping left) ─── */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch bg-emerald-600 overflow-hidden"
        style={{ width: swipeX < 0 ? `${-swipeX}px` : 0 }}
      >
        <button
          type="button"
          onClick={() => { close(); onToggleSettle(debt.id, !isSettled) }}
          className="w-full flex items-center justify-end gap-3 px-6 text-white hover:brightness-95 active:brightness-90 transition-all whitespace-nowrap"
        >
          <span 
            className="font-mono text-[11px] uppercase tracking-wider transition-all duration-200"
            style={{ 
              fontWeight: swipeX < -150 ? 'bold' : 'normal',
              opacity: swipeX < -40 ? 1 : 0 
            }}
          >
            {swipeX < -150 
              ? (isSettled ? 'Lepas untuk Outstanding' : 'Lepas untuk Lunas') 
              : (isSettled ? 'Outstanding' : 'Lunas')
            }
          </span>
          <span 
            className="text-white text-lg leading-none transition-transform duration-200 animate-pulse"
            style={{ transform: `scale(${swipeX < -150 ? 1.3 : 1})` }}
          >
            {isSettled ? '⏳' : '✓'}
          </span>
        </button>
      </div>

      {/* ── Row content ── */}
      <div
        className="relative flex items-center justify-between pl-6 pr-4 py-2.5 bg-white select-none transition-colors"
        style={{
          transform:  `translateX(${swipeX}px)`,
          transition: snapping ? 'transform 220ms cubic-bezier(.25,.8,.25,1)' : 'none',
          cursor:     dragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="flex flex-col">
          <p className={`font-mono text-[10px] uppercase tracking-widest ${isSettled ? 'text-gray-400' : 'text-gray-500'}`}>
            {new Date(debt.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className={`font-hand text-base mt-0.5 ${isSettled ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {debt.description || (isPiutang ? 'Pinjaman Diberi' : 'Pinjaman Diambil')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-stamp text-base ${
            isSettled 
              ? 'text-gray-400 line-through' 
              : isPiutang 
                ? 'text-emerald-600' 
                : 'text-nb-red'
          }`}>
            {isPiutang ? '+' : '-'} RM {fmt(debt.amount)}
          </span>
          <button
            onClick={() => onEdit(debt)}
            className="text-gray-300 hover:text-nb-blue p-1 transition-colors"
            title="Edit"
          >
            ✎
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function HutangPage() {
  const { user } = useAuth()

  const [debts,   setDebts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('outstanding') // 'outstanding' or 'settled'
  
  // Track expanded debtor accordion names
  const [expanded, setExpanded] = useState({})

  // Slide-over modal state
  const [formOpen, setFormOpen] = useState(false)
  const [debtId, setDebtId] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [debtorName, setDebtorName] = useState('')
  const [debtType, setDebtType] = useState('piutang')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [existingDebtors, setExistingDebtors] = useState([])
  const [savingDebt, setSavingDebt] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchDebts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    setDebts(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  useEffect(() => {
    const unique = [...new Set(debts.map(d => d.debtor_name).filter(Boolean))]
    setExistingDebtors(unique)
  }, [debts])

  function handleAddOpen() {
    setDebtId(null)
    setAmount('')
    setDescription('')
    setDebtorName('')
    setDebtType('piutang')
    setDate(new Date().toISOString().slice(0, 10))
    setFormError('')
    setFormOpen(true)
  }

  function handleEditOpen(debt) {
    setDebtId(debt.id)
    setAmount(String(debt.amount))
    setDescription(debt.description || '')
    setDebtorName(debt.debtor_name)
    setDebtType(debt.debt_type)
    setDate(debt.date)
    setFormError('')
    setFormOpen(true)
  }

  // ── Database mutation handlers ───────────────────────────────
  async function handleDelete(id) {
    if (loading) return
    setLoading(true)
    await supabase.from('debts').delete().eq('id', id)
    await fetchDebts()
  }

  async function handleToggleSettle(id, shouldSettle) {
    if (loading) return
    setLoading(true)
    await supabase.from('debts').update({ is_pending: !shouldSettle }).eq('id', id)
    await fetchDebts()
  }

  async function handleSaveDebt(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0 || !debtorName.trim()) {
      setFormError('Sila isi jumlah dan nama dengan betul.')
      return
    }
    setSavingDebt(true)
    setFormError('')

    const payload = {
      user_id: user.id,
      amount: parseFloat(amount),
      description: description.trim() || null,
      debtor_name: debtorName.trim(),
      debt_type: debtType,
      date: date
    }

    let err
    if (debtId) {
      const { error } = await supabase.from('debts').update(payload).eq('id', debtId)
      err = error
    } else {
      const { error } = await supabase.from('debts').insert({
        ...payload,
        is_pending: true
      })
      err = error
    }

    if (err) {
      setFormError(err.message)
      setSavingDebt(false)
    } else {
      setFormOpen(false)
      setSavingDebt(false)
      await fetchDebts()
    }
  }

  // ── Computations ──────────────────────────────────────────────
  const activeDebts = debts.filter(d => d.is_pending)
  
  // Total owed to us (piutang)
  const totalPiutang = activeDebts
    .filter(d => d.debt_type === 'piutang')
    .reduce((sum, d) => sum + Number(d.amount), 0)

  // Total we owe others (hutang)
  const totalHutang = activeDebts
    .filter(d => d.debt_type === 'hutang')
    .reduce((sum, d) => sum + Number(d.amount), 0)

  // Filter debts by selected tab
  const filteredDebts = debts.filter(d => 
    filter === 'outstanding' ? d.is_pending : !d.is_pending
  )

  // Group filtered debts by debtor_name
  const grouped = {}
  filteredDebts.forEach(d => {
    if (!grouped[d.debtor_name]) {
      grouped[d.debtor_name] = {
        name: d.debtor_name,
        items: [],
        netBalance: 0,
      }
    }
    grouped[d.debtor_name].items.push(d)
    
    if (d.is_pending) {
      if (d.debt_type === 'piutang') {
        grouped[d.debtor_name].netBalance += Number(d.amount)
      } else {
        grouped[d.debtor_name].netBalance -= Number(d.amount)
      }
    } else {
      grouped[d.debtor_name].netBalance += Number(d.amount)
    }
  })

  const groupedList = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))

  const toggleExpand = (name) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <Layout title="Buku Hutang 555">
      
      {/* ── Running balance summary ────────────────────── */}
      <div className="bg-nb-blue pb-4 px-4 flex gap-3 flex-shrink-0 z-10 shadow-md">
        
        {/* Piutang (Green Card) */}
        <div className="flex-1 bg-gradient-to-br from-emerald-600/90 to-teal-700/90 rounded-2xl p-4 text-white shadow-md">
          <p className="font-mono text-white/70 text-[9px] uppercase tracking-widest">Orang Hutang Kita (RM)</p>
          <p className="font-stamp text-2xl mt-1">RM {fmt(totalPiutang)}</p>
          <p className="font-mono text-white/50 text-[9px] mt-0.5">Jumlah piutang aktif</p>
        </div>

        {/* Hutang (Red Card) */}
        <div className="flex-1 bg-gradient-to-br from-red-600/90 to-rose-700/90 rounded-2xl p-4 text-white shadow-md">
          <p className="font-mono text-white/70 text-[9px] uppercase tracking-widest">Kita Hutang Orang (RM)</p>
          <p className="font-stamp text-2xl mt-1">RM {fmt(totalHutang)}</p>
          <p className="font-mono text-white/50 text-[9px] mt-0.5">Jumlah hutang aktif</p>
        </div>

      </div>

      {/* ── Status filter tabs ──────────────────────────── */}
      <div className="bg-white border-b border-nb-line/45 flex z-10">
        <button
          onClick={() => setFilter('outstanding')}
          className={`flex-1 py-3 font-mono text-xs font-semibold tracking-wider transition-colors border-b-2 uppercase ${
            filter === 'outstanding'
              ? 'text-red-600 border-red-600 bg-red-50/20'
              : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          Outstanding (Belum Lunas)
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`flex-1 py-3 font-mono text-xs font-semibold tracking-wider transition-colors border-b-2 uppercase ${
            filter === 'settled'
              ? 'text-emerald-600 border-emerald-600 bg-emerald-50/20'
              : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          Lunas (Selesai)
        </button>
      </div>

      {/* ── Grouped ledger list ─────────────────────────── */}
      <div className="ruled-paper flex-1 overflow-y-auto page-enter pb-24">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin" />
          </div>
        )}

        {!loading && groupedList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 gap-3 opacity-50">
            <span className="text-4xl">💸</span>
            <p className="font-hand text-lg text-gray-600 text-center">
              Tiada rekod hutang dijumpai.<br />
              Klik butang + di bawah untuk menambah rekod hutang.
            </p>
          </div>
        )}

        {!loading && groupedList.map(group => {
          const isExpanded = !!expanded[group.name]
          const net = group.netBalance
          const formattedNet = fmt(Math.abs(net))

          return (
            <div key={group.name} className="border-b border-nb-line/30 transition-all">
              
              {/* Header grouping row */}
              <div
                onClick={() => toggleExpand(group.name)}
                className="flex items-center justify-between pl-14 pr-4 py-3 bg-white/40 hover:bg-gray-50/50 cursor-pointer transition-colors select-none"
              >
                <div>
                  <h3 className="font-hand text-xl text-gray-800 font-bold leading-tight">{group.name}</h3>
                  <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                    {group.items.length} rekod transaksi
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-stamp text-base ${
                      filter === 'settled'
                        ? 'text-gray-500'
                        : net > 0
                          ? 'text-emerald-600'
                          : net < 0
                            ? 'text-nb-red'
                            : 'text-gray-500'
                    }`}>
                      RM {formattedNet}
                    </p>
                    {filter !== 'settled' && (
                      <p className="font-mono text-[8px] uppercase tracking-wider text-gray-400">
                        {net > 0 ? 'Hutang Anda' : net < 0 ? 'Anda Hutang' : 'Imbang'}
                      </p>
                    )}
                  </div>
                  <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </div>
              </div>

              {/* Accordion detail list */}
              {isExpanded && (
                <div className="bg-gray-50/30 pl-8 border-t border-nb-line/10 animate-slide-down">
                  {group.items.map(item => (
                    <HutangRow
                      key={item.id}
                      debt={item}
                      onDelete={handleDelete}
                      onToggleSettle={handleToggleSettle}
                      onEdit={handleEditOpen}
                    />
                  ))}
                </div>
              )}

            </div>
          )
        })}
      </div>

      {/* ── Floating Action Button (FAB) ────────────────── */}
      <button
        onClick={handleAddOpen}
        className="fixed bottom-20 right-4 w-14 h-14 bg-nb-blue rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:bg-nb-navy active:scale-95 transition-all z-50 animate-bounce"
        aria-label="Tambah hutang"
      >
        +
      </button>

      {/* ── Slide-over Form Drawer ─────────────────────────── */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center sm:p-4 animate-fade-in">
          <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl max-w-md p-6 flex flex-col gap-5 shadow-2xl animate-slide-up">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="font-stamp text-lg text-nb-blue tracking-wide">
                {debtId ? '📝 Kemaskini Rekod' : '💸 Rekod Hutang Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-mono text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveDebt} className="flex flex-col gap-4">
              
              {/* Debt Type Toggle */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gray-500 mb-1.5">Jenis Hutang</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDebtType('piutang')}
                    className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold border-2 transition-all ${
                      debtType === 'piutang'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    Saya Beri Hutang (Piutang)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType('hutang')}
                    className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold border-2 transition-all ${
                      debtType === 'hutang'
                        ? 'bg-red-600 border-red-600 text-white shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    Saya Berhutang (Hutang)
                  </button>
                </div>
              </div>

              {/* Debtor Name */}
              <div className="relative">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gray-500 mb-1.5">Nama Peminjam / Penerima</label>
                <input
                  type="text"
                  placeholder="cth: Ali, Muthu, Wife"
                  value={debtorName}
                  onChange={e => setDebtorName(e.target.value)}
                  maxLength={40}
                  className="w-full bg-transparent border-b-2 border-nb-blue/30 focus:border-nb-blue pb-1 font-hand text-lg text-gray-800 outline-none transition-colors"
                  required
                />
                
                {/* Suggestions */}
                {debtorName.trim().length > 0 && existingDebtors.filter(d => d.toLowerCase().includes(debtorName.toLowerCase()) && d !== debtorName).length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto">
                    {existingDebtors
                      .filter(d => d.toLowerCase().includes(debtorName.toLowerCase()) && d !== debtorName)
                      .map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setDebtorName(name)}
                          className="w-full text-left px-3 py-2 text-sm font-hand text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gray-500 mb-1.5">Jumlah (RM)</label>
                <div className="flex items-baseline gap-1 border-b-2 border-nb-blue/30 focus-within:border-nb-blue transition-colors">
                  <span className="font-stamp text-gray-400 text-lg">RM</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-transparent pb-1 font-stamp text-xl text-gray-800 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gray-500 mb-1.5">Tarikh</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-nb-blue/30 focus:border-nb-blue pb-1 font-mono text-sm text-gray-800 outline-none transition-colors"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gray-500 mb-1.5">Nota (Pilihan)</label>
                <input
                  type="text"
                  placeholder="cth: Belanja makan, pinjam cash"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-nb-blue/30 focus:border-nb-blue pb-1 font-hand text-base text-gray-800 outline-none transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={savingDebt}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-500 font-stamp text-sm tracking-wide hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingDebt}
                  className="flex-1 py-3 rounded-xl bg-nb-blue text-white font-stamp text-sm tracking-wide hover:bg-nb-navy transition-colors disabled:opacity-50 shadow-md"
                >
                  {savingDebt ? 'Menyimpan…' : '💾 Simpan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  )
}
