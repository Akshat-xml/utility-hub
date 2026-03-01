"use client";

import { useState } from "react";
import { useToast, copyToClipboard, downloadFile } from "@/utils/helpers";
import { ArrowLeftRight, Copy, FileDown, FileText, Trash2 } from "lucide-react";

function jsonToXml(obj, rootName = "root") {
    const convert = (data, name) => {
        if (data === null || data === undefined) return `<${name}/>`;
        if (typeof data !== "object") return `<${name}>${String(data).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</${name}>`;
        if (Array.isArray(data)) return data.map((item) => convert(item, "item")).join("\n");
        return `<${name}>\n${Object.entries(data).map(([k, v]) => convert(v, k)).join("\n")}\n</${name}>`;
    };
    return `<?xml version="1.0" encoding="UTF-8"?>\n${convert(obj, rootName)}`;
}

function xmlToJson(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("Invalid XML");
    const convert = (node) => {
        if (node.children.length === 0) return node.textContent;
        const obj = {};
        for (const child of node.children) {
            const key = child.tagName;
            const val = convert(child);
            if (obj[key]) {
                if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
                obj[key].push(val);
            } else obj[key] = val;
        }
        return obj;
    };
    return convert(doc.documentElement);
}

export default function JsonXmlConverter() {
    const [jsonInput, setJsonInput] = useState("");
    const [xmlInput, setXmlInput] = useState("");
    const [error, setError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const convertToXml = () => {
        try {
            if (!jsonInput.trim()) { setError("Enter JSON first"); return; }
            const parsed = JSON.parse(jsonInput);
            const rootName = Array.isArray(parsed) ? "items" : "root";
            setXmlInput(jsonToXml(parsed, rootName));
            setError("");
        } catch (e) { setError(`JSON Error: ${e.message}`); }
    };

    const convertToJson = () => {
        try {
            if (!xmlInput.trim()) { setError("Enter XML first"); return; }
            const result = xmlToJson(xmlInput);
            setJsonInput(JSON.stringify(result, null, 2));
            setError("");
        } catch (e) { setError(`XML Error: ${e.message}`); }
    };

    const loadSample = () => {
        setJsonInput(JSON.stringify({ employees: { employee: [{ name: "Alice", department: "Engineering" }, { name: "Bob", department: "Design" }] } }, null, 2));
        setXmlInput("");
        setError("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)" }}>
                    <ArrowLeftRight size={18} className="text-white" />
                </div>
                <div>
                    <h2>JSON ↔ XML Converter</h2>
                    <p>Convert between JSON and XML formats</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={convertToXml} className="btn-primary flex items-center gap-1.5">JSON → XML</button>
                <button onClick={convertToJson} className="btn-primary flex items-center gap-1.5">XML → JSON</button>
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5"><FileText size={14} /> Sample</button>
                <button onClick={() => { setJsonInput(""); setXmlInput(""); setError(""); }} className="btn-secondary flex items-center gap-1.5"><Trash2 size={14} /> Clear</button>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "var(--color-diff-remove)", color: "var(--color-error)" }}>{error}</div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>JSON</label>
                        {jsonInput && (
                            <div className="flex gap-1">
                                <button onClick={() => copyToClipboard(jsonInput, showToast)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}><Copy size={12} /> Copy</button>
                                <button onClick={() => downloadFile(jsonInput, "data.json")} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}><FileDown size={12} /> Download</button>
                            </div>
                        )}
                    </div>
                    <textarea className="input-base flex-1 font-mono" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="Enter JSON here..." spellCheck={false} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>XML</label>
                        {xmlInput && (
                            <div className="flex gap-1">
                                <button onClick={() => copyToClipboard(xmlInput, showToast)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}><Copy size={12} /> Copy</button>
                                <button onClick={() => downloadFile(xmlInput, "data.xml")} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)" }}><FileDown size={12} /> Download</button>
                            </div>
                        )}
                    </div>
                    <textarea className="input-base flex-1 font-mono" value={xmlInput} onChange={(e) => setXmlInput(e.target.value)} placeholder="Enter XML here..." spellCheck={false} />
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
