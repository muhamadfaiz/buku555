/**
 * DeepSeek API — AI tag suggestions for Buku 555.
 * Returns an empty array silently if the key is not configured.
 */
const API_URL     = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

const SYSTEM_PROMPT = `You are a tag suggester for a Malaysian personal expense tracker called Buku 555.
Given a spending description (in Malay or English), suggest 2–3 short, relevant tags.
Always include exactly one category tag from this list: Makan, Transport, Hutang, Lain-lain.
Additional tags can be specific context like: Sarapan, Minum, Malam, Kerja, Groceries,
Hiburan, Utiliti, Kesihatan, Online, Ansuran, Berulang, Keluarga, etc.
Rules:
- Return ONLY a valid JSON array of strings, e.g. ["Makan","Sarapan"]
- No explanation, no markdown, no extra text — just the raw JSON array
- Each tag: max 12 characters, title-cased
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
