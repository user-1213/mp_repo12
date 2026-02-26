import OpenAI from "openai";
import { db, nextId, type KBArticle } from "./db";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

export interface SimilarDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  similarity: number;
  successRate: number;
}

export interface ClassificationResult {
  category: string;
  priority: string;
  confidence: number;
}

export interface RAGResponse {
  answer: string;
  suggestedSteps: string[];
  rootCause: string;
  llmConfidence: number;
}

export interface ConfidenceResult {
  finalScore: number;
  breakdown: {
    similarity: number;
    llmConfidence: number;
    successRate: number;
  };
  action: "auto-resolve" | "suggest" | "escalate";
}

export interface AgentAssignment {
  agentId: string;
  agentName: string;
  skillMatch: number;
  workload: number;
  routingReason: string;
}

export interface ChatResponse {
  answer: string;
  confidence: number;
  confidenceBreakdown: ConfidenceResult["breakdown"];
  classification: ClassificationResult;
  similarArticles: SimilarDocument[];
  suggestedSteps: string[];
  rootCause: string;
  action: ConfidenceResult["action"];
}

const IT_VOCAB = [
  "network","vpn","wifi","router","switch","firewall","bandwidth","dns","ip","ethernet",
  "software","install","update","crash","error","application","license","driver","windows",
  "hardware","laptop","printer","monitor","keyboard","mouse","disk","memory","cpu","overheat",
  "account","password","login","access","permission","reset","mfa","authentication","user",
  "email","outlook","sync","attachment","phishing","spam","exchange","calendar",
  "performance","slow","speed","optimization","cache","database","query","latency",
  "security","breach","malware","antivirus","suspicious","encryption","backup","recovery",
  "teams","zoom","remote","desktop","rdp","conference","meeting",
  "server","cloud","storage","shared","drive","file","folder",
];

function localEmbedding(text: string): number[] {
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/);
  const vec = IT_VOCAB.map((term) => {
    let count = 0;
    for (const w of words) {
      if (w === term || w.includes(term) || term.includes(w)) count++;
    }
    return count;
  });
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  if (client) {
    try {
      const resp = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return resp.data[0].embedding;
    } catch {
      // fallback to local
    }
  }
  return localEmbedding(text);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function ensureKBEmbeddings(): Promise<void> {
  const toEmbed = db.knowledgeBase.filter((a) => !a.embedding);
  if (toEmbed.length === 0) return;
  for (let i = 0; i < toEmbed.length; i += 5) {
    const batch = toEmbed.slice(i, i + 5);
    const embeddings = await Promise.all(
      batch.map((a) => generateEmbedding(`${a.title} ${a.content} ${a.tags.join(" ")}`))
    );
    for (let j = 0; j < batch.length; j++) {
      batch[j].embedding = embeddings[j];
    }
  }
}

