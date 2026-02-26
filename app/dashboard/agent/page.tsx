'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Zap, LogOut, AlertCircle, Clock, CheckCircle, Brain } from 'lucide-react';
import useSWR from 'swr';

interface Ticket {
  _id: string;
  conversationId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  confidence: number;
  suggestedResolution?: string;
  relatedArticles: Array<{ content: string; similarity: number }>;
  createdAt: string;
  email: string;
  notes: Array<{ content: string; createdAt: string; agentId: string }>;
}

const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());
};

export default function AgentDashboard() {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';

  const { data: ticketsData, mutate } = useSWR(
    token ? '/api/tickets?status=Pending' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId: userEmail }),
      });

      if (response.ok) {
        toast.success('Ticket assigned to you');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Ticket marked as ${status}`);
        mutate();
        setSelectedTicket(null);
      }
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const handleAddNote = async (ticketId: string) => {
    if (!noteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: noteContent,
          agentId: userEmail,
        }),
      });

      if (response.ok) {
        toast.success('Note added');
        setNoteContent('');
        mutate();
        if (selectedTicket) {
          setSelectedTicket(response.json());
        }
      }
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  const tickets = ticketsData?.tickets || [];
  const highPriority = tickets.filter((t: Ticket) => ['critical', 'high'].includes(t.priority)).sort((a: Ticket, b: Ticket) => b.confidence - a.confidence);
  const medium = tickets.filter((t: Ticket) => t.priority === 'medium');
  const low = tickets.filter((t: Ticket) => t.priority === 'low');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.6) return 'text-blue-500';
    return 'text-yellow-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">Support Agent Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/50 backdrop-blur border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{highPriority.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{medium.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{low.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Queue */}
        <Tabs defaultValue="high" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="high" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Critical
            </TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="low">Low</TabsTrigger>
          </TabsList>

          <TabsContent value="high" className="space-y-4">
            {highPriority.length === 0 ? (
              <Card className="border-border/40 bg-card/50 backdrop-blur text-center py-12">
                <p className="text-muted-foreground">No critical tickets</p>
              </Card>
            ) : (
              highPriority.map((ticket: Ticket) => (
                <Card key={ticket._id} className="border-border/40 bg-card/50 backdrop-blur hover:bg-card/70 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <div className={`flex items-center gap-1 text-sm font-medium ${getConfidenceColor(ticket.confidence)}`}>
                            <Brain className="h-4 w-4" />
                            {Math.round(ticket.confidence * 100)}%
                          </div>
                        </div>
                        <CardDescription>{ticket.conversationId}</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          handleAssignToMe(ticket._id);
                        }}
                      >
                        Take Ticket
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{ticket.description}</p>
                    {ticket.suggestedResolution && (
                      <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium text-primary mb-1">AI Suggestion:</p>
                        <p className="text-sm">{ticket.suggestedResolution}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="medium" className="space-y-4">
            {medium.length === 0 ? (
              <Card className="border-border/40 bg-card/50 backdrop-blur text-center py-12">
                <p className="text-muted-foreground">No medium priority tickets</p>
              </Card>
            ) : (
              medium.map((ticket: Ticket) => (
                <Card key={ticket._id} className="border-border/40 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <CardDescription>{ticket.conversationId}</CardDescription>
                      </div>
                      <Badge variant="default">Medium</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{ticket.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="low" className="space-y-4">
            {low.length === 0 ? (
              <Card className="border-border/40 bg-card/50 backdrop-blur text-center py-12">
                <p className="text-muted-foreground">No low priority tickets</p>
              </Card>
            ) : (
              low.map((ticket: Ticket) => (
                <Card key={ticket._id} className="border-border/40 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <CardDescription>{ticket.conversationId}</CardDescription>
                      </div>
                      <Badge variant="outline">Low</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{ticket.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Details Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
                <DialogDescription>{selectedTicket.conversationId}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Badge variant={getPriorityColor(selectedTicket.priority)} className="mt-1">
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant="outline" className="mt-1">{selectedTicket.status}</Badge>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label>Issue Description</Label>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedTicket.description}</p>
                </div>

                {/* AI Suggestions */}
                {selectedTicket.suggestedResolution && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-primary mb-2">AI-Suggested Resolution:</p>
                    <p className="text-sm">{selectedTicket.suggestedResolution}</p>
                  </div>
                )}

                {/* Related Articles */}
                {selectedTicket.relatedArticles.length > 0 && (
                  <div>
                    <Label>Related Knowledge Base Articles</Label>
                    <div className="mt-2 space-y-2">
                      {selectedTicket.relatedArticles.map((article, i) => (
                        <div key={i} className="p-2 bg-card/50 rounded border border-border/40">
                          <p className="text-sm">{article.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Similarity: {Math.round(article.similarity * 100)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {selectedTicket.notes.map((note, i) => (
                      <div key={i} className="p-2 bg-card/50 rounded border border-border/40">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{note.agentId}</p>
                      </div>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Add a note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusChange(selectedTicket._id, 'In Progress')}
                    disabled={selectedTicket.status === 'In Progress'}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(selectedTicket._id, 'Resolved')}
                    variant="default"
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    onClick={() => handleAddNote(selectedTicket._id)}
                    disabled={!noteContent.trim() || isSubmitting}
                    variant="outline"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
