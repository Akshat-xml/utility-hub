"use client";

import { useState, useRef, useCallback } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/utils/helpers";
import { QrCode, Download, AlertTriangle } from "lucide-react";

export default function QrGenerator() {
    const [text, setText] = useState("");
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [level, setLevel] = useState("M");
    const canvasRef = useRef(null);
    const { showToast, ToastComponent } = useToast();

    const downloadQR = (format) => {
        if (!text.trim()) {
            showToast("Please enter some text first", "error");
            return;
        }

        if (format === "svg") {
            const svgElement = document.getElementById("qr-svg");
            if (!svgElement) {
                showToast("SVG element not found", "error");
                return;
            }
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "qrcode.svg";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Downloaded as SVG");
        } else {
            // Use the visible canvas ref to get the actual rendered canvas
            const wrapper = canvasRef.current;
            if (!wrapper) {
                showToast("Canvas not found", "error");
                return;
            }
            const canvas = wrapper.querySelector("canvas");
            if (!canvas) {
                showToast("Canvas element not found", "error");
                return;
            }
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = "qrcode.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast("Downloaded as PNG");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}
                >
                    <QrCode size={18} className="text-white" />
                </div>
                <div>
                    <h2>QR Code Generator</h2>
                    <p>Generate customizable QR codes from text or URLs</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                {/* Left: Controls */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                            Text or URL
                        </label>
                        <textarea
                            className="input-base font-mono"
                            rows={4}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text or URL to generate QR code..."
                            spellCheck={false}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                                Size (px)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="128"
                                    max="512"
                                    step="32"
                                    value={size}
                                    onChange={(e) => setSize(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <input
                                    type="number"
                                    min="64"
                                    max="1024"
                                    value={size}
                                    onChange={(e) => setSize(Math.max(64, Math.min(1024, Number(e.target.value) || 128)))}
                                    className="input-base text-sm font-mono"
                                    style={{ width: "80px" }}
                                />
                            </div>
                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                {size} × {size} px
                            </span>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                                Error Correction
                            </label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="btn-secondary w-full"
                            >
                                <option value="L">Low (7%)</option>
                                <option value="M">Medium (15%)</option>
                                <option value="Q">Quartile (25%)</option>
                                <option value="H">High (30%)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                                Foreground Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={fgColor}
                                    onChange={(e) => setFgColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={fgColor}
                                    onChange={(e) => setFgColor(e.target.value)}
                                    className="input-base text-sm"
                                    style={{ width: "100px" }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                                Background Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="input-base text-sm"
                                    style={{ width: "100px" }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => downloadQR("png")} className="btn-primary flex items-center gap-1.5" disabled={!text.trim()}>
                            <Download size={14} /> Download PNG
                        </button>
                        <button onClick={() => downloadQR("svg")} className="btn-secondary flex items-center gap-1.5" disabled={!text.trim()}>
                            <Download size={14} /> Download SVG
                        </button>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="flex flex-col items-center justify-center">
                    <div
                        className="glass-card p-8 flex items-center justify-center"
                        style={{ minHeight: "300px", minWidth: "300px" }}
                    >
                        {(() => {
                            if (!text.trim()) {
                                return (
                                    <p className="text-sm italic text-center" style={{ color: "var(--color-text-muted)" }}>
                                        Enter text above to generate<br />a QR code preview
                                    </p>
                                );
                            }

                            // Rough max limits for different levels (UTF-8 bytes)
                            const limits = { L: 2953, M: 2331, Q: 1663, H: 1273 };
                            const limit = limits[level] || 1273;

                            if (text.length > limit) {
                                return (
                                    <div className="flex flex-col items-center gap-3 text-center p-4">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(248,81,73,0.1)", color: "#f85149" }}>
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div style={{ color: "#f85149" }}>
                                            <p className="font-semibold text-sm">Data too long</p>
                                            <p className="text-xs opacity-80 mt-1">
                                                Content exceeds the limit for Error Correction Level {level}.<br />
                                                Limit: {limit} characters. Current: {text.length}.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setLevel("L")}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md mt-2 transition-colors"
                                            style={{ background: "var(--color-bg-input)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
                                        >
                                            Try Low Error Correction
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div className="flex flex-col items-center gap-4">
                                    {/* SVG for display + SVG download */}
                                    <QRCodeSVG
                                        id="qr-svg"
                                        value={text}
                                        size={Math.min(size, 350)}
                                        fgColor={fgColor}
                                        bgColor={bgColor}
                                        level={level}
                                    />
                                    {/* Canvas for PNG download - visually hidden but still rendered */}
                                    <div
                                        ref={canvasRef}
                                        style={{
                                            position: "absolute",
                                            left: "-9999px",
                                            top: "-9999px",
                                            opacity: 0,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <QRCodeCanvas
                                            value={text}
                                            size={size}
                                            fgColor={fgColor}
                                            bgColor={bgColor}
                                            level={level}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    {text.trim() && (
                        <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {text.length} characters • Error correction: {level}
                        </p>
                    )}
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
