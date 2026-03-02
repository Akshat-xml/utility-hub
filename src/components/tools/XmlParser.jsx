"use client";

import { useState, useEffect } from "react";
import { useToast, copyToClipboard, downloadFile } from "@/utils/helpers";
import { CheckCircle, Sparkles, Minimize2, Copy, FileDown, FileText, Trash2, Code } from "lucide-react";

export default function XmlParser() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const validate = () => {
        try {
            if (!input.trim()) { setError("Please enter some XML"); return; }
            const parser = new DOMParser();
            const doc = parser.parseFromString(input, "application/xml");
            const parseError = doc.querySelector("parsererror");
            if (parseError) {
                setError("Invalid XML: " + parseError.textContent.substring(0, 200));
                setOutput("");
            } else {
                setError("");
                setOutput(input);
                showToast("Valid XML!");
            }
        } catch (e) { setError(e.message); }
    };

    const beautify = (isAuto = false) => {
        try {
            if (!input.trim()) return;
            const parser = new DOMParser();
            const doc = parser.parseFromString(input, "application/xml");
            if (doc.querySelector("parsererror")) {
                if (!isAuto) setError("Fix XML errors first");
                return;
            }
            const serializer = new XMLSerializer();
            let xml = serializer.serializeToString(doc);
            let formatted = "", indent = 0;
            xml.split(/>\s*</).forEach((node) => {
                if (node.match(/^\/\w/)) indent--;
                formatted += "  ".repeat(Math.max(indent, 0)) + "<" + node + ">\n";
                if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) indent++;
            });
            formatted = formatted.substring(1, formatted.length - 2);
            setOutput(formatted);
            setError("");
        } catch (e) {
            if (!isAuto) setError(e.message);
        }
    };

    useEffect(() => {
        if (input.trim()) {
            beautify(true);
        }
    }, [input]);

    const minify = () => {
        try {
            if (!input.trim()) return;
            setOutput(input.replace(/>\s+</g, "><").trim());
            setError("");
        } catch (e) { setError(e.message); }
    };

    const loadSample = () => {
        setInput(`<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="1">
    <title>Developer's Guide</title>
    <author>NucUtils Team</author>
    <price currency="USD">29.99</price>
  </book>
  <book id="2">
    <title>XML Mastery</title>
    <author>Code Expert</author>
    <price currency="USD">39.99</price>
  </book>
</catalog>`);
        setOutput("");
        setError("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
                    <Code size={18} className="text-white" />
                </div>
                <div>
                    <h2>XML Parser</h2>
                    <p>Validate, beautify, and minify XML data</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={validate} className="btn-primary flex items-center gap-1.5"><CheckCircle size={14} /> Validate</button>
                <button onClick={beautify} className="btn-secondary flex items-center gap-1.5"><Sparkles size={14} /> Beautify</button>
                <button onClick={minify} className="btn-secondary flex items-center gap-1.5"><Minimize2 size={14} /> Minify</button>
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5"><FileText size={14} /> Sample</button>
                <button onClick={() => { setInput(""); setOutput(""); setError(""); }} className="btn-secondary flex items-center gap-1.5"><Trash2 size={14} /> Clear</button>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "var(--color-diff-remove)", color: "var(--color-error)" }}>{error}</div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Input XML</label>
                    <textarea className="input-base flex-1 font-mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your XML here..." spellCheck={false} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Output</label>
                        {output && (
                            <div className="flex gap-1">
                                <button onClick={() => copyToClipboard(output, showToast)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}><Copy size={12} /> Copy</button>
                                <button onClick={() => downloadFile(output, "output.xml")} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}><FileDown size={12} /> Download</button>
                            </div>
                        )}
                    </div>
                    <textarea className="input-base flex-1 font-mono" value={output} readOnly placeholder="Result will appear here..." spellCheck={false} />
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
