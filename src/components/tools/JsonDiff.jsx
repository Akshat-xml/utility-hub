"use client";

import { useState } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { GitCompareArrows, Play, FileText, Trash2, Copy, ChevronRight, ChevronDown, Plus, Minus, ArrowLeftRight } from "lucide-react";

function deepDiff(a, b, path = "") {
    const diffs = [];

    if (a === b) return diffs;
    if (a === null || b === null || typeof a !== typeof b) {
        diffs.push({ type: "modified", path: path || "/", oldVal: a, newVal: b });
        return diffs;
    }

    if (typeof a !== "object") {
        if (a !== b) diffs.push({ type: "modified", path: path || "/", oldVal: a, newVal: b });
        return diffs;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        const maxLen = Math.max(a.length, b.length);
        for (let i = 0; i < maxLen; i++) {
            const childPath = `${path}[${i}]`;
            if (i >= a.length) {
                diffs.push({ type: "added", path: childPath, newVal: b[i] });
            } else if (i >= b.length) {
                diffs.push({ type: "removed", path: childPath, oldVal: a[i] });
            } else {
                diffs.push(...deepDiff(a[i], b[i], childPath));
            }
        }
        return diffs;
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
        diffs.push({ type: "modified", path: path || "/", oldVal: a, newVal: b });
        return diffs;
    }

    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of allKeys) {
        const childPath = path ? `${path}.${key}` : key;
        if (!(key in a)) {
            diffs.push({ type: "added", path: childPath, newVal: b[key] });
        } else if (!(key in b)) {
            diffs.push({ type: "removed", path: childPath, oldVal: a[key] });
        } else {
            diffs.push(...deepDiff(a[key], b[key], childPath));
        }
    }
    return diffs;
}

function formatValue(val) {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
}

const SAMPLE_LEFT = {
    name: "NucUtils",
    version: "1.0.0",
    features: ["JSON", "XML", "Base64"],
    config: {
        theme: "dark",
        autoSave: true,
        maxSize: 5242880,
    },
    author: "Team Alpha",
};

const SAMPLE_RIGHT = {
    name: "NucUtils",
    version: "2.0.0",
    features: ["JSON", "XML", "Base64", "Regex", "API Tester"],
    config: {
        theme: "light",
        autoSave: true,
        maxSize: 10485760,
        newSetting: "enabled",
    },
    license: "MIT",
};

