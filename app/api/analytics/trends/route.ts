import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Generate mock trend data
    const trends = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        _id: date.toISOString().split('T')[0],
        created: Math.floor(Math.random() * 50) + 10,
        resolved: Math.floor(Math.random() * 40) + 20,
      });
    }

    return NextResponse.json({ trends });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
