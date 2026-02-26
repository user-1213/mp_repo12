'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        router.push('/dashboard/admin');
      } else if (userRole === 'agent') {
        router.push('/dashboard/agent');
      } else {
        router.push('/dashboard/employee');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">ITSupport Pro</h1>
          </div>
          <div className="flex gap-4">
            {!isLoggedIn ? (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => router.push('/register')}>
                  Get Started
                </Button>
              </>
            ) : (
              <Button onClick={handleGetStarted} className="gap-2">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge className="mb-4" variant="outline">
            Powered by OpenAI & Advanced ML
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl mb-6 text-balance">
            Intelligent IT Support for Modern Teams
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Automated ticket classification, semantic search, and AI-powered recommendations. Resolve issues faster with intelligent routing and comprehensive analytics.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted}>
              {isLoggedIn ? 'Open Dashboard' : 'Get Started Free'}
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold mb-12 text-center text-foreground">Why Choose ITSupport Pro?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-4" />
              <CardTitle>AI-Powered Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Automatically categorize and prioritize tickets using advanced NLP and machine learning models.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Intelligent Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Smart agent assignment based on expertise, workload, and historical performance metrics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Real-Time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Comprehensive dashboards with performance metrics, trends, and actionable insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Semantic search powered by OpenAI embeddings for instant resolutions and self-service support.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-primary mb-4" />
              <CardTitle>SLA Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Automated SLA tracking, alerts, and escalation policies for compliance and accountability.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Real-time updates, team notes, and collaborative ticket management with WebSocket integration.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-primary/20 bg-primary/5 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Transform Your Support?</CardTitle>
            <CardDescription className="text-lg mt-2">
              Join hundreds of teams already using ITSupport Pro to resolve tickets 3x faster.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" onClick={handleGetStarted}>
              Start Your Free Trial Today
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2024 ITSupport Pro. All rights reserved. | Powered by OpenAI</p>
      </footer>
    </div>
  );
}
