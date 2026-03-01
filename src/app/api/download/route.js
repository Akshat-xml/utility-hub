import { NextResponse } from "next/server";

// Temporary in-memory store for download data
const downloadStore = new Map();

// POST: Store the data and return a download ID
export async function POST(request) {
    try {
        const { base64Data, filename = "decoded-image.png" } = await request.json();

        if (!base64Data) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        // Generate a unique ID for this download
        const id = crypto.randomUUID();

        // Store data with expiry (auto-cleanup after 60 seconds)
        downloadStore.set(id, { base64Data, filename, createdAt: Date.now() });
        setTimeout(() => downloadStore.delete(id), 60000);

        return NextResponse.json({ downloadId: id });
    } catch (error) {
        return NextResponse.json({ error: "Failed to process" }, { status: 500 });
    }
}

// GET: Serve the file as a download
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id || !downloadStore.has(id)) {
            return NextResponse.json({ error: "Download expired or not found" }, { status: 404 });
        }

        const { base64Data, filename } = downloadStore.get(id);
        downloadStore.delete(id); // One-time use

        // Parse the data URL
        let mimeType = "image/png";
        let rawBase64 = base64Data;

        if (base64Data.startsWith("data:")) {
            const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1];
                rawBase64 = matches[2];
            }
        }

        const buffer = Buffer.from(rawBase64, "base64");

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": buffer.length.toString(),
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }
}
