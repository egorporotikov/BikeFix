"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";   // Required for navigation
import { useSupabaseAuth } from '@/context/SupabaseProvider';
import { getUserRepairRequests } from '@/lib/api';
import DashboardBackButton from '@/app/components/DashboardBackButton';

interface RepairRequest {
  id: string;
  title: string;
  status: string;
  created_at: string;
  mechanic_profile_id: string | null;
  mechanic_name?: string;
  is_verified?: boolean | null;
}

export default function UserRequestsPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const profileId = user?.profile_id;
        if (!profileId) {
        throw new Error('User not authenticated. Please log in.');
        }

        const data = await getUserRepairRequests();
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <DashboardBackButton className="mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Repair Requests</h1>
          <Link
            href="/user/create-request"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Request
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading requests...</p>
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 mb-4">You have no repair requests yet.</p>
            <Link
              href="/user/create-request"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Create Your First Request
            </Link>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map(request => (
              <Link key={request.id} href={`/user/request/${request.id}`}>
                <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Created: {formatDate(request.created_at)}</p>
                      {request.mechanic_profile_id && (
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
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
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.mechanic_profile_id && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
