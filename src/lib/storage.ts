// Local Storage Management for Demo Mode
// This will be replaced with Supabase/Cloud when backend is enabled

import { User, Patient, Doctor, TestSession, Alert } from '@/types';

const STORAGE_KEYS = {
  CURRENT_USER: 'pd_current_user',
  USERS: 'pd_users',
  TEST_SESSIONS: 'pd_test_sessions',
  ALERTS: 'pd_alerts',
} as const;

// Helper functions
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// User Management
export const getCurrentUser = (): User | null => {
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
};

export const setCurrentUser = (user: User | null): void => {
  setItem(STORAGE_KEYS.CURRENT_USER, user);
};

export const getAllUsers = (): User[] => {
  return getItem<User[]>(STORAGE_KEYS.USERS, []);
};

export const getUserById = (id: string): User | undefined => {
  return getAllUsers().find(u => u.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getAllUsers();
  const newUser: User = {
    ...userData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  setItem(STORAGE_KEYS.USERS, users);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates };
  setItem(STORAGE_KEYS.USERS, users);
  return users[index];
};

// Patient-specific functions
export const getPatients = (): Patient[] => {
  return getAllUsers().filter(u => u.role === 'patient') as Patient[];
};

export const getPatientsByDoctor = (doctorId: string): Patient[] => {
  return getPatients().filter(p => p.assignedDoctorId === doctorId);
};

// Doctor-specific functions
export const getDoctors = (): Doctor[] => {
  return getAllUsers().filter(u => u.role === 'doctor') as Doctor[];
};

// Test Sessions
export const getTestSessions = (): TestSession[] => {
  return getItem<TestSession[]>(STORAGE_KEYS.TEST_SESSIONS, []);
};

export const getTestSessionsByPatient = (patientId: string): TestSession[] => {
  return getTestSessions()
    .filter(s => s.patientId === patientId)
    .sort((a, b) => new Date(b.recording.recordedAt).getTime() - new Date(a.recording.recordedAt).getTime());
};

export const createTestSession = (session: Omit<TestSession, 'id'>): TestSession => {
  const sessions = getTestSessions();
  const newSession: TestSession = {
    ...session,
    id: crypto.randomUUID(),
  };
  sessions.push(newSession);
  setItem(STORAGE_KEYS.TEST_SESSIONS, sessions);
  return newSession;
};

export const updateTestSession = (id: string, updates: Partial<TestSession>): TestSession | null => {
  const sessions = getTestSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  sessions[index] = { ...sessions[index], ...updates };
  setItem(STORAGE_KEYS.TEST_SESSIONS, sessions);
  return sessions[index];
};

// Alerts
export const getAlerts = (): Alert[] => {
  return getItem<Alert[]>(STORAGE_KEYS.ALERTS, []);
};

export const getAlertsByUser = (userId: string, role: 'patient' | 'doctor'): Alert[] => {
  const alerts = getAlerts();
  if (role === 'patient') {
    return alerts.filter(a => a.patientId === userId);
  }
  // Doctors see all alerts for their patients
  const patientIds = getPatientsByDoctor(userId).map(p => p.id);
  return alerts.filter(a => a.patientId && patientIds.includes(a.patientId));
};

export const createAlert = (alert: Omit<Alert, 'id' | 'createdAt' | 'read'>): Alert => {
  const alerts = getAlerts();
  const newAlert: Alert = {
    ...alert,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  alerts.push(newAlert);
  setItem(STORAGE_KEYS.ALERTS, alerts);
  return newAlert;
};

export const markAlertAsRead = (id: string): void => {
  const alerts = getAlerts();
  const index = alerts.findIndex(a => a.id === id);
  if (index !== -1) {
    alerts[index].read = true;
    setItem(STORAGE_KEYS.ALERTS, alerts);
  }
};

// Initialize demo data
export const initializeDemoData = (): void => {
  const users = getAllUsers();
  if (users.length > 0) return; // Already initialized

  // Create demo doctor
  const demoDoctor: Doctor = {
    id: 'demo-doctor-1',
    email: 'doctor@demo.com',
    name: 'Dr. Sarah Mitchell',
    role: 'doctor',
    createdAt: new Date().toISOString(),
    specialization: 'Neurology',
    licenseNumber: 'MD-12345',
    department: 'Movement Disorders',
  };

  // Create demo patients
  const demoPatients: Patient[] = [
    {
      id: 'demo-patient-1',
      email: 'patient@demo.com',
      name: 'John Anderson',
      role: 'patient',
      createdAt: new Date().toISOString(),
      dateOfBirth: '1958-03-15',
      assignedDoctorId: 'demo-doctor-1',
      phoneNumber: '+1 (555) 123-4567',
    },
    {
      id: 'demo-patient-2',
      email: 'mary@demo.com',
      name: 'Mary Johnson',
      role: 'patient',
      createdAt: new Date().toISOString(),
      dateOfBirth: '1962-07-22',
      assignedDoctorId: 'demo-doctor-1',
      phoneNumber: '+1 (555) 234-5678',
    },
    {
      id: 'demo-patient-3',
      email: 'robert@demo.com',
      name: 'Robert Williams',
      role: 'patient',
      createdAt: new Date().toISOString(),
      dateOfBirth: '1955-11-08',
      assignedDoctorId: 'demo-doctor-1',
      phoneNumber: '+1 (555) 345-6789',
    },
  ];

  setItem(STORAGE_KEYS.USERS, [demoDoctor, ...demoPatients]);

  // Create some demo test sessions with historical data
  const demoSessions: TestSession[] = [];
  
  demoPatients.forEach((patient, patientIndex) => {
    // Generate 5 test sessions per patient over the last month
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7 + patientIndex * 2));
      
      const baseRisk = patientIndex === 2 ? 0.7 : patientIndex === 1 ? 0.45 : 0.25;
      const riskVariation = (Math.random() - 0.5) * 0.15;
      const probability = Math.max(0, Math.min(1, baseRisk + riskVariation - (i * 0.02)));
      
      const session: TestSession = {
        id: `demo-session-${patient.id}-${i}`,
        patientId: patient.id,
        recording: {
          id: `demo-recording-${patient.id}-${i}`,
          patientId: patient.id,
          recordedAt: date.toISOString(),
          duration: 5 + Math.random() * 3,
          features: {
            pitch: 120 + Math.random() * 60,
            pitchVariation: 10 + Math.random() * 15,
            jitter: 0.5 + Math.random() * 1.5,
            shimmer: 2 + Math.random() * 4,
            hnr: 15 + Math.random() * 10,
            duration: 5 + Math.random() * 3,
            amplitude: 0.3 + Math.random() * 0.4,
            formants: [500 + Math.random() * 200, 1500 + Math.random() * 300, 2500 + Math.random() * 400],
          },
          status: 'analyzed',
        },
        prediction: {
          id: `demo-prediction-${patient.id}-${i}`,
          recordingId: `demo-recording-${patient.id}-${i}`,
          patientId: patient.id,
          analyzedAt: date.toISOString(),
          probability,
          confidence: 0.85 + Math.random() * 0.1,
          riskLevel: probability > 0.6 ? 'high' : probability > 0.35 ? 'medium' : 'low',
          featureImportance: [
            { feature: 'Jitter', importance: 0.25, value: 0.5 + Math.random() },
            { feature: 'Shimmer', importance: 0.22, value: 2 + Math.random() * 2 },
            { feature: 'HNR', importance: 0.18, value: 15 + Math.random() * 5 },
            { feature: 'Pitch Variation', importance: 0.15, value: 10 + Math.random() * 10 },
            { feature: 'Pitch', importance: 0.12, value: 130 + Math.random() * 30 },
          ],
          recommendation: probability > 0.6 
            ? 'Schedule a follow-up appointment with your neurologist for further evaluation.'
            : probability > 0.35
            ? 'Continue regular monitoring. Consider increasing test frequency.'
            : 'Voice patterns are within normal range. Continue regular check-ups.',
        },
        reviewedByDoctor: i > 0,
      };
      
      demoSessions.push(session);
    }
  });

  setItem(STORAGE_KEYS.TEST_SESSIONS, demoSessions);

  // Create some alerts
  const demoAlerts: Alert[] = [
    {
      id: 'demo-alert-1',
      type: 'warning',
      title: 'Elevated Risk Detected',
      message: 'Robert Williams showed elevated risk indicators in the latest voice analysis.',
      createdAt: new Date().toISOString(),
      read: false,
      patientId: 'demo-patient-3',
    },
    {
      id: 'demo-alert-2',
      type: 'info',
      title: 'Weekly Summary Available',
      message: 'Your weekly health summary is ready to view.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      patientId: 'demo-patient-1',
    },
  ];

  setItem(STORAGE_KEYS.ALERTS, demoAlerts);
};

// Clear all data (for testing)
export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};
