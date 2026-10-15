import { requireAdmin, adminFailure } from "@/lib/admin/auth";
import { listPlayers } from "@/lib/admin/players";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { db } = await requireAdmin(request);
    return Response.json(await listPlayers(db, new URL(request.url).searchParams), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminFailure(error); }
}
