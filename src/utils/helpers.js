"use client";

import { useState, useEffect, useCallback } from "react";

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 2500);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const ToastComponent = toast ? (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
    ) : null;

    return { showToast, ToastComponent };
}

export function copyToClipboard(text, showToast) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Copied to clipboard!");
    }).catch(() => {
        showToast("Failed to copy", "error");
    });
}

export function downloadFile(content, filename, mime = "text/plain") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
