"use client";

import { useState } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { Lock, Unlock, ArrowRightLeft, Trash2, Copy, ShieldCheck } from "lucide-react";

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

export default function Base32Encoder() {
    const [mode, setMode] = useState("encode");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const process = () => {
        try {
            if (!input.trim()) { setError("Please enter some text"); return; }
            setOutput(mode === "encode" ? base32Encode(input) : base32Decode(input));
            setError("");
        } catch (e) { setError(e.message); setOutput(""); }
    };

    const swap = () => { setInput(output); setOutput(""); setMode(mode === "encode" ? "decode" : "encode"); setError(""); };
    const clear = () => { setInput(""); setOutput(""); setError(""); };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)" }}>
                    <ShieldCheck size={18} className="text-white" />
                </div>
                <div>
                    <h2>Base32 Encoder / Decoder</h2>
                    <p>RFC 4648 Base32 encoding using A-Z and 2-7</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => { setMode("encode"); setOutput(""); }} className={`sub-tab ${mode === "encode" ? "active" : ""}`}>Encode</button>
                <button onClick={() => { setMode("decode"); setOutput(""); }} className={`sub-tab ${mode === "decode" ? "active" : ""}`}>Decode</button>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={process} className="btn-primary flex items-center gap-1.5">
                    {mode === "encode" ? <><Lock size={14} /> Encode</> : <><Unlock size={14} /> Decode</>}
                </button>
                <button onClick={swap} className="btn-secondary flex items-center gap-1.5" disabled={!output}><ArrowRightLeft size={14} /> Swap</button>
                <button onClick={clear} className="btn-secondary flex items-center gap-1.5"><Trash2 size={14} /> Clear</button>
                {output && <button onClick={() => copyToClipboard(output, showToast)} className="btn-secondary flex items-center gap-1.5"><Copy size={14} /> Copy Output</button>}
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "var(--color-diff-remove)", color: "var(--color-error)" }}>{error}</div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                        {mode === "encode" ? "Plain Text" : "Base32 Encoded"}
                    </label>
                    <textarea className="input-base flex-1 font-mono" value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === "encode" ? "Enter text to encode..." : "Paste Base32 string to decode..."} spellCheck={false} />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                        {mode === "encode" ? "Base32 Encoded" : "Decoded Text"}
                    </label>
                    <textarea className="input-base flex-1 font-mono" value={output} readOnly placeholder="Result will appear here..." spellCheck={false} />
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
