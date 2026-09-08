import type { ReactNode } from "react";

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-bas-heading sm:text-2xl">{title}</h1>
        {desc ? <p className="mt-1 max-w-2xl text-sm leading-6 text-bas-muted">{desc}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:flex-wrap lg:w-auto [&>a]:w-full [&>a]:sm:w-auto [&>button]:w-full [&>button]:sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
