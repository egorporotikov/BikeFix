'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { listRepairRequests } from "@/lib/api";
import type { RepairRequest } from "@/types";

export default function RepairRequestsPage() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        const result = await listRepairRequests();
        setRequests(result);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load requests.");
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Repair requests</h1>
          <p className="mt-2 text-slate-600">Browse active requests and follow up on each job.</p>
        </div>
        <Link href="/upload" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          New request
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading requests...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-600">No repair requests found.</p>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Request #{request.id}</h2>
                  <p className="text-sm text-slate-500">{request.location}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700">
                  {request.status}
                </span>
              </div>
              <p className="mt-4 text-slate-700">{request.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>Photo:</span>
                <a href={request.photo_url} target="_blank" rel="noreferrer" className="font-medium text-sky-600 hover:underline">
                  View image
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/requests/${request.id}`} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                  View details
                </Link>
                <Link href={`/chat/${request.id}`} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Open chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
