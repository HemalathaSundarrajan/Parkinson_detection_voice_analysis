import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, User, Stethoscope, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<'patient' | 'doctor'>('patient');
  const [signupDateOfBirth, setSignupDateOfBirth] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupSpecialization, setSignupSpecialization] = useState('');
  const [signupLicense, setSignupLicense] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginEmail, loginPassword);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signup({
      email: signupEmail,
      password: signupPassword,
      name: signupName,
      role: signupRole,
      dateOfBirth: signupRole === 'patient' ? signupDateOfBirth : undefined,
      phoneNumber: signupRole === 'patient' ? signupPhone : undefined,
      specialization: signupRole === 'doctor' ? signupSpecialization : undefined,
      licenseNumber: signupRole === 'doctor' ? signupLicense : undefined,
    });
    if (success) {
      navigate('/dashboard');
    }
  };

  const fillDemoCredentials = (role: 'patient' | 'doctor') => {
    if (role === 'patient') {
      setLoginEmail('patient@demo.com');
    } else {
      setLoginEmail('doctor@demo.com');
    }
    setLoginPassword('demo');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-display font-semibold text-lg">PD Monitor</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Welcome to PD Monitor</CardTitle>
            <CardDescription>
              AI-Powered Parkinson's Disease Detection & Monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                {/* Demo Accounts */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    Try demo accounts (password: demo)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => fillDemoCredentials('patient')}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Patient
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => fillDemoCredentials('doctor')}
                    >
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Doctor
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a</Label>
                    <Select value={signupRole} onValueChange={(v) => setSignupRole(v as 'patient' | 'doctor')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Patient
                          </div>
                        </SelectItem>
                        <SelectItem value="doctor">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            Doctor
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Patient-specific fields */}
                  {signupRole === 'patient' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-dob">Date of Birth</Label>
                        <Input
                          id="signup-dob"
                          type="date"
                          value={signupDateOfBirth}
                          onChange={(e) => setSignupDateOfBirth(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Phone Number</Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Doctor-specific fields */}
                  {signupRole === 'doctor' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-specialization">Specialization</Label>
                        <Input
                          id="signup-specialization"
                          type="text"
                          placeholder="Neurology"
                          value={signupSpecialization}
                          onChange={(e) => setSignupSpecialization(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-license">Medical License Number</Label>
                        <Input
                          id="signup-license"
                          type="text"
                          placeholder="MD-12345"
                          value={signupLicense}
                          onChange={(e) => setSignupLicense(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
