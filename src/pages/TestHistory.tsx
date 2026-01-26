import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getTestSessionsByPatient } from '@/lib/storage';
import { generateTestReportPDF } from '@/lib/pdfGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle, FileDown } from 'lucide-react';
import { TestSession } from '@/types';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const TestHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);

  const sessions = useMemo(() => {
    if (!user) return [];
    return getTestSessionsByPatient(user.id).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [user]);

  const chartData = useMemo(() => {
    return sessions
      .slice()
      .reverse()
      .map((session) => ({
        date: format(new Date(session.completedAt), 'MMM d'),
        risk: Math.round(session.prediction.probability * 100),
        jitter: session.recording.features.jitter,
        shimmer: session.recording.features.shimmer,
        hnr: session.recording.features.hnr,
      }));
  }, [sessions]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge className="bg-success text-success-foreground">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      default:
        return null;
    }
  };

  const getFeatureStatus = (feature: string, value: number) => {
    const thresholds: Record<string, { healthy: number; warning: number; inverted?: boolean }> = {
      jitter: { healthy: 1.04, warning: 1.5 },
      shimmer: { healthy: 3.81, warning: 5.0 },
      hnr: { healthy: 20, warning: 15, inverted: true },
      pitchVariation: { healthy: 15, warning: 8, inverted: true },
    };

    const t = thresholds[feature];
    if (!t) return { status: 'normal', icon: CheckCircle, color: 'text-success' };

    if (t.inverted) {
      if (value >= t.healthy) return { status: 'Normal', icon: CheckCircle, color: 'text-success' };
      if (value >= t.warning) return { status: 'Borderline', icon: Minus, color: 'text-warning' };
      return { status: 'Abnormal', icon: XCircle, color: 'text-destructive' };
    } else {
      if (value <= t.healthy) return { status: 'Normal', icon: CheckCircle, color: 'text-success' };
      if (value <= t.warning) return { status: 'Borderline', icon: Minus, color: 'text-warning' };
      return { status: 'Abnormal', icon: XCircle, color: 'text-destructive' };
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-display font-bold">Test History</h1>
        <p className="text-muted-foreground">View all your voice analysis results over time</p>
      </div>

      {/* Trend Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Trend Over Time</CardTitle>
            <CardDescription>Track how your voice metrics change</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="risk" stroke="hsl(var(--primary))" strokeWidth={2} name="Risk %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test List */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">All Tests ({sessions.length})</h2>
        
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tests recorded yet.</p>
              <Button className="mt-4" onClick={() => navigate('/dashboard/record')}>
                Take Your First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card 
              key={session.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedSession(session)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      session.prediction.riskLevel === 'low' ? 'bg-success/10' : 
                      session.prediction.riskLevel === 'medium' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      {session.prediction.riskLevel === 'low' ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : session.prediction.riskLevel === 'medium' ? (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(session.completedAt), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.completedAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{Math.round(session.prediction.probability * 100)}%</p>
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                    </div>
                    {getRiskBadge(session.prediction.riskLevel)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              Test Details - {selectedSession && format(new Date(selectedSession.completedAt), 'MMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              {/* Risk Summary */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div className="text-center">
                  <p className="text-4xl font-bold">{Math.round(selectedSession.prediction.probability * 100)}%</p>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                </div>
                <div className="flex-1">
                  {getRiskBadge(selectedSession.prediction.riskLevel)}
                  <p className="text-sm text-muted-foreground mt-2">
                    Confidence: {Math.round(selectedSession.prediction.confidence * 100)}%
                  </p>
                </div>
              </div>

              {/* Feature Breakdown */}
              <div>
                <h3 className="font-semibold mb-3">Feature-by-Feature Analysis</h3>
                <div className="space-y-3">
                  {[
                    { key: 'jitter', label: 'Jitter', value: selectedSession.recording.features.jitter, unit: '%', desc: 'Frequency variation (healthy < 1.04%)' },
                    { key: 'shimmer', label: 'Shimmer', value: selectedSession.recording.features.shimmer, unit: '%', desc: 'Amplitude variation (healthy < 3.81%)' },
                    { key: 'hnr', label: 'HNR', value: selectedSession.recording.features.hnr, unit: 'dB', desc: 'Harmonics-to-Noise Ratio (healthy > 20dB)' },
                    { key: 'pitchVariation', label: 'Pitch Variation', value: selectedSession.recording.features.pitchVariation, unit: 'Hz', desc: 'Voice pitch stability (healthy > 15Hz)' },
                  ].map((feature) => {
                    const status = getFeatureStatus(feature.key, feature.value);
                    const Icon = status.icon;
                    return (
                      <div key={feature.key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${status.color}`} />
                            <span className="font-medium">{feature.label}</span>
                            <Badge variant="outline" className={status.color}>
                              {status.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{feature.value.toFixed(2)}{feature.unit}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Features */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Pitch</p>
                  <p className="text-lg font-semibold">{selectedSession.recording.features.pitch.toFixed(1)} Hz</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">{selectedSession.recording.features.duration.toFixed(1)}s</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 rounded-lg border-l-4 border-primary bg-primary/5">
                <h4 className="font-medium mb-2">Recommendation</h4>
                <p className="text-sm text-muted-foreground">{selectedSession.prediction.recommendation}</p>
              </div>

              {/* Download PDF Button */}
              <DialogFooter>
                <Button 
                  onClick={() => {
                    if (user && selectedSession) {
                      generateTestReportPDF(selectedSession, user);
                      toast({ title: 'Report Downloaded', description: 'Your PDF report has been generated.' });
                    }
                  }}
                  className="w-full gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Download PDF Report
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestHistory;