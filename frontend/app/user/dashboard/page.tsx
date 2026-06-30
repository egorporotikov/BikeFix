"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserRepairRequests } from '@/lib/api';
import { useSupabaseAuth } from '@/context/SupabaseProvider';
import LogoutButton from '@/app/components/LogoutButton';

interface RepairRequestPreview {
  id: string;
  title: string;
  status: string;
  created_at: string;
  mechanic_profile_id: string | null;
  mechanic_name?: string;
  is_verified?: boolean | null;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};

export default function UserDashboard() {
  const { user } = useSupabaseAuth();
  const [requests, setRequests] = useState<RepairRequestPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wait for user to load before rendering
  useEffect(() => {
    if (!user) return; // Wait for SupabaseProvider to load profile

    async function loadRequests() {
      try {
        const data = await getUserRepairRequests();

        const sorted = Array.isArray(data)
          ? [...data].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
          : [];

        setRequests(sorted.slice(0, 3));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load your requests.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [user]);

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // Show loading state while user profile is loading
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-600">Loading profile…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your dashboard</h1>
            <p className="mt-2 text-slate-600">
              Manage your repair requests and stay connected with mechanics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LogoutButton />
            <Link
              href="/user/create-request"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Create Request
            </Link>
            <Link
              href="/user/requests"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              My Requests
            </Link>
            <Link
              href="/user/profile"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Profile
            </Link>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Recent requests
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Preview your latest repair requests.
                  </p>
                </div>
                <Link
                  href="/user/requests"
                  className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                >
                  View all →
                </Link>
              </div>

              {loading ? (
                <div className="mt-8 text-slate-600">Loading requests…</div>
              ) : error ? (
                <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : requests.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  <p className="mb-3">No repair requests found yet.</p>
                  <Link
                    href="/user/create-request"
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create your first request
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {requests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/user/request/${request.id}`}
                      className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {request.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Created {formatDate(request.created_at)}
                          </p>
                          {request.mechanic_profile_id && (
                            <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
                              Assigned to {request.mechanic_name || request.mechanic_profile_id}
                              {request.is_verified && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100">
                                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              statusStyles[request.status] ??
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {request.status}
                          </span>
                          {request.mechanic_profile_id && (
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Quick actions
              </h2>
              <div className="mt-6 space-y-3">
                <Link
                  href="/user/create-request"
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Create a new repair request
                </Link>
                <Link
                  href="/user/requests"
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Browse all my requests
                </Link>
                <Link
                  href="/user/profile"
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  View profile details
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
