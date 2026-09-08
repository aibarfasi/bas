import { NextResponse } from "next/server";
import { getSettings } from "@/lib/admin/store";

export async function GET() {
  const s = getSettings();
  return NextResponse.json({
    notice: s.notice,
    maintenance: s.maintenance,
    prizeWallet: s.prizeWallet,
    liveUrl: s.liveUrl,
  });
}
