import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { agentId } = await request.json();

    // Assign ticket to agent (would use real DB)
    return NextResponse.json({ success: true, agentId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign ticket' }, { status: 500 });
  }
}
