'use client';

import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseProvider';

interface DashboardBackButtonProps {
  className?: string;
}

export default function DashboardBackButton({ className = '' }: DashboardBackButtonProps) {
  const { role } = useSupabaseAuth();

  const dashboardPath = role === 'mechanic' ? '/mechanic/dashboard' : '/user/dashboard';

  return (
    <Link
      href={dashboardPath}
      className={`inline-block text-blue-600 hover:text-blue-700 transition-colors ${className}`}
    >
      ← Back to Dashboard
    </Link>
  );
}
