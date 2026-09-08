import Link from "next/link";
import type { ReactNode } from "react";
import { IconSearch } from "@/components/admin/icons";

export type Column<T> = {
  label: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export function ResponsiveTable<T>({
  rows,
  rowKey,
  columns,
  leading,
  mobilePrimary,
  mobileSecondary,
  mobileActions,
  empty,
}: {
  rows: T[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  leading?: (row: T) => ReactNode;
  mobilePrimary: (row: T) => ReactNode;
  mobileSecondary?: (row: T) => ReactNode;
  mobileActions?: (row: T) => ReactNode;
  empty?: ReactNode;
}) {
  if (!rows.length) {
    return <>{empty ?? <p className="mt-4 text-sm text-bas-muted">Nothing here yet.</p>}</>;
  }

  return (
    <>
      <div className="mt-4 space-y-3 lg:hidden">
        {rows.map((row) => (
          <article
            key={rowKey(row)}
            className="rounded-[12px] border border-bas-hairline bg-bas-card p-4"
          >
            <div className="flex items-start gap-3">
              {leading ? <div className="pt-1">{leading(row)}</div> : null}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-bas-heading">{mobilePrimary(row)}</div>
                {mobileSecondary ? (
                  <div className="mt-1 text-xs text-bas-muted">{mobileSecondary(row)}</div>
                ) : null}
              </div>
            </div>
            {mobileActions ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">{mobileActions(row)}</div>
            ) : null}
          </article>
        ))}
      </div>
      <div className="mt-4 hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-bas-muted">
            <tr>
              {leading ? <th className="pb-2 font-medium" /> : null}
              {columns.map((col) => (
                <th key={col.label} className={`pb-2 font-medium ${col.className ?? ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-bas-hairline hover:bg-bas-elevated/70">
                {leading ? <td className="py-3">{leading(row)}</td> : null}
                {columns.map((col) => (
                  <td key={col.label} className={`py-3 ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div className="admin-chips -mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 shrink-0 rounded-[8px] border px-3 text-sm ${
        active
          ? "border-bas-primary bg-bas-primary text-bas-on-primary"
          : "border-bas-hairline bg-bas-card text-bas-body hover:bg-bas-elevated"
      }`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-[12px] border border-dashed border-bas-hairline px-4 py-10 text-center">
      <p className="text-sm font-semibold text-bas-heading">{title}</p>
      <p className="mt-1 text-sm text-bas-muted">{body}</p>
    </div>
  );
}

export function StatusBanner({
  tone = "neutral",
  title,
  body,
}: {
  tone?: "up" | "down" | "neutral" | "warn";
  title: string;
  body?: ReactNode;
}) {
  const box = {
    up: "border-bas-up/40 bg-bas-up/10",
    down: "border-bas-down/40 bg-bas-down/10",
    warn: "border-bas-primary/40 bg-bas-primary/10",
    neutral: "border-bas-hairline bg-bas-card",
  }[tone];
  const heading = {
    up: "text-bas-up",
    down: "text-bas-down",
    warn: "text-bas-heading",
    neutral: "text-bas-heading",
  }[tone];
  return (
    <div className={`mt-5 rounded-[12px] border p-4 ${box}`}>
      <p className={`text-sm font-semibold ${heading}`}>{title}</p>
      {body ? <div className="mt-1 text-xs text-bas-muted">{body}</div> : null}
    </div>
  );
}

export function StatGrid({
  items,
  cols = "grid-cols-2 sm:grid-cols-4",
}: {
  items: { n: ReactNode; l: string; href?: string }[];
  cols?: string;
}) {
  return (
    <div className={`mt-5 grid gap-3 ${cols}`}>
      {items.map((c) => {
        const inner = (
          <>
            <div className="num text-xl font-semibold text-bas-primary">{c.n}</div>
            <div className="mt-0.5 text-[11px] text-bas-muted">{c.l}</div>
          </>
        );
        if (c.href) {
          return (
            <Link
              key={c.l}
              href={c.href}
              className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3 hover:bg-bas-elevated"
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={c.l} className="rounded-[12px] border border-bas-hairline bg-bas-card px-3 py-3">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-[12px] bg-bas-card" />
      ))}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-md">
      <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-bas-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="admin-field h-11 w-full py-2 pr-3 pl-9 text-base md:h-10 md:text-sm"
      />
    </div>
  );
}

export function FieldInput({
  value,
  onChange,
  placeholder,
  type = "search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="admin-field h-11 w-full px-3 text-base md:h-10 md:max-w-md md:text-sm"
    />
  );
}
