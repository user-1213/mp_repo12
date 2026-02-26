import { OpenAI } from 'openai';
import { searchSimilarDocuments } from './vector-db';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ClassificationResult {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  suggestedResolution?: string;
  relatedArticles: Array<{ content: string; similarity: number }>;
}

const ISSUE_CATEGORIES = [
  'Software',
  'Network',
  'Hardware',
  'Account',
  'Performance',
  'Security',
  'Email',
  'Other',
];

const PRIORITY_KEYWORDS = {
  critical: ['crash', 'down', 'broken', 'critical', 'urgent', 'emergency', 'loss of data'],
  high: ['error', 'fail', 'not working', 'issue', 'problem', 'cannot', 'slow'],
  medium: ['question', 'help needed', 'unclear', 'confused', 'need assistance'],
  low: ['enhancement', 'suggestion', 'feedback', 'how to', 'information'],
};

export const aiClassificationService = {
  async classifyTicket(issueDescription: string): Promise<ClassificationResult> {
    try {
      // Search for similar tickets in knowledge base
      const relatedArticles = await searchSimilarDocuments(issueDescription, 3);

      // Extract category using LLM
      const categoryResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_LLM_MODEL || 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an IT support classifier. Classify the issue into ONE category: ${ISSUE_CATEGORIES.join(', ')}. 
            Respond with ONLY the category name.`,
          },
          {
            role: 'user',
            content: issueDescription,
          },
        ],
        max_tokens: 50,
        temperature: 0.3,
      });

      const category =
        categoryResponse.choices[0].message.content?.trim() || 'Other';

      // Determine priority
      const priority = determinePriority(issueDescription);

      // Calculate confidence (40% similarity + 30% category score + 30% success rate)
      const similarityScore =
        relatedArticles.length > 0 ? relatedArticles[0].similarity : 0;
      const categoryScore = ISSUE_CATEGORIES.includes(category) ? 1 : 0.5;
      const successRate = 0.8; // Placeholder

      const confidence =
        similarityScore * 0.4 + categoryScore * 0.3 + successRate * 0.3;

      // Generate suggested resolution
      const suggestedResolution =
        relatedArticles.length > 0
          ? `Similar issue found: ${relatedArticles[0].content.substring(0, 100)}...`
          : undefined;

      return {
        category,
        priority,
        confidence: Math.min(confidence, 1),
        suggestedResolution,
        relatedArticles: relatedArticles.map((a) => ({
          content: a.content.substring(0, 200),
          similarity: a.similarity,
        })),
      };
    } catch (error) {
      console.error('Classification error:', error);
      return {
        category: 'Other',
        priority: 'medium',
        confidence: 0,
        relatedArticles: [],
      };
    }
  },
};

function determinePriority(
  description: string
): 'critical' | 'high' | 'medium' | 'low' {
  const lower = description.toLowerCase();

  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return priority as 'critical' | 'high' | 'medium' | 'low';
    }
  }

  return 'medium';
}
