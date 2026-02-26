import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, agentId } = await request.json();

    const note = {
      _id: `NOTE-${Date.now()}`,
      content,
      agentId,
      createdAt: new Date().toISOString(),
    };

    // Add note to ticket (would use real DB)
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
