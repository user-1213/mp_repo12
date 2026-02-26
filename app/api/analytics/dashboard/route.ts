import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock analytics data
    const mockData = {
      totalTickets: 1800,
      resolvedTickets: 1485,
      pendingTickets: 275,
      highPriorityTickets: 42,
      resolutionRate: 82.5,
      avgResolutionTimeMinutes: 127,
      ticketsByCategory: {
        'Network': 450,
        'Software': 380,
        'Account': 320,
        'Performance': 280,
        'Hardware': 200,
        'Security': 95,
        'Other': 75,
      },
      ticketsByPriority: {
        'critical': 12,
        'high': 85,
        'medium': 450,
        'low': 1253,
      },
      ticketsByStatus: {
        'Pending': 275,
        'In Progress': 140,
        'Resolved': 1485,
      },
    };

    return NextResponse.json(mockData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
