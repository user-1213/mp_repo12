import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;

    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const db = await getDb();
    const note = {
      author: payload?.name || 'Unknown',
      authorRole: payload?.role || 'unknown',
      content,
      createdAt: new Date(),
    };

    const result = await db.collection('tickets').updateOne(
      { ticketId: id },
      { $push: { notes: note } as Record<string, unknown>, $set: { updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    return NextResponse.json(note);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
