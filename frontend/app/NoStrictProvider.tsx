"use client";

import { useRef, useState, useEffect } from "react";

export default function NoStrictProvider({ children }: { children: React.ReactNode }) {
  const rendered = useRef(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!rendered.current) {
      rendered.current = true;
      setShouldRender(true);
    }
  }, []);

  if (!shouldRender) return null;

  return <>{children}</>;
}
