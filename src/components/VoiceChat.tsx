import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Settings, Volume2, VolumeX, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription }  from './ui/card';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from '../types/speech-recognition';

// Declare global window interfaces
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceSettings {
  pitch: number;
  rate: number;
  volume: number;
  autoPlay: boolean;
  language: string;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  pitch: 1,
  rate: 1,
  volume: 1,
  autoPlay: true,
  language: 'es-ES'
};

const VoiceChat = () => {
  // State declarations
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [textInput, setTextInput] = useState('');

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      const defaultVoice = voices.find(voice => voice.lang === voiceSettings.language) || voices[0];
      setSelectedVoice(defaultVoice);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voiceSettings.language]);

  // Initialize speech recognition with error handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voiceSettings.language;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const current = event.resultIndex;
          const result = event.results[current];
          if (result && result[0]) {
            const transcriptText = result[0].transcript;
            setTranscript(transcriptText);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          if (isListening && recognition) {
            recognition.start();
          }
        };
      } else {
        setError('Speech recognition is not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, voiceSettings.language]);

  const startListening = useCallback(() => {
    setError(null);
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, []);

  const toggleSpeaking = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [speaking]);

  const speakMessage = useCallback((text: string) => {
    if (!selectedVoice) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;
    utterance.volume = voiceSettings.volume;
    
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
    
    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setSpeaking(false);
      setError('Failed to speak message');
    };
  }, [selectedVoice, voiceSettings]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content
          })),
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'API request failed');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      if (voiceSettings.autoPlay) {
        speakMessage(assistantMessage.content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setTranscript('');
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage(textInput);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="rounded-lg shadow-lg p-8 bg-var-grey-200">
        {/* Header with controls */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-var-grey-900 font-semibold">Voice & Text Chat</h2>
          <div className="flex gap-2 text-var-black ">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSpeaking}
              disabled={!speaking}
            >
              {speaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} />
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages container */}
        <Card className="mb-4">
  <CardHeader>
    <CardTitle>Chat History</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <div className="h-96 overflow-y-auto py-2 px-6 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-4 rounded-lg ${
            message.role === 'user' 
              ? 'message-user ml-auto max-w-[80%]' 
              : 'message-assistant mr-auto max-w-[80%]'
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 break-words">{message.content}</div>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {message.timestamp.toLocaleTimeString()}
            </time>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  </CardContent>
</Card>

        <div className="mt-8 flex items-center gap-4">
  <div className="flex-1 flex items-center text-var-black gap-4">
    <Button
      variant={isListening ? "destructive" : "default"}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      disabled={speaking}
    >
      {isListening ? <Mic size={24} /> : <MicOff size={24} />}
    </Button>

    <Input
      ref={inputRef}
      value={textInput}
      onChange={(e) => setTextInput(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder="Type a message..."
      disabled={isLoading}
    />

    <Button
      onClick={() => sendMessage(textInput || transcript)}
      disabled={(!textInput && !transcript) || speaking || isLoading}
      size="icon"
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Send size={24} />
      )}
    </Button>
  </div>
</div>

        {/* Settings dialog */}
        <AlertDialog open={showSettings} onOpenChange={setShowSettings}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Voice Settings</AlertDialogTitle>
              <AlertDialogDescription>
                Customize the voice chat experience
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Voice</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedVoice?.name}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.name === e.target.value);
                    if (voice) setSelectedVoice(voice);
                  }}
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pitch</label>
                <Slider
                  value={[voiceSettings.pitch]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => 
                    setVoiceSettings(prev => ({ ...prev, pitch: value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rate</label>
                <Slider
                  value={[voiceSettings.rate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => 
                    setVoiceSettings(prev => ({ ...prev, rate: value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Volume</label>
                <Slider
                  value={[voiceSettings.volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => 
                    setVoiceSettings(prev => ({ ...prev, volume: value }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-play responses</label>
                <Switch
                  checked={voiceSettings.autoPlay}
                  onCheckedChange={(checked) =>
                    setVoiceSettings(prev => ({ ...prev, autoPlay: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Language</label>
                <select
                  className="w-48 p-2 border rounded"
                  value={voiceSettings.language}
                  onChange={(e) =>
                    setVoiceSettings(prev => ({ ...prev, language: e.target.value }))
                  }
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                  <option value="zh-TW">Chinese (Traditional)</option>
                  <option value="ar-SA">Arabic</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ru-RU">Russian</option>
                </select>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowSettings(false);
                // Restart speech recognition with new language if it's active
                if (isListening && recognitionRef.current) {
                  stopListening();
                  startListening();
                }
              }}>
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default VoiceChat;