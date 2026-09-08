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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-[12px] bg-bas-card p-5">
        <h2 className="text-lg font-semibold text-bas-heading">{title}</h2>
        <p className="mt-2 text-sm text-bas-muted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
