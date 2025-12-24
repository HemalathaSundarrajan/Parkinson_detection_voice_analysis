import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getPrediction } from '@/lib/mlService';
import { createTestSession, createAlert } from '@/lib/storage';
import { PredictionResult, VoiceFeatures } from '@/types';
import { Mic, Square, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RecordingGuidelines from '@/components/RecordingGuidelines';
import FeatureBreakdown from '@/components/FeatureBreakdown';

const VoiceRecording = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecording, duration, audioLevel, startRecording, stopRecording, error } = useVoiceRecorder();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [lastFeatures, setLastFeatures] = useState<VoiceFeatures | null>(null);

  const handleStartRecording = async () => {
    setResult(null);
    setLastFeatures(null);
    await startRecording();
  };

  const handleStopRecording = async () => {
    const recordingData = await stopRecording();
    if (!recordingData || !user) return;

    setIsAnalyzing(true);
    try {
      const recordingId = crypto.randomUUID();
      const prediction = await getPrediction(recordingData.features, user.id, recordingId);
      
      // Save test session
      createTestSession({
        patientId: user.id,
        completedAt: new Date().toISOString(),
        recording: {
          id: recordingId,
          patientId: user.id,
          recordedAt: new Date().toISOString(),
          duration: recordingData.features.duration,
          features: recordingData.features,
          status: 'analyzed',
        },
        prediction,
      });

      // Create alert if high risk
      if (prediction.riskLevel === 'high') {
        createAlert({
          type: 'warning',
          title: 'Elevated Risk Detected',
          message: `Your latest voice analysis shows elevated risk indicators. Please review your results.`,
          patientId: user.id,
        });
      }

      setResult(prediction);
      setLastFeatures(recordingData.features);
      toast({ title: 'Analysis Complete', description: 'Your voice test has been analyzed successfully.' });
    } catch (err) {
      toast({ title: 'Analysis Failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      {/* Recording Guidelines */}
      {!result && <RecordingGuidelines />}

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Voice Test</CardTitle>
          <CardDescription>
            Record a 5-10 second voice sample saying "Aahhh" in a sustained tone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isAnalyzing}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-destructive pulse-recording' 
                  : 'bg-primary hover:bg-primary/90'
              } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAnalyzing ? (
                <Loader2 className="h-12 w-12 text-primary-foreground animate-spin" />
              ) : isRecording ? (
                <Square className="h-12 w-12 text-destructive-foreground" />
              ) : (
                <Mic className="h-12 w-12 text-primary-foreground" />
              )}
            </button>
            
            <p className="text-lg font-medium">
              {isAnalyzing ? 'Analyzing...' : isRecording ? `Recording: ${duration}s` : 'Tap to Record'}
            </p>

            {isRecording && (
              <div className="w-full max-w-xs">
                <Progress value={audioLevel * 100} className="h-2" />
                <p className="text-xs text-center text-muted-foreground mt-1">Audio Level</p>
              </div>
            )}
          </div>

          {error && <p className="text-destructive text-center text-sm">{error}</p>}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-2" style={{ borderColor: result.riskLevel === 'high' ? 'hsl(var(--destructive))' : result.riskLevel === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display">Analysis Results</CardTitle>
              <Badge variant={result.riskLevel === 'high' ? 'destructive' : result.riskLevel === 'medium' ? 'secondary' : 'default'}>
                {result.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${result.riskLevel === 'low' ? 'bg-success/10' : result.riskLevel === 'medium' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                {result.riskLevel === 'low' ? (
                  <CheckCircle className="h-8 w-8 text-success" />
                ) : (
                  <AlertTriangle className={`h-8 w-8 ${getRiskColor(result.riskLevel)}`} />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold">{Math.round(result.probability * 100)}%</p>
                <p className="text-muted-foreground">Risk Score</p>
              </div>
            </div>

            {/* Feature Breakdown */}
            {lastFeatures && <FeatureBreakdown features={lastFeatures} />}

            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-medium mb-2">Recommendation</h4>
              <p className="text-sm text-muted-foreground">{result.recommendation}</p>
            </div>

            <Button className="w-full" onClick={() => navigate('/dashboard/history')}>
              View All Results
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceRecording;
