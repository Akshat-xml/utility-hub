"use client";

import { useState, useEffect } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { Palette, Copy } from "lucide-react";

function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToCmyk(r, g, b) {
    if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
    const rr = r / 255, gg = g / 255, bb = b / 255;
    const k = 1 - Math.max(rr, gg, bb);
    return {
        c: Math.round(((1 - rr - k) / (1 - k)) * 100),
        m: Math.round(((1 - gg - k) / (1 - k)) * 100),
        y: Math.round(((1 - bb - k) / (1 - k)) * 100),
        k: Math.round(k * 100),
    };
}

function cmykToRgb(c, m, y, k) {
    c /= 100; m /= 100; y /= 100; k /= 100;
    return {
        r: Math.round(255 * (1 - c) * (1 - k)),
        g: Math.round(255 * (1 - m) * (1 - k)),
        b: Math.round(255 * (1 - y) * (1 - k)),
    };
}

function ColorField({ label, value, onCopy }) {
    return (
        <div
            className="flex items-center justify-between px-4 py-3 rounded-lg"
            style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}
        >
            <div>
                <span className="text-xs font-semibold uppercase tracking-wider block mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {label}
                </span>
                <span className="font-mono text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {value}
                </span>
            </div>
            <button
                onClick={onCopy}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{ color: "var(--color-primary)" }}
            >
                Copy
            </button>
        </div>
    );
}

