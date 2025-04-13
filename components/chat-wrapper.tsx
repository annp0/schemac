"use client";

import { useState, useEffect } from 'react';
import { Chat } from '@/components/chat';
import { UIMessage } from 'ai';
import { VisibilityType } from './visibility-selector';

export function ChatWrapper({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="min-h-screen">Loading chat interface...</div>;
  }

  return (
    <Chat
      id={id}
      initialMessages={initialMessages}
      selectedChatModel={selectedChatModel}
      selectedVisibilityType={selectedVisibilityType}
      isReadonly={isReadonly}
    />
  );
}