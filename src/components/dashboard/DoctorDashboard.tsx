import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  getPatientsByDoctor, 
  getTestSessionsByPatient, 
  getAlertsByUser 
} from '@/lib/storage';
import { Patient, TestSession, Alert, DoctorStats } from '@/types';
import { 
  Users, 
  AlertTriangle, 
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Eye
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSessions, setPatientSessions] = useState<Record<string, TestSession[]>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (user) {
      const doctorPatients = getPatientsByDoctor(user.id);
      setPatients(doctorPatients);

      // Get sessions for each patient
      const sessions: Record<string, TestSession[]> = {};
      let patientsAtRisk = 0;
      let totalRisk = 0;
      let testsToday = 0;
      const today = new Date().toDateString();

      doctorPatients.forEach(patient => {
        sessions[patient.id] = getTestSessionsByPatient(patient.id);
        
        const latestSession = sessions[patient.id][0];
        if (latestSession) {
          if (latestSession.prediction.riskLevel === 'high') {
            patientsAtRisk++;
          }
          totalRisk += latestSession.prediction.probability;

          if (new Date(latestSession.recording.recordedAt).toDateString() === today) {
            testsToday++;
          }
        }
      });

      setPatientSessions(sessions);

      const doctorAlerts = getAlertsByUser(user.id, 'doctor');
      setAlerts(doctorAlerts.filter(a => !a.read));

      setStats({
        totalPatients: doctorPatients.length,
        testsReviewedToday: testsToday,
        patientsAtRisk,
        averagePatientRisk: doctorPatients.length > 0 ? totalRisk / doctorPatients.length : 0,
      });
    }
  }, [user]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPatientRisk = (patientId: string) => {
    const sessions = patientSessions[patientId];
    if (!sessions || sessions.length === 0) return null;
    return sessions[0].prediction;
  };

  const getPatientTrend = (patientId: string) => {
    const sessions = patientSessions[patientId];
    if (!sessions || sessions.length < 3) return 'stable';
    
    const recent = sessions.slice(0, 3);
    const older = sessions.slice(3, 6);
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, s) => sum + s.prediction.probability, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.prediction.probability, 0) / older.length;
    
    if (recentAvg < olderAvg - 0.05) return 'improving';
    if (recentAvg > olderAvg + 0.05) return 'worsening';
    return 'stable';
  };

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
      case 'low': return 'default' as const;
      case 'medium': return 'secondary' as const;
      case 'high': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-4 w-4 text-success" />;
      case 'worsening': return <TrendingUp className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Prepare chart data for selected patient
  const selectedPatientChartData = selectedPatient 
    ? patientSessions[selectedPatient.id]?.slice(0, 10).reverse().map(session => ({
        date: format(new Date(session.recording.recordedAt), 'MMM d'),
        risk: Math.round(session.prediction.probability * 100),
      })) || []
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          Doctor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor your patients' voice analysis results
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">
                  {alerts.length} patient(s) require attention
                </p>
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
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalPatients || 0}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.patientsAtRisk || 0}</p>
                <p className="text-sm text-muted-foreground">At High Risk</p>
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
                <p className="text-2xl font-bold">{stats?.testsReviewedToday || 0}</p>
                <p className="text-sm text-muted-foreground">Tests Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? Math.round(stats.averagePatientRisk * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Avg. Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="font-display">Patient Overview</CardTitle>
              <CardDescription>View and monitor all assigned patients</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPatients.map((patient) => {
              const risk = getPatientRisk(patient.id);
              const trend = getPatientTrend(patient.id);
              const sessions = patientSessions[patient.id] || [];

              return (
                <div 
                  key={patient.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(patient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2">
                      {getTrendIcon(trend)}
                      <span className="text-sm text-muted-foreground capitalize">{trend}</span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{sessions.length} tests</p>
                      {risk && (
                        <Badge variant={getRiskBadgeVariant(risk.riskLevel)}>
                          {Math.round(risk.probability * 100)}% Risk
                        </Badge>
                      )}
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No patients found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedPatient.name)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedPatient.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedPatient.email} • {selectedPatient.phoneNumber || 'No phone'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Patient Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">
                      {patientSessions[selectedPatient.id]?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <p className={`text-2xl font-bold capitalize ${getRiskColor(getPatientRisk(selectedPatient.id)?.riskLevel || 'low')}`}>
                      {getPatientRisk(selectedPatient.id)?.riskLevel || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Latest Risk</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-center gap-2">
                      {getTrendIcon(getPatientTrend(selectedPatient.id))}
                      <p className="text-lg font-bold capitalize">
                        {getPatientTrend(selectedPatient.id)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">Trend</p>
                  </div>
                </div>

                {/* Risk Chart */}
                {selectedPatientChartData.length > 1 && (
                  <div>
                    <h4 className="font-medium mb-3">Risk Score History</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedPatientChartData}>
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
                  </div>
                )}

                {/* Latest Recommendation */}
                {getPatientRisk(selectedPatient.id) && (
                  <div>
                    <h4 className="font-medium mb-2">Latest Recommendation</h4>
                    <p className="text-sm text-muted-foreground">
                      {getPatientRisk(selectedPatient.id)?.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;
