import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { compressImage } from '../lib/imageUtils'
import { readReceipt } from '../lib/receiptReader'
import Layout from '../components/Layout'
import TagInput from '../components/TagInput'
import ReceiptUpload from '../components/ReceiptUpload'

const PRESET_CATS = ['Makan', 'Transport', 'Hutang', 'Lain-lain']
const TODAY = new Date().toISOString().slice(0, 10)

function derivedCategory(tags) {
  return tags.find(t => PRESET_CATS.includes(t)) ?? 'Lain-lain'
}

// ── Shared class helpers ──────────────────────────────────────
const LBL  = 'block font-mono text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1'
const INP  = 'w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 outline-none transition-colors'
const PH   = 'placeholder:text-gray-400'

export default function AddExpense() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [amount,      setAmount]      = useState('')
  const [description, setDescription] = useState('')
  const [label,       setLabel]       = useState('')
  const [tags,        setTags]        = useState([])
  const [date,        setDate]        = useState(TODAY)
  const [isPending,   setIsPending]   = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [uploading,   setUploading]   = useState(false)

  const [scanning,   setScanning]   = useState(false)
  const [scanDone,   setScanDone]   = useState(false)
  const [scanError,  setScanError]  = useState(false)
  const [autoFilled, setAutoFilled] = useState(new Set())

  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  function clearFill(...fields) {
    setAutoFilled(prev => {
      const next = new Set(prev)
      fields.forEach(f => next.delete(f))
      return next
    })
  }

  // ── Auto-scan when receipt photo is selected ─────────────────
  const prevFile = useRef(null)
  useEffect(() => {
    if (!receiptFile || receiptFile === prevFile.current) return
    prevFile.current = receiptFile
    let cancelled = false

    ;(async () => {
      setScanning(true)
      setScanDone(false)
      setScanError(false)
      setAutoFilled(new Set())

      try {
        const result = await readReceipt(receiptFile)
        if (cancelled || !result) return

        const filled = new Set()
        if (result.amount      != null) { setAmount(String(result.amount));   filled.add('amount') }
        if (result.description != null) { setDescription(result.description); filled.add('description') }
        if (result.date        != null) { setDate(result.date);               filled.add('date') }
        if (result.tags?.length)        { setTags(result.tags);               filled.add('tags') }

        setAutoFilled(filled)
        setScanDone(true)
        setTimeout(() => setScanDone(false), 5000)
      } catch (err) {
        console.warn('[Receipt scan]', err.message)
        if (!cancelled) setScanError(true)
        setTimeout(() => setScanError(false), 5000)
      } finally {
        if (!cancelled) setScanning(false)
      }
    })()

    return () => { cancelled = true }
  }, [receiptFile])

  // ── Submit ───────────────────────────────────────────────────
  const isValid = parseFloat(amount) > 0 && description.trim().length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    setError('')

    let receiptUrl = null
    if (receiptFile) {
      setUploading(true)
      try {
        const compressed = await compressImage(receiptFile)
        const path = `${user.id}/${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage
          .from('receipts')
          .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
          receiptUrl = publicUrl
        } else {
          console.warn('Receipt upload:', upErr.message)
        }
      } catch (e) {
        console.warn('Image compress:', e.message)
      } finally {
        setUploading(false)
      }
    }

    const { error: err } = await supabase.from('expenses').insert({
      user_id:     user.id,
      amount:      parseFloat(amount),
      description: description.trim(),
      label:       label.trim() || null,
      category:    derivedCategory(tags),
      tags,
      date,
      is_pending:  isPending,
      receipt_url: receiptUrl,
    })

    if (err) { setError(err.message); setSaving(false) }
    else      { navigate('/dashboard') }
  }

  const busy = saving || uploading

  return (
    <Layout title="Tambah Rekod">
      <div className="ruled-paper flex-1 overflow-y-auto page-enter">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pl-14 pr-4 py-6">

          {/* ── Error ─────────────────────────────────────── */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-nb-red text-sm font-mono rounded px-3 py-2 -ml-10">
              {error}
            </div>
          )}

          {/* ── Receipt (top — scan fills fields below) ───── */}
          <ReceiptUpload
            file={receiptFile}
            onChange={f => { setReceiptFile(f); setAutoFilled(new Set()) }}
            uploading={uploading}
          />

          {/* ── Scan status ───────────────────────────────── */}
          {scanning && (
            <div className="flex items-center gap-2 -mt-3 font-mono text-sm text-nb-blue">
              <span className="w-3.5 h-3.5 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin flex-shrink-0" />
              Sedang baca resit…
            </div>
          )}
          {scanDone && (
            <div className="-mt-3 font-mono text-sm text-green-700">
              ✓ Resit dibaca — medan diisi dipaparkan dalam warna kuning
            </div>
          )}
          {scanError && (
            <div className="-mt-3 font-mono text-sm text-amber-700">
              ⚠ Tidak dapat membaca resit — sila isi secara manual
            </div>
          )}

          {/* ── Amount ────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={LBL.replace('block ', '')}>Jumlah (RM)</label>
              {autoFilled.has('amount') && (
                <span className="font-mono text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded font-semibold">
                  ✦ dari resit
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-stamp text-2xl text-gray-500">RM</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(e.target.value); clearFill('amount') }}
                autoFocus
                className={`flex-1 border-b-2 pb-1 font-stamp text-5xl text-nb-blue outline-none ${PH} transition-colors ${
                  autoFilled.has('amount')
                    ? 'bg-yellow-50 border-yellow-400 focus:border-yellow-500 placeholder:text-yellow-300'
                    : 'bg-transparent border-nb-blue/40 focus:border-nb-blue placeholder:text-gray-400'
                }`}
              />
            </div>
          </div>

          {/* ── Description ───────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={LBL.replace('block ', '')}>Keterangan</label>
              {autoFilled.has('description') && (
                <span className="font-mono text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded font-semibold">
                  ✦ dari resit
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Nasi lemak, Grab, bayar balik…"
              value={description}
              onChange={e => { setDescription(e.target.value); clearFill('description') }}
              maxLength={80}
              className={`${INP} font-hand text-xl text-gray-800 ${
                autoFilled.has('description')
                  ? `bg-yellow-50 border-yellow-400 focus:border-yellow-500 placeholder:text-yellow-300`
                  : `placeholder:text-gray-400`
              }`}
            />
          </div>

          {/* ── Tags ──────────────────────────────────────── */}
          <div className={autoFilled.has('tags') ? 'bg-yellow-50 rounded-lg px-2 pt-2 pb-1 -mx-2' : ''}>
            {autoFilled.has('tags') && (
              <p className="font-mono text-xs text-yellow-700 font-semibold mb-1">✦ tag dari resit</p>
            )}
            <TagInput
              tags={tags}
              onChange={t => { setTags(t); clearFill('tags') }}
              description={description}
            />
          </div>

          {/* ── Date ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={LBL.replace('block ', '')}>Tarikh</label>
              {autoFilled.has('date') && (
                <span className="font-mono text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded font-semibold">
                  ✦ dari resit
                </span>
              )}
            </div>
            <input
              type="date"
              value={date}
              max={TODAY}
              onChange={e => { setDate(e.target.value); clearFill('date') }}
              className={`border-b-2 pb-1 font-mono text-base text-gray-800 outline-none transition-colors ${
                autoFilled.has('date')
                  ? 'bg-yellow-50 border-yellow-400 focus:border-yellow-500'
                  : 'bg-transparent border-nb-blue/40 focus:border-nb-blue'
              }`}
            />
          </div>

          {/* ── Label (optional) ──────────────────────────── */}
          <div>
            <label className={LBL}>
              Label{' '}
              <span className="normal-case tracking-normal font-normal text-gray-500">
                (pilihan — nama kedai / vendor)
              </span>
            </label>
            <input
              type="text"
              placeholder="cth: Mydin, Grab, Pizza Hut"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={40}
              className={`${INP} font-mono text-sm text-gray-800 placeholder:text-gray-400`}
            />
          </div>

          {/* ── Pending toggle ────────────────────────────── */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setIsPending(p => !p)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                isPending ? 'bg-amber-400' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPending ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-600">
                Belum Selesai
              </p>
              <p className="font-mono text-xs text-gray-500 mt-0.5">
                {isPending ? '⏳ Rekod ini masih belum disahkan' : 'Rekod sudah selesai'}
              </p>
            </div>
          </label>

          {/* ── Upload progress ───────────────────────────── */}
          {uploading && (
            <div className="flex items-center gap-2 font-mono text-sm text-nb-blue -mt-2">
              <span className="w-3.5 h-3.5 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin" />
              Memuat naik gambar resit…
            </div>
          )}

          {/* ── Buttons ───────────────────────────────────── */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={busy}
              className="flex-1 py-3 rounded-xl border-2 border-gray-400 text-gray-600 font-stamp text-base tracking-wide hover:border-gray-500 transition-colors disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || busy}
              className="flex-1 py-3 rounded-xl bg-nb-blue text-white font-stamp text-base tracking-wide hover:bg-nb-navy transition-colors disabled:opacity-40 shadow-md"
            >
              {busy ? 'Menyimpan…' : '💾 Simpan'}
            </button>
          </div>

        </form>
      </div>
    </Layout>
  )
}
