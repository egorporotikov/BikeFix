"use client";

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentProfile, updateProfile, uploadAvatar } from '@/lib/api';
import DashboardBackButton from '@/app/components/DashboardBackButton';
import type { Profile } from '@/types';

export default function EditUserProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentProfile();
        setProfile(data);
        setName(data.name ?? '');
        setCity(data.city ?? '');
        setBio(data.bio ?? '');
        setAvatarPreview(data.profile_image_url ?? null);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load profile');
      }
    };

    loadProfile();
  }, []);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setFileUploading(true);

    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      setAvatarPreview(updated.profile_image_url ?? null);
      setStatusMessage('Avatar uploaded successfully');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Avatar upload failed');
    } finally {
      setFileUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setSaving(true);

    try {
      await updateProfile({ name, city, bio });
      setStatusMessage('Profile saved successfully. Redirecting...');
      router.push('/user/profile');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl text-center py-12">
          <p className="text-slate-500">Loading profile settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <DashboardBackButton className="mb-4" />
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit profile</h1>
            <p className="mt-2 text-slate-600">Update your public user profile and avatar.</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
              {errorMessage}
            </div>
          )}
          {statusMessage && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
              {statusMessage}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
            <div className="space-y-4 text-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile.name ?? profile.username ?? 'Profile avatar'}
                  className="mx-auto h-40 w-40 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-slate-200 text-4xl font-bold text-slate-600">
                  {profile.name?.charAt(0) ?? profile.username?.charAt(0) ?? 'U'}
                </div>
              )}
              <label className="block">
                <span className="sr-only">Upload avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={fileUploading}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-slate-700"
                />
              </label>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/user/profile')}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
