// src/pages/VoiceChatPage.tsx
import React from 'react';
import VoiceChat from '../components/VoiceChat';

const VoiceChatPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Voice Chat Assistant</h1>
        <VoiceChat />
      </div>
    </div>
  );
};

export default VoiceChatPage;