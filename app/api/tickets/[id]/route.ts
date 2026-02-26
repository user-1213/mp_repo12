import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const ticket = await db.collection('tickets').findOne({ ticketId: id });
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status) update.status = body.status;
    if (body.priority) update.priority = body.priority;
    if (body.category) update.category = body.category;
    if (body.resolution !== undefined) update.resolution = body.resolution;
    if (body.assignedTo !== undefined) update.assignedTo = body.assignedTo;
    if (body.assignedToName !== undefined) update.assignedToName = body.assignedToName;
    if (body.escalatedTo !== undefined) update.escalatedTo = body.escalatedTo;
    if (body.escalationReason !== undefined) update.escalationReason = body.escalationReason;

    // If resolving, update agent stats
    if (body.status === 'resolved') {
      const ticket = await db.collection('tickets').findOne({ ticketId: id });
      if (ticket?.assignedTo) {
        await db.collection('users').updateOne(
          { userId: ticket.assignedTo },
          { $inc: { activeTickets: -1, totalResolved: 1 } }
        );
        // Update success rate
        const agent = await db.collection('users').findOne({ userId: ticket.assignedTo });
        if (agent && agent.totalResolved > 0) {
          const newRate = Math.min(1, (agent.successRate || 0.5) * 0.95 + 0.05);
          await db.collection('users').updateOne({ userId: ticket.assignedTo }, { $set: { successRate: newRate } });
        }
      }
      // Auto-update KB from resolution
      if (body.resolution && body.updateKb) {
        const ticket = await db.collection('tickets').findOne({ ticketId: id });
        if (ticket) {
          const existing = await db.collection('kb_articles').findOne({ category: ticket.category });
          if (existing) {
            await db.collection('kb_articles').updateOne(
              { _id: existing._id },
              { $inc: { successCount: 1, totalUsed: 1 }, $set: { updatedAt: new Date() } }
            );
          }
        }
      }
    }

    const result = await db.collection('tickets').updateOne({ ticketId: id }, { $set: update });
    if (result.matchedCount === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const ticket = await db.collection('tickets').findOne({ ticketId: id });
    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
