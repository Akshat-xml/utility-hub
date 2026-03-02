"use client";

import { useState, useEffect } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";

// --- Base32 (RFC 4648) ---
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bits = "";
    for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
    let result = "";
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.substring(i, i + 5).padEnd(5, "0");
        result += BASE32_CHARS[parseInt(chunk, 2)];
    }
    while (result.length % 8 !== 0) result += "=";
    return result;
}

function base32Decode(str) {
    const cleaned = str.replace(/=+$/, "");
    let bits = "";
    for (const char of cleaned) {
        const idx = BASE32_CHARS.indexOf(char.toUpperCase());
        if (idx === -1) throw new Error(`Invalid Base32 character: ${char}`);
        bits += idx.toString(2).padStart(5, "0");
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}

// --- Base58 (Bitcoin alphabet) ---
const BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(str) {
    const bytes = new TextEncoder().encode(str);
    let num = BigInt(0);
    for (const byte of bytes) num = num * BigInt(256) + BigInt(byte);
    let result = "";
    while (num > 0n) {
        result = BASE58_CHARS[Number(num % 58n)] + result;
        num = num / 58n;
    }
    for (const byte of bytes) {
        if (byte === 0) result = "1" + result;
        else break;
    }
    return result || "1";
}

function base58Decode(str) {
    let num = BigInt(0);
    for (const char of str) {
        const idx = BASE58_CHARS.indexOf(char);
        if (idx === -1) throw new Error(`Invalid Base58 character: ${char}`);
        num = num * BigInt(58) + BigInt(idx);
    }
    const hex = num.toString(16).padStart(2, "0");
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    for (const char of str) {
        if (char === "1") bytes.unshift(0);
        else break;
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}

// --- Base64 ---
function base64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(str) {
    return decodeURIComponent(escape(atob(str)));
}

const ENCODINGS = [
    {
        id: "base32",
        name: "Base32",
        encode: base32Encode,
        decode: base32Decode,
        description: "RFC 4648 Base32 encoding using A-Z and 2-7",
        color: "#8b5cf6",
    },
    {
        id: "base58",
        name: "Base58",
        encode: base58Encode,
        decode: base58Decode,
        description: "Bitcoin-style Base58 encoding (no 0, O, I, l)",
        color: "#f59e0b",
    },
    {
        id: "base64",
        name: "Base64",
        encode: base64Encode,
        decode: base64Decode,
        description: "Standard Base64 encoding (RFC 4648)",
        color: "#06b6d4",
    },
];

export default function BaseEncoder() {
    const [activeTab, setActiveTab] = useState("base32");
    const [mode, setMode] = useState("encode");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const activeEncoding = ENCODINGS.find((e) => e.id === activeTab);

    const process = (isAuto = false) => {
        try {
            if (!input.trim()) {
                if (!isAuto) setError("Please enter some text");
                return;
            }
            const fn = mode === "encode" ? activeEncoding.encode : activeEncoding.decode;
            setOutput(fn(input));
            setError("");
        } catch (e) {
            if (!isAuto) {
                setError(e.message);
                setOutput("");
            }
        }
    };

    useEffect(() => {
        if (input.trim()) {
            process(true);
        }
    }, [input, mode, activeTab]);

    const swap = () => {
        setInput(output);
        setOutput("");
        setMode(mode === "encode" ? "decode" : "encode");
        setError("");
    };

    const clear = () => {
        setInput("");
        setOutput("");
        setError("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${activeEncoding.color}, ${activeEncoding.color}cc)` }}
                >
                    <span className="text-white font-bold text-sm">B{activeTab.slice(-2)}</span>
                </div>
                <div>
                    <h2>Base Encoding / Decoding</h2>
                    <p>{activeEncoding.description}</p>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-4">
                {ENCODINGS.map((enc) => (
                    <button
                        key={enc.id}
                        onClick={() => { setActiveTab(enc.id); setOutput(""); setError(""); }}
                        className="sub-tab"
                        style={
                            activeTab === enc.id
                                ? { background: enc.color, color: "white", borderColor: enc.color }
                                : {}
                        }
                    >
                        {enc.name}
                    </button>
                ))}
                <div className="mx-2 h-6 w-px" style={{ background: "var(--color-border)" }} />
                <button
                    onClick={() => { setMode("encode"); setOutput(""); }}
                    className={`sub-tab ${mode === "encode" ? "active" : ""}`}
                >
                    Encode
                </button>
                <button
                    onClick={() => { setMode("decode"); setOutput(""); }}
                    className={`sub-tab ${mode === "decode" ? "active" : ""}`}
                >
                    Decode
                </button>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={process} className="btn-primary">
                    {mode === "encode" ? "🔒 Encode" : "🔓 Decode"}
                </button>
                <button onClick={swap} className="btn-secondary" disabled={!output}>
                    🔄 Swap
                </button>
                <button onClick={clear} className="btn-secondary">
                    🗑️ Clear
                </button>
                {output && (
                    <button onClick={() => copyToClipboard(output, showToast)} className="btn-secondary">
                        📋 Copy Output
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "var(--color-diff-remove)", color: "var(--color-error)" }}>
                    ❌ {error}
                </div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                        {mode === "encode" ? "Plain Text" : `${activeEncoding.name} Encoded`}
                    </label>
                    <textarea
                        className="input-base flex-1 font-mono"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === "encode" ? "Enter text to encode..." : `Paste ${activeEncoding.name} string to decode...`}
                        spellCheck={false}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                        {mode === "encode" ? `${activeEncoding.name} Encoded` : "Decoded Text"}
                    </label>
                    <textarea
                        className="input-base flex-1 font-mono"
                        value={output}
                        readOnly
                        placeholder="Result will appear here..."
                        spellCheck={false}
                    />
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
