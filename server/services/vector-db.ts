import { Chroma } from 'langchain/vectorstores/chroma';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import dotenv from 'dotenv';

dotenv.config();

let vectorStore: Chroma;

export async function initializeVectorDB() {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    });

    vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: process.env.CHROMA_COLLECTION_NAME || 'kb_vectors',
      url: `http://${process.env.CHROMA_SERVER_HOST || 'localhost'}:${process.env.CHROMA_SERVER_PORT || 8000}`,
    }).catch(async () => {
      // Collection doesn't exist, will be created on first insert
      console.log('Creating new Chroma collection...');
      return Chroma.fromDocuments([], embeddings, {
        collectionName: process.env.CHROMA_COLLECTION_NAME || 'kb_vectors',
        url: `http://${process.env.CHROMA_SERVER_HOST || 'localhost'}:${process.env.CHROMA_SERVER_PORT || 8000}`,
      });
    });

    console.log('✓ Vector store initialized');
  } catch (error) {
    console.error('Error initializing vector store:', error);
    throw error;
  }
}

export async function addDocumentsToVectorStore(documents: Array<{ content: string; metadata?: Record<string, any> }>) {
  try {
    if (!vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const docs = documents.map((doc) => ({
      pageContent: doc.content,
      metadata: doc.metadata || {},
    }));

    await vectorStore.addDocuments(docs);
    console.log(`Added ${documents.length} documents to vector store`);
  } catch (error) {
    console.error('Error adding documents to vector store:', error);
    throw error;
  }
}

export async function searchSimilarDocuments(query: string, k: number = 5) {
  try {
    if (!vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const results = await vectorStore.similaritySearchWithScore(query, k);
    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      similarity: score,
    }));
  } catch (error) {
    console.error('Error searching vector store:', error);
    throw error;
  }
}

export function getVectorStore() {
  if (!vectorStore) {
    throw new Error('Vector store not initialized');
  }
  return vectorStore;
}
