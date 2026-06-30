'use client';

import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseProvider';
import NotificationBell from '@/app/components/NotificationBell';

export default function HeaderNav() {
  const { user, loading } = useSupabaseAuth();

  // Determine the navigation link based on user role
  const getHomeLink = () => {
    // If still loading, don't render yet to avoid hydration mismatch
    if (loading) {
      return '/auth/login';
    }

    if (!user) {
      return '/auth/login';
    }

    if (user.role === 'mechanic') {
      return '/mechanic/dashboard';
    }

    return '/user/dashboard';
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 py-4 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
        <Link href={getHomeLink()} className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
          BikeFix
        </Link>
        {user ? <NotificationBell /> : null}
      </div>
    </header>
  );
}
