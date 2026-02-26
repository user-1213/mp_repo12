import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { similaritySearch } from './vector-store'
import { getCollection, COLLECTIONS } from './mongodb'
import type {
  ClassificationResult,
  RAGResult,
  ConfidenceResult,
  AgentScore,
  TicketCategory,
  TicketPriority,
  User,
  Ticket,
} from './types'

function getLLM() {
  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.2,
    openAIApiKey: process.env.OPENAI_API_KEY,
  })
}

// ---- CLASSIFICATION CHAIN ----
const classificationTemplate = PromptTemplate.fromTemplate(
  `You are an expert IT support ticket classifier. Analyze the following IT issue and classify it.

Issue: {issue}

Classify into:
- Category: One of [Network, Software, Hardware, Security, Email, Database, Other]
- Priority: One of [critical, high, medium, low]
  - critical: System-wide outage, security breach, data loss risk
  - high: Major service disruption, VPN failure, server issues
  - medium: Single user affected, software bug, slow performance
  - low: Feature request, cosmetic issue, minor inconvenience

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{{"category": "...", "priority": "...", "reasoning": "..."}}`
)

export async function classifyTicket(issue: string): Promise<ClassificationResult> {
  const llm = getLLM()
  const chain = RunnableSequence.from([
    classificationTemplate,
    llm,
    new StringOutputParser(),
  ])

  try {
    const result = await chain.invoke({ issue })
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      category: parsed.category as TicketCategory,
      priority: parsed.priority as TicketPriority,
      reasoning: parsed.reasoning || '',
    }
  } catch {
    return {
      category: 'Other',
      priority: 'medium',
      reasoning: 'Classification failed, defaulting to Other/Medium',
    }
  }
}

// ---- RAG PIPELINE ----
const ragTemplate = PromptTemplate.fromTemplate(
  `You are an expert IT support assistant. Use the following context from past tickets and knowledge base to answer the user's IT issue.

Context from similar past issues:
{context}

User's Issue: {query}

Provide:
1. A clear, helpful answer addressing the issue
2. Step-by-step suggested fix steps (numbered)
3. Your confidence level (0.0 to 1.0) in the answer based on how well the context matches

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{{"answer": "...", "confidence": 0.85, "suggestedSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."], "rootCause": "..."}}`
)

export async function ragPipeline(query: string): Promise<RAGResult> {
  const llm = getLLM()

  // Step 1: Retrieve similar documents
  const similarDocs = await similaritySearch(query, 5)

  // Step 2: Build context from retrieved docs
  const context = similarDocs.length > 0
    ? similarDocs.map((d, i) => `[${i + 1}] (Similarity: ${(d.similarity * 100).toFixed(1)}%) ${d.text}`).join('\n\n')
    : 'No similar past issues found. Provide general IT troubleshooting advice.'

  // Step 3: Run RAG chain
  const chain = RunnableSequence.from([
    ragTemplate,
    llm,
    new StringOutputParser(),
  ])

  try {
    const result = await chain.invoke({ context, query })
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      answer: parsed.answer || 'Unable to generate a response.',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      sources: similarDocs.map((d) => ({
        sourceId: d.sourceId,
        sourceType: d.sourceType as 'ticket' | 'kb',
        text: d.text,
        similarity: d.similarity,
      })),
      suggestedSteps: parsed.suggestedSteps || [],
    }
  } catch {
    return {
      answer: 'I encountered an error generating a response. Please try again or create a ticket for human assistance.',
      confidence: 0.3,
      sources: similarDocs.map((d) => ({
        sourceId: d.sourceId,
        sourceType: d.sourceType as 'ticket' | 'kb',
        text: d.text,
        similarity: d.similarity,
      })),
      suggestedSteps: ['Please create a support ticket for further assistance.'],
    }
  }
}

// ---- CONFIDENCE ENGINE ----
export function computeConfidence(
  similarityScore: number,
  llmConfidence: number,
  successRate: number
): ConfidenceResult {
  const finalConfidence = 0.4 * similarityScore + 0.3 * llmConfidence + 0.3 * successRate

  let decision: 'auto-resolve' | 'suggest' | 'escalate'
  if (finalConfidence > 0.8) {
    decision = 'auto-resolve'
  } else if (finalConfidence >= 0.55) {
    decision = 'suggest'
  } else {
    decision = 'escalate'
  }

  return {
    finalConfidence,
    similarityScore,
    llmConfidence,
    successRate,
    decision,
  }
}

// ---- AGENT ROUTING ----
export async function routeToAgent(
  category: TicketCategory,
  confidenceDecision: 'auto-resolve' | 'suggest' | 'escalate'
): Promise<AgentScore | null> {
  const usersCol = await getCollection<User>(COLLECTIONS.USERS)
  const agents = await usersCol.find({ role: 'agent' }).toArray()

  if (agents.length === 0) return null

  const scored: AgentScore[] = agents.map((agent) => {
    const skills = agent.skills || []
    const skillMatch = skills.includes(category) ? 1.0 : skills.some((s) => s.toLowerCase() === category.toLowerCase()) ? 0.8 : 0.3
    const workload = (agent.activeTickets || 0) / (agent.maxTickets || 10)
    const workloadScore = 1 - Math.min(1, workload) // lower workload = higher score
    const successRateScore = agent.successRate || 0.5

    let score: number
    if (confidenceDecision === 'escalate') {
      // Low confidence: quality-focused
      score = skillMatch * 0.4 + successRateScore * 0.4 + (agent.experienceLevel === 'senior' ? 0.2 : agent.experienceLevel === 'mid' ? 0.1 : 0)
    } else if (confidenceDecision === 'suggest') {
      // Medium confidence: balanced
      score = skillMatch * 0.5 + workloadScore * 0.3 + successRateScore * 0.2
    } else {
      // High confidence: standard routing
      score = skillMatch * 0.4 + successRateScore * 0.3 + workloadScore * 0.2 + 0.1
    }

    return {
      userId: agent.userId,
      name: agent.name,
      score,
      skillMatch,
      workloadScore,
      successRateScore,
    }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0] || null
}

// ---- FULL AI PIPELINE: Process a ticket ----
export async function processTicketAI(description: string) {
  // Step 1: Classify
  const classification = await classifyTicket(description)

  // Step 2: RAG retrieval + LLM response
  const ragResult = await ragPipeline(description)

  // Step 3: Compute historical success rate for this category
  const ticketsCol = await getCollection<Ticket>(COLLECTIONS.TICKETS)
  const categoryTickets = await ticketsCol.find({
    category: classification.category,
    status: { $in: ['resolved', 'closed'] },
  }).toArray()

  const successRate = categoryTickets.length > 0
    ? categoryTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length / Math.max(categoryTickets.length, 1)
    : 0.5

  // Step 4: Max similarity score from RAG sources
  const maxSimilarity = ragResult.sources.length > 0
    ? Math.max(...ragResult.sources.map((s) => s.similarity))
    : 0.3

  // Step 5: Compute confidence
  const confidence = computeConfidence(maxSimilarity, ragResult.confidence, successRate)

  // Step 6: Route to agent
  const bestAgent = await routeToAgent(classification.category, confidence.decision)

  return {
    classification,
    ragResult,
    confidence,
    bestAgent,
  }
}
