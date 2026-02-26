import { NextRequest, NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";
import { routeToAgent } from "@/lib/ai-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reason, userId, userName } = await request.json();

    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    ticket.status = "escalated";
    ticket.updatedAt = new Date().toISOString();

    // Decrease current agent workload
    if (ticket.assignedTo) {
      const oldAgent = db.users.find((u) => u.id === ticket.assignedTo);
      if (oldAgent && oldAgent.workload !== undefined && oldAgent.workload > 0) oldAgent.workload--;
    }

    // Route to higher-skilled agent (escalation mode)
    const newRouting = routeToAgent(
      { category: ticket.category, priority: "critical" },
      "escalate"
    );

    if (newRouting && newRouting.agentId !== ticket.assignedTo) {
      ticket.assignedTo = newRouting.agentId;
      ticket.assignedToName = newRouting.agentName;
      ticket.assignedSkillMatch = newRouting.skillMatch;
      ticket.routingReason = `Escalated: ${newRouting.routingReason}`;

      const newAgent = db.users.find((u) => u.id === newRouting.agentId);
      if (newAgent && newAgent.workload !== undefined) newAgent.workload++;

      // Notify new agent
      db.notifications.push({
        id: nextId(),
        userId: newRouting.agentId,
        type: "escalation",
        title: "Escalated Ticket Assigned",
        message: `${ticket.id} (${ticket.title}) has been escalated to you. Reason: ${reason || "Not specified"}`,
        ticketId: ticket.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    ticket.timeline.push({
      id: nextId(),
      action: "escalated",
      details: `Ticket escalated. Reason: ${reason || "Not specified"}. ${newRouting ? `Re-assigned to ${newRouting.agentName}` : ""}`,
      userId: userId || "system",
      userName: userName || "System",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Failed to escalate ticket" }, { status: 500 });
  }
}
