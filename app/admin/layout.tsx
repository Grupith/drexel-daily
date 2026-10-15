import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/shell";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }
  return <AdminShell>{children}</AdminShell>;
}
