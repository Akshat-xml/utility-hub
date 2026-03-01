import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { url, method = "GET", headers = {}, body = null } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const fetchOptions = {
            method: method.toUpperCase(),
            headers: {},
        };

        // Forward custom headers
        for (const [key, value] of Object.entries(headers)) {
            if (key.trim() && value.trim()) {
                fetchOptions.headers[key.trim()] = value.trim();
            }
        }

        // Add body for non-GET/HEAD requests
        if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
            fetchOptions.body = body;
            if (!fetchOptions.headers["Content-Type"]) {
                fetchOptions.headers["Content-Type"] = "application/json";
            }
        }

        const startTime = Date.now();
        const response = await fetch(url, fetchOptions);
        const elapsed = Date.now() - startTime;

        // Read response body
        const contentType = response.headers.get("content-type") || "";
        let responseBody;
        if (contentType.includes("json")) {
            responseBody = JSON.stringify(await response.json(), null, 2);
        } else {
            responseBody = await response.text();
        }

        // Collect response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
            time: elapsed,
            size: new TextEncoder().encode(responseBody).length,
        });
    } catch (error) {
        return NextResponse.json({
            error: error.message || "Request failed",
            status: 0,
            statusText: "Error",
            headers: {},
            body: "",
            time: 0,
            size: 0,
        }, { status: 200 }); // Return 200 so the client can read the error
    }
}
