"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMechanicRepairRequests } from "@/lib/api";
import { useSupabaseAuth } from "@/context/SupabaseProvider";
import { useRouter } from "next/navigation";

interface MechanicJobPreview {
  id: string;
  title: string;
  status: string;
  user_name?: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

export default function MechanicDashboard() {
  const { user, signOut } = useSupabaseAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<MechanicJobPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wait for user to load before rendering
  useEffect(() => {
    if (!user) return; // Wait for SupabaseProvider to load profile

    async function loadJobs() {
      try {
        const data = await getMechanicRepairRequests();

        const acceptedJobs = Array.isArray(data)
          ? data.filter((item) => item.status === "accepted")
          : [];

        const sorted = [...acceptedJobs].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        setJobs(sorted.slice(0, 3));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load accepted jobs."
        );
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [user]);

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
            <h1 className="text-3xl font-bold text-slate-900">
              Mechanic dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              Track new requests and keep your accepted jobs moving.
            </p>
          </div>

          {/* Action buttons + Logout */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/mechanic/requests"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Pending Requests
            </Link>

            <Link
              href="/mechanic/jobs"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              My Jobs
            </Link>

            <Link
              href="/mechanic/profile"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Profile
            </Link>

            {/* 🔥 Logout */}
            <button
              onClick={async () => {
                await signOut();
                router.replace("/auth/login");
              }}
              className="rounded-2xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Accepted jobs
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your latest jobs accepted from customers.
                  </p>
                </div>
                <Link
                  href="/mechanic/jobs"
                  className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                >
                  View all →
                </Link>
              </div>

              {loading ? (
                <div className="mt-8 text-slate-600">
                  Loading accepted jobs…
                </div>
              ) : error ? (
                <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : jobs.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  <p className="mb-3">No accepted jobs yet.</p>
                  <Link
                    href="/mechanic/requests"
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Review pending requests
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/mechanic/jobs/${job.id}`}
                      className="group block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="pointer-events-none flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                            {job.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Requested by {job.user_name ?? "customer"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Accepted {formatDate(job.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`pointer-events-none rounded-full px-3 py-1 text-sm font-semibold ${
                              statusStyles[job.status] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {job.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/chat/${job.id}`);
                            }}
                            className="pointer-events-auto rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                          >
                            Open chat
                          </button>
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
                  href="/mechanic/requests"
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Browse pending requests
                </Link>
                <Link
                  href="/mechanic/jobs"
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Review accepted jobs
                </Link>
                <Link
                  href="/mechanic/profile"
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
