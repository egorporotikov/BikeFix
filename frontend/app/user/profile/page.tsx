"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentProfile } from '@/lib/api';
import type { Profile } from '@/types';

export default function UserProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentProfile();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl text-center py-12">
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <p className="text-red-600">{error || 'Profile not found.'}</p>
            <Link href="/user/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your profile</h1>
            <p className="mt-2 text-slate-600">Review your account details and role settings.</p>
          </div>
          <Link href="/user/profile/edit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Edit profile
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name ?? profile.username ?? 'Avatar'}
                  className="mx-auto h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-slate-200 text-4xl font-bold text-slate-600">
                  {profile.name?.charAt(0) ?? profile.username?.charAt(0) ?? 'U'}
                </div>
              )}

              <div className="mt-6 space-y-3 text-left">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">Name</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{profile.name ?? profile.username ?? 'Unnamed user'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">City</p>
                  <p className="mt-1 text-slate-700">{profile.city ?? 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Profile ID</h2>
                  <p className="mt-2 text-lg font-medium text-slate-900">{profile.id}</p>
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Email</h2>
                  <p className="mt-2 text-lg font-medium text-slate-900">{profile.email ?? 'Not available'}</p>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Role</h2>
                <p className="mt-2 text-lg font-medium text-slate-900 capitalize">{profile.role ?? 'user'}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">About</h2>
                <p className="mt-4 text-slate-700 whitespace-pre-wrap">{profile.bio ?? 'No bio provided yet.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
