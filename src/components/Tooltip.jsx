"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Portal-based Tooltip – immune to parent overflow:hidden clipping.
 *
 * Props:
 *   text      – tooltip label (required; empty string = disabled)
 *   shortcut  – optional keyboard shortcut string, e.g. "Ctrl+B"
 *   position  – "top" | "bottom" | "left" | "right"  (default: "top")
 *   delay     – show delay in ms  (default: 400)
 *   children  – the trigger element to wrap
 */
export default function Tooltip({
    text,
    shortcut,
    position = "top",
    delay = 400,
    children,
}) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const timerRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => clearTimeout(timerRef.current);
    }, []);

    const computeCoords = useCallback(() => {
        if (!triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        const GAP = 8; // px gap between trigger and tooltip
        let top, left;

        if (position === "right") {
            top = r.top + r.height / 2;
            left = r.right + GAP;
        } else if (position === "left") {
            top = r.top + r.height / 2;
            left = r.left - GAP;
        } else if (position === "bottom") {
            top = r.bottom + GAP;
            left = r.left + r.width / 2;
        } else {
            // top (default)
            top = r.top - GAP;
            left = r.left + r.width / 2;
        }

        setCoords({ top, left });
    }, [position]);

    const handleMouseEnter = useCallback(() => {
        if (!text) return;
        computeCoords();
        timerRef.current = setTimeout(() => {
            computeCoords();
            setVisible(true);
        }, delay);
    }, [text, delay, computeCoords]);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(timerRef.current);
        setVisible(false);
    }, []);

    // Transform per position
    const transformMap = {
        right: "translateY(-50%)",
        left: "translateY(-50%) translateX(-100%)",
        bottom: "translateX(-50%)",
        top: "translateX(-50%) translateY(-100%)",
    };

    // Arrow style per position
    const arrowStyle = {
        right: {
            left: "-4px", top: "50%",
            transform: "translateY(-50%)",
            borderWidth: "4px",
            borderStyle: "solid",
            borderColor: "transparent #1e293b transparent transparent",
        },
        left: {
            right: "-4px", top: "50%",
            transform: "translateY(-50%)",
            borderWidth: "4px",
            borderStyle: "solid",
            borderColor: "transparent transparent transparent #1e293b",
        },
        bottom: {
            top: "-4px", left: "50%",
            transform: "translateX(-50%)",
            borderWidth: "4px",
            borderStyle: "solid",
            borderColor: "transparent transparent #1e293b transparent",
        },
        top: {
            bottom: "-4px", left: "50%",
            transform: "translateX(-50%)",
            borderWidth: "4px",
            borderStyle: "solid",
            borderColor: "#1e293b transparent transparent transparent",
        },
    };

    return (
        <span
            ref={triggerRef}
            className="inline-flex"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {mounted && text && createPortal(
                <span
                    role="tooltip"
                    style={{
                        position: "fixed",
                        top: coords.top,
                        left: coords.left,
                        transform: transformMap[position] || transformMap.top,
                        zIndex: 9999,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: 500,
                        background: "#1e293b",
                        color: "#e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                        opacity: visible ? 1 : 0,
                        transform: `${transformMap[position] || transformMap.top} scale(${visible ? 1 : 0.92})`,
                        transition: "opacity 120ms ease, transform 120ms ease",
                    }}
                >
                    {text}
                    {shortcut && (
                        <kbd style={{
                            borderRadius: "4px",
                            padding: "1px 4px",
                            fontSize: "10px",
                            fontFamily: "monospace",
                            background: "rgba(255,255,255,0.13)",
                            color: "inherit",
                        }}>
                            {shortcut}
                        </kbd>
                    )}
                    {/* Arrow */}
                    <span style={{ position: "absolute", width: 0, height: 0, ...arrowStyle[position] }} />
                </span>,
                document.body
            )}
        </span>
    );
}
