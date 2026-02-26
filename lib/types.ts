import { ObjectId } from 'mongodb'

// ---- User Types ----
export type UserRole = 'employee' | 'agent' | 'admin'

export interface User {
  _id?: ObjectId
  userId: string
  name: string
  email: string
  password: string // bcrypt hashed
  role: UserRole
  skills?: string[] // for agents
  experienceLevel?: 'junior' | 'mid' | 'senior' // for agents
  activeTickets?: number // for agents
  maxTickets?: number // for agents (default 10)
  successRate?: number // for agents (0-1)
  totalResolved?: number
  createdAt: Date
  updatedAt: Date
}

// ---- Ticket Types ----
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'escalated' | 'closed'
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'
export type TicketCategory = 'Network' | 'Software' | 'Hardware' | 'Security' | 'Email' | 'Database' | 'Other'

export interface AIAnalysis {
  category: TicketCategory
  priority: TicketPriority
  confidence: number // 0-1
  similarityScore: number
  llmConfidence: number
  successRate: number
  suggestedRootCause: string
  suggestedSteps: string[]
  reasoning: string
}

export interface TicketNote {
  author: string
  authorRole: UserRole
  content: string
  createdAt: Date
}

export interface Ticket {
  _id?: ObjectId
  ticketId: string // human-readable like TK-001
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  createdBy: string // userId
  createdByName: string
  assignedTo?: string // agent userId
  assignedToName?: string
  aiAnalysis?: AIAnalysis
  notes: TicketNote[]
  resolution?: string
  slaDeadline?: Date
  escalatedTo?: string // admin userId
  escalationReason?: string
  chatSessionId?: string
  createdAt: Date
  updatedAt: Date
}

// ---- Knowledge Base Types ----
export interface KBArticle {
  _id?: ObjectId
  title: string
  content: string
  category: TicketCategory
  tags: string[]
  solution: string
  successCount: number
  totalUsed: number
  createdBy: string
  sourceTicketId?: string
  createdAt: Date
  updatedAt: Date
}

// ---- Embedding Types ----
export interface EmbeddingDoc {
  _id?: ObjectId
  sourceId: string // ticket or KB article id
  sourceType: 'ticket' | 'kb'
  text: string
  embedding: number[] // 1536-dim vector
  category: TicketCategory
  createdAt: Date
}

// ---- Chat Types ----
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    similarityScore?: number
    llmConfidence?: number
    successRate?: number
    suggestedSteps?: string[]
    similarTickets?: Array<{ ticketId: string; title: string; similarity: number }>
    category?: TicketCategory
    priority?: TicketPriority
  }
}

export interface ChatSession {
  _id?: ObjectId
  sessionId: string
  userId: string
  messages: ChatMessage[]
  resolved: boolean
  ticketCreated?: string
  createdAt: Date
  updatedAt: Date
}

// ---- Notification Types ----
export type NotificationType = 'ticket_assigned' | 'ticket_escalated' | 'sla_warning' | 'ticket_resolved' | 'new_ticket' | 'admin_approval'

export interface Notification {
  _id?: ObjectId
  userId: string
  type: NotificationType
  title: string
  message: string
  ticketId?: string
  read: boolean
  createdAt: Date
}

// ---- Analytics Types ----
export interface DashboardStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  escalatedTickets: number
  slaCompliance: number // percentage
  aiResolutionRate: number // percentage
  avgConfidence: number
  avgResolutionTime: number // hours
}

export interface AgentPerformance {
  userId: string
  name: string
  skills: string[]
  activeTickets: number
  totalResolved: number
  successRate: number
  avgResolutionTime: number
  workload: 'low' | 'medium' | 'high'
}

// ---- Auth Types ----
export interface JWTPayload {
  userId: string
  name: string
  email: string
  role: UserRole
}

// ---- AI Pipeline Types ----
export interface ClassificationResult {
  category: TicketCategory
  priority: TicketPriority
  reasoning: string
}

export interface RAGResult {
  answer: string
  confidence: number
  sources: Array<{
    sourceId: string
    sourceType: 'ticket' | 'kb'
    text: string
    similarity: number
  }>
  suggestedSteps: string[]
}

export interface ConfidenceResult {
  finalConfidence: number
  similarityScore: number
  llmConfidence: number
  successRate: number
  decision: 'auto-resolve' | 'suggest' | 'escalate'
}

export interface AgentScore {
  userId: string
  name: string
  score: number
  skillMatch: number
  workloadScore: number
  successRateScore: number
}
