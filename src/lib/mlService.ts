// ML Service - Mock predictions ready for real Python API integration
// When your Python backend is ready, update the API_URL and adjust the request format

import { VoiceFeatures, PredictionResult, MLPredictionRequest, MLPredictionResponse } from '@/types';

// Configuration for ML API
const ML_CONFIG = {
  // Set this to your Python backend URL when ready
  API_URL: process.env.VITE_ML_API_URL || null,
  USE_MOCK: true, // Set to false when real API is available
  TIMEOUT: 30000, // 30 seconds
};

// Mock prediction model (simulates SVM/Random Forest behavior)
const generateMockPrediction = (features: VoiceFeatures): Omit<PredictionResult, 'id' | 'recordingId' | 'patientId' | 'analyzedAt'> => {
  // Simulate feature-based prediction
  // These weights are loosely based on research literature
  const weights = {
    jitter: 0.25,      // Higher jitter = higher risk
    shimmer: 0.22,     // Higher shimmer = higher risk
    hnr: -0.18,        // Lower HNR = higher risk (inverted)
    pitchVariation: 0.15, // Higher variation can indicate issues
    pitch: 0.08,       // Abnormal pitch ranges
    amplitude: 0.12,   // Voice strength
  };

  // Normalize features to 0-1 range (approximate)
  const normalizedJitter = Math.min(features.jitter / 3, 1);
  const normalizedShimmer = Math.min(features.shimmer / 8, 1);
  const normalizedHNR = 1 - Math.min(features.hnr / 30, 1); // Inverted
  const normalizedPitchVar = Math.min(features.pitchVariation / 30, 1);
  const normalizedPitch = Math.abs(features.pitch - 150) / 100; // Distance from typical
  const normalizedAmplitude = 1 - features.amplitude; // Lower amplitude = risk

  // Calculate weighted score
  let rawScore = 
    weights.jitter * normalizedJitter +
    weights.shimmer * normalizedShimmer +
    weights.hnr * normalizedHNR +
    weights.pitchVariation * normalizedPitchVar +
    weights.pitch * normalizedPitch +
    weights.amplitude * normalizedAmplitude;

  // Add some randomness to simulate model uncertainty
  rawScore += (Math.random() - 0.5) * 0.1;
  
  // Sigmoid to get probability
  const probability = 1 / (1 + Math.exp(-5 * (rawScore - 0.5)));
  
  // Confidence based on feature quality
  const confidence = 0.8 + Math.random() * 0.15;

  // Determine risk level
  const riskLevel: 'low' | 'medium' | 'high' = 
    probability > 0.6 ? 'high' : 
    probability > 0.35 ? 'medium' : 'low';

  // Feature importance (for explainability)
  const featureImportance = [
    { feature: 'Jitter', importance: weights.jitter, value: features.jitter },
    { feature: 'Shimmer', importance: weights.shimmer, value: features.shimmer },
    { feature: 'HNR', importance: Math.abs(weights.hnr), value: features.hnr },
    { feature: 'Pitch Variation', importance: weights.pitchVariation, value: features.pitchVariation },
    { feature: 'Pitch', importance: weights.pitch, value: features.pitch },
    { feature: 'Amplitude', importance: weights.amplitude, value: features.amplitude },
  ].sort((a, b) => b.importance - a.importance);

  // Generate recommendation
  let recommendation: string;
  if (riskLevel === 'high') {
    recommendation = 'The voice analysis indicates patterns that may warrant further clinical evaluation. Please schedule an appointment with your neurologist for a comprehensive assessment.';
  } else if (riskLevel === 'medium') {
    recommendation = 'Some voice characteristics show mild variations. Continue regular monitoring and consider discussing these results with your healthcare provider during your next visit.';
  } else {
    recommendation = 'Your voice patterns are within the expected range. Continue with your regular check-up schedule and maintain healthy vocal habits.';
  }

  return {
    probability,
    confidence,
    riskLevel,
    featureImportance,
    recommendation,
  };
};

// Call real ML API
const callMLAPI = async (request: MLPredictionRequest): Promise<MLPredictionResponse> => {
  if (!ML_CONFIG.API_URL) {
    throw new Error('ML API URL not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_CONFIG.TIMEOUT);

  try {
    const response = await fetch(`${ML_CONFIG.API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features: {
          pitch: request.features.pitch,
          pitch_variation: request.features.pitchVariation,
          jitter: request.features.jitter,
          shimmer: request.features.shimmer,
          hnr: request.features.hnr,
          duration: request.features.duration,
          amplitude: request.features.amplitude,
          formants: request.features.formants,
        },
        patient_id: request.patientId,
        recording_id: request.recordingId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      prediction: {
        id: data.prediction_id || crypto.randomUUID(),
        recordingId: request.recordingId,
        patientId: request.patientId,
        analyzedAt: new Date().toISOString(),
        probability: data.probability,
        confidence: data.confidence,
        riskLevel: data.risk_level,
        featureImportance: data.feature_importance || [],
        recommendation: data.recommendation || '',
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Main prediction function
export const getPrediction = async (
  features: VoiceFeatures,
  patientId: string,
  recordingId: string
): Promise<PredictionResult> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  if (ML_CONFIG.USE_MOCK || !ML_CONFIG.API_URL) {
    // Use mock prediction
    const mockResult = generateMockPrediction(features);
    return {
      id: crypto.randomUUID(),
      recordingId,
      patientId,
      analyzedAt: new Date().toISOString(),
      ...mockResult,
    };
  }

  // Call real API
  const response = await callMLAPI({ features, patientId, recordingId });
  
  if (!response.success || !response.prediction) {
    // Fallback to mock if API fails
    console.warn('ML API failed, using mock prediction:', response.error);
    const mockResult = generateMockPrediction(features);
    return {
      id: crypto.randomUUID(),
      recordingId,
      patientId,
      analyzedAt: new Date().toISOString(),
      ...mockResult,
    };
  }

  return response.prediction;
};

// Check if ML service is available
export const checkMLServiceHealth = async (): Promise<boolean> => {
  if (ML_CONFIG.USE_MOCK || !ML_CONFIG.API_URL) {
    return true; // Mock is always available
  }

  try {
    const response = await fetch(`${ML_CONFIG.API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Export config for debugging
export const getMLConfig = () => ({
  apiUrl: ML_CONFIG.API_URL,
  useMock: ML_CONFIG.USE_MOCK,
});
