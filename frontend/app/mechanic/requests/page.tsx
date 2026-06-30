"use client";

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import Link from 'next/link';import DashboardBackButton from '@/app/components/DashboardBackButton';
interface PendingRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  user_name?: string;
}

export default function MechanicRequestsPage() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await apiClient.get('/repair-requests/pending');
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <DashboardBackButton className="mb-4" />
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Available Repair Requests</h1>
            <p className="text-sm text-gray-500">Submit offers to win new jobs.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-600">Loading pending requests...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">No pending repair requests available right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{request.title}</h2>
                    <p className="text-gray-600 mt-2">{request.description}</p>
                    <p className="text-sm text-gray-500 mt-3">Address: {request.address}</p>
                    <p className="text-sm text-gray-500 mt-1">User: {request.user_name || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/requests/${request.id}`}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-800"
                    >
                      Review & Offer
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
