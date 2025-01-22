// VoiceSettingsDialog.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import type { VoiceSettings } from './VoiceChat';

interface VoiceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: React.Dispatch<React.SetStateAction<VoiceSettings>>;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: React.Dispatch<React.SetStateAction<SpeechSynthesisVoice | null>>;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

const VoiceSettingsDialog: React.FC<VoiceSettingsDialogProps> = ({
  open,
  onOpenChange,
  voiceSettings,
  setVoiceSettings,
  availableVoices,
  selectedVoice,
  setSelectedVoice,
  isListening,
  startListening,
  stopListening,
}) => {
  const handleSaveChanges = () => {
    onOpenChange(false);
    if (isListening) {
      stopListening();
      startListening();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Voice Settings</AlertDialogTitle>
          <AlertDialogDescription>
            Customize the voice chat experience
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-var-black text-sm font-medium">Voice</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedVoice?.name}
              onChange={(e) => {
                const voice = availableVoices.find((v) => v.name === e.target.value);
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
            <label className="text-var-black text-sm font-medium">Pitch</label>
            <Slider
              value={[voiceSettings.pitch]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={([value]) =>
                setVoiceSettings((prev) => ({ ...prev, pitch: value }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-var-black text-sm font-medium">Rate</label>
            <Slider
              value={[voiceSettings.rate]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={([value]) =>
                setVoiceSettings((prev) => ({ ...prev, rate: value }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-var-black text-sm font-medium">Volume</label>
            <Slider
              value={[voiceSettings.volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={([value]) =>
                setVoiceSettings((prev) => ({ ...prev, volume: value }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-var-black text-sm font-medium">Auto-play responses</label>
            <Switch
              checked={voiceSettings.autoPlay}
              onCheckedChange={(checked) =>
                setVoiceSettings((prev) => ({ ...prev, autoPlay: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-var-black text-sm font-medium">Language</label>
            <select
              className="w-48 p-2 border rounded"
              value={voiceSettings.language}
              onChange={(e) =>
                setVoiceSettings((prev) => ({ ...prev, language: e.target.value }))
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
          <AlertDialogAction onClick={handleSaveChanges}>
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VoiceSettingsDialog;