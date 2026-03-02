"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/utils/helpers";
import { GitBranch, Play, Trash2, FileText, Search, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";

const AUTO_LIMIT = 300000; // 300KB limit for auto-parsing (rendering tree is expensive)

function TreeNode({ name, value, depth = 0 }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const isObject = value !== null && typeof value === "object";
    const isArray = Array.isArray(value);

    const getTypeColor = (val) => {
        if (val === null) return "var(--color-text-muted)";
        switch (typeof val) {
            case "string": return "var(--color-success)";
            case "number": return "var(--color-primary-light)";
            case "boolean": return "var(--color-warning)";
            default: return "var(--color-text-secondary)";
        }
    };

    if (!isObject) {
        return (
            <div className="flex items-center py-0.5" style={{ paddingLeft: `${depth * 20}px` }}>
                {name !== undefined && (
                    <span className="font-mono text-xs mr-1" style={{ color: "var(--color-accent)" }}>
                        &quot;{name}&quot;:
                    </span>
                )}
                <span className="font-mono text-xs" style={{ color: getTypeColor(value) }}>
                    {typeof value === "string" ? `"${value}"` : String(value)}
                </span>
            </div>
        );
    }

    const entries = isArray
        ? value.map((v, i) => [i, v])
        : Object.entries(value);

    return (
        <div>
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center py-0.5 w-full text-left hover:opacity-80"
                style={{ paddingLeft: `${depth * 20}px` }}
            >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {name !== undefined && (
                    <span className="font-mono text-xs ml-1 mr-1" style={{ color: "var(--color-accent)" }}>
                        &quot;{name}&quot;:
                    </span>
                )}
                <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {isArray ? `[${entries.length}]` : `{${entries.length}}`}
                </span>
            </button>
            {expanded && entries.map(([key, val]) => (
                <TreeNode key={key} name={key} value={val} depth={depth + 1} />
            ))}
        </div>
    );
}

export default function JsonParser() {
    const [input, setInput] = useState("");
    const [parsed, setParsed] = useState(null);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const { showToast, ToastComponent } = useToast();

    const parse = (isAuto = false) => {
        try {
            if (!input.trim()) {
                if (!isAuto) setError("Please enter some JSON");
                return;
            }
            const result = JSON.parse(input);
            setParsed(result);
            setError("");
        } catch (e) {
            if (!isAuto) {
                setError(`Invalid JSON: ${e.message}`);
                setParsed(null);
            }
        }
    };

    useEffect(() => {
        if (input.trim() && input.length < AUTO_LIMIT) {
            parse(true);
        } else if (!input.trim()) {
            setParsed(null);
        }
    }, [input]);

    const loadSample = () => {
        const sample = {
            users: [
                { id: 1, name: "Alice", role: "admin", active: true },
                { id: 2, name: "Bob", role: "developer", active: false },
            ],
            metadata: { total: 2, page: 1, timestamp: null },
        };
        setInput(JSON.stringify(sample, null, 2));
        setParsed(null);
        setError("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #06b6d4, #22d3ee)" }}>
                    <GitBranch size={18} className="text-white" />
                </div>
                <div>
                    <h2>JSON Parser</h2>
                    <p>Parse and explore JSON with an interactive tree view</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={parse} className="btn-primary flex items-center gap-1.5">
                    <Play size={14} /> Parse
                </button>
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5">
                    <FileText size={14} /> Sample
                </button>
                <button onClick={() => { setInput(""); setParsed(null); setError(""); }} className="btn-secondary flex items-center gap-1.5">
                    <Trash2 size={14} /> Clear
                </button>
                {parsed && (
                    <div className="relative ml-auto">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                        <input
                            type="text" placeholder="Search keys..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-base text-xs pl-8 py-1.5" style={{ width: "180px" }}
                        />
                    </div>
                )}
            </div>

            {input.length >= AUTO_LIMIT && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-3" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning)" }}>
                    <AlertTriangle size={18} />
                    <p>Input is large ({Math.round(input.length / 1024)} KB). Auto-update disabled to prevent UI lag. Click "Parse" to process manually.</p>
                </div>
            )}

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "var(--color-diff-remove)", color: "var(--color-error)" }}>
                    {error}
                </div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Input JSON</label>
                    <textarea className="input-base flex-1 font-mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your JSON here..." spellCheck={false} />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Tree View</label>
                    <div className="input-base flex-1 overflow-auto" style={{ padding: "0.5rem" }}>
                        {parsed ? <TreeNode value={parsed} /> : (
                            <p className="text-sm italic" style={{ color: "var(--color-text-muted)" }}>Parsed tree will appear here...</p>
                        )}
                    </div>
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
