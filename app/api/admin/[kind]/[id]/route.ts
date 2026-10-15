import { requireAdmin, adminFailure, AdminError } from "@/lib/admin/auth";
import { mutateAdmin, collectionName, validId, questionUsage } from "@/lib/admin/data";
export const runtime = "nodejs";
type Context = {
    params: Promise<{
        kind: string;
        id: string;
    }>;
};
export async function GET(request: Request, context: Context) {
    try {
        const { db } = await requireAdmin(request);
        const { kind, id } = await context.params;
        const doc = await db.collection(collectionName(kind)).doc(validId(id)).get();
        if (!doc.exists)
            throw new AdminError(404, "Document not found.");
        const { createdAt: _created, updatedAt: _updated, ...data } = doc.data()!;
        void _created;
        void _updated;
        return Response.json({ ...data, id, ...(kind === "questions" ? { usage: await questionUsage(id) } : {}) }, { headers: { "Cache-Control": "private, no-store" } });
    }
    catch (e) {
        return adminFailure(e);
    }
}
export async function PUT(request: Request, context: Context) {
    try {
        await requireAdmin(request);
        const { kind, id } = await context.params;
        const input = await request.json().catch(() => null);
        if (!input || typeof input !== "object")
            throw new AdminError(400, "Invalid input.");
        await mutateAdmin(kind, id, input);
        return Response.json({ id });
    }
    catch (e) {
        return adminFailure(e);
    }
}
export async function DELETE(request: Request, context: Context) {
    try {
        await requireAdmin(request);
        const { kind, id } = await context.params;
        await mutateAdmin(kind, id, null);
        return Response.json({ ok: true });
    }
    catch (e) {
        return adminFailure(e);
    }
}
