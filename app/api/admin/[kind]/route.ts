import { requireAdmin, adminFailure, AdminError } from "@/lib/admin/auth";
import { listAdmin, mutateAdmin, collectionName } from "@/lib/admin/data";
export const runtime = "nodejs";
type Context = {
    params: Promise<{
        kind: string;
    }>;
};
export async function GET(request: Request, context: Context) {
    try {
        await requireAdmin(request);
        const { kind } = await context.params;
        return Response.json(await listAdmin(kind, new URL(request.url).searchParams), { headers: { "Cache-Control": "private, no-store" } });
    }
    catch (e) {
        return adminFailure(e);
    }
}
export async function POST(request: Request, context: Context) {
    try {
        const { db } = await requireAdmin(request);
        const { kind } = await context.params;
        collectionName(kind);
        const input = await request.json().catch(() => null);
        if (!input || typeof input !== "object")
            throw new AdminError(400, "Invalid input.");
        const id = kind === "questions" ? db.collection(kind).doc().id : input.date;
        if (typeof id !== "string")
            throw new AdminError(400, "Choose a date.");
        await mutateAdmin(kind, id, input, true);
        return Response.json({ id }, { status: 201 });
    }
    catch (e) {
        return adminFailure(e);
    }
}
