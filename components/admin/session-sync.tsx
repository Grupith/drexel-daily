"use client";
import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
export function AdminSessionSync() {
    useEffect(() => {
        let controller: AbortController | undefined;
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            controller?.abort();
            const current = new AbortController();
            controller = current;
            try {
                const token = user ? await user.getIdToken() : null;
                if (current.signal.aborted)
                    return;
                const response = await fetch("/api/admin/session", { method: token ? "POST" : "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: current.signal });
                if (response.status === 403 && !current.signal.aborted)
                    await fetch("/api/admin/session", { method: "DELETE", signal: current.signal });
            }
            catch (cause) {
                if (!current.signal.aborted)
                    console.error("Could not synchronize admin session", cause);
            }
        });
        return () => { controller?.abort(); unsubscribe(); };
    }, []);
    return null;
}
