"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/utils/helpers";
import { Regex, Play, FileText, Trash2, Flag, Copy } from "lucide-react";
import { copyToClipboard } from "@/utils/helpers";

const COMMON_PATTERNS = [
    { label: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
    { label: "URL", pattern: "https?://[^\\s/$.?#].[^\\s]*", flags: "gi" },
    { label: "IP Address", pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b", flags: "g" },
    { label: "Phone", pattern: "\\+?[\\d\\s()-]{7,15}", flags: "g" },
    { label: "Hex Color", pattern: "#[0-9a-fA-F]{3,8}\\b", flags: "gi" },
    { label: "Date (YYYY-MM-DD)", pattern: "\\d{4}-\\d{2}-\\d{2}", flags: "g" },
];

const SAMPLE_TEXT = `Contact us at support@example.com or sales@company.org
Visit https://www.example.com/page?id=123 for more info.

Server IPs: 192.168.1.1, 10.0.0.255, 172.16.0.1
Phone: +1 (555) 123-4567 or 800-555-0199

Colors: #ff6600, #333, #1a2b3c4d
Dates: 2024-01-15, 2025-12-31, 2026-03-01`;

export default function RegexTester() {
    const [pattern, setPattern] = useState("");
    const [flags, setFlags] = useState("g");
    const [testText, setTestText] = useState("");
    const [error, setError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const flagOptions = [
        { id: "g", label: "g", desc: "Global" },
        { id: "i", label: "i", desc: "Case insensitive" },
        { id: "m", label: "m", desc: "Multiline" },
        { id: "s", label: "s", desc: "Dotall" },
    ];

    const toggleFlag = (f) => {
        setFlags((prev) => prev.includes(f) ? prev.replace(f, "") : prev + f);
    };

    const results = useMemo(() => {
        if (!pattern.trim() || !testText) return { matches: [], highlighted: null };
        try {
            const regex = new RegExp(pattern, flags);
            setError("");
            const matches = [];
            let match;

            if (flags.includes("g")) {
                while ((match = regex.exec(testText)) !== null) {
                    matches.push({
                        value: match[0],
                        index: match.index,
                        groups: match.slice(1),
                    });
                    if (match[0].length === 0) regex.lastIndex++;
                }
            } else {
                match = regex.exec(testText);
                if (match) {
                    matches.push({
                        value: match[0],
                        index: match.index,
                        groups: match.slice(1),
                    });
                }
            }

            // Build highlighted text
            const parts = [];
            let lastIndex = 0;
            const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
            for (const m of sortedMatches) {
                if (m.index > lastIndex) {
                    parts.push({ type: "text", content: testText.slice(lastIndex, m.index) });
                }
                parts.push({ type: "match", content: m.value });
                lastIndex = m.index + m.value.length;
            }
            if (lastIndex < testText.length) {
                parts.push({ type: "text", content: testText.slice(lastIndex) });
            }

            return { matches, highlighted: parts };
        } catch (e) {
            setError(e.message);
            return { matches: [], highlighted: null };
        }
    }, [pattern, flags, testText]);

    const loadSample = () => {
        setTestText(SAMPLE_TEXT);
        setPattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        setFlags("g");
        setError("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                    <Regex size={18} className="text-white" />
                </div>
                <div>
                    <h2>Regex Tester</h2>
                    <p>Test regular expressions with live highlighting</p>
                </div>
            </div>

            {/* Pattern input */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center gap-0 rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                    <span className="px-2.5 py-2 text-sm font-mono shrink-0 select-none" style={{ color: "var(--color-text-muted)", background: "var(--color-bg-input)" }}>/</span>
                    <input
                        type="text"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        className="flex-1 text-sm font-mono py-2 px-1 outline-none"
                        placeholder="Enter regex pattern..."
                        spellCheck={false}
                        style={{ background: "var(--color-bg-input)", color: "var(--color-text-primary)", border: "none" }}
                    />
                    <span className="px-1 py-2 text-sm font-mono shrink-0 select-none" style={{ color: "var(--color-text-muted)", background: "var(--color-bg-input)" }}>/</span>
                    <span className="px-2 py-2 text-sm font-mono font-bold shrink-0" style={{ color: "var(--color-primary)", background: "var(--color-bg-input)" }}>{flags}</span>
                </div>

                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5">
                    <FileText size={14} /> Sample
                </button>
                <button onClick={() => { setPattern(""); setTestText(""); setFlags("g"); setError(""); }} className="btn-secondary flex items-center gap-1.5">
                    <Trash2 size={14} /> Clear
                </button>
            </div>

            {/* Flags + common patterns */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-1">
                    <Flag size={12} style={{ color: "var(--color-text-muted)" }} />
                    {flagOptions.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => toggleFlag(f.id)}
                            title={f.desc}
                            className="w-7 h-7 rounded text-xs font-mono font-bold flex items-center justify-center transition-colors"
                            style={{
                                background: flags.includes(f.id) ? "var(--color-primary)" : "var(--color-bg-input)",
                                color: flags.includes(f.id) ? "white" : "var(--color-text-muted)",
                                border: `1px solid ${flags.includes(f.id) ? "var(--color-primary)" : "var(--color-border)"}`,
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="h-4 w-px" style={{ background: "var(--color-border)" }} />
                <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-muted)" }}>Patterns:</span>
                    {COMMON_PATTERNS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => { setPattern(p.pattern); setFlags(p.flags); }}
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: "var(--color-bg-input)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-3 px-3 py-2 rounded-lg text-xs font-mono" style={{ background: "rgba(248,81,73,0.1)", color: "#f85149" }}>
                    {error}
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
                {/* Test string */}
                <div className="col-span-2 flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Test String</label>
                    <textarea
                        className="input-base flex-1 font-mono text-xs"
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        placeholder="Enter text to test against your regex..."
                        spellCheck={false}
                        style={{ lineHeight: "1.7" }}
                    />
                </div>

                {/* Results panel */}
                <div className="flex flex-col min-h-0">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                        Matches {results.matches.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: "var(--color-primary)", color: "white" }}>
                                {results.matches.length}
                            </span>
                        )}
                    </label>

                    <div className="flex-1 overflow-auto rounded-lg" style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}>
                        {/* Highlighted preview */}
                        {results.highlighted && results.highlighted.length > 0 && (
                            <div className="p-2.5 border-b font-mono text-xs whitespace-pre-wrap" style={{ borderColor: "var(--color-border)", lineHeight: "1.7", color: "var(--color-text-primary)" }}>
                                {results.highlighted.map((part, i) =>
                                    part.type === "match" ? (
                                        <mark key={i} style={{ background: "rgba(139,92,246,0.3)", color: "var(--color-text-primary)", borderRadius: "2px", padding: "1px 2px" }}>
                                            {part.content}
                                        </mark>
                                    ) : (
                                        <span key={i}>{part.content}</span>
                                    )
                                )}
                            </div>
                        )}

                        {/* Match list */}
                        <div className="p-2">
                            {results.matches.length === 0 && pattern && testText && !error && (
                                <p className="text-xs italic p-2" style={{ color: "var(--color-text-muted)" }}>No matches found</p>
                            )}
                            {results.matches.length === 0 && (!pattern || !testText) && (
                                <p className="text-xs italic p-2" style={{ color: "var(--color-text-muted)" }}>Enter a pattern and test string to see matches</p>
                            )}
                            {results.matches.map((m, i) => (
                                <div key={i} className="flex items-center gap-2 py-1 px-2 rounded text-xs font-mono" style={{ color: "var(--color-text-primary)" }}>
                                    <span className="shrink-0 w-5 text-right" style={{ color: "var(--color-text-muted)" }}>{i + 1}.</span>
                                    <span className="px-1.5 py-0.5 rounded flex-1 truncate" style={{ background: "rgba(139,92,246,0.15)" }}>
                                        {m.value}
                                    </span>
                                    <span className="shrink-0 text-[10px]" style={{ color: "var(--color-text-muted)" }}>@{m.index}</span>
                                    <button onClick={() => copyToClipboard(m.value, showToast)} className="shrink-0" style={{ color: "var(--color-text-muted)" }}>
                                        <Copy size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
