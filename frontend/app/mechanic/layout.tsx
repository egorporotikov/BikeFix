"use client";

import RequireMechanicRole from "../../components/RequireMechanicRole";

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return <RequireMechanicRole>{children}</RequireMechanicRole>;
}
