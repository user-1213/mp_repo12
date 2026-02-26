import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ragQuery } from '@/lib/langchain';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;

    const { message, sessionId } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const db = await getDb();
    const sid = sessionId || `session-${Date.now()}`;

    // Store user message
    await db.collection('chat_sessions').updateOne(
      { sessionId: sid },
      {
        $setOnInsert: { sessionId: sid, userId: payload?.userId || 'anonymous', createdAt: new Date() },
        $push: { messages: { role: 'user', content: message, timestamp: new Date() } } as Record<string, unknown>,
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    // RAG query via LangChain
    let response;
    try {
      response = await ragQuery(message, db);
    } catch (e) {
      console.error('RAG query failed, using fallback:', e);
      response = {
        answer: 'I apologize, but I am having trouble processing your request right now. Please try again or create a support ticket for further assistance.',
        confidence: 0,
        sources: [],
        suggestTicket: true,
      };
    }

    // Store assistant message
    await db.collection('chat_sessions').updateOne(
      { sessionId: sid },
      {
        $push: {
          messages: {
            role: 'assistant',
            content: response.answer,
            confidence: response.confidence,
            sources: response.sources,
            timestamp: new Date(),
          },
        } as Record<string, unknown>,
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
      sessionId: sid,
      message: response.answer,
      confidence: response.confidence,
      sources: response.sources,
      suggestTicket: response.suggestTicket,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
