import { NextRequest, NextResponse } from "next/server";
import { db, nextTicketId, nextId } from "@/lib/db";
import { classifyTicket, routeToAgent, computeConfidenceScore, semanticSearch } from "@/lib/ai-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title, description, userId, userName,
      fromChat, chatSessionId, category: preCategory, priority: prePriority,
    } = body;

    if (!title || !description || !userId) {
      return NextResponse.json({ error: "Title, description, userId required" }, { status: 400 });
    }

    // Classification: use chat pre-fill or run AI classification
    let classification;
    if (fromChat && preCategory && prePriority) {
      classification = { category: preCategory, priority: prePriority, confidence: 0.9 };
    } else {
      classification = await classifyTicket(description);
    }

    // Agent routing
    const routing = routeToAgent(
      { category: classification.category, priority: classification.priority },
      classification.confidence > 0.8 ? "suggest" : "escalate"
    );

    // Update agent workload
    if (routing) {
      const agent = db.users.find((u) => u.id === routing.agentId);
      if (agent && agent.workload !== undefined) agent.workload++;
    }

    const ticketId = nextTicketId();
    const creatorName = userName || db.users.find((u) => u.id === userId)?.name || "Unknown";

    const ticket = {
      id: ticketId,
      title,
      description,
      category: classification.category,
      priority: classification.priority as "critical" | "high" | "medium" | "low",
      status: "open" as const,
      createdBy: userId,
      createdByName: creatorName,
      assignedTo: routing?.agentId,
      assignedToName: routing?.agentName,
      assignedSkillMatch: routing?.skillMatch,
      routingReason: routing?.routingReason,
      chatSessionId: chatSessionId || undefined,
      aiClassification: classification,
      notes: [],
      timeline: [{
        id: nextId(),
        action: "created",
        details: `Ticket created${fromChat ? " from chatbot" : ""}. AI classified as ${classification.category}/${classification.priority} (${Math.round(classification.confidence * 100)}% confidence). ${routing ? `Auto-assigned to ${routing.agentName}.` : ""}`,
        userId,
        userName: creatorName,
        createdAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.tickets.push(ticket);

    // Create notification for assigned agent
    if (routing) {
      db.notifications.push({
        id: nextId(),
        userId: routing.agentId,
        type: "assignment",
        title: "New Ticket Assigned",
        message: `${ticketId} (${title}) - ${classification.priority} priority - ${classification.category}`,
        ticketId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Mark chat session as ticket-created
    if (chatSessionId) {
      const session = db.chatSessions.find((s) => s.id === chatSessionId);
      if (session) session.status = "ticket-created";
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const assignedTo = searchParams.get("assignedTo");
    const priority = searchParams.get("priority");

    let filtered = [...db.tickets];

    if (status && status !== "all") filtered = filtered.filter((t) => t.status === status);
    if (userId) filtered = filtered.filter((t) => t.createdBy === userId);
    if (assignedTo) filtered = filtered.filter((t) => t.assignedTo === assignedTo);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ tickets: filtered });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
