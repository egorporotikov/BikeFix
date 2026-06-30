"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from '@/context/SupabaseProvider';

export default function AuthSuccessPage() {
  const router = useRouter();
  const { session, role, loading } = useSupabaseAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    if (!role) {
      // Waiting for profile to load from database
      return;
    }

    router.replace(role === 'mechanic' ? '/mechanic/dashboard' : '/user/dashboard');
  }, [loading, role, session, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-slate-600">Finalizing authentication and redirecting...</p>
      </div>
    </main>
  );
}
