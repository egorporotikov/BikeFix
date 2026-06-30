"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseProvider';

export default function NotificationBell() {
  const { user, unreadCount, loading } = useSupabaseAuth();

  const badge = useMemo(() => {
    if (loading || unreadCount <= 0) return null;
    return (
      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    );
  }, [loading, unreadCount]);

  return (
    <Link href="/notifications" className="relative inline-flex items-center rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {badge}
    </Link>
  );
}
