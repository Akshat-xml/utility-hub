"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { GitCompareArrows, Trash2, Upload, Diff, FileText, ArrowRightLeft } from "lucide-react";

// --- LCS-based diff algorithm ---
function lcs(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp;
}

function computeDiff(leftText, rightText) {
    const leftLines = leftText.split("\n");
    const rightLines = rightText.split("\n");
    const dp = lcs(leftLines, rightLines);

    // Backtrack to build diff
    const result = [];
    let i = leftLines.length, j = rightLines.length;
    const stack = [];

    while (i > 0 && j > 0) {
        if (leftLines[i - 1] === rightLines[j - 1]) {
            stack.push({ type: "unchanged", left: leftLines[i - 1], right: rightLines[j - 1], leftLine: i, rightLine: j });
            i--; j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            stack.push({ type: "removed", left: leftLines[i - 1], right: null, leftLine: i, rightLine: null });
            i--;
        } else {
            stack.push({ type: "added", left: null, right: rightLines[j - 1], leftLine: null, rightLine: j });
            j--;
        }
    }
    while (i > 0) {
        stack.push({ type: "removed", left: leftLines[i - 1], right: null, leftLine: i, rightLine: null });
        i--;
    }
    while (j > 0) {
        stack.push({ type: "added", left: null, right: rightLines[j - 1], leftLine: null, rightLine: j });
        j--;
    }

    stack.reverse();

    // Re-number lines sequentially
    let leftNum = 0, rightNum = 0;
    for (const row of stack) {
        if (row.type === "unchanged") { leftNum++; rightNum++; row.leftLine = leftNum; row.rightLine = rightNum; }
        else if (row.type === "removed") { leftNum++; row.leftLine = leftNum; }
        else if (row.type === "added") { rightNum++; row.rightLine = rightNum; }
    }

    return stack;
}

