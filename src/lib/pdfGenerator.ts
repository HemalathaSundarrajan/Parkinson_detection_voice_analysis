import jsPDF from 'jspdf';
import { TestSession, VoiceFeatures, User } from '@/types';
import { format } from 'date-fns';

const CLINICAL_THRESHOLDS: Record<string, { healthy: number; warning: number; inverted?: boolean; label: string; unit: string; description: string }> = {
  jitter: { healthy: 1.04, warning: 1.5, inverted: false, label: 'Jitter', unit: '%', description: 'Frequency variation' },
  shimmer: { healthy: 3.81, warning: 5.0, inverted: false, label: 'Shimmer', unit: '%', description: 'Amplitude variation' },
  hnr: { healthy: 20, warning: 15, inverted: true, label: 'HNR', unit: 'dB', description: 'Harmonics-to-Noise Ratio' },
  pitchVariation: { healthy: 15, warning: 8, inverted: true, label: 'Pitch Variation', unit: 'Hz', description: 'Voice pitch stability' },
};

const getFeatureStatus = (feature: string, value: number): string => {
  const t = CLINICAL_THRESHOLDS[feature];
  if (t.inverted) {
    if (value >= t.healthy) return 'Normal';
    if (value >= t.warning) return 'Borderline';
    return 'Abnormal';
  } else {
    if (value <= t.healthy) return 'Normal';
    if (value <= t.warning) return 'Borderline';
    return 'Abnormal';
  }
};

export const generateTestReportPDF = (session: TestSession, user: User): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(14, 165, 233); // Primary color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Parkinson\'s Voice Analysis Report', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Based Real-Time Detection System', pageWidth / 2, 28, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}`, pageWidth / 2, 35, { align: 'center' });

  yPos = 55;
  doc.setTextColor(0, 0, 0);

  // Patient Information Section
  doc.setFillColor(241, 245, 249);
  doc.rect(15, yPos - 5, pageWidth - 30, 30, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${user.name}`, 20, yPos + 15);
  doc.text(`Email: ${user.email}`, 20, yPos + 22);
  doc.text(`Test Date: ${format(new Date(session.completedAt), 'MMMM d, yyyy')}`, 120, yPos + 15);
  doc.text(`Test Time: ${format(new Date(session.completedAt), 'h:mm a')}`, 120, yPos + 22);

  yPos += 40;

  // Risk Assessment Section
  const riskColor = session.prediction.riskLevel === 'low' ? [34, 197, 94] : 
                    session.prediction.riskLevel === 'medium' ? [234, 179, 8] : [239, 68, 68];
  
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', 20, yPos + 12);
  
  doc.setFontSize(28);
  doc.text(`${Math.round(session.prediction.probability * 100)}%`, pageWidth - 50, yPos + 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Risk Level: ${session.prediction.riskLevel.toUpperCase()}`, 20, yPos + 22);
  doc.text(`Confidence: ${Math.round(session.prediction.confidence * 100)}%`, 20, yPos + 30);
  doc.text('Risk Score', pageWidth - 50, yPos + 28);

  yPos += 50;
  doc.setTextColor(0, 0, 0);

  // Voice Features Analysis Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Voice Features Analysis', 20, yPos);
  yPos += 10;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(15, yPos, pageWidth - 30, 10, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Feature', 20, yPos + 7);
  doc.text('Value', 70, yPos + 7);
  doc.text('Status', 110, yPos + 7);
  doc.text('Healthy Range', 145, yPos + 7);
  yPos += 12;

  // Feature rows
  const features = [
    { key: 'jitter' as const, value: session.recording.features.jitter, healthyRange: '< 1.04%' },
    { key: 'shimmer' as const, value: session.recording.features.shimmer, healthyRange: '< 3.81%' },
    { key: 'hnr' as const, value: session.recording.features.hnr, healthyRange: '> 20 dB' },
    { key: 'pitchVariation' as const, value: session.recording.features.pitchVariation, healthyRange: '> 15 Hz' },
  ];

  doc.setFont('helvetica', 'normal');
  features.forEach((feature, index) => {
    const threshold = CLINICAL_THRESHOLDS[feature.key];
    const status = getFeatureStatus(feature.key, feature.value);
    
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 3, pageWidth - 30, 12, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.text(threshold.label, 20, yPos + 5);
    doc.text(`${feature.value.toFixed(2)} ${threshold.unit}`, 70, yPos + 5);
    
    // Status with color
    const statusColor = status === 'Normal' ? [34, 197, 94] : 
                       status === 'Borderline' ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(status, 110, yPos + 5);
    
    doc.setTextColor(100, 100, 100);
    doc.text(feature.healthyRange, 145, yPos + 5);
    
    yPos += 12;
  });

  yPos += 10;
  doc.setTextColor(0, 0, 0);

  // Additional Measurements
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Additional Measurements', 20, yPos);
  yPos += 10;

  doc.setFillColor(241, 245, 249);
  doc.rect(15, yPos, 80, 25, 'F');
  doc.rect(100, yPos, 80, 25, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fundamental Pitch', 20, yPos + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${session.recording.features.pitch.toFixed(1)} Hz`, 20, yPos + 18);

  doc.setFont('helvetica', 'normal');
  doc.text('Recording Duration', 105, yPos + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${session.recording.features.duration.toFixed(1)} seconds`, 105, yPos + 18);

  yPos += 40;

  // Recommendation Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Clinical Recommendation', 20, yPos);
  yPos += 8;

  doc.setFillColor(219, 234, 254);
  doc.rect(15, yPos, pageWidth - 30, 30, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 64, 175);
  
  // Word wrap for recommendation
  const splitText = doc.splitTextToSize(session.prediction.recommendation, pageWidth - 40);
  doc.text(splitText, 20, yPos + 10);

  yPos += 45;
  doc.setTextColor(0, 0, 0);

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const disclaimer = 'DISCLAIMER: This report is generated by an AI-based screening tool and is intended for informational purposes only. It does not constitute a medical diagnosis. Please consult with a qualified healthcare professional for proper medical evaluation and diagnosis. Early detection through professional consultation can lead to better management of symptoms.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
  doc.text(disclaimerLines, 20, yPos);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFillColor(14, 165, 233);
  doc.rect(0, footerY - 5, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Parkinson\'s Disease Detection System | Powered by AI Voice Analysis', pageWidth / 2, footerY + 3, { align: 'center' });
  doc.text(`Report ID: ${session.id}`, pageWidth / 2, footerY + 9, { align: 'center' });

  // Save the PDF
  doc.save(`parkinson-voice-analysis-${format(new Date(session.completedAt), 'yyyy-MM-dd')}.pdf`);
};
