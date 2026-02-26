import { NextRequest, NextResponse } from "next/server";
import { db, nextId } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, department } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const id = `${role}-${nextId()}`;
    const newUser = {
      id,
      name,
      email,
      password,
      role: role as "employee" | "agent" | "admin",
      department: department || undefined,
      skills: role === "agent" ? ["Software", "Network"] : undefined,
      workload: role === "agent" ? 0 : undefined,
      successRate: role === "agent" ? 0.75 : undefined,
      resolvedCount: role === "agent" ? 0 : undefined,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    const token = Buffer.from(`${id}:${email}:${role}`).toString("base64");

    return NextResponse.json({
      token,
      user: { id, name, email, role, department },
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
