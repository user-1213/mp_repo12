import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || ''

if (!MONGODB_URI) {
  console.warn('MongoDB URI not found in environment variables')
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient
  }
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
  })
  await client.connect()
  cachedClient = client
  return client
}

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }
  const client = await getMongoClient()
  cachedDb = client.db('it_support')
  return cachedDb
}

// Collection helpers
export async function getCollection<T extends object>(name: string) {
  const db = await getDb()
  return db.collection<T>(name)
}

export const COLLECTIONS = {
  USERS: 'users',
  TICKETS: 'tickets',
  KB_ARTICLES: 'kb_articles',
  EMBEDDINGS: 'embeddings',
  CHAT_SESSIONS: 'chat_sessions',
  NOTIFICATIONS: 'notifications',
} as const
