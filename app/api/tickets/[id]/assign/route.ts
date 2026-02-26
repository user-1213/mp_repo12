import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { agentId } = await request.json();
    const db = await getDb();

    const ticket = await db.collection('tickets').findOne({ ticketId: id });
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    // Decrement old agent if reassigning
    if (ticket.assignedTo && ticket.assignedTo !== agentId) {
      await db.collection('users').updateOne({ userId: ticket.assignedTo }, { $inc: { activeTickets: -1 } });
    }

    const agent = await db.collection('users').findOne({ userId: agentId });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    if (agent.activeTickets >= (agent.maxTickets || 10)) {
      return NextResponse.json({ error: 'Agent at max capacity' }, { status: 400 });
    }

    await db.collection('tickets').updateOne({ ticketId: id }, {
      $set: { assignedTo: agentId, assignedToName: agent.name, status: ticket.status === 'open' || ticket.status === 'escalated' ? 'in-progress' : ticket.status, updatedAt: new Date() },
    });
    await db.collection('users').updateOne({ userId: agentId }, { $inc: { activeTickets: 1 } });

    // Notify agent
    await db.collection('notifications').insertOne({
      userId: agentId,
      type: 'ticket_assigned',
      title: 'Ticket Assigned',
      message: `Ticket ${id}: ${ticket.title}`,
      ticketId: id,
      read: false,
      createdAt: new Date(),
    });

    const updated = await db.collection('tickets').findOne({ ticketId: id });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
