import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Mic, Volume2, Clock, AlertCircle } from 'lucide-react';

const RecordingGuidelines = () => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Recording Guidelines for Accurate Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Do's */}
          <div className="space-y-2">
            <h4 className="font-semibold text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Do's
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Mic className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Say <strong>"Aahhh"</strong> in a steady, sustained tone</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Record for <strong>5-10 seconds</strong> minimum</span>
              </li>
              <li className="flex items-start gap-2">
                <Volume2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Use your <strong>normal speaking volume</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Record in a <strong>quiet room</strong> without background noise</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Hold device <strong>15-20cm from mouth</strong></span>
              </li>
            </ul>
          </div>

          {/* Don'ts */}
          <div className="space-y-2">
            <h4 className="font-semibold text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Don'ts
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Don't whisper or shout</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Don't record if you have a cold or sore throat</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Avoid recording immediately after eating/drinking</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Don't cover the microphone</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Don't move or shake the device while recording</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> For best results, try to record at the same time each day. Voice quality can vary 
            based on time of day, hydration, and fatigue levels.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecordingGuidelines;