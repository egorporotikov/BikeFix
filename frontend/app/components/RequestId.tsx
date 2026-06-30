'use client';

interface RequestIdProps {
  value: string;
  className?: string;
}

export default function RequestId({ value, className = "" }: RequestIdProps) {
  const normalizedValue = value?.trim() ?? "";
  const displayValue = normalizedValue.length > 8
    ? `${normalizedValue.slice(0, 8)}…`
    : normalizedValue;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={normalizedValue}
    >
      <span className="mr-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">REQ</span>
      <span className="font-mono">#{displayValue}</span>
    </span>
  );
}
