import { requireAdmin, adminFailure, AdminError } from "@/lib/admin/auth";
import { scoreTestChallenge } from "@/lib/admin/test-challenge";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ date: string }> }) {
  try {
    const { db } = await requireAdmin(request);
    const { date } = await context.params;
    const body: unknown = await request.json().catch(() => { throw new AdminError(400, "Invalid submission."); });
    const results = await scoreTestChallenge(db, date, body);
    return Response.json({ status: "completed", results }, { headers: { "Cache-Control": "private, no-store", Vary: "Authorization" } });
  } catch (error) {
    const failure = adminFailure(error);
    const body = await failure.json();
    return Response.json({ status: "error", message: body.message }, { status: failure.status, headers: { "Cache-Control": "private, no-store" } });
  }
}
