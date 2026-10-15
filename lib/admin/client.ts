"use client";
import { auth } from "@/firebase/config";
function redirectHome(): never {
    window.location.replace(new URL("/", window.location.origin).href);
    throw new Error("Please sign in with an administrator account.");
}
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
        redirectHome();
    }
    const response = await fetch(`/api/admin/${path}`, { ...init, cache: "no-store", headers: { ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init.headers, Authorization: `Bearer ${await user.getIdToken()}` } });
    const body = await response.json();
    if (response.status === 401 || response.status === 403)
        redirectHome();
    if (!response.ok)
        throw new Error(body.message ?? "Request failed.");
    return body as T;
}
