"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { setAuthToken } from "@/lib/apiClient";
import { getUnreadNotificationsCount } from "@/lib/api";

type AuthUser = {
  auth_id: string;
  profile_id: string;
  email?: string | null;
  role: string;
  token?: string | null;

  name?: string | null;
  username?: string | null;
  city?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
} | null;

type SupabaseAuthContextValue = {
  supabase: SupabaseClient | null;
  session: Session | null;
  user: AuthUser;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(
  undefined
);

async function getUserFromSession(
  supabase: SupabaseClient,
  session: Session | null
): Promise<AuthUser> {
  if (!session?.user) return null;

  const authId = session.user.id;
  const email = session.user.email ?? null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, role, username, email, name, city, bio, profile_image_url"
    )
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) {
    console.error("Profile load error:", error);
    return null;
  }

  if (!data) return null;

  return {
    auth_id: authId,
    profile_id: data.id,
    email,
    role: data.role,
    token: session.access_token ?? null,

    name: data.name,
    username: data.username,
    city: data.city,
    bio: data.bio,
    profile_image_url: data.profile_image_url,
  };
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const supabaseClient = useMemo(() => getBrowserSupabaseClient(), []);

  // ---------------- AUTH + SESSION ----------------
  useEffect(() => {
    const supabase = supabaseClient;
    let mounted = true;

    async function updateSessionState(session: Session | null) {
      if (!mounted) return;

      setSession(session);

      const authUser = await getUserFromSession(supabase, session);
      if (!mounted) return;

      setUser(authUser);

      if (authUser?.token) {
        setAuthToken(authUser.token);
      }

      try {
        if (authUser?.profile_id) {
          const res = await getUnreadNotificationsCount();
          setUnreadCount(res.unread_count ?? 0);
        } else {
          setUnreadCount(0);
        }
      } catch {}
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        await updateSessionState(newSession);
        if (mounted) setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data }) => {
      updateSessionState(data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  // ---------------- UNREAD COUNT REFRESH ----------------
  const refreshUnreadCount = useCallback(async () => {
    try {
      if (!user?.profile_id) {
        setUnreadCount(0);
        return;
      }
      const res = await getUnreadNotificationsCount();
      setUnreadCount(res.unread_count ?? 0);
    } catch (err) {
      console.error("Failed to refresh unread count", err);
    }
  }, [user]);

  // ---------------- REALTIME NOTIFICATIONS ----------------
  useEffect(() => {
    if (!user?.profile_id) return;

    const supabase = supabaseClient;
    if (!supabase) return;

    const channel = supabase.channel(`notifications-${user.profile_id}`);

    // Register handler BEFORE subscribe
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `recipient_profile_id=eq.${user.profile_id}`,
      },
      () => {
        refreshUnreadCount();
      }
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();        // 🔥 обязательно
      supabase.removeChannel(channel); // 🔥 обязательно
    };
  }, [refreshUnreadCount, supabaseClient, user?.profile_id]);

  // ---------------- UNREAD COUNT POLLING ----------------
  useEffect(() => {
    if (!user?.profile_id) return;

    const load = async () => {
      try {
        const res = await fetch("/api/notifications/unread");
        const json = await res.json();
        setUnreadCount(json.unread ?? 0);
      } catch (err) {
        console.error("Failed to load unread notifications", err);
      }
    };

    load();
    const interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, [user?.profile_id]);

  // ---------------- SIGN OUT ----------------
  const signOut = useCallback(async () => {
    const supabase = supabaseClient;
    if (!supabase) return;
    await supabase.auth.signOut();

    setSession(null);
    setUser(null);
    setAuthToken(null);

    router.replace("/auth/login");
  }, [router, supabaseClient]);

  const value = useMemo(
    () => ({
      supabase: supabaseClient,
      session,
      user,
      role: user?.role ?? null,
      loading,
      signOut,
      unreadCount,
      refreshUnreadCount,
    }),
    [session, user, loading, signOut, unreadCount, refreshUnreadCount, supabaseClient]
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context)
    throw new Error("useSupabaseAuth must be used within SupabaseProvider");
  return context;
}
