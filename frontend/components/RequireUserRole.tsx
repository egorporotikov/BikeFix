"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSupabaseAuth } from "@/context/SupabaseProvider";

export default function RequireUserRole({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useSupabaseAuth();
  const role = user?.role;

  // Routes that do NOT require authentication
  const publicRoutes = [
    "/auth/callback",
    "/auth/success",
    "/auth/login",
    "/auth/register",
  ];

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (isPublic) return; // Skip public routes
    if (loading) return;

    if (role !== "user") {
      router.replace("/auth/login");
    }
  }, [router, role, loading, isPublic]);

  // Show loading spinner only if route is protected
  if (!isPublic && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If route is protected and role is not user — render nothing
  if (!isPublic && role !== "user") return null;

  return <>{children}</>;
}
