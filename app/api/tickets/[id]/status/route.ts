import { NextRequest, NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";
import { feedbackLoop } from "@/lib/ai-engine";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, resolution, userId, userName } = await request.json();

    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date().toISOString();
      if (resolution) ticket.resolution = resolution;

      // Decrease agent workload
      if (ticket.assignedTo) {
        const agent = db.users.find((u) => u.id === ticket.assignedTo);
        if (agent && agent.workload !== undefined && agent.workload > 0) agent.workload--;
        if (agent && agent.resolvedCount !== undefined) agent.resolvedCount++;
      }

      // Feedback loop: update KB from resolution
      if (resolution) {
        await feedbackLoop(id, resolution);
      }
    }

    // Add timeline entry
    ticket.timeline.push({
      id: nextId(),
      action: "status-change",
      details: `Status changed from ${oldStatus} to ${status}${resolution ? `. Resolution: ${resolution}` : ""}`,
      userId: userId || "system",
      userName: userName || "System",
      createdAt: new Date().toISOString(),
    });

    // Notify ticket creator on status changes
    db.notifications.push({
      id: nextId(),
      userId: ticket.createdBy,
      type: "status-change",
      title: "Ticket Status Updated",
      message: `${ticket.id} (${ticket.title}) status changed to ${status}`,
      ticketId: ticket.id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