export async function semanticSearch(query: string, topK: number = 5): Promise<SimilarDocument[]> {
  await ensureKBEmbeddings();
  const queryEmb = await generateEmbedding(query);

  const scored = db.knowledgeBase.map((article) => ({
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    similarity: article.embedding ? cosineSimilarity(queryEmb, article.embedding) : 0,
    successRate: article.totalUsed > 0 ? article.successCount / article.totalUsed : 0.5,
  }));

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

const CATEGORIES = ["Network","Software","Hardware","Account","Performance","Security","Email","Other"];
const PRIORITIES = ["critical","high","medium","low"];

const CAT_KW: Record<string, string[]> = {
  Network: ["vpn","wifi","network","internet","connection","bandwidth","dns","router","switch","ethernet","firewall","rdp","remote desktop"],
  Software: ["install","update","crash","application","software","teams","zoom","license","program","app","error code"],
  Hardware: ["laptop","printer","monitor","keyboard","mouse","hardware","overheating","screen","disk","battery","charger","usb","bsod","blue screen"],
  Account: ["password","login","account","access","permission","reset","locked","credentials","shared drive","onboarding"],
  Performance: ["slow","performance","speed","latency","memory","cpu","database","optimization","lag","hanging","freezing"],
  Security: ["security","suspicious","phishing","malware","virus","breach","hack","mfa","2fa","antivirus","encryption"],
  Email: ["email","outlook","sync","attachment","calendar","exchange","inbox","spam"],
};

const PRI_KW: Record<string, string[]> = {
  critical: ["shutdown","breach","compromised","down","crashed","critical","security","all users","production","server down"],
  high: ["cannot","not working","error","unable","broken","failing","urgent","blocking","multiple"],
  medium: ["slow","intermittent","sometimes","issue","problem","help","need"],
  low: ["question","how to","setup","configure","request","would like","information"],
};

function localClassify(desc: string): ClassificationResult {
  const lower = desc.toLowerCase();
  const catScores: Record<string,number> = {};
  for (const cat of CATEGORIES) {
    catScores[cat] = 0;
    for (const kw of (CAT_KW[cat]||[])) {
      if (lower.includes(kw)) catScores[cat] += kw.split(" ").length > 1 ? 3 : 1;
    }
  }
  const best = Object.entries(catScores).sort((a,b) => b[1]-a[1])[0];
  const category = best[1] > 0 ? best[0] : "Other";

  let priority = "medium";
  let maxS = 0;
  for (const [pri, kws] of Object.entries(PRI_KW)) {
    let s = 0;
    for (const kw of kws) { if (lower.includes(kw)) s += kw.split(" ").length > 1 ? 3 : 1; }
    if (s > maxS) { maxS = s; priority = pri; }
  }

  const confidence = Math.min(0.95, 0.6 + (best[1]*0.05) + (maxS*0.03));
  return { category, priority, confidence };
}

export async function classifyTicket(description: string): Promise<ClassificationResult> {
  const client = getOpenAI();
  if (client) {
    try {
      const resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are an IT support ticket classifier. Classify the ticket description.\nReturn ONLY valid JSON with:\n- "category": one of [${CATEGORIES.map(c=>`"${c}"`).join(",")}]\n- "priority": one of [${PRIORITIES.map(p=>`"${p}"`).join(",")}]\n- "confidence": number 0.0-1.0\nConsider severity, business impact, affected user count.` },
          { role: "user", content: description },
        ],
        temperature: 0.1,
        max_tokens: 150,
      });
      const text = resp.choices[0]?.message?.content?.trim() || "";
      const json = JSON.parse(text);
      return {
        category: CATEGORIES.includes(json.category) ? json.category : "Other",
        priority: PRIORITIES.includes(json.priority) ? json.priority : "medium",
        confidence: typeof json.confidence === "number" ? Math.min(1, Math.max(0, json.confidence)) : 0.7,
      };
    } catch { /* fallback */ }
  }
  return localClassify(description);
}

function localRAGResponse(query: string, context: SimilarDocument[]): RAGResponse {
  if (context.length === 0 || context[0].similarity < 0.1) {
    return {
      answer: "I couldn't find a specific solution in our knowledge base for this issue. I recommend creating a support ticket so our IT team can assist you directly.",
      suggestedSteps: ["Create a support ticket with detailed description","Include any error messages or screenshots","Note when the issue started"],
      rootCause: "Unable to determine root cause from available information",
      llmConfidence: 0.3,
    };
  }
  const best = context[0];
  const steps = best.content.split(/\d+\)\s+/).filter(Boolean).map(s => s.trim());
  return {
    answer: `Based on our knowledge base article "${best.title}", here is a solution for your issue:\n\n${best.content}`,
    suggestedSteps: steps.slice(0,8),
    rootCause: `This appears to be a ${best.category} issue. The solution has been successful in ${Math.round(best.successRate*100)}% of similar cases.`,
    llmConfidence: Math.min(0.85, best.similarity * 0.9 + 0.1),
  };
}

export async function generateRAGResponse(query: string, context: SimilarDocument[]): Promise<RAGResponse> {
  const client = getOpenAI();
  if (client && context.length > 0) {
    try {
      const kbCtx = context.slice(0,3).map((doc,i) =>
        `[Article ${i+1}: "${doc.title}" (${Math.round(doc.similarity*100)}% match)]\n${doc.content}`
      ).join("\n\n");

      const resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are an expert IT support assistant. Use the knowledge base articles to answer the user's question.\nReturn ONLY valid JSON with:\n- "answer": detailed helpful response\n- "suggestedSteps": array of 3-8 troubleshooting steps\n- "rootCause": brief root cause explanation\n- "llmConfidence": number 0.0-1.0\n\nKnowledge Base:\n${kbCtx}` },
          { role: "user", content: query },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });
      const text = resp.choices[0]?.message?.content?.trim() || "";
      const json = JSON.parse(text);
      return {
        answer: json.answer || "I found relevant information but couldn't generate a complete response.",
        suggestedSteps: Array.isArray(json.suggestedSteps) ? json.suggestedSteps : [],
        rootCause: json.rootCause || "Root cause analysis unavailable",
        llmConfidence: typeof json.llmConfidence === "number" ? Math.min(1, Math.max(0, json.llmConfidence)) : 0.6,
      };
    } catch { /* fallback */ }
  }
  return localRAGResponse(query, context);
}

