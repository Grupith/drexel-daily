import { randomUUID } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { getAdminServices } from "@/firebase/admin";
import { requireAdmin, adminFailure, AdminError } from "@/lib/admin/auth";
export const runtime = "nodejs";
const maximumBytes = 5 * 1024 * 1024;
export async function POST(request: Request) {
    try {
        await requireAdmin(request);
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName)
            throw new AdminError(503, "Firebase Storage is not configured. Use an existing HTTPS image URL.");
        if (Number(request.headers.get("content-length")) > maximumBytes + 65536)
            throw new AdminError(400, "Images must be 5 MB or smaller.");
        // Bound the body even when Content-Length is missing or untrusted.
        const reader = request.body?.getReader();
        if (!reader)
            throw new AdminError(400, "Select an image.");
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
            const chunk = await reader.read();
            if (chunk.done)
                break;
            size += chunk.value.byteLength;
            if (size > maximumBytes + 65536) {
                await reader.cancel();
                throw new AdminError(400, "Images must be 5 MB or smaller.");
            }
            chunks.push(chunk.value);
        }
        const body = Buffer.concat(chunks);
        const form = await new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
        const file = form.get("image");
        if (!(file instanceof File) || !file.size || file.size > maximumBytes)
            throw new AdminError(400, "Choose an image up to 5 MB.");
        const bytes = Buffer.from(await file.arrayBuffer());
        const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
        const webp = bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
        const extension = file.type === "image/png" && png ? "png" : file.type === "image/jpeg" && jpeg ? "jpg" : file.type === "image/webp" && webp ? "webp" : null;
        if (!extension)
            throw new AdminError(400, "Use a valid PNG, JPEG, or WebP image.");
        const path = `challenge-images/${randomUUID()}/image.${extension}`;
        const token = randomUUID();
        await getStorage(getAdminServices().auth.app).bucket(bucketName).file(path).save(bytes, { resumable: false, metadata: { contentType: file.type, cacheControl: "public,max-age=31536000,immutable", metadata: { firebaseStorageDownloadTokens: token } } });
        return Response.json({ imageUrl: `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(path)}?alt=media&token=${token}` });
    }
    catch (e) {
        return adminFailure(e);
    }
}
