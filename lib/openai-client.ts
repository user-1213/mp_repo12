import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient
  
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  
  openaiClient = new OpenAI({ apiKey })
  return openaiClient
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI()
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // limit input
  })
  return response.data[0].embedding
}

export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const openai = getOpenAI()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 1024,
  })
  return response.choices[0]?.message?.content || ''
}
