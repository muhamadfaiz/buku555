/**
 * DeepSeek API — AI tag suggestions for Buku 555.
 * Returns an empty array silently if the key is not configured.
 */
const API_URL     = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

const SYSTEM_PROMPT = `You are a tag suggester for a Malaysian personal expense tracker called Buku 555.
Given a spending description (in Malay or English), suggest 2–3 short tags — ALL in Bahasa Melayu only.

First tag must be one of these category tags: Makan, Transport, Lain-lain, Hutang
Then add 0–2 more specific Malay tags.

Malay-only examples (NEVER use the English version):
  "Makan" not "Food"
  "Sarapan" not "Breakfast"
  "Makan Tengahari" not "Lunch"
  "Makan Malam" not "Dinner"
  "Makanan Segera" not "Fast Food"
  "Restoran" not "Restaurant"
  "Runcit" not "Groceries"
  "Minyak" not "Petrol" or "Gas"
  "Tol" not "Toll"
  "Bil" not "Bill" or "Bills"
  "Beli-belah" not "Shopping"
  "Kesihatan" not "Health"
  "Hiburan" not "Entertainment"
  "Selenggara" not "Maintenance"
  "Hadiah" not "Gift"
  "Pelajaran" not "Education"
  "Lain-lain" not "Others" or "Misc"

Rules:
- Return ONLY a valid JSON array of strings, e.g. ["Makan","Sarapan"]
- No explanation, no markdown, no extra text — just the raw JSON array
- NEVER include English words in any tag
- Each tag: max 15 characters, title-cased
- Max 3 tags total`

export async function suggestTags(description) {
  if (!DEEPSEEK_KEY || description.trim().length < 2) return []

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model:       'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: description.trim() },
        ],
        max_tokens:  60,
        temperature: 0.3,
      }),
    })

    if (!res.ok) throw new Error(`DeepSeek ${res.status}`)

    const data = await res.json()
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? '[]'

    // Safely extract the first JSON array in the response
    const match = raw.match(/\[[\s\S]*?\]/)
    if (!match) return []

    const tags = JSON.parse(match[0])
    return Array.isArray(tags) ? tags.slice(0, 3).map(String) : []
  } catch (err) {
    console.warn('[DeepSeek]', err.message)
    throw err   // re-throw so caller can show error state
  }
}
