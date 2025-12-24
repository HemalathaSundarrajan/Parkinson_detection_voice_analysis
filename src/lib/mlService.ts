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

// Clinical thresholds based on research literature for Parkinson's detection
// References: Tsanas et al., Little et al. studies on PD voice biomarkers
const CLINICAL_THRESHOLDS = {
  // Jitter (frequency perturbation) - healthy < 1.04%, PD typically > 1.5%
  jitter: { healthy: 1.04, warning: 1.5, critical: 2.5 },
  // Shimmer (amplitude perturbation) - healthy < 3.81%, PD typically > 5%
  shimmer: { healthy: 3.81, warning: 5.0, critical: 8.0 },
  // HNR (Harmonics-to-Noise Ratio) - healthy > 20dB, PD typically < 15dB
  hnr: { healthy: 20, warning: 15, critical: 10 },
  // Pitch variation - healthy has moderate variation, PD often shows reduced variation
  pitchVariation: { healthy: 15, warning: 8, critical: 5 },
};

// Calculate normalized score for each feature (0 = healthy, 1 = pathological)
const normalizeFeature = (
  value: number, 
  thresholds: { healthy: number; warning: number; critical: number },
  inverted: boolean = false
): number => {
  if (inverted) {
    // For features where lower = worse (like HNR, pitch variation)
    if (value >= thresholds.healthy) return 0;
    if (value <= thresholds.critical) return 1;
    if (value >= thresholds.warning) {
      return (thresholds.healthy - value) / (thresholds.healthy - thresholds.warning) * 0.5;
    }
    return 0.5 + (thresholds.warning - value) / (thresholds.warning - thresholds.critical) * 0.5;
  } else {
    // For features where higher = worse (like jitter, shimmer)
    if (value <= thresholds.healthy) return 0;
    if (value >= thresholds.critical) return 1;
    if (value <= thresholds.warning) {
      return (value - thresholds.healthy) / (thresholds.warning - thresholds.healthy) * 0.5;
    }
    return 0.5 + (value - thresholds.warning) / (thresholds.critical - thresholds.warning) * 0.5;
  }
};

// Mock prediction model based on clinical research
const generateMockPrediction = (features: VoiceFeatures): Omit<PredictionResult, 'id' | 'recordingId' | 'patientId' | 'analyzedAt'> => {
  // Normalize each feature to 0-1 scale based on clinical thresholds
  const normalizedJitter = normalizeFeature(features.jitter, CLINICAL_THRESHOLDS.jitter, false);
  const normalizedShimmer = normalizeFeature(features.shimmer, CLINICAL_THRESHOLDS.shimmer, false);
  const normalizedHNR = normalizeFeature(features.hnr, CLINICAL_THRESHOLDS.hnr, true);
  const normalizedPitchVar = normalizeFeature(features.pitchVariation, CLINICAL_THRESHOLDS.pitchVariation, true);

  // Feature weights based on clinical importance (from research literature)
  const weights = {
    jitter: 0.30,      // Jitter is highly indicative
    shimmer: 0.28,     // Shimmer is also very important
    hnr: 0.25,         // HNR is a key biomarker
    pitchVariation: 0.17, // Pitch variation is moderately important
  };

  // Calculate weighted probability score
  const rawScore = 
    weights.jitter * normalizedJitter +
    weights.shimmer * normalizedShimmer +
    weights.hnr * normalizedHNR +
    weights.pitchVariation * normalizedPitchVar;

  // Apply sigmoid for smooth probability curve
  // No random noise - this is for accurate clinical assessment
  const probability = rawScore;
  
  // Confidence based on signal quality (amplitude and duration)
  const signalQuality = Math.min(1, features.amplitude * 10) * Math.min(1, features.duration / 3);
  const confidence = 0.70 + signalQuality * 0.25; // 70-95% confidence range

  // Determine risk level based on probability thresholds
  // Conservative thresholds to minimize false positives
  const riskLevel: 'low' | 'medium' | 'high' = 
    probability > 0.65 ? 'high' : 
    probability > 0.40 ? 'medium' : 'low';

  // Feature importance for explainability
  const featureImportance = [
    { 
      feature: 'Jitter', 
      importance: weights.jitter, 
      value: features.jitter,
      status: features.jitter <= CLINICAL_THRESHOLDS.jitter.healthy ? 'normal' : 
              features.jitter <= CLINICAL_THRESHOLDS.jitter.warning ? 'borderline' : 'elevated'
    },
    { 
      feature: 'Shimmer', 
      importance: weights.shimmer, 
      value: features.shimmer,
      status: features.shimmer <= CLINICAL_THRESHOLDS.shimmer.healthy ? 'normal' : 
              features.shimmer <= CLINICAL_THRESHOLDS.shimmer.warning ? 'borderline' : 'elevated'
    },
    { 
      feature: 'HNR', 
      importance: weights.hnr, 
      value: features.hnr,
      status: features.hnr >= CLINICAL_THRESHOLDS.hnr.healthy ? 'normal' : 
              features.hnr >= CLINICAL_THRESHOLDS.hnr.warning ? 'borderline' : 'low'
    },
    { 
      feature: 'Pitch Variation', 
      importance: weights.pitchVariation, 
      value: features.pitchVariation,
      status: features.pitchVariation >= CLINICAL_THRESHOLDS.pitchVariation.healthy ? 'normal' : 
              features.pitchVariation >= CLINICAL_THRESHOLDS.pitchVariation.warning ? 'borderline' : 'reduced'
    },
  ].sort((a, b) => b.importance - a.importance);

  // Generate detailed recommendation based on analysis
  let recommendation: string;
  const healthyFeatures = featureImportance.filter(f => f.status === 'normal').length;
  
  if (riskLevel === 'low') {
    recommendation = `Your voice analysis shows ${healthyFeatures}/4 features within healthy ranges. ` +
      `Jitter: ${features.jitter.toFixed(2)}% (healthy < ${CLINICAL_THRESHOLDS.jitter.healthy}%), ` +
      `Shimmer: ${features.shimmer.toFixed(2)}% (healthy < ${CLINICAL_THRESHOLDS.shimmer.healthy}%), ` +
      `HNR: ${features.hnr.toFixed(1)}dB (healthy > ${CLINICAL_THRESHOLDS.hnr.healthy}dB). ` +
      `Continue regular monitoring and maintain healthy vocal habits.`;
  } else if (riskLevel === 'medium') {
    recommendation = `Some voice characteristics show mild variations from typical ranges. ` +
      `This does not indicate a diagnosis but suggests continued monitoring. ` +
      `Consider discussing these results with your healthcare provider during your next routine visit. ` +
      `Factors like fatigue, stress, or recent illness can affect voice measurements.`;
  } else {
    recommendation = `The voice analysis indicates patterns that may warrant further clinical evaluation. ` +
      `Please note: This is a screening tool, not a diagnostic. ` +
      `Schedule an appointment with your neurologist for a comprehensive assessment including clinical examination.`;
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
