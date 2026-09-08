import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import type { ReactNode } from "react";

export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAuthed())) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
