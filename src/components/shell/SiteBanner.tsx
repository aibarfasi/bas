"use client";

import { useEffect, useState } from "react";

type Banner = { notice: string; maintenance: boolean };

export function SiteBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    fetch("/api/site")
      .then((r) => r.json())
      .then((d) => {
        if (d.maintenance || d.notice) setBanner(d);
      })
      .catch(() => null);
  }, []);

  if (!banner) return null;

  return (
    <div
      className={`border-b px-4 py-2 text-sm md:px-6 ${
        banner.maintenance
          ? "border-bas-down/40 bg-bas-down/10 text-bas-heading"
          : "border-bas-hairline bg-bas-elevated text-bas-body"
      }`}
    >
      {banner.maintenance ? <strong className="mr-2">Maintenance.</strong> : null}
      {banner.notice || "The operator has paused new hires."}
    </div>
  );
}
