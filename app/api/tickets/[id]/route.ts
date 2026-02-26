import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { semanticSearch } from "@/lib/ai-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const similarArticles = await semanticSearch(`${ticket.title} ${ticket.description}`, 5);

    const similarTickets = db.tickets
      .filter((t) => t.id !== id && t.category === ticket.category)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        resolution: t.resolution,
        category: t.category,
        priority: t.priority,
      }));

    const agent = ticket.assignedTo
      ? db.users.find((u) => u.id === ticket.assignedTo)
      : null;

    return NextResponse.json({
      ticket,
      aiAnalysis: {
        classification: ticket.aiClassification,
        similarArticles: similarArticles.map((a) => ({
          id: a.id,
          title: a.title,
          category: a.category,
          similarity: Math.round(a.similarity * 100),
          successRate: Math.round(a.successRate * 100),
        })),
        similarTickets,
      },
      assignedAgent: agent
        ? {
            id: agent.id,
            name: agent.name,
            skills: agent.skills,
            workload: agent.workload,
            successRate: agent.successRate ? Math.round(agent.successRate * 100) : null,
            skillMatch: ticket.assignedSkillMatch,
            routingReason: ticket.routingReason,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    if (body.title) ticket.title = body.title;
    if (body.description) ticket.description = body.description;
    if (body.category) ticket.category = body.category;
    if (body.priority) ticket.priority = body.priority;
    ticket.updatedAt = new Date().toISOString();

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
