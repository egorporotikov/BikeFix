"use client";

import { useEffect, useState } from 'react';
import { getNotifications, markNotificationAsRead } from '@/lib/api';
import { useSupabaseAuth } from '@/context/SupabaseProvider';
import DashboardBackButton from '@/app/components/DashboardBackButton';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { user, loading: authLoading, refreshUnreadCount } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.profile_id) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    // Only depend on profile_id to avoid re-fetch loops
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profile_id, authLoading]);

  const handleMarkRead = async (notificationId: string) => {
    try {
      const updated = await markNotificationAsRead(notificationId);
      setNotifications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      // Refresh global unread counter
      try {
        await refreshUnreadCount();
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl text-center py-12">
          <p className="text-slate-600">Please log in to view your notifications.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <DashboardBackButton className="mb-4" />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="mt-2 text-slate-600">See recent updates across your requests, offers, and chat.</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          {loading ? (
            <p className="text-slate-600">Loading notifications…</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-3xl border px-5 py-4 transition ${
                    notification.is_read
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-blue-300 bg-blue-50 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-500 whitespace-pre-wrap">{notification.body}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{new Date(notification.created_at).toLocaleString()}</p>
                      {!notification.is_read ? (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Mark read
                        </button>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">Read</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
