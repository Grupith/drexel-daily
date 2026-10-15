import { cookies } from "next/headers";
import { requireAdmin, adminFailure, AdminError } from "@/lib/admin/auth";

function hasTrustedOrigin(request: Request) {
    // App Hosting's internal request URL need not match the public browser origin.
    // Exact matches also reject missing, opaque, malformed and multi-value origins.
    const origin = request.headers.get("origin");
    return origin === "https://drexeldaily.com" ||
        (process.env.NODE_ENV !== "production" && origin === "http://localhost:3000");
}

export async function POST(request: Request) {
    try {
        if (!hasTrustedOrigin(request))
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
    if (!hasTrustedOrigin(request))
        return new Response(null, { status: 403 });
    (await cookies()).delete({ name: "admin-token", path: "/admin" });
    return Response.json({ ok: true });
}
