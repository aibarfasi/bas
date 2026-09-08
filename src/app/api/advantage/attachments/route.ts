import { NextResponse } from "next/server";
import { termixAttachments } from "@/lib/termix/attachments";

export const revalidate = 60;

export async function GET(req: Request) {
  const task = new URL(req.url).searchParams.get("task");
  const body = await termixAttachments();
  if (task && task in body.tasks) {
    const row = body.tasks[task as keyof typeof body.tasks];
    return NextResponse.json(row);
  }
  return NextResponse.json(body);
}
