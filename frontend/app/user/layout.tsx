"use client";

import RequireUserRole from "../../components/RequireUserRole";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <RequireUserRole>{children}</RequireUserRole>;
}
