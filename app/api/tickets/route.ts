import { NextRequest, NextResponse } from 'next/server';

// Mock ticket database
const mockTickets: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { title, description, email, userId } = await request.json();

    const ticket = {
      _id: `TICK-${Date.now()}`,
      conversationId: `CONV-${String(mockTickets.length).padStart(4, '0')}`,
      title,
      description,
      email,
      userId,
      status: 'Pending',
      priority: determinePriority(description),
      category: determineCategory(description),
      confidence: Math.random() * 0.4 + 0.6,
      suggestedResolution: generateSuggestion(description),
      relatedArticles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedAgent: null,
      notes: [],
      attachments: [],
    };

    mockTickets.push(ticket);

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const priority = searchParams.get('priority');

    let filtered = mockTickets;

    if (status) filtered = filtered.filter((t) => t.status === status);
    if (userId) filtered = filtered.filter((t) => t.userId === userId);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);

    return NextResponse.json({
      tickets: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

function determinePriority(description: string): string {
  const lower = description.toLowerCase();
  if (['crash', 'down', 'broken', 'critical'].some((w) => lower.includes(w))) return 'critical';
  if (['error', 'fail', 'not working'].some((w) => lower.includes(w))) return 'high';
  if (['slow', 'issue', 'help'].some((w) => lower.includes(w))) return 'medium';
  return 'low';
}

function determineCategory(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('wifi') || lower.includes('network') || lower.includes('internet'))
    return 'Network';
  if (lower.includes('password') || lower.includes('account') || lower.includes('login'))
    return 'Account';
  if (lower.includes('software') || lower.includes('install') || lower.includes('driver'))
    return 'Software';
  if (lower.includes('performance') || lower.includes('slow') || lower.includes('lag'))
    return 'Performance';
  return 'Other';
}

function generateSuggestion(description: string): string {
  if (description.toLowerCase().includes('wifi'))
    return 'Try restarting your router and reconnecting to the network.';
  if (description.toLowerCase().includes('password'))
    return 'Use the password reset link to set a new password.';
  if (description.toLowerCase().includes('slow'))
    return 'Clear your cache and disable unnecessary browser extensions.';
  return 'Please provide more details so we can assist you better.';
}
