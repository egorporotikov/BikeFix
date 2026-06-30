"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseProvider';
import { getMechanicRepairRequests } from '@/lib/api';
import DashboardBackButton from '@/app/components/DashboardBackButton';

interface MechanicJob {
  id: string;
  title: string;
  status: string;
  user_name?: string;
}

export default function MechanicJobsPage() {
  const { user } = useSupabaseAuth();
  const [jobs, setJobs] = useState<MechanicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        if (!user?.profile_id) {
          throw new Error('Mechanic profile not found. Please log in again.');
        }

        const data = await getMechanicRepairRequests();
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <DashboardBackButton className="mb-4" />
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Jobs</h1>
          <p className="text-sm text-gray-500">Open chat with requesters when ready.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-600">Loading mechanic jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">No assigned jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                    <p className="text-gray-600 mt-1">User: {job.user_name || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(job.status)}`}>
                      {job.status}
                    </span>
                    <Link
                      href={`/chat/${job.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
                    >
                      Open Chat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
