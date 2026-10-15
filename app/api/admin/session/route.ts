import { cookies } from "next/headers";
import { requireAdmin, adminFailure, AdminError } from "@/lib/admin/auth";
export async function POST(request: Request) {
    try {
        if (request.headers.get("origin") !== new URL(request.url).origin)
            throw new AdminError(403, "Invalid origin.");
        await requireAdmin(request);
        const token = request.headers.get("authorization")!.split(" ")[1];
        (await cookies()).set("admin-token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 3500 });
        return Response.json({ ok: true });
    }
    catch (error) {
        return adminFailure(error);
    }
}
export async function DELETE(request: Request) {
    if (request.headers.get("origin") !== new URL(request.url).origin)
        return new Response(null, { status: 403 });
    (await cookies()).delete({ name: "admin-token", path: "/admin" });
    return Response.json({ ok: true });
}
