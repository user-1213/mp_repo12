import { NextRequest, NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";
import { processChatQuery } from "@/lib/ai-engine";

export async function POST(request: NextRequest) {
  try {
    const { query, userId, sessionId } = await request.json();

    if (!query || !userId) {
      return NextResponse.json({ error: "Query and userId required" }, { status: 400 });
    }

    // Find or create chat session
    let session = sessionId
      ? db.chatSessions.find((s) => s.id === sessionId)
      : null;

    if (!session) {
      session = {
        id: `chat-${nextId()}`,
        userId,
        messages: [],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.chatSessions.push(session);
    }

    // Add user message
    session.messages.push({
      id: nextId(),
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
    });

    // Run full LangChain orchestration pipeline
    const aiResponse = await processChatQuery(query);

    // Store classification for later ticket creation
    session.lastQuery = query;
    session.lastClassification = aiResponse.classification;

    // Add assistant message with full metadata
    session.messages.push({
      id: nextId(),
      role: "assistant",
      content: aiResponse.answer,
      metadata: {
        confidence: aiResponse.confidence,
        confidenceBreakdown: aiResponse.confidenceBreakdown,
        classification: aiResponse.classification,
        similarArticles: aiResponse.similarArticles.map((a) => ({
          id: a.id,
          title: a.title,
          similarity: a.similarity,
        })),
        suggestedSteps: aiResponse.suggestedSteps,
        rootCause: aiResponse.rootCause,
        action: aiResponse.action,
      },
      createdAt: new Date().toISOString(),
    });

    session.updatedAt = new Date().toISOString();

    return NextResponse.json({
      sessionId: session.id,
      answer: aiResponse.answer,
      confidence: aiResponse.confidence,
      confidenceBreakdown: aiResponse.confidenceBreakdown,
      classification: aiResponse.classification,
      similarArticles: aiResponse.similarArticles.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        similarity: Math.round(a.similarity * 100),
        successRate: Math.round(a.successRate * 100),
      })),
      suggestedSteps: aiResponse.suggestedSteps,
      rootCause: aiResponse.rootCause,
      action: aiResponse.action,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat processing failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (sessionId) {
    const session = db.chatSessions.find((s) => s.id === sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json(session);
  }

  if (userId) {
    const sessions = db.chatSessions.filter((s) => s.userId === userId);
    return NextResponse.json(sessions);
  }

  return NextResponse.json({ error: "userId or sessionId required" }, { status: 400 });
}
