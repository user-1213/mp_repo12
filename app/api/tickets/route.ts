import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { classifyTicket, findBestAgent } from '@/lib/langchain';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;

    const { title, description } = await request.json();
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    const db = await getDb();

    // AI Classification via LangChain
    let aiAnalysis;
    try {
      aiAnalysis = await classifyTicket(title, description);
    } catch (e) {
      console.error('AI classification failed, using fallback:', e);
      aiAnalysis = fallbackClassify(title, description);
    }

    // Auto-assign agent based on AI analysis
    let assignedTo: string | null = null;
    let assignedToName: string | null = null;
    try {
      const bestAgent = await findBestAgent(aiAnalysis.category, aiAnalysis.priority, db);
      if (bestAgent) {
        assignedTo = bestAgent.userId;
        assignedToName = bestAgent.name;
        await db.collection('users').updateOne({ userId: bestAgent.userId }, { $inc: { activeTickets: 1 } });
      }
    } catch (e) {
      console.error('Agent assignment failed:', e);
    }

    const count = await db.collection('tickets').countDocuments();
    const ticketId = `TK-${String(count + 1).padStart(3, '0')}`;

    const slaHours = aiAnalysis.priority === 'critical' ? 4 : aiAnalysis.priority === 'high' ? 8 : aiAnalysis.priority === 'medium' ? 24 : 48;

    const ticket = {
      ticketId,
      title,
      description,
      category: aiAnalysis.category,
      priority: aiAnalysis.priority,
      status: aiAnalysis.confidence > 0.8 ? 'open' : aiAnalysis.confidence > 0.55 ? 'open' : 'escalated',
      createdBy: payload?.userId || 'anonymous',
      createdByName: payload?.name || 'Anonymous User',
      assignedTo,
      assignedToName,
      escalatedTo: aiAnalysis.confidence < 0.55 ? 'admin-001' : null,
      escalationReason: aiAnalysis.confidence < 0.55 ? 'Low AI confidence - requires expert review' : null,
      aiAnalysis,
      notes: [],
      resolution: null,
      slaDeadline: new Date(Date.now() + slaHours * 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('tickets').insertOne(ticket);

    // Create notification for assigned agent
    if (assignedTo) {
      await db.collection('notifications').insertOne({
        userId: assignedTo,
        type: 'ticket_assigned',
        title: 'New Ticket Assigned',
        message: `Ticket ${ticketId}: ${title}`,
        ticketId,
        read: false,
        createdAt: new Date(),
      });
    }

    // If escalated, notify admin
    if (ticket.escalatedTo) {
      await db.collection('notifications').insertOne({
        userId: ticket.escalatedTo,
        type: 'ticket_escalated',
        title: 'Ticket Escalated',
        message: `Ticket ${ticketId} escalated - low AI confidence (${(aiAnalysis.confidence * 100).toFixed(0)}%)`,
        ticketId,
        read: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');

    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (userId) filter.createdBy = userId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await db.collection('tickets').find(filter).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ tickets });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function fallbackClassify(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  let category = 'General';
  if (text.includes('vpn') || text.includes('network') || text.includes('wifi') || text.includes('internet')) category = 'Network';
  else if (text.includes('email') || text.includes('outlook') || text.includes('mail')) category = 'Email';
  else if (text.includes('password') || text.includes('login') || text.includes('security') || text.includes('hack')) category = 'Security';
  else if (text.includes('software') || text.includes('install') || text.includes('app')) category = 'Software';
  else if (text.includes('hardware') || text.includes('printer') || text.includes('screen') || text.includes('blue screen')) category = 'Hardware';
  else if (text.includes('database') || text.includes('sql') || text.includes('timeout')) category = 'Database';

  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (text.includes('critical') || text.includes('down') || text.includes('breach') || text.includes('crash')) priority = 'critical';
  else if (text.includes('error') || text.includes('fail') || text.includes('cannot')) priority = 'high';
  else if (text.includes('slow') || text.includes('help') || text.includes('issue')) priority = 'medium';
  else priority = 'low';

  return {
    category,
    priority,
    confidence: 0.5,
    similarityScore: 0,
    llmConfidence: 0.5,
    successRate: 0,
    suggestedRootCause: 'Unable to determine automatically',
    suggestedSteps: ['Review ticket details manually', 'Check knowledge base'],
    reasoning: 'Fallback classification used',
  };
}
