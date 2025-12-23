// Digital Signal Processing utilities for voice feature extraction
// This extracts features that are typically used for Parkinson's detection

import { VoiceFeatures } from '@/types';

export class DSPProcessor {
  private audioContext: AudioContext;
  private sampleRate: number;

  constructor() {
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;
  }

  async extractFeatures(audioBlob: Blob): Promise<VoiceFeatures> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    const samples = audioBuffer.getChannelData(0);
    
    // Extract various voice features
    const pitch = this.calculatePitch(samples);
    const pitchVariation = this.calculatePitchVariation(samples);
    const jitter = this.calculateJitter(samples, pitch);
    const shimmer = this.calculateShimmer(samples);
    const hnr = this.calculateHNR(samples);
    const amplitude = this.calculateAmplitude(samples);
    const formants = this.calculateFormants(samples);
    const duration = audioBuffer.duration;

    return {
      pitch,
      pitchVariation,
      jitter,
      shimmer,
      hnr,
      duration,
      amplitude,
      formants,
    };
  }

  // Fundamental Frequency (F0) estimation using autocorrelation
  private calculatePitch(samples: Float32Array): number {
    const frameSize = 2048;
    const hopSize = 512;
    const pitches: number[] = [];

    for (let i = 0; i + frameSize < samples.length; i += hopSize) {
      const frame = samples.slice(i, i + frameSize);
      const pitch = this.autocorrelationPitch(frame);
      if (pitch > 50 && pitch < 500) {
        pitches.push(pitch);
      }
    }

    if (pitches.length === 0) return 150; // Default fallback
    
    // Return median pitch
    pitches.sort((a, b) => a - b);
    return pitches[Math.floor(pitches.length / 2)];
  }

  private autocorrelationPitch(frame: Float32Array): number {
    const correlations: number[] = [];
    const minLag = Math.floor(this.sampleRate / 500); // Max 500 Hz
    const maxLag = Math.floor(this.sampleRate / 50);  // Min 50 Hz

    for (let lag = minLag; lag < maxLag && lag < frame.length; lag++) {
      let correlation = 0;
      for (let i = 0; i < frame.length - lag; i++) {
        correlation += frame[i] * frame[i + lag];
      }
      correlations.push(correlation);
    }

    // Find the peak
    let maxCorr = -Infinity;
    let maxLagIndex = 0;
    for (let i = 0; i < correlations.length; i++) {
      if (correlations[i] > maxCorr) {
        maxCorr = correlations[i];
        maxLagIndex = i;
      }
    }

    const bestLag = minLag + maxLagIndex;
    return this.sampleRate / bestLag;
  }

  // Pitch variation (standard deviation of F0)
  private calculatePitchVariation(samples: Float32Array): number {
    const frameSize = 2048;
    const hopSize = 512;
    const pitches: number[] = [];

    for (let i = 0; i + frameSize < samples.length; i += hopSize) {
      const frame = samples.slice(i, i + frameSize);
      const pitch = this.autocorrelationPitch(frame);
      if (pitch > 50 && pitch < 500) {
        pitches.push(pitch);
      }
    }

    if (pitches.length < 2) return 10; // Default

    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pitches.length;
    return Math.sqrt(variance);
  }

  // Jitter: cycle-to-cycle frequency variation
  private calculateJitter(samples: Float32Array, fundamentalFreq: number): number {
    const periodSamples = Math.round(this.sampleRate / fundamentalFreq);
    const periods: number[] = [];

    // Find zero crossings to estimate period lengths
    let lastCrossing = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i - 1] <= 0 && samples[i] > 0) {
        if (lastCrossing > 0) {
          const period = i - lastCrossing;
          if (period > periodSamples * 0.5 && period < periodSamples * 2) {
            periods.push(period);
          }
        }
        lastCrossing = i;
      }
    }

    if (periods.length < 2) return 0.5; // Default

    // Calculate jitter as average absolute difference between periods
    let totalDiff = 0;
    for (let i = 1; i < periods.length; i++) {
      totalDiff += Math.abs(periods[i] - periods[i - 1]);
    }
    const avgDiff = totalDiff / (periods.length - 1);
    const avgPeriod = periods.reduce((a, b) => a + b, 0) / periods.length;
    
    // Jitter percentage
    return (avgDiff / avgPeriod) * 100;
  }

  // Shimmer: cycle-to-cycle amplitude variation
  private calculateShimmer(samples: Float32Array): number {
    const frameSize = 512;
    const amplitudes: number[] = [];

    for (let i = 0; i + frameSize < samples.length; i += frameSize) {
      const frame = samples.slice(i, i + frameSize);
      let max = 0;
      for (let j = 0; j < frame.length; j++) {
        const abs = Math.abs(frame[j]);
        if (abs > max) max = abs;
      }
      amplitudes.push(max);
    }

    if (amplitudes.length < 2) return 3; // Default

    // Calculate shimmer as average absolute difference between amplitudes
    let totalDiff = 0;
    for (let i = 1; i < amplitudes.length; i++) {
      totalDiff += Math.abs(amplitudes[i] - amplitudes[i - 1]);
    }
    const avgDiff = totalDiff / (amplitudes.length - 1);
    const avgAmp = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    
    // Shimmer percentage
    return (avgDiff / avgAmp) * 100;
  }

  // Harmonics-to-Noise Ratio (simplified estimation)
  private calculateHNR(samples: Float32Array): number {
    const frameSize = 2048;
    let totalSignalPower = 0;
    let totalNoisePower = 0;

    for (let i = 0; i + frameSize < samples.length; i += frameSize) {
      const frame = samples.slice(i, i + frameSize);
      
      // Estimate signal power
      let signalPower = 0;
      for (let j = 0; j < frame.length; j++) {
        signalPower += frame[j] * frame[j];
      }
      signalPower /= frame.length;
      
      // Estimate noise using high-frequency content
      // This is a simplified estimation
      let noisePower = 0;
      for (let j = 1; j < frame.length; j++) {
        const diff = frame[j] - frame[j - 1];
        noisePower += diff * diff;
      }
      noisePower /= frame.length;

      totalSignalPower += signalPower;
      totalNoisePower += noisePower * 0.1; // Scale factor
    }

    if (totalNoisePower === 0) return 25; // Default high HNR
    
    // HNR in dB
    const hnr = 10 * Math.log10(totalSignalPower / totalNoisePower);
    return Math.max(0, Math.min(40, hnr)); // Clamp to reasonable range
  }

  // Average amplitude (RMS)
  private calculateAmplitude(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  // Formant estimation (simplified using LPC-like approach)
  private calculateFormants(samples: Float32Array): number[] {
    // Simplified formant estimation
    // In a real implementation, you'd use LPC analysis
    const frameSize = 2048;
    const frame = samples.slice(0, Math.min(frameSize, samples.length));
    
    // Perform FFT
    const fft = this.fft(frame);
    const magnitudes = fft.map(c => Math.sqrt(c.re * c.re + c.im * c.im));
    
    // Find peaks in spectrum (simplified formant detection)
    const formants: number[] = [];
    const minFreq = 200;
    const maxFreq = 4000;
    const binWidth = this.sampleRate / frameSize;
    
    const startBin = Math.floor(minFreq / binWidth);
    const endBin = Math.min(Math.floor(maxFreq / binWidth), magnitudes.length / 2);
    
    let prevMag = 0;
    let rising = false;
    
    for (let i = startBin; i < endBin; i++) {
      if (magnitudes[i] > prevMag) {
        rising = true;
      } else if (rising && magnitudes[i] < prevMag) {
        // Found a peak
        formants.push((i - 1) * binWidth);
        rising = false;
        if (formants.length >= 4) break;
      }
      prevMag = magnitudes[i];
    }
    
    // Ensure we have at least 3 formants
    while (formants.length < 3) {
      formants.push(500 + formants.length * 1000);
    }
    
    return formants.slice(0, 4);
  }

  // Simple FFT implementation
  private fft(input: Float32Array): { re: number; im: number }[] {
    const n = input.length;
    const output: { re: number; im: number }[] = [];
    
    for (let k = 0; k < n; k++) {
      let re = 0;
      let im = 0;
      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * t * k) / n;
        re += input[t] * Math.cos(angle);
        im -= input[t] * Math.sin(angle);
      }
      output.push({ re, im });
    }
    
    return output;
  }

  dispose() {
    this.audioContext.close();
  }
}

// Singleton instance
let dspProcessor: DSPProcessor | null = null;

export const getDSPProcessor = (): DSPProcessor => {
  if (!dspProcessor) {
    dspProcessor = new DSPProcessor();
  }
  return dspProcessor;
};
