"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import VoiceSettingsDialog from './VoiceSettingsDialog';
import { AIVoiceInput } from '/workspaces/Language-Voice-Chat/src/components/ui/ai-voice-input.tsx';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from '/workspaces/Language-Voice-Chat/src/types/speech-recognition.d.ts';

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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, voiceSettings.language]);

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
          model: 'gpt-4o-mini',
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

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="rounded-lg shadow-lg p-8 bg-muted">
        <ChatHeader 
          speaking={speaking}
          toggleSpeaking={toggleSpeaking}
          setShowSettings={setShowSettings}
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <ChatHistory 
            messages={messages}
            messagesEndRef={messagesEndRef}
          />
        </Card>

        <ChatInput 
          isListening={isListening}
          speaking={speaking}
          isLoading={isLoading}
          textInput={textInput}
          transcript={transcript}
          setTextInput={setTextInput}
          startListening={startListening}
          stopListening={stopListening}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
        />

        <AIVoiceInput
          onStart={startListening}
          onStop={stopListening}
          className="shrink-0"
        />

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

export default VoiceChat