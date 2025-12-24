import { VoiceFeatures } from '@/types';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FeatureBreakdownProps {
  features: VoiceFeatures;
}

interface ThresholdConfig {
  healthy: number;
  warning: number;
  critical: number;
  label: string;
  unit: string;
  description: string;
  healthyRange: string;
  inverted?: boolean;
}

const CLINICAL_THRESHOLDS: Record<string, ThresholdConfig> = {
  jitter: { 
    healthy: 1.04, 
    warning: 1.5, 
    critical: 2.5,
    label: 'Jitter',
    unit: '%',
    description: 'Measures cycle-to-cycle frequency variation. Higher values may indicate vocal cord irregularity.',
    healthyRange: '< 1.04%',
    inverted: false
  },
  shimmer: { 
    healthy: 3.81, 
    warning: 5.0, 
    critical: 8.0,
    label: 'Shimmer',
    unit: '%',
    description: 'Measures cycle-to-cycle amplitude variation. Elevated values suggest voice instability.',
    healthyRange: '< 3.81%',
    inverted: false
  },
  hnr: { 
    healthy: 20, 
    warning: 15, 
    critical: 10,
    label: 'HNR (Harmonics-to-Noise)',
    unit: 'dB',
    description: 'Ratio of harmonic sound to noise. Higher values indicate clearer voice quality.',
    healthyRange: '> 20 dB',
    inverted: true
  },
  pitchVariation: { 
    healthy: 15, 
    warning: 8, 
    critical: 5,
    label: 'Pitch Variation',
    unit: 'Hz',
    description: 'Standard deviation of fundamental frequency. Very low variation may indicate reduced vocal flexibility.',
    healthyRange: '> 15 Hz',
    inverted: true
  },
};

const getFeatureStatus = (key: string, value: number) => {
  const t = CLINICAL_THRESHOLDS[key as keyof typeof CLINICAL_THRESHOLDS];
  if (!t) return { status: 'unknown', color: 'text-muted-foreground', bg: 'bg-muted', Icon: Info };

  if (t.inverted) {
    if (value >= t.healthy) return { status: 'Normal', color: 'text-success', bg: 'bg-success/10', Icon: CheckCircle };
    if (value >= t.warning) return { status: 'Borderline', color: 'text-warning', bg: 'bg-warning/10', Icon: AlertTriangle };
    return { status: 'Abnormal', color: 'text-destructive', bg: 'bg-destructive/10', Icon: XCircle };
  } else {
    if (value <= t.healthy) return { status: 'Normal', color: 'text-success', bg: 'bg-success/10', Icon: CheckCircle };
    if (value <= t.warning) return { status: 'Borderline', color: 'text-warning', bg: 'bg-warning/10', Icon: AlertTriangle };
    return { status: 'Abnormal', color: 'text-destructive', bg: 'bg-destructive/10', Icon: XCircle };
  }
};

const FeatureBreakdown = ({ features }: FeatureBreakdownProps) => {
  const featureData = [
    { key: 'jitter', value: features.jitter },
    { key: 'shimmer', value: features.shimmer },
    { key: 'hnr', value: features.hnr },
    { key: 'pitchVariation', value: features.pitchVariation },
  ];

  const normalCount = featureData.filter(f => getFeatureStatus(f.key, f.value).status === 'Normal').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Feature-by-Feature Analysis</h3>
        <Badge variant="outline" className={normalCount >= 3 ? 'text-success' : normalCount >= 2 ? 'text-warning' : 'text-destructive'}>
          {normalCount}/4 Normal
        </Badge>
      </div>

      <div className="space-y-3">
        {featureData.map(({ key, value }) => {
          const threshold = CLINICAL_THRESHOLDS[key as keyof typeof CLINICAL_THRESHOLDS];
          const status = getFeatureStatus(key, value);
          const Icon = status.Icon;

          return (
            <div key={key} className={`p-3 rounded-lg border ${status.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${status.color}`} />
                  <span className="font-medium">{threshold.label}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{threshold.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant="outline" className={status.color}>
                  {status.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Healthy range: {threshold.healthyRange}
                </span>
                <span className={`font-semibold ${status.color}`}>
                  {value.toFixed(2)} {threshold.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-xs text-muted-foreground">Pitch</p>
          <p className="font-semibold">{features.pitch.toFixed(0)} Hz</p>
        </div>
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-xs text-muted-foreground">Amplitude</p>
          <p className="font-semibold">{(features.amplitude * 100).toFixed(0)}%</p>
        </div>
        <div className="text-center p-2 rounded bg-muted">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="font-semibold">{features.duration.toFixed(1)}s</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureBreakdown;