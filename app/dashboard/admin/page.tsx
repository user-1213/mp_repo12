'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { Zap, LogOut, Download, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import useSWR from 'swr';

interface Analytics {
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  highPriorityTickets: number;
  resolutionRate: number;
  avgResolutionTimeMinutes: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
}

const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());
};

export default function AdminDashboard() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';

  const { data: analytics } = useSWR(
    token ? '/api/analytics/dashboard' : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 5000 }
  );

  const { data: agentsData } = useSWR(
    token ? '/api/analytics/agents' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: trendsData } = useSWR(
    token ? '/api/analytics/trends?days=30' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  const handleExport = () => {
    if (!analytics) return;

    const csv = [
      ['Metric', 'Value'],
      ['Total Tickets', analytics.totalTickets],
      ['Resolved Tickets', analytics.resolvedTickets],
      ['Pending Tickets', analytics.pendingTickets],
      ['Critical Tickets', analytics.highPriorityTickets],
      ['Resolution Rate', `${analytics.resolutionRate}%`],
      ['Avg Resolution Time', `${analytics.avgResolutionTimeMinutes} min`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Report exported');
  };

  const categoryData = analytics
    ? Object.entries(analytics.ticketsByCategory).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const priorityData = analytics
    ? Object.entries(analytics.ticketsByPriority).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const statusData = analytics
    ? Object.entries(analytics.ticketsByStatus).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  const agents = agentsData?.agents || [];
  const trends = trendsData?.trends || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Total Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.totalTickets}</div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.resolvedTickets}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(analytics.resolutionRate)}% resolution rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{analytics.pendingTickets}</div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{analytics.highPriorityTickets}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="distribution" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="kba">KB Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Tickets by Category</CardTitle>
                  <CardDescription>Distribution across issue types</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Tickets by Priority</CardTitle>
                  <CardDescription>Priority breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="border-border/40 bg-card/50 backdrop-blur lg:col-span-2">
                <CardHeader>
                  <CardTitle>Tickets by Status</CardTitle>
                  <CardDescription>Current status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statusData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Ticket Trends (30 Days)</CardTitle>
                <CardDescription>Created vs Resolved tickets over time</CardDescription>
              </CardHeader>
              <CardContent>
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="created"
                        stroke="#8b5cf6"
                        name="Created"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="resolved"
                        stroke="#10b981"
                        name="Resolved"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No trend data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Resolution rates and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {agents.length > 0 ? (
                  <div className="space-y-4">
                    {agents.map((agent: any) => (
                      <div key={agent.agentId} className="flex items-center justify-between p-4 border border-border/40 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{agent.agentId}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.resolved} / {agent.totalAssigned} resolved
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{Math.round(agent.resolutionRate)}%</div>
                          <p className="text-xs text-muted-foreground">
                            Avg: {agent.avgResolutionTimeMinutes} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No agent data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kba">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Knowledge Base Articles</CardTitle>
                <CardDescription>Top performing articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>KB analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
