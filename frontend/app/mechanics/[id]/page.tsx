"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMechanicProfile } from '@/lib/api';
import type { MechanicProfile } from '@/types';

export default function MechanicPublicProfilePage() {
  const params = useParams();
  const mechanicId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  const [profile, setProfile] = useState<MechanicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.name || profile?.email || profile?.username || 'Mechanic';

  useEffect(() => {
    if (!mechanicId) return;

    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await getMechanicProfile(mechanicId);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mechanic profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mechanicId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl text-center py-12">
          <p className="text-slate-500">Loading mechanic profile...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <p className="text-red-600">{error}</p>
            <Link href="/user/requests" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
              ← Back to my requests
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl text-center py-12">
          <p className="text-slate-500">Mechanic profile not found.</p>
          <Link href="/user/requests" className="text-blue-600 hover:text-blue-700">
            ← Back to my requests
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mechanic profile</h1>
            <p className="mt-2 text-slate-600">Browse the mechanic's public profile and experience.</p>
          </div>
          <Link href="/user/requests" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Back to requests
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name ?? profile.username ?? 'Mechanic avatar'}
                  className="mx-auto h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-600">
                  {profile.name?.charAt(0) ?? profile.username?.charAt(0) ?? 'M'}
                </div>
              )}

              <div className="mt-6 space-y-3 text-left">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">Name</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold text-slate-900">{displayName}</p>
                    {profile.is_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-700">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">Location</p>
                  <p className="mt-1 text-slate-700">{profile.city ?? 'Unknown'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-3xl bg-slate-100 p-4 text-left">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Rating</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{profile.average_rating?.toFixed(1) ?? '0.0'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-100 p-4 text-left">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Reviews</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{profile.total_reviews ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-900">About</h2>
                <p className="mt-4 text-slate-700 whitespace-pre-wrap">{profile.bio ?? 'No bio provided yet.'}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-sm uppercase tracking-wide text-slate-400">Completed jobs</h3>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{profile.completed_jobs_count ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-sm uppercase tracking-wide text-slate-400">Verification status</h3>
                  <div className="mt-3 flex items-center gap-2">
                    {profile.is_verified ? (
                      <>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="text-lg font-semibold text-green-700">Verified mechanic</span>
                      </>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-sm font-semibold">Not verified</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm uppercase tracking-wide text-slate-400">Public profile id</h3>
                <p className="mt-2 text-slate-700 break-all">{profile.id}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Reviews</h2>
          {!profile.reviews || profile.reviews.length === 0 ? (
            <p className="text-slate-600">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {profile.reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{r.user_name ?? 'Anonymous'}</p>
                      <p className="text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-slate-800 text-lg font-semibold">
                      {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  {r.comment ? <p className="mt-3 text-slate-700">{r.comment}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>

      </div> {/* Closing div for profile grid */}

    </main>
  );
}

