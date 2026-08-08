import { useState, useCallback } from 'react';
import { WebRTCManager } from '../services/webrtc/WebRTCManager.js';
import { ChatMessage } from '../types/index.js';

export function useChat(webrtc: WebRTCManager | null, userId?: string, userName?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!webrtc || !content.trim()) return;

      const newMsg: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: userId || 'local-user',
        senderName: userName || 'You',
        content: content.trim(),
        timestamp: Date.now(),
      };

      const success = webrtc.sendChatMessage(newMsg);
      if (success) {
        setMessages((prev) => [...prev, newMsg]);
      }
    },
    [webrtc, userId, userName]
  );

  const addSystemMessage = useCallback((content: string) => {
    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'System',
      content,
      timestamp: Date.now(),
      isSystem: true,
    };
    setMessages((prev) => [...prev, sysMsg]);
  }, []);

  const handleIncomingChatMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return {
    messages,
    sendMessage,
    addSystemMessage,
    handleIncomingChatMessage,
  };
}
