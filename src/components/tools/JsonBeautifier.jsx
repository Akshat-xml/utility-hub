"use client";

import { useState, useEffect } from "react";
import { useToast, copyToClipboard, downloadFile } from "@/utils/helpers";
import { Sparkles, Minimize2, FileDown, Copy, FileText, Trash2, ChevronDown, AlertTriangle } from "lucide-react";

const AUTO_LIMIT = 500000; // 500KB limit for auto-processing

export default function JsonBeautifier() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [indent, setIndent] = useState(2);
    const [error, setError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const beautify = (isAuto = false) => {
        try {
            if (!input.trim()) {
                if (!isAuto) setError("Please enter some JSON");
                return;
            }
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed, null, indent));
            setError("");
        } catch (e) {
            if (!isAuto) {
                setError(`Invalid JSON: ${e.message}`);
                setOutput("");
            }
        }
    };

    useEffect(() => {
        if (input.trim() && input.length < AUTO_LIMIT) {
            beautify(true);
        }
    }, [indent, input]);

    const minify = () => {
        try {
            if (!input.trim()) return;
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed));
            setError("");
        } catch (e) {
            setError(`Invalid JSON: ${e.message}`);
        }
    };

    const loadSample = () => {
        const sample = {
            name: "NucUtils",
            version: "1.0.0",
            description: "Developer Utilities",
            tools: ["JSON Beautifier", "XML Parser", "Base64 Encoder"],
            config: {
                theme: "dark",
                autoSave: true,
                maxFileSize: 5242880,
            },
        };
        setInput(JSON.stringify(sample));
        setOutput("");
        setError("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" }}
                >
                    <Sparkles size={18} className="text-white" />
                </div>
                <div>
                    <h2>JSON Beautifier</h2>
                    <p>Format, beautify, and minify your JSON data</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={beautify} className="btn-primary flex items-center gap-1.5">
                    <Sparkles size={14} /> Beautify
                </button>
                <button onClick={minify} className="btn-secondary flex items-center gap-1.5">
                    <Minimize2 size={14} /> Minify
                </button>
                <div className="relative">
                    <select
                        value={indent}
                        onChange={(e) => setIndent(Number(e.target.value))}
                        className="btn-secondary appearance-none pr-7 cursor-pointer"
                    >
                        <option value={2}>2 Spaces</option>
                        <option value={4}>4 Spaces</option>
                        <option value={8}>Tab</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }} />
                </div>
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5">
                    <FileText size={14} /> Sample
                </button>
                <button
                    onClick={() => {
                        setInput("");
                        setOutput("");
                        setError("");
                    }}
                    className="btn-secondary flex items-center gap-1.5"
                >
                    <Trash2 size={14} /> Clear
                </button>
            </div>

            {input.length >= AUTO_LIMIT && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-3" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning)" }}>
                    <AlertTriangle size={18} />
                    <p>Input is large ({Math.round(input.length / 1024)} KB). Auto-update disabled. Click "Beautify" to process manually.</p>
                </div>
            )}

            {error && (
                <div
                    className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
                    style={{
                        background: "var(--color-diff-remove)",
                        color: "var(--color-error)",
                    }}
                >
                    {error}
                </div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Input JSON</label>
                    <textarea
                        className="input-base flex-1 font-mono"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        spellCheck={false}
                    />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Output</label>
                        {output && (
                            <div className="flex gap-1">
                                <button onClick={() => copyToClipboard(output, showToast)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                                    <Copy size={12} /> Copy
                                </button>
                                <button onClick={() => downloadFile(output, "formatted.json")} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                                    <FileDown size={12} /> Download
                                </button>
                            </div>
                        )}
                    </div>
                    <textarea
                        className="input-base flex-1 font-mono"
                        value={output}
                        readOnly
                        placeholder="Beautified JSON will appear here..."
                        spellCheck={false}
                    />
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
