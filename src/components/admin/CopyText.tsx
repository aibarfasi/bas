"use client";

import { useToast } from "@/components/admin/Toast";

export function CopyText({ value, label }: { value: string; label?: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className="num max-w-full truncate text-left text-xs text-bas-muted hover:text-bas-heading"
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => toast("ok", "Copied"),
          () => toast("err", "Copy failed"),
        );
      }}
    >
      {label ?? value}
    </button>
  );
}
