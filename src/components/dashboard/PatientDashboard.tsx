import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTestSessionsByPatient, getAlertsByUser } from '@/lib/storage';
import { TestSession, Alert, PatientStats } from '@/types';
import { 
  Mic, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);

  useEffect(() => {
    if (user) {
      const sessions = getTestSessionsByPatient(user.id);
      setTestSessions(sessions);

      const userAlerts = getAlertsByUser(user.id, 'patient');
      setAlerts(userAlerts.filter(a => !a.read));

      // Calculate stats
      const thisMonth = sessions.filter(s => 
        new Date(s.recording.recordedAt) > subDays(new Date(), 30)
      );
      
      const avgRisk = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.prediction.probability, 0) / sessions.length
        : 0;

      // Determine trend
      let trend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (sessions.length >= 3) {
        const recent = sessions.slice(0, 3);
        const older = sessions.slice(3, 6);
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, s) => sum + s.prediction.probability, 0) / recent.length;
          const olderAvg = older.reduce((sum, s) => sum + s.prediction.probability, 0) / older.length;
          if (recentAvg < olderAvg - 0.05) trend = 'improving';
          else if (recentAvg > olderAvg + 0.05) trend = 'worsening';
        }
      }

      setStats({
        totalTests: sessions.length,
        lastTestDate: sessions[0]?.recording.recordedAt,
        averageRiskScore: avgRisk,
        riskTrend: trend,
        testsThisMonth: thisMonth.length,
      });
    }
  }, [user]);

  const latestPrediction = testSessions[0]?.prediction;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getTrendIcon = () => {
    switch (stats?.riskTrend) {
      case 'improving': return <TrendingDown className="h-5 w-5 text-success" />;
      case 'worsening': return <TrendingUp className="h-5 w-5 text-destructive" />;
      default: return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Prepare chart data
  const chartData = testSessions.slice(0, 10).reverse().map(session => ({
    date: format(new Date(session.recording.recordedAt), 'MMM d'),
    risk: Math.round(session.prediction.probability * 100),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Track your voice health and monitor for early signs
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/dashboard/record">
            <Mic className="h-5 w-5" />
            New Voice Test
          </Link>
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">You have {alerts.length} new alert(s)</p>
                <p className="text-sm text-muted-foreground">{alerts[0].message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalTests || 0}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.testsThisMonth || 0}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${latestPrediction?.riskLevel === 'high' ? 'bg-destructive/10' : latestPrediction?.riskLevel === 'medium' ? 'bg-warning/10' : 'bg-success/10'}`}>
                {latestPrediction?.riskLevel === 'low' ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <AlertTriangle className={`h-5 w-5 ${getRiskColor(latestPrediction?.riskLevel || 'low')}`} />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold capitalize ${getRiskColor(latestPrediction?.riskLevel || 'low')}`}>
                  {latestPrediction?.riskLevel || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Latest Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {getTrendIcon()}
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{stats?.riskTrend || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Trend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Tests */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Risk Score Trend</CardTitle>
            <CardDescription>Your risk scores over the last 10 tests</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Risk Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="risk" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Complete more tests to see your trend</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Recent Tests</CardTitle>
              <CardDescription>Your latest voice analysis results</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/history">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testSessions.slice(0, 5).map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      session.prediction.riskLevel === 'high' ? 'bg-destructive/10' :
                      session.prediction.riskLevel === 'medium' ? 'bg-warning/10' : 'bg-success/10'
                    }`}>
                      <Mic className={`h-4 w-4 ${getRiskColor(session.prediction.riskLevel)}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(session.recording.recordedAt), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duration: {session.recording.duration.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                  <Badge variant={getRiskBadgeVariant(session.prediction.riskLevel)}>
                    {Math.round(session.prediction.probability * 100)}% Risk
                  </Badge>
                </div>
              ))}
              {testSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tests yet. Start your first voice test!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Recommendation */}
      {latestPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Latest Recommendation</CardTitle>
            <CardDescription>
              Based on your most recent voice analysis from {format(new Date(latestPrediction.analyzedAt), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{latestPrediction.recommendation}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientDashboard;