export default function JsonDiff() {
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");
    const [diffs, setDiffs] = useState(null);
    const [leftError, setLeftError] = useState("");
    const [rightError, setRightError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const compare = () => {
        setDiffs(null);
        setLeftError("");
        setRightError("");

        let left, right;
        try { left = JSON.parse(leftText); } catch (e) { setLeftError(`Invalid JSON: ${e.message}`); return; }
        try { right = JSON.parse(rightText); } catch (e) { setRightError(`Invalid JSON: ${e.message}`); return; }

        const result = deepDiff(left, right);
        setDiffs(result);

        if (result.length === 0) {
            showToast("Objects are identical!");
        } else {
            showToast(`Found ${result.length} difference(s)`);
        }
    };

    const loadSample = () => {
        setLeftText(JSON.stringify(SAMPLE_LEFT, null, 2));
        setRightText(JSON.stringify(SAMPLE_RIGHT, null, 2));
        setDiffs(null);
        setLeftError("");
        setRightError("");
    };

    const clear = () => {
        setLeftText("");
        setRightText("");
        setDiffs(null);
        setLeftError("");
        setRightError("");
    };

    const stats = diffs ? {
        added: diffs.filter(d => d.type === "added").length,
        removed: diffs.filter(d => d.type === "removed").length,
        modified: diffs.filter(d => d.type === "modified").length,
    } : null;

    const typeConfig = {
        added: { icon: Plus, color: "#3fb950", bg: "rgba(63,185,80,0.08)", label: "Added" },
        removed: { icon: Minus, color: "#f85149", bg: "rgba(248,81,73,0.08)", label: "Removed" },
        modified: { icon: ArrowLeftRight, color: "#d29922", bg: "rgba(210,153,34,0.08)", label: "Changed" },
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    <GitCompareArrows size={18} className="text-white" />
                </div>
                <div>
                    <h2>JSON Diff</h2>
                    <p>Compare two JSON objects and see structural differences</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button onClick={compare} className="btn-primary flex items-center gap-1.5" disabled={!leftText.trim() || !rightText.trim()}>
                    <Play size={14} /> Compare
                </button>
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5">
                    <FileText size={14} /> Sample
                </button>
                <button onClick={clear} className="btn-secondary flex items-center gap-1.5">
                    <Trash2 size={14} /> Clear
                </button>

                {stats && (
                    <div className="ml-auto flex items-center gap-3 text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#3fb950" }} />{stats.added} added</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#f85149" }} />{stats.removed} removed</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#d29922" }} />{stats.modified} changed</span>
                    </div>
                )}
            </div>

            {/* Editors */}
            <div className={`grid grid-cols-2 gap-3 min-h-0 ${diffs !== null ? "" : "flex-1"}`} style={diffs !== null ? { height: "40%" } : {}}>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Original JSON</label>
                    {leftError && <div className="mb-1 px-2.5 py-1.5 rounded text-xs" style={{ background: "rgba(248,81,73,0.1)", color: "#f85149" }}>{leftError}</div>}
                    <textarea
                        className="input-base flex-1 font-mono text-xs"
                        value={leftText}
                        onChange={(e) => setLeftText(e.target.value)}
                        placeholder='{"key": "original value"}'
                        spellCheck={false}
                        style={{ lineHeight: "1.6" }}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Modified JSON</label>
                    {rightError && <div className="mb-1 px-2.5 py-1.5 rounded text-xs" style={{ background: "rgba(248,81,73,0.1)", color: "#f85149" }}>{rightError}</div>}
                    <textarea
                        className="input-base flex-1 font-mono text-xs"
                        value={rightText}
                        onChange={(e) => setRightText(e.target.value)}
                        placeholder='{"key": "modified value"}'
                        spellCheck={false}
                        style={{ lineHeight: "1.6" }}
                    />
                </div>
            </div>

            {/* Diff results */}
            {diffs !== null && (
                <div className="flex-1 mt-3 rounded-lg overflow-hidden flex flex-col min-h-0" style={{ border: "1px solid var(--color-border)" }}>
                    <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-2"
                        style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                        <GitCompareArrows size={12} />
                        {diffs.length === 0 ? "No differences — objects are identical" : `${diffs.length} Difference${diffs.length > 1 ? "s" : ""}`}
                    </div>
                    <div className="flex-1 overflow-auto" style={{ background: "var(--color-bg-card)" }}>
                        {diffs.map((diff, i) => {
                            const cfg = typeConfig[diff.type];
                            const Icon = cfg.icon;
                            return (
                                <div key={i} className="flex items-start gap-3 px-3 py-2.5 border-b" style={{ borderColor: "var(--color-border)", background: cfg.bg }}>
                                    <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                                        <Icon size={12} style={{ color: cfg.color }} />
                                        <span className="text-[10px] font-bold uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
                                    </div>
                                    <span className="font-mono text-xs font-semibold shrink-0 px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}>
                                        {diff.path}
                                    </span>
                                    <div className="flex-1 text-xs font-mono min-w-0">
                                        {diff.type === "modified" && (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-start gap-1">
                                                    <span className="shrink-0 text-[10px] font-bold px-1 rounded" style={{ background: "rgba(248,81,73,0.15)", color: "#f85149" }}>−</span>
                                                    <span className="whitespace-pre-wrap break-all" style={{ color: "#f85149" }}>{formatValue(diff.oldVal)}</span>
                                                </div>
                                                <div className="flex items-start gap-1">
                                                    <span className="shrink-0 text-[10px] font-bold px-1 rounded" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>+</span>
                                                    <span className="whitespace-pre-wrap break-all" style={{ color: "#3fb950" }}>{formatValue(diff.newVal)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {diff.type === "added" && (
                                            <span className="whitespace-pre-wrap break-all" style={{ color: "#3fb950" }}>{formatValue(diff.newVal)}</span>
                                        )}
                                        {diff.type === "removed" && (
                                            <span className="whitespace-pre-wrap break-all" style={{ color: "#f85149" }}>{formatValue(diff.oldVal)}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {ToastComponent}
        </div>
    );
}
