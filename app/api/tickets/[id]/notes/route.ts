import { NextRequest, NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content, userId, userName } = await request.json();

    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const authorName = userName || db.users.find((u) => u.id === userId)?.name || "Unknown";

    const note = {
      id: nextId(),
      content,
      authorId: userId,
      authorName,
      createdAt: new Date().toISOString(),
    };

    ticket.notes.push(note);
    ticket.updatedAt = new Date().toISOString();

    ticket.timeline.push({
      id: nextId(),
      action: "note",
      details: `Note added: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
      userId,
      userName: authorName,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