// Character-level diff for modified lines (adjacent removed+added)
function charDiff(oldStr, newStr) {
    const oldChars = [...oldStr];
    const newChars = [...newStr];
    const m = oldChars.length, n = newChars.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = oldChars[i - 1] === newChars[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    // Backtrack
    const result = [];
    let ci = m, cj = n;
    const charStack = [];
    while (ci > 0 && cj > 0) {
        if (oldChars[ci - 1] === newChars[cj - 1]) {
            charStack.push({ type: "same", char: oldChars[ci - 1] }); ci--; cj--;
        } else if (dp[ci - 1][cj] >= dp[ci][cj - 1]) {
            charStack.push({ type: "del", char: oldChars[ci - 1] }); ci--;
        } else {
            charStack.push({ type: "ins", char: newChars[cj - 1] }); cj--;
        }
    }
    while (ci > 0) { charStack.push({ type: "del", char: oldChars[ci - 1] }); ci--; }
    while (cj > 0) { charStack.push({ type: "ins", char: newChars[cj - 1] }); cj--; }
    charStack.reverse();
    return charStack;
}

function InlineHighlight({ text, type, side }) {
    if (!text) return <span>{"\u00A0"}</span>;
    return <span className="whitespace-pre">{text}</span>;
}

function CharHighlightedLine({ oldText, newText, side }) {
    const diff = charDiff(oldText || "", newText || "");
    return (
        <span className="whitespace-pre">
            {diff.map((d, i) => {
                if (side === "left") {
                    if (d.type === "del") return <span key={i} style={{ background: "rgba(248,81,73,0.35)", borderRadius: "2px" }}>{d.char}</span>;
                    if (d.type === "same") return <span key={i}>{d.char}</span>;
                    return null; // skip insertions on left side
                } else {
                    if (d.type === "ins") return <span key={i} style={{ background: "rgba(63,185,80,0.35)", borderRadius: "2px" }}>{d.char}</span>;
                    if (d.type === "same") return <span key={i}>{d.char}</span>;
                    return null; // skip deletions on right side
                }
            })}
        </span>
    );
}

export default function FormatterCompare() {
    const [left, setLeft] = useState("");
    const [right, setRight] = useState("");
    const [diff, setDiff] = useState(null);
    const [stats, setStats] = useState(null);
    const [viewMode, setViewMode] = useState("side"); // "side" or "inline"
    const leftFileRef = useRef(null);
    const rightFileRef = useRef(null);
    const leftScrollRef = useRef(null);
    const rightScrollRef = useRef(null);
    const isSyncing = useRef(false);
    const { showToast, ToastComponent } = useToast();

    const compare = () => {
        if (!left.trim() && !right.trim()) {
            showToast("Please enter text on both sides", "error");
            return;
        }
        const result = computeDiff(left, right);
        setDiff(result);
        const added = result.filter((r) => r.type === "added").length;
        const removed = result.filter((r) => r.type === "removed").length;
        const unchanged = result.filter((r) => r.type === "unchanged").length;
        setStats({ added, removed, unchanged, total: result.length });
        showToast("Comparison complete!");
    };

    const handleFileUpload = (e, side) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (side === "left") setLeft(ev.target.result);
            else setRight(ev.target.result);
        };
        reader.readAsText(file);
    };

    const clear = () => {
        setLeft("");
        setRight("");
        setDiff(null);
        setStats(null);
    };

    const loadSample = () => {
        setLeft(`function greet(name) {
    console.log("Hello, " + name);
    return true;
}

const users = ["Alice", "Bob"];
users.forEach(greet);`);
        setRight(`function greet(name, greeting = "Hello") {
    console.log(greeting + ", " + name + "!");
    return true;
}

const users = ["Alice", "Bob", "Charlie"];
users.forEach(u => greet(u));
console.log("Done!");`);
        setDiff(null);
        setStats(null);
    };

    // Pair up removed+added as "modified" for char-level highlighting
    const pairedDiff = [];
    if (diff) {
        let i = 0;
        while (i < diff.length) {
            if (diff[i].type === "removed" && i + 1 < diff.length && diff[i + 1].type === "added") {
                pairedDiff.push({ type: "modified", left: diff[i].left, right: diff[i + 1].right, leftLine: diff[i].leftLine, rightLine: diff[i + 1].rightLine });
                i += 2;
            } else {
                pairedDiff.push(diff[i]);
                i++;
            }
        }
    }

    // Synchronized scrolling
    const syncScroll = useCallback((source, target) => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        if (target.current) {
            target.current.scrollTop = source.current.scrollTop;
        }
        requestAnimationFrame(() => { isSyncing.current = false; });
    }, []);

    const rowStyles = {
        unchanged: {
            leftBg: "transparent",
            rightBg: "transparent",
            gutterBg: "transparent",
            gutterColor: "var(--color-text-muted)",
        },
        removed: {
            leftBg: "rgba(248,81,73,0.10)",
            rightBg: "transparent",
            gutterBg: "rgba(248,81,73,0.18)",
            gutterColor: "#f85149",
        },
        added: {
            leftBg: "transparent",
            rightBg: "rgba(63,185,80,0.10)",
            gutterBg: "rgba(63,185,80,0.18)",
            gutterColor: "#3fb950",
        },
        modified: {
            leftBg: "rgba(248,81,73,0.10)",
            rightBg: "rgba(63,185,80,0.10)",
            gutterBg: "rgba(210,153,34,0.18)",
            gutterColor: "#d2992a",
        },
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #ec4899, #f472b6)" }}
                >
                    <Diff size={18} className="text-white" />
                </div>
                <div>
                    <h2>Formatter & Compare</h2>
                    <p>Compare two texts side by side with diff highlighting</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button onClick={compare} className="btn-primary flex items-center gap-1.5">
                    <GitCompareArrows size={14} /> Compare
                </button>
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5">
                    <FileText size={14} /> Sample
                </button>
                <button onClick={clear} className="btn-secondary flex items-center gap-1.5">
                    <Trash2 size={14} /> Clear
                </button>
                <button onClick={() => leftFileRef.current?.click()} className="btn-secondary flex items-center gap-1.5">
                    <Upload size={14} /> Upload Left
                </button>
                <button onClick={() => rightFileRef.current?.click()} className="btn-secondary flex items-center gap-1.5">
                    <Upload size={14} /> Upload Right
                </button>
                <input ref={leftFileRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, "left")} accept="text/*,.json,.xml,.csv,.js,.ts,.py,.java,.html,.css" />
                <input ref={rightFileRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, "right")} accept="text/*,.json,.xml,.csv,.js,.ts,.py,.java,.html,.css" />

                {diff && (
                    <div className="ml-auto flex items-center gap-1">
                        <button
                            onClick={() => setViewMode("side")}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === "side" ? "" : ""}`}
                            style={{
                                background: viewMode === "side" ? "var(--color-primary)" : "transparent",
                                color: viewMode === "side" ? "white" : "var(--color-text-muted)",
                            }}
                        >
                            Side by Side
                        </button>
                        <button
                            onClick={() => setViewMode("inline")}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors`}
                            style={{
                                background: viewMode === "inline" ? "var(--color-primary)" : "transparent",
                                color: viewMode === "inline" ? "white" : "var(--color-text-muted)",
                            }}
                        >
                            Inline
                        </button>
                    </div>
                )}
            </div>

            {/* Stats bar */}
            {stats && (
                <div className="flex items-center gap-3 mb-3 text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: "#3fb950" }} />
                        {stats.added} added
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: "#f85149" }} />
                        {stats.removed} removed
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-text-muted)" }} />
                        {stats.unchanged} unchanged
                    </span>
                    <span className="ml-auto">{stats.total} lines</span>
                </div>
            )}

            {!diff ? (
                /* Input mode */
                <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                            Original
                        </label>
                        <textarea
                            className="input-base flex-1 font-mono text-xs"
                            value={left}
                            onChange={(e) => setLeft(e.target.value)}
                            placeholder="Paste original text or upload file..."
                            spellCheck={false}
                            style={{ lineHeight: "1.6", tabSize: 4 }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                            Modified
                        </label>
                        <textarea
                            className="input-base flex-1 font-mono text-xs"
                            value={right}
                            onChange={(e) => setRight(e.target.value)}
                            placeholder="Paste modified text or upload file..."
                            spellCheck={false}
                            style={{ lineHeight: "1.6", tabSize: 4 }}
                        />
                    </div>
                </div>
            ) : viewMode === "side" ? (
                /* Side-by-side diff (VS Code style) */
                <div className="flex-1 flex min-h-0 rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                    {/* Left panel */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-2"
                            style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: "#f85149" }} />
                            Original
                        </div>
                        <div
                            ref={leftScrollRef}
                            className="flex-1 overflow-auto font-mono text-xs"
                            style={{ lineHeight: "20px", background: "var(--color-bg-card)" }}
                            onScroll={() => syncScroll(leftScrollRef, rightScrollRef)}
                        >
                            {pairedDiff.map((row, i) => {
                                const style = rowStyles[row.type] || rowStyles.unchanged;
                                const showLeft = row.type !== "added";
                                return (
                                    <div
                                        key={i}
                                        className="flex"
                                        style={{
                                            background: showLeft ? style.leftBg : "transparent",
                                            minHeight: "20px",
                                        }}
                                    >
                                        {/* Gutter */}
                                        <div
                                            className="shrink-0 w-8 text-right pr-2 select-none"
                                            style={{
                                                color: showLeft ? "var(--color-text-muted)" : "transparent",
                                                borderRight: "1px solid var(--color-border)",
                                                opacity: showLeft ? 0.6 : 0,
                                            }}
                                        >
                                            {showLeft ? row.leftLine : ""}
                                        </div>
                                        {/* Change indicator */}
                                        <div
                                            className="shrink-0 w-5 flex items-center justify-center select-none text-[10px] font-bold"
                                            style={{
                                                background: showLeft && row.type !== "unchanged" ? style.gutterBg : "transparent",
                                                color: style.gutterColor,
                                            }}
                                        >
                                            {row.type === "removed" ? "−" : row.type === "modified" ? "~" : ""}
                                        </div>
                                        {/* Content */}
                                        <div className="flex-1 px-2 overflow-hidden" style={{ color: "var(--color-text-primary)" }}>
                                            {!showLeft ? (
                                                <span className="whitespace-pre">{"\u00A0"}</span>
                                            ) : row.type === "modified" ? (
                                                <CharHighlightedLine oldText={row.left} newText={row.right} side="left" />
                                            ) : (
                                                <span className="whitespace-pre">{row.left ?? "\u00A0"}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px shrink-0" style={{ background: "var(--color-border)" }} />

                    {/* Right panel */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-2"
                            style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: "#3fb950" }} />
                            Modified
                        </div>
                        <div
                            ref={rightScrollRef}
                            className="flex-1 overflow-auto font-mono text-xs"
                            style={{ lineHeight: "20px", background: "var(--color-bg-card)" }}
                            onScroll={() => syncScroll(rightScrollRef, leftScrollRef)}
                        >
                            {pairedDiff.map((row, i) => {
                                const style = rowStyles[row.type] || rowStyles.unchanged;
                                const showRight = row.type !== "removed";
                                return (
                                    <div
                                        key={i}
                                        className="flex"
                                        style={{
                                            background: showRight ? style.rightBg : "transparent",
                                            minHeight: "20px",
                                        }}
                                    >
                                        {/* Gutter */}
                                        <div
                                            className="shrink-0 w-8 text-right pr-2 select-none"
                                            style={{
                                                color: showRight ? "var(--color-text-muted)" : "transparent",
                                                borderRight: "1px solid var(--color-border)",
                                                opacity: showRight ? 0.6 : 0,
                                            }}
                                        >
                                            {showRight ? row.rightLine : ""}
                                        </div>
                                        {/* Change indicator */}
                                        <div
                                            className="shrink-0 w-5 flex items-center justify-center select-none text-[10px] font-bold"
                                            style={{
                                                background: showRight && row.type !== "unchanged" ? style.gutterBg : "transparent",
                                                color: style.gutterColor,
                                            }}
                                        >
                                            {row.type === "added" ? "+" : row.type === "modified" ? "~" : ""}
                                        </div>
                                        {/* Content */}
                                        <div className="flex-1 px-2 overflow-hidden" style={{ color: "var(--color-text-primary)" }}>
                                            {!showRight ? (
                                                <span className="whitespace-pre">{"\u00A0"}</span>
                                            ) : row.type === "modified" ? (
                                                <CharHighlightedLine oldText={row.left} newText={row.right} side="right" />
                                            ) : (
                                                <span className="whitespace-pre">{row.right ?? "\u00A0"}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                /* Inline diff view */
                <div className="flex-1 min-h-0 rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                    <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-4"
                        style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                        Unified Diff View
                    </div>
                    <div className="overflow-auto h-full font-mono text-xs" style={{ lineHeight: "20px", background: "var(--color-bg-card)" }}>
                        {pairedDiff.map((row, i) => {
                            if (row.type === "unchanged") {
                                return (
                                    <div key={i} className="flex" style={{ minHeight: "20px" }}>
                                        <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ color: "var(--color-text-muted)", opacity: 0.6, borderRight: "1px solid var(--color-border)" }}>{row.leftLine}</div>
                                        <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ color: "var(--color-text-muted)", opacity: 0.6, borderRight: "1px solid var(--color-border)" }}>{row.rightLine}</div>
                                        <div className="shrink-0 w-5 flex items-center justify-center select-none" />
                                        <div className="flex-1 px-2 whitespace-pre" style={{ color: "var(--color-text-primary)" }}>{row.left}</div>
                                    </div>
                                );
                            }
                            if (row.type === "removed") {
                                return (
                                    <div key={i} className="flex" style={{ background: "rgba(248,81,73,0.10)", minHeight: "20px" }}>
                                        <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ color: "var(--color-text-muted)", opacity: 0.6, borderRight: "1px solid var(--color-border)" }}>{row.leftLine}</div>
                                        <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ borderRight: "1px solid var(--color-border)" }} />
                                        <div className="shrink-0 w-5 flex items-center justify-center select-none text-[10px] font-bold" style={{ background: "rgba(248,81,73,0.18)", color: "#f85149" }}>−</div>
                                        <div className="flex-1 px-2 whitespace-pre" style={{ color: "var(--color-text-primary)" }}>{row.left}</div>
                                    </div>
                                );
                            }
                            if (row.type === "added") {
                                return (
                                    <div key={i} className="flex" style={{ background: "rgba(63,185,80,0.10)", minHeight: "20px" }}>
                                        <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ borderRight: "1px solid var(--color-border)" }} />
                                        <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ color: "var(--color-text-muted)", opacity: 0.6, borderRight: "1px solid var(--color-border)" }}>{row.rightLine}</div>
                                        <div className="shrink-0 w-5 flex items-center justify-center select-none text-[10px] font-bold" style={{ background: "rgba(63,185,80,0.18)", color: "#3fb950" }}>+</div>
                                        <div className="flex-1 px-2 whitespace-pre" style={{ color: "var(--color-text-primary)" }}>{row.right}</div>
                                    </div>
                                );
                            }
                            if (row.type === "modified") {
                                return (
                                    <div key={i} className="contents">
                                        <div className="flex" style={{ background: "rgba(248,81,73,0.10)", minHeight: "20px" }}>
                                            <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ color: "var(--color-text-muted)", opacity: 0.6, borderRight: "1px solid var(--color-border)" }}>{row.leftLine}</div>
                                            <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ borderRight: "1px solid var(--color-border)" }} />
                                            <div className="shrink-0 w-5 flex items-center justify-center select-none text-[10px] font-bold" style={{ background: "rgba(248,81,73,0.18)", color: "#f85149" }}>−</div>
                                            <div className="flex-1 px-2" style={{ color: "var(--color-text-primary)" }}><CharHighlightedLine oldText={row.left} newText={row.right} side="left" /></div>
                                        </div>
                                        <div className="flex" style={{ background: "rgba(63,185,80,0.10)", minHeight: "20px" }}>
                                            <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ borderRight: "1px solid var(--color-border)" }} />
                                            <div className="shrink-0 w-8 text-right pr-2 select-none" style={{ color: "var(--color-text-muted)", opacity: 0.6, borderRight: "1px solid var(--color-border)" }}>{row.rightLine}</div>
                                            <div className="shrink-0 w-5 flex items-center justify-center select-none text-[10px] font-bold" style={{ background: "rgba(63,185,80,0.18)", color: "#3fb950" }}>+</div>
                                            <div className="flex-1 px-2" style={{ color: "var(--color-text-primary)" }}><CharHighlightedLine oldText={row.left} newText={row.right} side="right" /></div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            )}
            {ToastComponent}
        </div>
    );
}
