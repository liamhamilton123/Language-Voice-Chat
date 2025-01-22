// ChatHistory.tsx
import React from 'react';
import { CardHeader, CardContent, CardTitle } from '../ui/card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  messagesEndRef,
}) => {
  return (
    <>
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
                  ? ' message-user ml-auto max-w-[80%]'
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
    </>
  );
};

export default ChatHistory;
