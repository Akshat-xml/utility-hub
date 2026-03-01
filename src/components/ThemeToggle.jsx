"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-10 h-10" />;

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
                background: isDark
                    ? "linear-gradient(135deg, #1e293b, #334155)"
                    : "linear-gradient(135deg, #fef3c7, #fde68a)",
                boxShadow: isDark
                    ? "0 0 15px rgba(99,102,241,0.3)"
                    : "0 0 15px rgba(245,158,11,0.3)",
            }}
            aria-label="Toggle theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <span
                className="absolute transition-all duration-500"
                style={{
                    opacity: isDark ? 0 : 1,
                    transform: isDark ? "rotate(90deg) scale(0)" : "rotate(0deg) scale(1)",
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            </span>
            <span
                className="absolute transition-all duration-500"
                style={{
                    opacity: isDark ? 1 : 0,
                    transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)",
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </span>
        </button>
    );
}
