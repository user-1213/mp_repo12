import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { agentId } = await request.json();

    // Assign ticket to agent (would use real DB)
    return NextResponse.json({ success: true, id, agentId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign ticket' }, { status: 500 });
  }
}
