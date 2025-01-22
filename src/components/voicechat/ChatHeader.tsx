// ChatHeader.tsx
import React from 'react';
import { Button } from '../ui/button';
import { Volume2, VolumeX, Settings } from 'lucide-react';

interface ChatHeaderProps {
  speaking: boolean;
  toggleSpeaking: () => void;
  setShowSettings: (value: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  speaking,
  toggleSpeaking,
  setShowSettings,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl text-var-grey-900 font-semibold">Voice & Text Chat</h2>
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
  );
};

export default ChatHeader;
