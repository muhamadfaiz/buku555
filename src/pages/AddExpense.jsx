import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { compressImage } from '../lib/imageUtils'
import Layout from '../components/Layout'
import TagInput from '../components/TagInput'
import ReceiptUpload from '../components/ReceiptUpload'

const PRESET_CATS = ['Makan', 'Transport', 'Hutang', 'Lain-lain']
const TODAY = new Date().toISOString().slice(0, 10)

// Derive a legacy `category` value from the tags array for backward-compat
function derivedCategory(tags) {
  return tags.find(t => PRESET_CATS.includes(t)) ?? 'Lain-lain'
}

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
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const isValid = parseFloat(amount) > 0 && description.trim().length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    setError('')

    // ── 1. Upload receipt (if any) ───────────────────────
    let receiptUrl = null
    if (receiptFile) {
      setUploading(true)
      try {
        const compressed = await compressImage(receiptFile)
        const path       = `${user.id}/${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage
          .from('receipts')
          .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(path)
          receiptUrl = publicUrl
        } else {
          console.warn('Receipt upload error:', upErr.message)
        }
      } catch (imgErr) {
        console.warn('Image compression error:', imgErr.message)
      } finally {
        setUploading(false)
      }
    }

    // ── 2. Insert expense row ────────────────────────────
    const { error: err } = await supabase.from('expenses').insert({
      user_id:     user.id,
      amount:      parseFloat(amount),
      description: description.trim(),
      label:       label.trim() || null,
      category:    derivedCategory(tags),   // backward-compat column
      tags:        tags,                    // new array column
      date,
      is_pending:  isPending,
      receipt_url: receiptUrl,
    })

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      navigate('/dashboard')
    }
  }

  const busy = saving || uploading

  return (
    <Layout title="Tambah Rekod">
      <div className="ruled-paper flex-1 overflow-y-auto page-enter">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pl-14 pr-4 py-6">

          {/* ── Error banner ──────────────────────────────── */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-nb-red text-xs font-mono rounded px-3 py-2 -ml-10">
              {error}
            </div>
          )}

          {/* ── Amount ────────────────────────────────────── */}
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

          {/* ── Description ───────────────────────────────── */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
              Keterangan
            </label>
            <input
              type="text"
              placeholder="Nasi lemak, Grab, bayar balik…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={80}
              className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-hand text-xl text-gray-800 outline-none placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* ── AI Tag Input (replaces old Category grid) ─── */}
          <TagInput
            tags={tags}
            onChange={setTags}
            description={description}
          />

          {/* ── Receipt photo ─────────────────────────────── */}
          <ReceiptUpload
            file={receiptFile}
            onChange={setReceiptFile}
            uploading={uploading}
          />

          {/* ── Label (optional) ──────────────────────────── */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[2px] text-gray-400 mb-1">
              Label <span className="normal-case text-gray-300">(pilihan — nama kedai / vendor)</span>
            </label>
            <input
              type="text"
              placeholder="cth: Mydin, Grab, Pizza Hut"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={40}
              className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-sm text-gray-700 outline-none placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* ── Date ──────────────────────────────────────── */}
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

          {/* ── Pending toggle ────────────────────────────── */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setIsPending(p => !p)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                isPending ? 'bg-amber-400' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPending ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-gray-400">Belum Selesai</p>
              <p className="font-mono text-xs text-gray-400">
                {isPending ? '⏳ Rekod ini masih belum disahkan' : 'Rekod sudah selesai'}
              </p>
            </div>
          </label>

          {/* ── Upload progress note ──────────────────────── */}
          {uploading && (
            <div className="flex items-center gap-2 font-mono text-xs text-nb-blue -mt-2">
              <span className="w-3 h-3 border border-nb-blue/40 border-t-nb-blue rounded-full animate-spin" />
              Memuat naik gambar resit…
            </div>
          )}

          {/* ── Action buttons ────────────────────────────── */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={busy}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-500 font-stamp tracking-wide hover:border-gray-400 transition-colors disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || busy}
              className="flex-1 py-3 rounded-xl bg-nb-blue text-white font-stamp tracking-wide hover:bg-nb-navy transition-colors disabled:opacity-40 shadow-md"
            >
              {busy ? 'Menyimpan…' : '💾 Simpan'}
            </button>
          </div>

        </form>
      </div>
    </Layout>
  )
}
