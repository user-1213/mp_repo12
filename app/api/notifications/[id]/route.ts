import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notif = db.notifications.find((n) => n.id === id);
    if (!notif) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    notif.read = true;
    return NextResponse.json(notif);
  } catch {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
