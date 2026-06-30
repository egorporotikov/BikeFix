"use client";

import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseProvider';
import type { ChatMessage } from '@/types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { listChatMessages, sendChatMessage } from '@/lib/api';

export default function ChatWindow({ chatId }: { chatId: string }) {
  const { user } = useSupabaseAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [senderId, setSenderId] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSenderId(user?.profile_id ?? null);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      try {
        setError(null);

        const data = await listChatMessages(chatId);
        if (!mounted) return;

        const loadedMessages = (data as ChatMessage[])
          .slice()
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        setMessages(loadedMessages);
      } catch (err) {
        console.error('Failed to load chat messages', err);
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load chat messages.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!chatId) {
      setLoading(false);
      setError('Chat identifier is missing.');
      return;
    }

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!senderId || !user) {
      setError('You must be logged in to send messages.');
      return;
    }

    setSending(true);
    try {
      setError(null);
      const newMessage = await sendChatMessage(chatId, { content });
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error('Failed to send message', err);
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <div>Chat loaded from the backend API.</div>
          <div className="font-mono text-slate-400">{chatId}</div>
        </div>
        {error ? (
          <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        {loading ? (
          <div className="p-6 text-slate-600">Loading messages…</div>
        ) : (
          <MessageList messages={messages} currentSenderId={senderId} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={handleSend} disabled={!senderId || sending} />
    </div>
  );
}
