import { requireAdmin, adminFailure } from "@/lib/admin/auth";
import { playerDetails } from "@/lib/admin/players";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await requireAdmin(request);
    return Response.json(await playerDetails(db, (await params).id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminFailure(error); }
}
