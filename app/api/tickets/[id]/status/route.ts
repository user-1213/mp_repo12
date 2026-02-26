import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, resolution } = await request.json();
    const db = await getDb();

    const update: Record<string, unknown> = { status, updatedAt: new Date() };
    if (resolution) update.resolution = resolution;

    // If resolving, update agent stats
    if (status === 'resolved') {
      const ticket = await db.collection('tickets').findOne({ ticketId: id });
      if (ticket?.assignedTo) {
        await db.collection('users').updateOne(
          { userId: ticket.assignedTo },
          { $inc: { activeTickets: -1, totalResolved: 1 } }
        );
      }
    }

    const result = await db.collection('tickets').updateOne({ ticketId: id }, { $set: update });
    if (result.matchedCount === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const ticket = await db.collection('tickets').findOne({ ticketId: id });

    // Notify creator about status change
    if (ticket) {
      await db.collection('notifications').insertOne({
        userId: ticket.createdBy,
        type: 'status_update',
        title: 'Ticket Status Updated',
        message: `Ticket ${id} is now: ${status}`,
        ticketId: id,
        read: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
