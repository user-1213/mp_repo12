import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    // In production, validate against database
    // For demo, accept any email/password
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const token = Buffer.from(`${email}:${password}`).toString('base64');

    return NextResponse.json({
      token,
      user: {
        email,
        role: role || 'employee',
        name: email.split('@')[0],
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
