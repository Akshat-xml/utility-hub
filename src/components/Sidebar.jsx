"use client";

import { useState } from "react";

const TOOL_CATEGORIES = [
    {
        name: "JSON",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
                <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
            </svg>
        ),
        tools: [
            { id: "json-beautifier", name: "JSON Beautifier" },
            { id: "json-parser", name: "JSON Parser" },
            { id: "json-schema-validator", name: "JSON Schema Validator" },
            { id: "json-diff", name: "JSON Diff" },
        ],
    },
    {
        name: "XML",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        tools: [{ id: "xml-parser", name: "XML Parser" }],
    },
    {
        name: "Converters",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
        ),
        tools: [
            { id: "json-xml-converter", name: "JSON ↔ XML" },
            { id: "image-base64", name: "Image ↔ Base64" },
            { id: "color-converter", name: "Color Converter" },
        ],
    },
    {
        name: "Encoding",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        ),
        tools: [
            { id: "base32-encoder", name: "Base32 Encode/Decode" },
            { id: "base64-encoder", name: "Base64 Encode/Decode" },
        ],
    },
    {
        name: "Utilities",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
        tools: [
            { id: "formatter-compare", name: "Formatter & Compare" },
            { id: "qr-generator", name: "QR Code Generator" },
            { id: "markdown-viewer", name: "Markdown Viewer" },
            { id: "regex-tester", name: "Regex Tester" },
        ],
    },
    {
        name: "API",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
        ),
        tools: [
            { id: "api-tester", name: "API Tester" },
        ],
    },
];

export default function Sidebar({ activeTool, setActiveTool, collapsed, setCollapsed }) {
    const [search, setSearch] = useState("");
    const [expandedCategories, setExpandedCategories] = useState(
        TOOL_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
    );

    const toggleCategory = (name) => {
        setExpandedCategories((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const filteredCategories = TOOL_CATEGORIES.map((cat) => ({
        ...cat,
        tools: cat.tools.filter((t) =>
            t.name.toLowerCase().includes(search.toLowerCase())
        ),
    })).filter((cat) => cat.tools.length > 0);

    return (
        <aside
            className="sidebar-transition flex flex-col border-r shrink-0 h-full overflow-hidden"
            style={{
                width: collapsed ? "60px" : "250px",
                background: "var(--color-bg-sidebar)",
                borderColor: "var(--color-border)",
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-4 py-4 border-b"
                style={{ borderColor: "var(--color-border)" }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{
                        background: "var(--color-primary)",
                    }}
                >
                    N
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="font-semibold text-sm tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                            NucUtils
                        </h1>
                    </div>
                )}
            </div>

            {/* Search */}
            {!collapsed && (
                <div className="px-3 pt-3 pb-1">
                    <div className="relative">
                        <svg
                            className="absolute left-2.5 top-1/2 -translate-y-1/2"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-text-muted)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search tools…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs outline-none transition-all"
                            style={{
                                background: "var(--color-bg-input)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-primary)",
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Tool categories */}
            <nav className="flex-1 overflow-y-auto px-2 py-2">
                {filteredCategories.map((category) => (
                    <div key={category.name} className="mb-0.5">
                        <button
                            onClick={() => !collapsed && toggleCategory(category.name)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[0.6875rem] font-semibold uppercase tracking-wider transition-colors"
                            style={{ color: "var(--color-text-muted)" }}
                            title={collapsed ? category.name : undefined}
                        >
                            <span className="shrink-0" style={{ color: "var(--color-text-muted)" }}>
                                {category.icon}
                            </span>
                            {!collapsed && (
                                <>
                                    <span className="flex-1 text-left">{category.name}</span>
                                    <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        className="transition-transform duration-200"
                                        style={{
                                            transform: expandedCategories[category.name]
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {!collapsed && expandedCategories[category.name] && (
                            <div className="ml-2 space-y-px">
                                {category.tools.map((tool) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => setActiveTool(tool.id)}
                                        className="w-full text-left px-3 py-1.5 rounded-md text-[0.8125rem] transition-all duration-150 flex items-center gap-2"
                                        style={{
                                            background:
                                                activeTool === tool.id
                                                    ? "var(--color-bg-active)"
                                                    : "transparent",
                                            color:
                                                activeTool === tool.id
                                                    ? "var(--color-primary)"
                                                    : "var(--color-text-secondary)",
                                            fontWeight: activeTool === tool.id ? 600 : 400,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeTool !== tool.id) {
                                                e.currentTarget.style.background = "var(--color-bg-hover)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeTool !== tool.id) {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        <span
                                            className="w-1 h-1 rounded-full shrink-0"
                                            style={{
                                                background:
                                                    activeTool === tool.id
                                                        ? "var(--color-primary)"
                                                        : "var(--color-text-muted)",
                                            }}
                                        />
                                        {tool.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center py-2.5 border-t transition-colors"
                style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-muted)",
                }}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300"
                    style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>
        </aside>
    );
}
