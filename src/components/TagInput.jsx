import { useState, useEffect, useRef } from 'react'
import { suggestTags } from '../lib/deepseek'

const PRESET_CATS = ['Makan', 'Transport', 'Hutang', 'Lain-lain']

const TAG_COLOR = {
  Makan:       'bg-amber-500',
  Transport:   'bg-blue-600',
  Hutang:      'bg-red-600',
  'Lain-lain': 'bg-purple-600',
}
function tagColor(t) { return TAG_COLOR[t] ?? 'bg-nb-blue' }

const HAS_AI = !!import.meta.env.VITE_DEEPSEEK_API_KEY

export default function TagInput({ tags, onChange, description }) {
  const [input,       setInput]       = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiError,     setAiError]     = useState(false)
  const debounceRef = useRef(null)
  const tagsRef     = useRef(tags)

  useEffect(() => { tagsRef.current = tags }, [tags])

  // Debounced AI call on description change
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
        setSuggestions(ai.filter(t => !tagsRef.current.includes(t)))
      } catch {
        setAiError(true)
      } finally {
        setAiLoading(false)
      }
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [description])

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

  const hasPreset       = tags.some(t => PRESET_CATS.includes(t))
  const filteredSuggest = suggestions.filter(t => !tags.includes(t))
  const presetsToShow   = PRESET_CATS.filter(t => !tags.includes(t))

  return (
    <div className="space-y-3">

      {/* ── Section label + AI status ───────────────────── */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-600">
          Tag
        </span>
        {aiLoading && (
          <span className="flex items-center gap-1.5 font-mono text-xs text-nb-blue">
            <span className="w-3 h-3 border-2 border-nb-blue/30 border-t-nb-blue rounded-full animate-spin inline-block flex-shrink-0" />
            AI sedang fikir…
          </span>
        )}
        {aiError && (
          <span className="font-mono text-xs text-red-600 font-semibold">
            AI tidak dapat dihubungi
          </span>
        )}
      </div>

      {/* ── Active tag chips ────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-mono font-semibold text-white shadow-sm ${tagColor(tag)}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-white/70 hover:text-white leading-none ml-0.5 text-base"
                aria-label={`Buang ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Custom tag input field ──────────────────────── */}
      <input
        type="text"
        placeholder="Taip tag dan tekan Enter…"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={20}
        className="w-full bg-transparent border-b-2 border-nb-blue/40 focus:border-nb-blue pb-1 font-mono text-sm text-gray-800 outline-none placeholder:text-gray-400 transition-colors"
      />

      {/* ── AI suggestions ──────────────────────────────── */}
      {filteredSuggest.length > 0 && (
        <div>
          <p className="font-mono text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            ✦ Cadangan AI
          </p>
          <div className="flex flex-wrap gap-2">
            {filteredSuggest.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-mono font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 ${tagColor(tag)}`}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Preset category quick-add ───────────────────── */}
      {!hasPreset && presetsToShow.length > 0 && (
        <div>
          <p className="font-mono text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Kategori
          </p>
          <div className="flex flex-wrap gap-2">
            {presetsToShow.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => addTag(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-mono font-semibold text-white border-2 border-dashed border-white/50 transition-all hover:border-white shadow-sm ${tagColor(cat)}`}
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
