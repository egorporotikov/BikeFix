"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getChatByRequestId, getRepairRequest } from "@/lib/api";
import ChatWindow from "@/app/components/ChatWindow";
import DashboardBackButton from "@/app/components/DashboardBackButton";
import { useSupabaseAuth } from "@/context/SupabaseProvider";
import type { Chat, RepairRequest } from "@/types";

export default function ChatPage() {
  const params = useParams();
  const requestId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const { role } = useSupabaseAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    let mounted = true;

    const loadChat = async () => {
      setLoading(true);
      try {
        const [existingChat, repairRequest] = await Promise.all([
          getChatByRequestId(requestId),
          getRepairRequest(requestId),
        ]);
        if (!mounted) return;
        setChat(existingChat);
        setRequest(repairRequest);
        setError(null);
      } catch (exception) {
        if (!mounted) return;
        setError(exception instanceof Error ? exception.message : "Unable to load chat.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadChat();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  const participantName = useMemo(() => {
    if (role === "mechanic") {
      return (
        request?.requester_name?.trim() ||
        request?.requester_profile_id?.trim() ||
        "Conversation"
      );
    }

    if (role === "user") {
      return (
        request?.mechanic_name?.trim() ||
        request?.mechanic_profile_id?.trim() ||
        "Conversation"
      );
    }

    return "Conversation";
  }, [request, role]);

  if (!requestId) {
    return <div className="p-6">No request selected for chat.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <DashboardBackButton className="mb-4" />

        {/* Header with avatar */}
        <div className="mb-8 flex items-center gap-4">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-700">
            {participantName[0]?.toUpperCase()}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Chat with{" "}
              <span className="text-sky-600 font-bold">{participantName}</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Messages are synced in realtime using Supabase.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-slate-600">
            Loading chat...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm text-red-700">
            {error}
          </div>
        ) : !chat ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-slate-600">
            Chat not found.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-[70vh]">
              <ChatWindow chatId={chat.id} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
