'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getRepairRequest, completeRepairRequest } from '@/lib/api';
import DashboardBackButton from '@/app/components/DashboardBackButton';

interface MechanicJob {
  id: string;
  title: string;
  description: string;
  address: string;
  category: string;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function MechanicJobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const router = useRouter();

  const [job, setJob] = useState<MechanicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await getRepairRequest(jobId);
        setJob(data as MechanicJob);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCompleteJob = async () => {
    if (!jobId) return;
    setCompleting(true);

    try {
      const updated = await completeRepairRequest(jobId);
      setJob(updated as MechanicJob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete job');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl text-center py-8">
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <DashboardBackButton className="mb-4" />
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
            {error || 'Job not found'}
          </div>
          <Link href="/mechanic/jobs" className="text-blue-600 hover:text-blue-700">
            ← Back to My Jobs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <DashboardBackButton className="mb-4" />

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-lg font-semibold">{job.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-lg font-semibold">{job.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Accepted</p>
              <p className="text-lg font-semibold">{formatDate(job.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Updated</p>
              <p className="text-lg font-semibold">{formatDate(job.updated_at)}</p>
            </div>
          </div>

          <div className="mb-6 border-t pt-6">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.image_url && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold mb-3">Image</h2>
              <img src={job.image_url} alt={job.title} className="mt-3 max-w-full h-auto rounded-lg shadow" />
            </div>
          )}

          {/* Action buttons */}
          <div className="mb-6 border-t pt-6">
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/chat/${job.id}`}
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Open Chat
              </Link>

              {job.status === 'accepted' && (
                <button
                  type="button"
                  onClick={handleCompleteJob}
                  disabled={completing}
                  className="inline-block rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {completing ? 'Completing…' : 'Mark as completed'}
                </button>
              )}
            </div>
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
