import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockAgents = [
      { agentId: 'agent@company.com', totalAssigned: 150, resolved: 135, avgResolutionTimeMinutes: 92 },
      { agentId: 'support1@company.com', totalAssigned: 180, resolved: 156, avgResolutionTimeMinutes: 115 },
      { agentId: 'support2@company.com', totalAssigned: 120, resolved: 98, avgResolutionTimeMinutes: 145 },
      { agentId: 'tech@company.com', totalAssigned: 200, resolved: 170, avgResolutionTimeMinutes: 105 },
    ];

    const agents = mockAgents.map((agent) => ({
      ...agent,
      resolutionRate: (agent.resolved / agent.totalAssigned) * 100,
    }));

    return NextResponse.json({ agents });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch agent analytics' }, { status: 500 });
  }
}
