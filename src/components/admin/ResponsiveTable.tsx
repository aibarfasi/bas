import type { ReactNode } from "react";

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
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs">{mobileActions(row)}</div>
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
              <tr key={rowKey(row)} className="border-t border-bas-hairline">
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
      className={`h-10 shrink-0 rounded-[6px] px-3 text-sm ${
        active ? "bg-bas-primary text-bas-on-primary" : "bg-bas-card"
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

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-[12px] bg-bas-card" />
      ))}
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
      className="h-11 w-full rounded-[6px] border border-bas-hairline bg-bas-canvas px-3 text-base text-bas-heading md:h-10 md:max-w-md md:text-sm"
    />
  );
}
