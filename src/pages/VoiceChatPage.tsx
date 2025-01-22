// src/pages/VoiceChatPage.tsx
import React from 'react';
import VoiceChat from '../components/voicechat/VoiceChat';

const VoiceChatPage: React.FC = () => {
  return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl text-var-grey-700 font-bold mb-8 text-center">Voice Chat Assistant</h1>
        <VoiceChat />
      </div>
  );
};

export default VoiceChatPage;