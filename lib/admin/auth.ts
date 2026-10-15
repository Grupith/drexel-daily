import "server-only";
import { cookies } from "next/headers";
import { getAdminServices } from "@/firebase/admin";
export class AdminError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export async function requireAdmin(request?: Request) {
    const token = request ? request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1] : (await cookies()).get("admin-token")?.value;
    if (!token)
        throw new AdminError(401, "Please sign in again.");
    const { auth, db } = getAdminServices();
    const identity = await auth.verifyIdToken(token, true).catch(() => { throw new AdminError(401, "Please sign in again."); });
    const profile = await db.collection("users").doc(identity.uid).get();
    if (profile.data()?.role !== "admin")
        throw new AdminError(403, "Administrator access required.");
    return { db, uid: identity.uid };
}
export function adminFailure(error: unknown) {
    if (error instanceof AdminError)
        return Response.json({ message: error.message }, { status: error.status });
    console.error("Admin operation failed", error);
    return Response.json({ message: "The operation failed. Please try again." }, { status: 500 });
}
