import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'agent' ? 'agent' : 'employee';
    const userId = `${userRole}-${Date.now()}`;

    const newUser = {
      userId,
      name,
      email,
      password: hashedPassword,
      role: userRole,
      skills: userRole === 'agent' ? [] : undefined,
      experienceLevel: userRole === 'agent' ? 'junior' : undefined,
      activeTickets: userRole === 'agent' ? 0 : undefined,
      maxTickets: userRole === 'agent' ? 10 : undefined,
      successRate: userRole === 'agent' ? 0 : undefined,
      totalResolved: userRole === 'agent' ? 0 : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertOne(newUser);

    const token = signToken({ userId, email, role: userRole, name });

    const res = NextResponse.json({
      token,
      user: { userId, name, email, role: userRole },
    });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });
    return res;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
