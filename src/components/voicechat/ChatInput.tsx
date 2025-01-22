// ChatInput.tsx
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  isListening: boolean;
  speaking: boolean;
  isLoading: boolean;
  textInput: string;
  transcript: string;
  setTextInput: (value: string) => void;
  startListening: () => void;
  stopListening: () => void;
  sendMessage: (content: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  speaking,
  isLoading,
  textInput,
  transcript,
  setTextInput,
  sendMessage,
}) => {
  return (
    <div className="mt-8 flex items-center gap-4">
      <div className="flex-1 flex items-center text-var-black gap-4">

        <Input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
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
  );
};

export default ChatInput;
