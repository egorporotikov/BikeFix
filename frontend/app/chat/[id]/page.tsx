'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listMessages, sendMessage } from "@/lib/api";
import type { Message } from "@/types";

export default function ChatPage() {
  const params = useParams();
  const requestId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderId, setSenderId] = useState(1);
  const [recipientId, setRecipientId] = useState(2);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessages() {
      if (!requestId) return;
      setLoading(true);
      try {
        const result = await listMessages(requestId);
        setMessages(result);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load messages.");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [requestId]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestId) return;

    try {
      const created = await sendMessage({
        request_id: Number(requestId),
        sender_id: senderId,
        recipient_id: recipientId,
        content,
      });
      setMessages((current) => [...current, created]);
      setContent("");
      setStatus("Message sent.");
    } catch (exception) {
      setStatus(exception instanceof Error ? exception.message : "Failed to send message.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Chat for request #{requestId}</h1>
        <p className="mt-2 text-slate-600">Send and view messages for this repair request.</p>
      </div>

      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-slate-600">Loading messages...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : messages.length === 0 ? (
            <p className="text-slate-600">No messages yet for this request.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>From {message.sender_id}</span>
                    <span>To {message.recipient_id}</span>
                  </div>
                  <p className="mt-3 text-slate-700">{message.content}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{new Date(message.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Send a new message</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSend}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Sender ID</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  type="number"
                  min={1}
                  value={senderId}
                  onChange={(event) => setSenderId(Number(event.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Recipient ID</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  type="number"
                  min={1}
                  value={recipientId}
                  onChange={(event) => setRecipientId(Number(event.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Message</label>
              <textarea
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                rows={4}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </div>
            <button className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
              Send message
            </button>
            {status ? <p className="mt-3 text-slate-600">{status}</p> : null}
          </form>
        </div>
      </section>
    </div>
  );
}
