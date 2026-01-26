import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const FAQ_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: "Hello! I'm your Parkinson's Disease Detection Assistant. I can help answer questions about Parkinson's disease, voice analysis, and how to use this system. What would you like to know?"
  },
  {
    keywords: ['what is parkinson', 'parkinson disease', 'parkinson\'s'],
    response: "Parkinson's disease is a progressive neurological disorder that affects movement. It occurs when nerve cells in the brain don't produce enough dopamine. Common symptoms include tremors, stiffness, slow movement, and balance problems. Voice changes are often an early indicator, which is why voice analysis can be helpful for early detection."
  },
  {
    keywords: ['symptoms', 'signs', 'early signs'],
    response: "Early signs of Parkinson's disease include:\n\n• Tremor (shaking) in hands, arms, legs, or jaw\n• Slowness of movement (bradykinesia)\n• Stiffness in limbs and trunk\n• Balance and coordination problems\n• Voice changes - softer, monotone, or slurred speech\n• Reduced facial expressions\n• Small handwriting (micrographia)\n\nVoice changes often appear early, making voice analysis valuable for screening."
  },
  {
    keywords: ['voice', 'speech', 'how voice', 'voice analysis', 'voice test'],
    response: "Voice analysis can detect subtle changes in speech patterns that may indicate Parkinson's disease. We analyze several features:\n\n• **Jitter**: Frequency variation in voice (healthy < 1.04%)\n• **Shimmer**: Amplitude variation (healthy < 3.81%)\n• **HNR**: Harmonics-to-Noise Ratio (healthy > 20 dB)\n• **Pitch Variation**: Voice stability (healthy > 15 Hz)\n\nPeople with Parkinson's often show increased jitter and shimmer, and decreased HNR."
  },
  {
    keywords: ['jitter', 'what is jitter'],
    response: "**Jitter** measures the variation in the frequency (pitch) of your voice from cycle to cycle. It reflects how stable your vocal cords vibrate.\n\n• **Healthy range**: < 1.04%\n• **Borderline**: 1.04% - 1.5%\n• **Abnormal**: > 1.5%\n\nHigher jitter values may indicate reduced control over vocal cord movement, which can be associated with Parkinson's disease."
  },
  {
    keywords: ['shimmer', 'what is shimmer'],
    response: "**Shimmer** measures the variation in the amplitude (loudness) of your voice from cycle to cycle.\n\n• **Healthy range**: < 3.81%\n• **Borderline**: 3.81% - 5.0%\n• **Abnormal**: > 5.0%\n\nIncreased shimmer can indicate instability in vocal cord function, which may be an early sign of neurological changes."
  },
  {
    keywords: ['hnr', 'harmonics', 'noise ratio'],
    response: "**HNR (Harmonics-to-Noise Ratio)** measures the ratio of harmonic sound to noise in your voice. A higher HNR indicates a clearer, less breathy voice.\n\n• **Healthy range**: > 20 dB\n• **Borderline**: 15 - 20 dB\n• **Abnormal**: < 15 dB\n\nLower HNR values indicate more noise/breathiness in speech, which can be associated with Parkinson's disease."
  },
  {
    keywords: ['accurate', 'accuracy', 'reliable', 'how accurate'],
    response: "This AI-based screening tool uses clinically-validated thresholds from peer-reviewed research. However, it's important to understand:\n\n• This is a **screening tool**, not a diagnostic device\n• It can help identify people who may benefit from further evaluation\n• **Always consult a healthcare professional** for proper diagnosis\n• Multiple factors can affect voice patterns\n\nEarly detection through professional evaluation leads to better outcomes."
  },
  {
    keywords: ['record', 'how to record', 'recording', 'test'],
    response: "To get the best voice analysis results:\n\n1. **Find a quiet room** with minimal background noise\n2. **Hold your device** 6-12 inches from your mouth\n3. **Take a deep breath** before recording\n4. **Say 'Aahhh'** in a sustained, steady tone for 5-10 seconds\n5. **Keep volume consistent** - don't start loud and fade\n6. **Avoid clearing throat** during recording\n\nThe system works best with clear, uninterrupted voice samples."
  },
  {
    keywords: ['treatment', 'cure', 'medication', 'therapy'],
    response: "While there's no cure for Parkinson's disease, several treatments can help manage symptoms:\n\n• **Medications**: Levodopa, dopamine agonists, MAO-B inhibitors\n• **Physical therapy**: Improves mobility and balance\n• **Speech therapy**: Helps with voice and swallowing issues\n• **Exercise**: Regular activity can slow symptom progression\n• **Deep brain stimulation**: Surgical option for advanced cases\n\nEarly detection allows for earlier intervention and better quality of life."
  },
  {
    keywords: ['risk', 'low risk', 'medium risk', 'high risk', 'score'],
    response: "Your risk score is calculated based on your voice features:\n\n• **Low Risk (0-30%)**: Voice features are within healthy ranges. Continue regular monitoring.\n• **Medium Risk (30-60%)**: Some features show borderline values. Consider consulting a healthcare provider.\n• **High Risk (60-100%)**: Multiple features show concerning values. We recommend consulting a neurologist.\n\nRemember, this is a screening tool - only a medical professional can provide a diagnosis."
  },
  {
    keywords: ['help', 'support', 'contact', 'doctor'],
    response: "If you have concerns about your results:\n\n1. **Schedule an appointment** with your primary care physician\n2. **Request a referral** to a neurologist if needed\n3. **Bring your test history** - you can download PDF reports\n4. **Note any other symptoms** you've experienced\n\nFor emergencies or urgent medical concerns, please contact your local healthcare provider or emergency services."
  },
  {
    keywords: ['download', 'pdf', 'report', 'export'],
    response: "You can download a detailed PDF report of any test:\n\n1. Go to **Test History** from your dashboard\n2. Click on any test to view details\n3. Click the **Download PDF** button\n\nThe report includes your voice features analysis, risk assessment, and recommendations - perfect for sharing with your healthcare provider."
  },
  {
    keywords: ['thank', 'thanks', 'bye', 'goodbye'],
    response: "You're welcome! Take care of your health, and don't hesitate to come back if you have more questions. Remember, regular monitoring and early detection can make a significant difference. Stay healthy! 💙"
  }
];

const DEFAULT_RESPONSE = "I'm not sure I understand that question. I can help you with:\n\n• Information about Parkinson's disease\n• How voice analysis works\n• Understanding your test results\n• Recording tips for best results\n• When to see a doctor\n\nTry asking about any of these topics!";

const findResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  for (const faq of FAQ_RESPONSES) {
    if (faq.keywords.some(keyword => lowerInput.includes(keyword))) {
      return faq.response;
    }
  }
  
  return DEFAULT_RESPONSE;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: "Hello! I'm your Parkinson's Disease Detection Assistant. I can help answer questions about Parkinson's disease, voice analysis, and how to use this system. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: findResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "What is Parkinson's disease?",
    "How does voice analysis work?",
    "What do my results mean?",
    "How to record properly?"
  ];

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 transition-transform hover:scale-105",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[500px] z-50 shadow-2xl flex flex-col">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-base font-medium">Health Assistant</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === 'bot' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => handleSend(), 100);
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
