import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Patient, Doctor } from '@/types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getUserByEmail, 
  createUser,
  initializeDemoData 
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isPatient: boolean;
  isDoctor: boolean;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  role: 'patient' | 'doctor';
  // Patient-specific
  dateOfBirth?: string;
  phoneNumber?: string;
  // Doctor-specific
  specialization?: string;
  licenseNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData();
    
    // Check for existing session
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Demo mode: Accept any password for demo accounts
    const existingUser = getUserByEmail(email);
    
    if (existingUser) {
      // In demo mode, we accept password "demo" for demo accounts
      // or any password for newly created accounts
      if (email.includes('demo.com') && password !== 'demo') {
        toast({
          title: 'Invalid credentials',
          description: 'For demo accounts, use password: demo',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }
      
      setUser(existingUser);
      setCurrentUser(existingUser);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${existingUser.name}`,
      });
      setIsLoading(false);
      return true;
    }
    
    toast({
      title: 'Account not found',
      description: 'Please check your email or sign up for a new account.',
      variant: 'destructive',
    });
    setIsLoading(false);
    return false;
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    if (getUserByEmail(data.email)) {
      toast({
        title: 'Account already exists',
        description: 'An account with this email already exists. Please log in.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
    
    // Create new user
    let newUser: User;
    
    if (data.role === 'patient') {
      newUser = createUser({
        email: data.email,
        name: data.name,
        role: 'patient',
        dateOfBirth: data.dateOfBirth,
        phoneNumber: data.phoneNumber,
        assignedDoctorId: 'demo-doctor-1', // Assign to demo doctor
      } as Omit<Patient, 'id' | 'createdAt'>);
    } else {
      newUser = createUser({
        email: data.email,
        name: data.name,
        role: 'doctor',
        specialization: data.specialization || 'General',
        licenseNumber: data.licenseNumber || 'PENDING',
      } as Omit<Doctor, 'id' | 'createdAt'>);
    }
    
    setUser(newUser);
    setCurrentUser(newUser);
    toast({
      title: 'Account created!',
      description: `Welcome to PD Monitor, ${newUser.name}`,
    });
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isPatient: user?.role === 'patient',
        isDoctor: user?.role === 'doctor',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
