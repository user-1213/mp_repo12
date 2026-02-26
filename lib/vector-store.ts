import { getCollection, COLLECTIONS } from './mongodb'
import { generateEmbedding } from './openai-client'
import type { EmbeddingDoc, TicketCategory } from './types'

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dotProduct / denom
}

// Add a document to the vector store
export async function addToVectorStore(
  sourceId: string,
  sourceType: 'ticket' | 'kb',
  text: string,
  category: TicketCategory
): Promise<void> {
  const embedding = await generateEmbedding(text)
  const col = await getCollection<EmbeddingDoc>(COLLECTIONS.EMBEDDINGS)
  
  await col.updateOne(
    { sourceId, sourceType },
    {
      $set: {
        text,
        embedding,
        category,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}

// Similarity search - returns top k most similar documents
export async function similaritySearch(
  query: string,
  k: number = 5,
  filter?: { sourceType?: 'ticket' | 'kb'; category?: TicketCategory }
): Promise<Array<{ sourceId: string; sourceType: string; text: string; similarity: number }>> {
  const queryEmbedding = await generateEmbedding(query)
  const col = await getCollection<EmbeddingDoc>(COLLECTIONS.EMBEDDINGS)

  // Build filter
  const mongoFilter: Record<string, unknown> = {}
  if (filter?.sourceType) mongoFilter.sourceType = filter.sourceType
  if (filter?.category) mongoFilter.category = filter.category

  // Fetch all embeddings matching filter
  const docs = await col.find(mongoFilter).toArray()

  // Compute similarity for each
  const scored = docs.map((doc) => ({
    sourceId: doc.sourceId,
    sourceType: doc.sourceType,
    text: doc.text,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }))

  // Sort by similarity descending and take top k
  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, k)
}

// Remove embedding
export async function removeFromVectorStore(sourceId: string): Promise<void> {
  const col = await getCollection<EmbeddingDoc>(COLLECTIONS.EMBEDDINGS)
  await col.deleteOne({ sourceId })
}

// Get raw similarity score for a query against existing embeddings
export async function getMaxSimilarity(query: string): Promise<number> {
  const results = await similaritySearch(query, 1)
  return results.length > 0 ? results[0].similarity : 0
}
