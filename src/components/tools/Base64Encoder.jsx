"use client";

import { useState } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { Lock, Unlock, ArrowRightLeft, Trash2, Copy, Binary } from "lucide-react";

function base64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(str) {
    return decodeURIComponent(escape(atob(str)));
}

export default function Base64Encoder() {
    const [mode, setMode] = useState("encode");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const process = () => {
        try {
            if (!input.trim()) { setError("Please enter some text"); return; }
            setOutput(mode === "encode" ? base64Encode(input) : base64Decode(input));
            setError("");
        } catch (e) { setError(e.message); setOutput(""); }
    };

    const swap = () => { setInput(output); setOutput(""); setMode(mode === "encode" ? "decode" : "encode"); setError(""); };
    const clear = () => { setInput(""); setOutput(""); setError(""); };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #06b6d4, #22d3ee)" }}>
                    <Binary size={18} className="text-white" />
                </div>
                <div>
                    <h2>Base64 Encoder / Decoder</h2>
                    <p>Standard Base64 encoding (RFC 4648)</p>
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
                        {mode === "encode" ? "Plain Text" : "Base64 Encoded"}
                    </label>
                    <textarea className="input-base flex-1 font-mono" value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === "encode" ? "Enter text to encode..." : "Paste Base64 string to decode..."} spellCheck={false} />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                        {mode === "encode" ? "Base64 Encoded" : "Decoded Text"}
                    </label>
                    <textarea className="input-base flex-1 font-mono" value={output} readOnly placeholder="Result will appear here..." spellCheck={false} />
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