export function computeConfidenceScore(similarity: number, llmConfidence: number, successRate: number): ConfidenceResult {
  const finalScore = (0.4 * similarity) + (0.3 * llmConfidence) + (0.3 * successRate);
  const clamped = Math.min(1, Math.max(0, finalScore));
  let action: ConfidenceResult["action"];
  if (clamped > 0.8) action = "auto-resolve";
  else if (clamped >= 0.55) action = "suggest";
  else action = "escalate";
  return {
    finalScore: Math.round(clamped * 100) / 100,
    breakdown: {
      similarity: Math.round(similarity * 100) / 100,
      llmConfidence: Math.round(llmConfidence * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
    },
    action,
  };
}

export function routeToAgent(
  ticket: { category: string; priority: string },
  confidenceAction: ConfidenceResult["action"]
): AgentAssignment | null {
  const agents = db.users.filter(u => u.role === "agent");
  if (agents.length === 0) return null;

  const scored = agents.map(agent => {
    const skills = agent.skills || [];
    const skillMatch = skills.some(s => s.toLowerCase() === ticket.category.toLowerCase()) ? 0.95
      : skills.some(s => ticket.category.toLowerCase().includes(s.toLowerCase())) ? 0.7 : 0.4;
    const maxWL = 8;
    const wlScore = 1 - ((agent.workload||0)/maxWL);
    const sr = agent.successRate || 0.5;
    const exp = Math.min(1, (agent.resolvedCount||0)/200);

    let score: number;
    let reason: string;
    if (confidenceAction === "escalate" || ticket.priority === "critical") {
      score = (skillMatch*0.4) + (sr*0.4) + (exp*0.2);
      reason = `${ticket.priority==="critical"?"Critical priority":"Low confidence"} routing: Skill ${Math.round(skillMatch*100)}%, Success ${Math.round(sr*100)}%`;
    } else {
      score = (skillMatch*0.5) + (wlScore*0.3) + (sr*0.2);
      reason = `Best match: Skill ${Math.round(skillMatch*100)}%, Workload ${agent.workload||0}/${maxWL}, Success ${Math.round(sr*100)}%`;
    }
    return { agent, score, skillMatch, reason };
  });

  scored.sort((a,b) => b.score - a.score);
  const best = scored[0];
  return {
    agentId: best.agent.id,
    agentName: best.agent.name,
    skillMatch: Math.round(best.skillMatch * 100),
    workload: best.agent.workload || 0,
    routingReason: best.reason,
  };
}

export async function processChatQuery(query: string): Promise<ChatResponse> {
  const similarArticles = await semanticSearch(query, 5);
  const classification = await classifyTicket(query);
  const ragResponse = await generateRAGResponse(query, similarArticles);
  const bestSim = similarArticles.length > 0 ? similarArticles[0].similarity : 0;
  const bestSR = similarArticles.length > 0 ? similarArticles[0].successRate : 0.5;
  const conf = computeConfidenceScore(bestSim, ragResponse.llmConfidence, bestSR);
  return {
    answer: ragResponse.answer,
    confidence: conf.finalScore,
    confidenceBreakdown: conf.breakdown,
    classification,
    similarArticles: similarArticles.slice(0,5),
    suggestedSteps: ragResponse.suggestedSteps,
    rootCause: ragResponse.rootCause,
    action: conf.action,
  };
}

export async function feedbackLoop(ticketId: string, resolution: string): Promise<void> {
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  const existing = db.knowledgeBase.find(a =>
    a.category === ticket.category &&
    a.content.toLowerCase().includes(ticket.title.toLowerCase().split(" ")[0])
  );

  if (existing) {
    existing.successCount++;
    existing.totalUsed++;
    existing.updatedAt = new Date().toISOString();
    existing.embedding = null;
  } else {
    const newArticle: KBArticle = {
      id: `kb-auto-${nextId()}`,
      title: `Resolution: ${ticket.title}`,
      content: `Issue: ${ticket.description}\n\nResolution: ${resolution}\n\nCategory: ${ticket.category}, Priority: ${ticket.priority}`,
      category: ticket.category,
      tags: ticket.title.toLowerCase().split(/\W+/).filter(w => w.length > 3),
      embedding: null,
      successCount: 1,
      totalUsed: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.knowledgeBase.push(newArticle);
  }
}
