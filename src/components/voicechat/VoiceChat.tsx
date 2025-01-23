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
import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const DEFAULT_VOICE_SETTINGS = {
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
  const [textInput, setTextInput] = useState('');

  const audioContext = useRef<AudioContext>();
  const mediaRecorder = useRef<MediaRecorder>();
  const speechClient = useRef<speech.SpeechClient>();
  const ttsClient = useRef<textToSpeech.TextToSpeechClient>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    speechClient.current = new speech.SpeechClient();
    ttsClient.current = new textToSpeech.TextToSpeechClient();
    audioContext.current = new AudioContext();
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const buffer = await audioBlob.arrayBuffer();

        const request = {
          audio: { content: Buffer.from(buffer).toString('base64') },
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 48000,
            languageCode: voiceSettings.language,
          },
        };

        try {
          const [response] = await speechClient.current!.recognize(request);
          const transcription = response.results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .join('\n');
          setTranscript(transcription || '');
        } catch (err) {
          console.error('Speech recognition error:', err);
          setError('Failed to recognize speech');
        }
      };

      mediaRecorder.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone');
    }
  }, [isListening, voiceSettings.language]);

  const stopListening = useCallback(() => {
    if (!isListening || !mediaRecorder.current) return;
    mediaRecorder.current.stop();
    setIsListening(false);
  }, [isListening]);

  const speakMessage = useCallback(async (text: string) => {
    if (!ttsClient.current || speaking) return;

    try {
      const request = {
        input: { text },
        voice: {
          languageCode: voiceSettings.language,
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: voiceSettings.pitch,
          speakingRate: voiceSettings.rate,
          volumeGainDb: Math.log10(voiceSettings.volume) * 20,
        },
      };

      setSpeaking(true);
      const [response] = await ttsClient.current.synthesizeSpeech(request);
      const audioContent = response.audioContent;

      if (audioContent) {
        const audioBuffer = await audioContext.current!.decodeAudioData(
          audioContent.buffer
        );
        const source = audioContext.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.current!.destination);
        source.start();
        source.onended = () => setSpeaking(false);
      }
    } catch (err) {
      console.error('TTS error:', err);
      setError('Failed to synthesize speech');
      setSpeaking(false);
    }
  }, [speaking, voiceSettings]);

  // Rest of the component remains the same...
  
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="rounded-lg shadow-lg p-8 bg-muted">
        <ChatHeader 
          speaking={speaking}
          toggleSpeaking={() => {
            if (speaking) {
              audioContext.current?.close();
              setSpeaking(false);
            }
          }}
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
          isListening={isListening}
          startListening={startListening}
          stopListening={stopListening}
        />
      </div>
    </div>
  );
};

export default VoiceChat;