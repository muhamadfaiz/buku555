import { useRef, useEffect, useState } from 'react'

export default function ReceiptUpload({ file, onChange, uploading }) {
  const fileRef   = useRef(null)   // gallery / file picker
  const camRef    = useRef(null)   // direct camera capture
  const [preview, setPreview] = useState(null)

  // Revoke old object URL and create a new one when file changes
  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleChange(e) {
    const f = e.target.files?.[0]
    if (f) onChange(f)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div>
      <label className="block font-mono text-xs font-semibold uppercase tracking-widest text-gray-600 mb-2">
        Resit <span className="normal-case tracking-normal font-normal text-gray-500">(pilihan)</span>
      </label>

      {/* Hidden inputs */}
      <input ref={fileRef} type="file" accept="image/*"
        className="hidden" onChange={handleChange} />
      <input ref={camRef}  type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleChange} />

      {!file ? (
        /* ── No file yet: show two pick buttons ─────────── */
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => camRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-nb-blue/40 rounded-xl text-gray-600 hover:border-nb-blue hover:text-nb-blue transition-all font-mono text-sm font-semibold"
          >
            <span className="text-lg">📷</span>
            Kamera
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-nb-blue/40 rounded-xl text-gray-600 hover:border-nb-blue hover:text-nb-blue transition-all font-mono text-sm font-semibold"
          >
            <span className="text-lg">🖼️</span>
            Galeri
          </button>
        </div>
      ) : (
        /* ── File selected: show preview ─────────────────── */
        <div className="flex items-center gap-3">
          {/* Preview thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="bg-white p-1 pb-2.5 shadow-md" style={{ transform: 'rotate(-1.5deg)' }}>
              <img
                src={preview}
                alt="Resit"
                className="w-16 h-16 object-cover"
              />
            </div>
            {/* Upload spinner overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Action links */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-xs text-gray-500 truncate max-w-[140px]">
              {file.name}
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-mono font-semibold text-nb-blue hover:underline text-left"
            >
              Tukar gambar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-sm font-mono font-semibold text-nb-red hover:underline text-left"
            >
              Buang
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
