import { NextRequest, NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { agentId, userId, userName } = await request.json();

    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const agent = db.users.find((u) => u.id === agentId && u.role === "agent");
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    // Decrease old agent workload
    if (ticket.assignedTo) {
      const oldAgent = db.users.find((u) => u.id === ticket.assignedTo);
      if (oldAgent && oldAgent.workload !== undefined && oldAgent.workload > 0) oldAgent.workload--;
    }

    ticket.assignedTo = agent.id;
    ticket.assignedToName = agent.name;
    ticket.updatedAt = new Date().toISOString();

    // Increase new agent workload
    if (agent.workload !== undefined) agent.workload++;

    ticket.timeline.push({
      id: nextId(),
      action: "assignment",
      details: `Assigned to ${agent.name}`,
      userId: userId || "system",
      userName: userName || "System",
      createdAt: new Date().toISOString(),
    });

    // Notify new agent
    db.notifications.push({
      id: nextId(),
      userId: agent.id,
      type: "assignment",
      title: "New Ticket Assigned",
      message: `${ticket.id} (${ticket.title}) has been assigned to you`,
      ticketId: ticket.id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 });
  }
}
