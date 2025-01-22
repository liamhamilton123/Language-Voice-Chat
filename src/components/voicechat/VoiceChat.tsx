// VoiceChat.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Settings,
  Volume2,
  VolumeX,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import VoiceSettingsDialog from './VoiceSettingsDialog';
import { AIVoiceInput } from '/workspaces/Language-Voice-Chat/src/components/ui/ai-voice-input.tsx';

// Types
import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from '/workspaces/Language-Voice-Chat/src/types/speech-recognition.d.ts';

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

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  pitch: 1,
  rate: 1,
  volume: 1,
  autoPlay: true,
  language: 'es-ES'
};

export interface VoiceSettings {
  pitch: number;
  rate: number;
  volume: number;
  autoPlay: boolean;
  language: string;
}

const VoiceChat = () => {
  // ----------------------------------------------------------------
  //                          State
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  //                          Refs
  // ----------------------------------------------------------------
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------------
  //            Scrolling to the bottom of messages
  // ----------------------------------------------------------------
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ----------------------------------------------------------------
  //               Initialize available voices
  // ----------------------------------------------------------------
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      const defaultVoice = voices.find((voice) => voice.lang === voiceSettings.language) || voices[0];
      setSelectedVoice(defaultVoice);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voiceSettings.language]);

  // ----------------------------------------------------------------
  //         Initialize speech recognition with error handling
  // ----------------------------------------------------------------
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
          setIsListening(false);
        };
      } else {
        setError('Speech recognition is not supported in this browser');
      }
    }

    // Cleanup: stop recognition if component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, voiceSettings.language]);

  // ----------------------------------------------------------------
  //                     Start / Stop Listening
  // ----------------------------------------------------------------
  const startListening = useCallback(() => {
    if (isListening) return;
    setError(null);
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);
  
  const stopListening = useCallback(() => {
    if (!isListening) return;
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // ----------------------------------------------------------------
  //                   Speech Synthesis Handlers
  // ----------------------------------------------------------------
  const toggleSpeaking = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [speaking]);

  const speakMessage = useCallback(
    (text: string) => {
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
    },
    [selectedVoice, voiceSettings]
  );

  // ----------------------------------------------------------------
  //                        Send Message
  // ----------------------------------------------------------------
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
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

      setMessages((prev) => [...prev, assistantMessage]);

      if (voiceSettings.autoPlay) {
        speakMessage(assistantMessage.content);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setTranscript('');
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage(textInput || transcript);
    }
  };

  // ----------------------------------------------------------------
  //                        Render
  // ----------------------------------------------------------------
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="rounded-lg shadow-lg p-8 bg-muted">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-var-grey-900 font-semibold">Voice &amp; Text Chat</h2>
          <div className="flex gap-2 text-var-black">
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

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                      ? 'bg-blue-100 message-user ml-auto max-w-[80%]'
                      : 'bg-var-grey-200 message-assistant mr-auto max-w-[80%]'
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

        <AIVoiceInput
          onStart={startListening}
          onStop={() => stopListening()}
          className="shrink-0"
        />

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 flex items-center text-var-black gap-4">
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

        <VoiceSettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          voiceSettings={voiceSettings}
          setVoiceSettings={setVoiceSettings}
          availableVoices={availableVoices}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          isListening={isListening}
          startListening={startListening}
          stopListening={stopListening}
        />
      </div>
    </div>
  );
};

export default VoiceChat;