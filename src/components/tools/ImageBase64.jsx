"use client";

import { useState, useRef } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { saveAs } from "file-saver";
import { Image, FileText, Trash2, Unlock, Download, Upload, Copy } from "lucide-react";

export default function ImageBase64() {
    const [mode, setMode] = useState("image-to-base64");
    const [imagePreview, setImagePreview] = useState(null);
    const [base64Output, setBase64Output] = useState("");
    const [base64Input, setBase64Input] = useState("");
    const [decodedImage, setDecodedImage] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const fileRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const { showToast, ToastComponent } = useToast();

    const handleFile = (file) => {
        if (!file || !file.type.startsWith("image/")) {
            showToast("Please select an image file", "error");
            return;
        }
        setFileInfo({ name: file.name, size: file.size, type: file.type });

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            setImagePreview(dataUrl);
            setBase64Output(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const decodeBase64 = () => {
        try {
            let input = base64Input.trim();
            if (!input.startsWith("data:")) {
                input = "data:image/png;base64," + input;
            }
            setDecodedImage(input);
            showToast("Image decoded successfully!");
        } catch (e) {
            showToast("Invalid Base64 string", "error");
        }
    };

    const downloadDecodedImage = async () => {
        if (!decodedImage) return;
        try {
            // Determine filename
            const mimeMatch = decodedImage.match(/^data:([^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
            const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : (mimeType.split("/")[1] || "png");
            const filename = `decoded-image.${ext}`;

            // Step 1: POST the data to get a download ID
            const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64Data: decodedImage, filename }),
            });

            if (!response.ok) throw new Error("Failed to prepare download");

            const { downloadId } = await response.json();

            // Step 2: Use a native anchor to bypass Next.js router
            // The API returns application/octet-stream + Content-Disposition: attachment
            const downloadUrl = `/api/download?id=${downloadId}`;
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            a.rel = "noopener";
            a.style.display = "none";
            document.body.appendChild(a);
            // Use native click to bypass Next.js Link interception
            a.click();
            setTimeout(() => document.body.removeChild(a), 1000);

            showToast("Image download started!");
        } catch (e) {
            showToast("Failed to download: " + e.message, "error");
        }
    };

    const formatBytes = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
                >
                    <Image size={18} className="text-white" />
                </div>
                <div>
                    <h2>Image ↔ Base64</h2>
                    <p>Convert images to Base64 strings and vice versa</p>
                </div>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setMode("image-to-base64")}
                    className={`sub-tab ${mode === "image-to-base64" ? "active" : ""}`}
                >
                    Image → Base64
                </button>
                <button
                    onClick={() => setMode("base64-to-image")}
                    className={`sub-tab ${mode === "base64-to-image" ? "active" : ""}`}
                >
                    Base64 → Image
                </button>
            </div>

            {mode === "image-to-base64" ? (
                <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                    {/* Left: Upload area */}
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                            Upload Image
                        </label>
                        <div
                            className="flex-1 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all"
                            style={{
                                background: dragActive ? "var(--color-bg-active)" : "var(--color-bg-input)",
                                border: `2px dashed ${dragActive ? "var(--color-primary)" : "var(--color-border)"}`,
                            }}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleDrop}
                        >
                            {imagePreview ? (
                                <div className="p-4 flex flex-col items-center gap-3">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-48 max-w-full rounded-lg object-contain"
                                    />
                                    {fileInfo && (
                                        <div className="text-xs text-center" style={{ color: "var(--color-text-secondary)" }}>
                                            <p className="font-medium">{fileInfo.name}</p>
                                            <p>{formatBytes(fileInfo.size)} • {fileInfo.type}</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); setBase64Output(""); setFileInfo(null); }}
                                        className="btn-secondary text-xs"
                                    >
                                        <Trash2 size={12} className="inline mr-1" /> Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload size={28} className="mb-3" style={{ color: "var(--color-text-muted)" }} />
                                    <p className="font-medium text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                        Drop image here or click to upload
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                                        Supports PNG, JPG, GIF, WebP, SVG
                                    </p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files[0])}
                        />
                    </div>

                    {/* Right: Base64 output */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                                Base64 Output
                            </label>
                            {base64Output && (
                                <div className="flex gap-1">
                                    <button onClick={() => copyToClipboard(base64Output, showToast)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--color-primary)" }}>
                                        Copy
                                    </button>
                                    <button onClick={() => {
                                        const blob = new Blob([base64Output], { type: "text/plain" });
                                        saveAs(blob, "base64.txt");
                                    }} className="text-xs px-2 py-1 rounded" style={{ color: "var(--color-primary)" }}>
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>
                        <textarea
                            className="input-base flex-1 font-mono text-xs"
                            value={base64Output}
                            readOnly
                            placeholder="Base64 encoded string will appear here..."
                            spellCheck={false}
                        />
                        {base64Output && (
                            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                                {base64Output.length.toLocaleString()} characters
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                    {/* Left: Base64 input */}
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                            Base64 Input
                        </label>
                        <textarea
                            className="input-base flex-1 font-mono text-xs"
                            value={base64Input}
                            onChange={(e) => setBase64Input(e.target.value)}
                            placeholder="Paste Base64 encoded image string here (with or without data URI prefix)..."
                            spellCheck={false}
                        />
                        <div className="flex gap-2 mt-2">
                            <button onClick={decodeBase64} className="btn-primary flex items-center gap-1.5" disabled={!base64Input.trim()}>
                                <Unlock size={14} /> Decode
                            </button>
                            <button onClick={() => { setBase64Input(""); setDecodedImage(null); }} className="btn-secondary flex items-center gap-1.5">
                                <Trash2 size={14} /> Clear
                            </button>
                        </div>
                    </div>

                    {/* Right: Image preview */}
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                            Image Preview
                        </label>
                        <div
                            className="flex-1 rounded-lg flex items-center justify-center overflow-auto"
                            style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}
                        >
                            {decodedImage ? (
                                <div className="p-4 flex flex-col items-center gap-3">
                                    <img
                                        src={decodedImage}
                                        alt="Decoded"
                                        className="max-h-64 max-w-full rounded-lg object-contain"
                                    />
                                    <button onClick={downloadDecodedImage} className="btn-secondary text-xs flex items-center gap-1.5">
                                        <Download size={14} /> Download Image
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm italic" style={{ color: "var(--color-text-muted)" }}>
                                    Decoded image will appear here...
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {ToastComponent}
        </div>
    );
}
