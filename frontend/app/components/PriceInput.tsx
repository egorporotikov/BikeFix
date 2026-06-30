'use client';

import { useState } from "react";

interface PriceInputProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

function formatDisplayValue(rawValue: string) {
  const sanitized = rawValue.replace(/[^\d,.-]/g, "");
  if (!sanitized) {
    return "";
  }

  const normalized = sanitized.replace(/\./g, "").replace(",", ".");
  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return `${new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue)} €`;
}

export default function PriceInput({
  value,
  onValueChange,
  label = "Offer price",
  placeholder = "0,00",
  className = "",
}: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value === null || value === undefined) {
      return "";
    }

    return formatDisplayValue(String(value).replace(".", ","));
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setDisplayValue(formatDisplayValue(nextValue));

    const sanitized = nextValue.replace(/[^\d,.-]/g, "");
    if (!sanitized) {
      onValueChange(null);
      return;
    }

    const normalized = sanitized.replace(/\./g, "").replace(",", ".");
    const numericValue = Number(normalized);
    onValueChange(Number.isFinite(numericValue) ? numericValue : null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative mt-2">
        <input
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/20 focus-visible:ring-offset-2"
          inputMode="decimal"
          type="text"
          value={displayValue}
          placeholder={placeholder}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
