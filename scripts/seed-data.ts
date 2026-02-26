import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { MongoClient, Db } from 'mongodb';
import { OpenAI } from 'openai';
import { Chroma } from 'langchain/vectorstores/chroma';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function seedDatabase() {
  let client: MongoClient | null = null;
  let db: Db | null = null;

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/itsupport';
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('itsupport');

    console.log('✓ Connected to MongoDB');

    // Read CSV file
    const csvPath = path.join(__dirname, '../user_read_only_context/text_attachments/tech_support_dataset-z04mg.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} records in CSV`);

    // Clear existing collections
    await db.collection('tickets').deleteMany({});
    await db.collection('kb_articles').deleteMany({});
    console.log('✓ Cleared existing data');

    // Transform and insert tickets
    const tickets = records.map((record: any, index: number) => ({
      conversationId: record.Conversation_ID || `CONV-${String(index).padStart(4, '0')}`,
      title: record.Customer_Issue || 'Untitled Issue',
      description: record.Customer_Issue || 'No description provided',
      techResponse: record.Tech_Response || '',
      status: record.Issue_Status === 'Resolved' ? 'Resolved' : 'Pending',
      resolutionTime: record.Resolution_Time ? parseInt(record.Resolution_Time) : null,
      category: record.Issue_Category || 'Other',
      priority: determinePriority(record.Customer_Issue),
      confidence: 0.85,
      relatedArticles: [],
      suggestedResolution: record.Tech_Response || undefined,
      userId: `user-${Math.floor(index / 100)}`,
      email: `customer${Math.floor(index / 100)}@company.com`,
      assignedAgent: null,
      attachments: [],
      notes: [],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    }));

    await db.collection('tickets').insertMany(tickets);
    console.log(`✓ Inserted ${tickets.length} tickets`);

    // Create KB articles from unique resolutions
    const uniqueResolutions = [...new Set(records.map((r: any) => r.Tech_Response).filter(Boolean))].slice(0, 100);

    const kbArticles = uniqueResolutions.map((resolution: string, index: number) => {
      const category = records.find((r: any) => r.Tech_Response === resolution)?.Issue_Category || 'General';

      return {
        title: `Solution: ${resolution.substring(0, 50)}`,
        content: resolution,
        category,
        tags: [category.toLowerCase(), 'solution'],
        views: Math.floor(Math.random() * 100),
        helpful: Math.floor(Math.random() * 50),
        notHelpful: Math.floor(Math.random() * 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    await db.collection('kb_articles').insertMany(kbArticles);
    console.log(`✓ Inserted ${kbArticles.length} KB articles`);

    // Initialize vector store with OpenAI embeddings
    console.log('Initializing vector store...');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    });

    const vectorStore = await Chroma.fromDocuments(
      kbArticles.map((article) => ({
        pageContent: `${article.title}\n${article.content}`,
        metadata: {
          articleId: article.title,
          category: article.category,
          tags: article.tags,
        },
      })),
      embeddings,
      {
        collectionName: process.env.CHROMA_COLLECTION_NAME || 'kb_vectors',
        url: `http://${process.env.CHROMA_SERVER_HOST || 'localhost'}:${process.env.CHROMA_SERVER_PORT || 8000}`,
      }
    );

    console.log('✓ Vector store initialized with KB articles');

    // Create sample users
    const users = [
      { email: 'admin@company.com', password: 'admin123', name: 'Admin User', role: 'admin' },
      { email: 'agent@company.com', password: 'agent123', name: 'Support Agent', role: 'agent' },
      { email: 'user@company.com', password: 'user123', name: 'Regular User', role: 'employee' },
    ];

    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany(users);
    console.log(`✓ Inserted ${users.length} sample users`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`   - ${tickets.length} tickets imported`);
    console.log(`   - ${kbArticles.length} KB articles created`);
    console.log(`   - ${users.length} sample users created`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

function determinePriority(issue: string): 'critical' | 'high' | 'medium' | 'low' {
  const lower = issue.toLowerCase();
  if (['crash', 'down', 'broken', 'critical'].some((w) => lower.includes(w))) {
    return 'critical';
  }
  if (['error', 'fail', 'not working'].some((w) => lower.includes(w))) {
    return 'high';
  }
  if (['slow', 'issue', 'help'].some((w) => lower.includes(w))) {
    return 'medium';
  }
  return 'low';
}

seedDatabase();
