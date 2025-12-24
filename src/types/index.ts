// User and Authentication Types
export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  profileImage?: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth?: string;
  assignedDoctorId?: string;
  medicalHistory?: string;
  phoneNumber?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization: string;
  licenseNumber: string;
  department?: string;
}

// Voice Recording and Analysis Types
export interface VoiceFeatures {
  pitch: number;           // Fundamental frequency (F0) in Hz
  pitchVariation: number;  // Standard deviation of pitch
  jitter: number;          // Frequency variation (%)
  shimmer: number;         // Amplitude variation (%)
  hnr: number;             // Harmonics-to-Noise Ratio (dB)
  duration: number;        // Recording duration in seconds
  amplitude: number;       // Average amplitude
  formants: number[];      // Formant frequencies
}

export interface VoiceRecording {
  id: string;
  patientId: string;
  recordedAt: string;
  duration: number;
  audioData?: string;      // Base64 encoded audio (for demo)
  features: VoiceFeatures;
  status: 'pending' | 'analyzed' | 'error';
}

// ML Prediction Types
export interface PredictionResult {
  id: string;
  recordingId: string;
  patientId: string;
  analyzedAt: string;
  
  // Prediction scores
  probability: number;     // 0-1 probability of Parkinson's
  confidence: number;      // Model confidence (0-1)
  riskLevel: 'low' | 'medium' | 'high';
  
  // Feature importance (for explainability)
  featureImportance: {
    feature: string;
    importance: number;
    value: number;
  }[];
  
  // Recommendation
  recommendation: string;
}

// Test History
export interface TestSession {
  id: string;
  patientId: string;
  recording: VoiceRecording;
  prediction: PredictionResult;
  completedAt: string;
  notes?: string;
  reviewedByDoctor?: boolean;
  doctorNotes?: string;
}

// Dashboard Statistics
export interface PatientStats {
  totalTests: number;
  lastTestDate?: string;
  averageRiskScore: number;
  riskTrend: 'improving' | 'stable' | 'worsening';
  testsThisMonth: number;
}

export interface DoctorStats {
  totalPatients: number;
  testsReviewedToday: number;
  patientsAtRisk: number;
  averagePatientRisk: number;
}

// Alert Types
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  patientId?: string;
  testSessionId?: string;
}

// API Response Types (for future ML backend integration)
export interface MLPredictionRequest {
  features: VoiceFeatures;
  patientId: string;
  recordingId: string;
}

export interface MLPredictionResponse {
  success: boolean;
  prediction?: PredictionResult;
  error?: string;
}
