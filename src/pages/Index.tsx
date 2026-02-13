import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Mic, LineChart, Shield, Brain, Users, ArrowRight, CheckCircle } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Mic,
      title: 'Voice Analysis',
      description: 'Record voice samples and extract clinical-grade audio features using advanced DSP algorithms.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Detection',
      description: 'Machine learning models (SVM & Random Forest) analyze voice patterns for early Parkinson\'s indicators.',
    },
    {
      icon: LineChart,
      title: 'Progress Tracking',
      description: 'Monitor trends over time with detailed charts and historical comparisons.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with healthcare-grade security standards.',
    },
  ];

  const benefits = [
    'Non-invasive voice-based screening',
    'Early detection capabilities',
    'Real-time analysis results',
    'Doctor dashboard for remote monitoring',
    'Trend analysis over time',
    'Email alerts for critical findings',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display font-bold text-xl">PD Monitor</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Activity className="h-4 w-4" />
            AI-Powered Health Monitoring
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Early Detection of{' '}
            <span className="text-primary">Parkinson's Disease</span>{' '}
            Through Voice Analysis
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A non-invasive, AI-powered system that analyzes voice patterns to detect early indicators of Parkinson's Disease. Monitor your health from anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/auth">
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/auth">
                <Users className="mr-2 h-5 w-5" />
                Doctor Portal
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our system uses advanced digital signal processing and machine learning to analyze voice characteristics associated with Parkinson's Disease.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="medical-card border-0 shadow-sm">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold mb-6">
                Comprehensive Health Monitoring
              </h2>
              <p className="text-muted-foreground mb-8">
                Our platform provides both patients and healthcare providers with powerful tools for continuous monitoring and early intervention.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <Card className="p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-success/10">
                    <div className="p-2 rounded-full bg-success/20">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Low Risk</p>
                      <p className="text-sm text-muted-foreground">Voice patterns within normal range</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-warning/10">
                    <div className="p-2 rounded-full bg-warning/20">
                      <Activity className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">Medium Risk</p>
                      <p className="text-sm text-muted-foreground">Some variations detected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-destructive/10">
                    <div className="p-2 rounded-full bg-destructive/20">
                      <Shield className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">High Risk</p>
                      <p className="text-sm text-muted-foreground">Consult healthcare provider</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of patients and healthcare providers using PD Monitor for early detection and continuous monitoring.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8">
            <Link to="/auth">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">PD Monitor</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Hema PD Monitor. For educational and research purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
