"use client";

import React from 'react';
import { ChatMessage } from '@/types';

export default function MessageList({ messages, currentSenderId }: { messages: ChatMessage[]; currentSenderId?: string | null }) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-slate-500">
        No messages yet. Start the conversation by sending the first message.
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 py-6">
      {messages.map((m) => {
        const mine = currentSenderId && m.sender_profile_id === currentSenderId;
        const senderDisplay = mine ? 'You' : (m.sender_name || (m.sender_role === 'mechanic' ? 'Mechanic' : 'Customer'));
        
        return (
          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-sm ${mine ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
              <div className={`mb-2 text-xs uppercase tracking-[0.18em] flex items-center gap-2 ${mine ? 'text-blue-200' : 'text-slate-400'}`}>
                <span>{senderDisplay}</span>
                {!mine && m.is_verified && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100">
                    <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <div>{m.content}</div>
              <div className={`mt-3 text-[11px] text-right ${mine ? 'text-blue-200' : 'text-slate-400'}`}>{new Date(m.created_at).toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
