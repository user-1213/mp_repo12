import { NextRequest, NextResponse } from "next/server";
import { classifyTicket } from "@/lib/ai-engine";

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();
    if (!description) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }
    const classification = await classifyTicket(description);
    return NextResponse.json(classification);
  } catch {
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }
}