export default function ColorConverter() {
    const [hex, setHex] = useState("#6366f1");
    const [hexInput, setHexInput] = useState("#6366f1"); // separate state for typing
    const [rgb, setRgb] = useState({ r: 99, g: 102, b: 241 });
    const [hsl, setHsl] = useState({ h: 239, s: 84, l: 67 });
    const [cmyk, setCmyk] = useState({ c: 59, m: 58, y: 0, k: 5 });
    const { showToast, ToastComponent } = useToast();

    const updateAllFromRgb = (r, g, b) => {
        const newHex = rgbToHex(r, g, b);
        setRgb({ r, g, b });
        setHex(newHex);
        setHexInput(newHex);
        setHsl(rgbToHsl(r, g, b));
        setCmyk(rgbToCmyk(r, g, b));
    };

    const handleHexInput = (rawValue) => {
        setHexInput(rawValue); // always update what user sees
        try {
            const clean = rawValue.startsWith("#") ? rawValue : "#" + rawValue;
            if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
                setHex(clean);
                const rgbVal = hexToRgb(clean);
                setRgb(rgbVal);
                setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
                setCmyk(rgbToCmyk(rgbVal.r, rgbVal.g, rgbVal.b));
            } else if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
                // Support shorthand hex like #f00
                const expanded = "#" + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
                setHex(expanded);
                const rgbVal = hexToRgb(expanded);
                setRgb(rgbVal);
                setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
                setCmyk(rgbToCmyk(rgbVal.r, rgbVal.g, rgbVal.b));
            }
        } catch (e) { }
    };

    const updateFromPicker = (e) => {
        const val = e.target.value;
        setHex(val);
        setHexInput(val);
        const rgbVal = hexToRgb(val);
        setRgb(rgbVal);
        setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
        setCmyk(rgbToCmyk(rgbVal.r, rgbVal.g, rgbVal.b));
    };

    const handleRgbInput = (channel, value) => {
        const val = Math.max(0, Math.min(255, Number(value) || 0));
        updateAllFromRgb(
            channel === "R" ? val : rgb.r,
            channel === "G" ? val : rgb.g,
            channel === "B" ? val : rgb.b
        );
    };

    const presetColors = [
        "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
        "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#3b82f6",
        "#0f172a", "#1e293b", "#475569", "#94a3b8", "#f1f5f9",
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)" }}
                >
                    <Palette size={18} className="text-white" />
                </div>
                <div>
                    <h2>Color Converter</h2>
                    <p>Convert between HEX, RGB, HSL, and CMYK color formats</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                {/* Left: color picker + input */}
                <div className="flex flex-col gap-4">
                    {/* Color preview */}
                    <div
                        className="rounded-xl h-32 flex items-end p-4 transition-colors"
                        style={{
                            background: hex,
                            boxShadow: `0 8px 32px ${hex}40`,
                        }}
                    >
                        <span
                            className="text-sm font-mono font-bold px-2 py-1 rounded"
                            style={{
                                background: "rgba(255,255,255,0.9)",
                                color: "#000",
                            }}
                        >
                            {hex.toUpperCase()}
                        </span>
                    </div>

                    {/* Hex input + Color picker */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                            Enter HEX Code
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={hex}
                                onChange={updateFromPicker}
                                className="w-14 h-14 rounded-xl cursor-pointer border-0 shrink-0"
                            />
                            <input
                                type="text"
                                value={hexInput}
                                onChange={(e) => handleHexInput(e.target.value)}
                                className="input-base font-mono text-lg"
                                placeholder="#000000"
                                maxLength={7}
                            />
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                            Type a hex code (e.g. #ff5500 or #f50) and values update instantly
                        </p>
                    </div>

                    {/* RGB Inputs with Sliders */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                            RGB Values
                        </label>
                        <div className="space-y-2">
                            {[
                                { label: "R", val: rgb.r, color: "#ef4444" },
                                { label: "G", val: rgb.g, color: "#22c55e" },
                                { label: "B", val: rgb.b, color: "#3b82f6" },
                            ].map((ch) => (
                                <div key={ch.label} className="flex items-center gap-3">
                                    <span className="w-4 font-mono font-bold text-sm" style={{ color: ch.color }}>{ch.label}</span>
                                    <input
                                        type="range"
                                        min="0" max="255"
                                        value={ch.val}
                                        onChange={(e) => handleRgbInput(ch.label, e.target.value)}
                                        className="flex-1"
                                        style={{ accentColor: ch.color }}
                                    />
                                    <input
                                        type="number"
                                        min="0" max="255"
                                        value={ch.val}
                                        onChange={(e) => handleRgbInput(ch.label, e.target.value)}
                                        className="input-base text-sm font-mono text-center"
                                        style={{ width: "60px" }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Presets */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                            Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {presetColors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => updateFromHex(c)}
                                    className="w-8 h-8 rounded-lg transition-transform hover:scale-110 border-2"
                                    style={{
                                        background: c,
                                        borderColor: hex === c ? "var(--color-primary)" : "transparent",
                                        boxShadow: hex === c ? "0 0 0 2px var(--color-primary)" : "none",
                                    }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: all formats */}
                <div className="flex flex-col gap-3">
                    <ColorField
                        label="HEX"
                        value={hex.toUpperCase()}
                        onCopy={() => copyToClipboard(hex.toUpperCase(), showToast)}
                    />
                    <ColorField
                        label="RGB"
                        value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                        onCopy={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, showToast)}
                    />
                    <ColorField
                        label="HSL"
                        value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                        onCopy={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, showToast)}
                    />
                    <ColorField
                        label="CMYK"
                        value={`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`}
                        onCopy={() => copyToClipboard(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, showToast)}
                    />
                    <ColorField
                        label="RGB (0-1)"
                        value={`(${(rgb.r / 255).toFixed(3)}, ${(rgb.g / 255).toFixed(3)}, ${(rgb.b / 255).toFixed(3)})`}
                        onCopy={() => copyToClipboard(`(${(rgb.r / 255).toFixed(3)}, ${(rgb.g / 255).toFixed(3)}, ${(rgb.b / 255).toFixed(3)})`, showToast)}
                    />
                    <ColorField
                        label="CSS Custom Property"
                        value={`--color-custom: ${hex};`}
                        onCopy={() => copyToClipboard(`--color-custom: ${hex};`, showToast)}
                    />
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
