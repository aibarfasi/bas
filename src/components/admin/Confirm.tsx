"use client";

import { Button } from "@/components/ui/Button";

export function Confirm({
  title,
  body,
  confirm = "Confirm",
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirm?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-3 sm:items-center">
      <div className="w-full max-w-sm rounded-[12px] bg-bas-card p-5 admin-safe">
        <h2 className="text-lg font-semibold text-bas-heading">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-bas-muted">{body}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} className="w-full sm:w-auto" onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
