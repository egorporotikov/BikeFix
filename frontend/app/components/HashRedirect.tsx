"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash && hash.includes("access_token")) {
      router.replace("/auth/callback" + hash);
    }
  }, [router]);

  return null;
}