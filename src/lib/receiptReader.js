/**
 * receiptReader.js — AI-powered receipt OCR using Google Gemini Vision.
 * Returns { amount, description, date, tags } extracted from a receipt image File.
 *
 * Get a free API key at: https://aistudio.google.com/app/apikey
 * Add VITE_GEMINI_API_KEY to your .env file.
 */

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL      = 'gemini-flash-latest'
const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`

const PROMPT = `You are a receipt scanner for a Malaysian expense tracker app.
Analyze this receipt image and extract:
1. Total amount (number only, no currency symbol)
2. Merchant/store name
3. Date (in YYYY-MM-DD format if visible)
4. Category tags (suggest 1-3 tags in Malay or English based on the type of store)

Respond in JSON format only:
{"amount": number, "description": string, "date": string or null, "tags": string[]}

If you cannot determine a value, use null.`

/** Convert a File to a base64 string (without the data URI prefix). */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Scan a receipt image and return extracted fields.
 * Returns null silently if no API key is configured.
 * Throws on network / parse errors.
 *
 * @param {File} file
 * @returns {Promise<{amount: number|null, description: string|null, date: string|null, tags: string[]|null}|null>}
 */
export async function readReceipt(file) {
  if (!GEMINI_KEY) return null

  const base64   = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'

  const res = await fetch(GEMINI_URL(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini HTTP ${res.status}`)
  }

  const data = await res.json()
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Strip markdown code fences (Gemini often wraps JSON in ```json ... ```)
  const clean = raw.trim()
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/\n?```$/, '')
    .trim()

  const result = JSON.parse(clean)   // throws if malformed — caught by caller
  return {
    amount:      typeof result.amount === 'number' ? result.amount : null,
    description: typeof result.description === 'string' ? result.description : null,
    date:        typeof result.date === 'string' ? result.date : null,
    tags:        Array.isArray(result.tags) ? result.tags.slice(0, 3).map(String) : null,
  }
}
