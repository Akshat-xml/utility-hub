"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/utils/helpers";
import { ShieldCheck, Play, FileText, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const AUTO_LIMIT = 500000; // 500KB limit for auto-validation

const SAMPLE_SCHEMA = `{
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "email": {
      "type": "string",
      "format": "email",
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$"
    },
    "role": {
      "type": "string",
      "enum": ["admin", "user", "moderator"]
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    }
  },
  "additionalProperties": false
}`;

const SAMPLE_DATA = `{
  "name": "Alice Johnson",
  "age": 28,
  "email": "alice@example.com",
  "role": "admin",
  "tags": ["developer", "lead"]
}`;

const SAMPLE_INVALID = `{
  "name": "",
  "age": -5,
  "email": "not-an-email",
  "role": "superadmin",
  "tags": [],
  "extra": true
}`;

export default function JsonSchemaValidator() {
    const [schema, setSchema] = useState("");
    const [data, setData] = useState("");
    const [result, setResult] = useState(null);
    const [schemaError, setSchemaError] = useState("");
    const [dataError, setDataError] = useState("");
    const { showToast, ToastComponent } = useToast();

    const validate = (isAuto = false) => {
        if (!isAuto) {
            setResult(null);
            setSchemaError("");
            setDataError("");
        }

        let parsedSchema, parsedData;
        try {
            parsedSchema = JSON.parse(schema);
        } catch (e) {
            if (!isAuto) setSchemaError(`Invalid JSON Schema: ${e.message}`);
            return;
        }
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            if (!isAuto) setDataError(`Invalid JSON Data: ${e.message}`);
            return;
        }

        try {
            const ajv = new Ajv({ allErrors: true, verbose: true });
            addFormats(ajv);
            const valid = ajv.validate(parsedSchema, parsedData);

            if (valid) {
                setResult({ valid: true, errors: [] });
                if (!isAuto) showToast("Validation passed! ✓");
            } else {
                const errors = (ajv.errors || []).map((err) => ({
                    path: err.instancePath || "/",
                    message: err.message,
                    keyword: err.keyword,
                    params: err.params,
                    schemaPath: err.schemaPath,
                }));
                setResult({ valid: false, errors });
                if (!isAuto) showToast(`Validation failed: ${errors.length} error(s)`, "error");
            }
        } catch (e) {
            if (!isAuto) setSchemaError(`Schema compilation error: ${e.message}`);
        }
    };

    useEffect(() => {
        if (schema.trim() && data.trim() && (schema.length + data.length) < AUTO_LIMIT) {
            validate(true);
        }
    }, [schema, data]);

    const loadValidSample = () => {
        setSchema(SAMPLE_SCHEMA);
        setData(SAMPLE_DATA);
        setResult(null);
        setSchemaError("");
        setDataError("");
    };

    const loadInvalidSample = () => {
        setSchema(SAMPLE_SCHEMA);
        setData(SAMPLE_INVALID);
        setResult(null);
        setSchemaError("");
        setDataError("");
    };

    const clear = () => {
        setSchema("");
        setData("");
        setResult(null);
        setSchemaError("");
        setDataError("");
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}>
                    <ShieldCheck size={18} className="text-white" />
                </div>
                <div>
                    <h2>JSON Schema Validator</h2>
                    <p>Validate JSON data against a JSON Schema</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button onClick={validate} className="btn-primary flex items-center gap-1.5" disabled={!schema.trim() || !data.trim()}>
                    <Play size={14} /> Validate
                </button>
                <button onClick={loadValidSample} className="btn-secondary flex items-center gap-1.5">
                    <FileText size={14} /> Valid Sample
                </button>
                <button onClick={loadInvalidSample} className="btn-secondary flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Invalid Sample
                </button>
                <button onClick={clear} className="btn-secondary flex items-center gap-1.5">
                    <Trash2 size={14} /> Clear
                </button>

                {/* Result badge */}
                {result && (
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                            background: result.valid ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)",
                            color: result.valid ? "#3fb950" : "#f85149",
                        }}>
                        {result.valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {result.valid ? "Valid" : `${result.errors.length} Error${result.errors.length > 1 ? "s" : ""}`}
                    </div>
                )}
            </div>

            {(schema.length + data.length) >= AUTO_LIMIT && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-3" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning)" }}>
                    <AlertTriangle size={18} />
                    <p>Input is large ({Math.round((schema.length + data.length) / 1024)} KB). Auto-validation disabled. Click "Validate" to process manually.</p>
                </div>
            )}

            {/* Editors */}
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>JSON Schema</label>
                    {schemaError && (
                        <div className="mb-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "rgba(248,81,73,0.1)", color: "#f85149" }}>{schemaError}</div>
                    )}
                    <textarea
                        className="input-base flex-1 font-mono text-xs"
                        value={schema}
                        onChange={(e) => setSchema(e.target.value)}
                        placeholder='{"type": "object", "properties": {...}}'
                        spellCheck={false}
                        style={{ lineHeight: "1.6" }}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>JSON Data</label>
                    {dataError && (
                        <div className="mb-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: "rgba(248,81,73,0.1)", color: "#f85149" }}>{dataError}</div>
                    )}
                    <textarea
                        className="input-base flex-1 font-mono text-xs"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        placeholder='{"name": "Alice", "age": 28}'
                        spellCheck={false}
                        style={{ lineHeight: "1.6" }}
                    />
                </div>
            </div>

            {/* Validation errors */}
            {result && !result.valid && result.errors.length > 0 && (
                <div className="mt-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)", maxHeight: "160px" }}>
                    <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-2"
                        style={{ background: "rgba(248,81,73,0.08)", borderColor: "var(--color-border)", color: "#f85149" }}>
                        <XCircle size={12} /> Validation Errors
                    </div>
                    <div className="overflow-auto" style={{ maxHeight: "120px", background: "var(--color-bg-card)" }}>
                        {result.errors.map((err, i) => (
                            <div key={i} className="flex items-start gap-3 px-3 py-2 border-b text-xs" style={{ borderColor: "var(--color-border)" }}>
                                <span className="font-mono font-semibold shrink-0 px-1.5 py-0.5 rounded" style={{ background: "rgba(248,81,73,0.1)", color: "#f85149" }}>
                                    {err.path || "/"}
                                </span>
                                <span style={{ color: "var(--color-text-primary)" }}>{err.message}</span>
                                <span className="ml-auto shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-input)", color: "var(--color-text-muted)" }}>
                                    {err.keyword}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {ToastComponent}
        </div>
    );
}
