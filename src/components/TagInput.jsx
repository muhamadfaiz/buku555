import { useState, useEffect, useRef } from 'react'
import { suggestTags } from '../lib/deepseek'

const PRESET_CATS = ['Makan', 'Transport', 'Hutang', 'Lain-lain']

// Colour per well-known category; custom tags fall back to nb-blue
const TAG_COLOR = {
  Makan:       'bg-amber-500',
  Transport:   'bg-blue-500',
  Hutang:      'bg-red-500',
  'Lain-lain': 'bg-purple-500',
}
function tagColor(t) { return TAG_COLOR[t] ?? 'bg-nb-blue' }

const HAS_AI = !!import.meta.env.VITE_DEEPSEEK_API_KEY

export default function TagInput({ tags, onChange, description }) {
  const [input,      setInput]      = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiError,    setAiError]    = useState(false)
  const debounceRef  = useRef(null)
  const tagsRef      = useRef(tags)      // avoid stale closure in timeout

  // Keep tagsRef current
  useEffect(() => { tagsRef.current = tags }, [tags])

  // Trigger AI whenever description changes (debounced 500 ms)
  useEffect(() => {
    if (!HAS_AI || description.trim().length < 3) {
      setSuggestions([])
      setAiError(false)
      return
    }
    setAiError(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true)
      try {
        const ai = await suggestTags(description)
        // Filter out already-added tags
        setSuggestions(ai.filter(t => !tagsRef.current.includes(t)))
      } catch {
        setAiError(true)
      } finally {
        setAiLoading(false)
      }
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [description])  // only description drives the AI call

  function addTag(raw) {
    const tag = raw.trim().replace(/,/g, '').slice(0, 20)
    if (!tag || tags.includes(tag)) return
    onChange([...tags, tag])
    setSuggestions(s => s.filter(t => t !== tag))
    setInput('')
  }

  function removeTag(tag) { onChange(tags.filter(t => t !== tag)) }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const hasPreset        = tags.some(t => PRESET_CATS.includes(t))
  const filteredSuggest  = suggestions.filter(t => !tags.includes(t))
  const presetsToShow    = PRESET_CATS.filter(t => !tags.includes(t))

  return (
    <div className="space-y-2">
      {/* ── Label row ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <label className="font-mono text-[10px] uppercase tracking-[2px] text-gray-400">
          Tag
        </label>
        {aiLoading && (
          <span className="flex items-center gap-1 text-[9px] font-mono text-nb-blue">
            <span className="w-2.5 h-2.5 border border-nb-blue/40 border-t-nb-blue rounded-full animate-spin inline-block" />
            AI sedang fikir…
          </span>
        )}
        {aiError && (
          <span className="text-[9px] font-mono text-red-400">AI tidak dapat dihubungi</span>
        )}
      </div>

      {/* ── Active tags ────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-white ${tagColor(tag)}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-white/60 hover:text-white leading-none ml-0.5"
                aria-label={`Buang ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Custom tag input ───────────────────────────────── */}
      <input
        type="text"
        placeholder="Taip tag dan tekan Enter…"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={20}
        className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-sm text-gray-700 outline-none placeholder:text-gray-300 transition-colors"
      />

      {/* ── AI suggestions ─────────────────────────────────── */}
      {filteredSuggest.length > 0 && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-gray-400 mb-1.5">
            ✦ Cadangan AI
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filteredSuggest.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-white border border-white/20 transition-transform hover:scale-105 active:scale-95 ${tagColor(tag)}`}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Preset category quick-add (shown until one is chosen) */}
      {!hasPreset && presetsToShow.length > 0 && (
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-gray-400 mb-1.5">
            Kategori
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presetsToShow.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => addTag(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono text-white/90 border-2 border-dashed border-white/30 transition-all hover:border-white/60 ${tagColor(cat)}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
