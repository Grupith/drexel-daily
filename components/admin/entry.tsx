"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/auth-context";
import { adminFetch } from "@/lib/admin/client";
export function AdminEntry() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (loading || !user || profile?.role !== "admin") return null;
  return <div className="mt-3 text-sm"><button type="button" className="py-2 text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try { await adminFetch("session", { method: "POST" }); router.push("/admin"); }
    catch (cause) { setError((cause as Error).message); setBusy(false); }
  }}>{busy ? "Opening dashboard…" : "Admin Dashboard"}</button>{error && <p role="alert" className="text-destructive">{error}</p>}</div>;
}
