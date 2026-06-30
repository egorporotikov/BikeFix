'use client';

import Link from 'next/link';

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">BikeFix</h1>
          <p className="text-lg text-slate-600">Select your role to continue</p>
        </div>

        <div className="grid gap-6">
          {/* User Dashboard Link */}
          <Link
            href="/user/dashboard"
            className="rounded-3xl border-2 border-slate-200 bg-white p-8 text-center transition-all hover:border-blue-500 hover:shadow-lg hover:bg-blue-50"
          >
            <div className="text-4xl mb-3">👤</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">User Dashboard</h2>
            <p className="text-slate-600">Manage your repair requests, browse mechanics, and leave reviews</p>
          </Link>

          {/* Mechanic Dashboard Link */}
          <Link
            href="/mechanic/dashboard"
            className="rounded-3xl border-2 border-slate-200 bg-white p-8 text-center transition-all hover:border-blue-500 hover:shadow-lg hover:bg-blue-50"
          >
            <div className="text-4xl mb-3">🔧</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Mechanic Dashboard</h2>
            <p className="text-slate-600">View repair requests, submit bids, and manage your accepted jobs</p>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-2xl bg-white border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Need help?</h3>
          <p className="text-slate-600">
            BikeFix connects bike owners with expert mechanics. Choose your role above to get started.
          </p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
