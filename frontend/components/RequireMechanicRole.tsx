"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from '@/context/SupabaseProvider';

export default function RequireMechanicRole({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSupabaseAuth();
  const role = user?.role;

  useEffect(() => {
    if (loading) return;
    if (role !== "mechanic") {
      router.replace('/auth/login');
    }
  }, [router, role, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (role !== "mechanic") return null;
  return <>{children}</>;
}
