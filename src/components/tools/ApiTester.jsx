"use client";

import { useState, useRef } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { Send, Plus, Trash2, Copy, Clock, ChevronDown, FileText, X, Shield, Eye, EyeOff, Key } from "lucide-react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const METHOD_COLORS = {
    GET: "#3fb950",
    POST: "#d29922",
    PUT: "#58a6ff",
    PATCH: "#bc8cff",
    DELETE: "#f85149",
};

const AUTH_TYPES = [
    { id: "none", label: "No Auth" },
    { id: "bearer", label: "Bearer Token" },
    { id: "basic", label: "Basic Auth" },
    { id: "apikey", label: "API Key" },
];

export default function ApiTester() {
    const [method, setMethod] = useState("GET");
    const [url, setUrl] = useState("");
    const [activeTab, setActiveTab] = useState("params");
    const [headers, setHeaders] = useState([{ key: "Content-Type", value: "application/json", enabled: true }]);
    const [body, setBody] = useState("");
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [responseTab, setResponseTab] = useState("body");
    const { showToast, ToastComponent } = useToast();

    // Auth state
    const [authType, setAuthType] = useState("none");
    const [bearerToken, setBearerToken] = useState("");
    const [basicUsername, setBasicUsername] = useState("");
    const [basicPassword, setBasicPassword] = useState("");
    const [apiKeyName, setApiKeyName] = useState("");
    const [apiKeyValue, setApiKeyValue] = useState("");
    const [apiKeyLocation, setApiKeyLocation] = useState("header");
    const [showPassword, setShowPassword] = useState(false);
    const [showToken, setShowToken] = useState(false);

    const addHeader = () => setHeaders([...headers, { key: "", value: "", enabled: true }]);
    const removeHeader = (i) => setHeaders(headers.filter((_, idx) => idx !== i));
    const updateHeader = (i, field, value) => {
        const updated = [...headers];
        updated[i][field] = value;
        setHeaders(updated);
    };

    const buildAuthHeaders = () => {
        const authHeaders = {};
        if (authType === "bearer" && bearerToken.trim()) {
            authHeaders["Authorization"] = `Bearer ${bearerToken.trim()}`;
        } else if (authType === "basic" && basicUsername.trim()) {
            const encoded = btoa(`${basicUsername}:${basicPassword}`);
            authHeaders["Authorization"] = `Basic ${encoded}`;
        } else if (authType === "apikey" && apiKeyName.trim() && apiKeyValue.trim() && apiKeyLocation === "header") {
            authHeaders[apiKeyName.trim()] = apiKeyValue.trim();
        }
        return authHeaders;
    };

    const buildAuthParams = () => {
        if (authType === "apikey" && apiKeyName.trim() && apiKeyValue.trim() && apiKeyLocation === "query") {
            return `${apiKeyName.trim()}=${encodeURIComponent(apiKeyValue.trim())}`;
        }
        return null;
    };

    const sendRequest = async () => {
        if (!url.trim()) {
            showToast("Please enter a URL", "error");
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const activeHeaders = {};
            headers.forEach((h) => {
                if (h.enabled && h.key.trim()) activeHeaders[h.key.trim()] = h.value;
            });

            // Merge auth headers
            const authHeaders = buildAuthHeaders();
            Object.assign(activeHeaders, authHeaders);

            // Build final URL with query params for API Key
            let finalUrl = url.trim();
            const queryParam = buildAuthParams();
            if (queryParam) {
                finalUrl += (finalUrl.includes("?") ? "&" : "?") + queryParam;
            }

            const res = await fetch("/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: finalUrl,
                    method,
                    headers: activeHeaders,
                    body: body || null,
                }),
            });

            const data = await res.json();
            setResponse(data);
            setResponseTab("body");
        } catch (e) {
            setResponse({ error: e.message, status: 0, statusText: "Error", headers: {}, body: "", time: 0, size: 0 });
        } finally {
            setLoading(false);
        }
    };

    const loadSample = () => {
        setMethod("GET");
        setUrl("https://jsonplaceholder.typicode.com/posts/1");
        setHeaders([{ key: "Content-Type", value: "application/json", enabled: true }]);
        setBody("");
        setResponse(null);
        setAuthType("none");
    };

    const getStatusStyle = (status) => {
        if (status >= 200 && status < 300) return { color: "#3fb950", bg: "rgba(63,185,80,0.1)" };
        if (status >= 300 && status < 400) return { color: "#d29922", bg: "rgba(210,153,34,0.1)" };
        if (status >= 400 && status < 500) return { color: "#f85149", bg: "rgba(248,81,73,0.1)" };
        if (status >= 500) return { color: "#f85149", bg: "rgba(248,81,73,0.15)" };
        return { color: "var(--color-text-muted)", bg: "transparent" };
    };

    const formatResponseBody = () => {
        if (!response?.body) return;
        try {
            const parsed = JSON.parse(response.body);
            setResponse({ ...response, body: JSON.stringify(parsed, null, 2) });
        } catch { }
    };

    const requestTabs = [
        { id: "auth", label: "Authorization" },
        { id: "params", label: "Headers", count: headers.filter(h => h.key.trim()).length },
        { id: "body", label: "Body" },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
                    <Send size={18} className="text-white" />
                </div>
                <div>
                    <h2>API Tester</h2>
                    <p>Send HTTP requests and inspect responses</p>
                </div>
            </div>

            {/* URL Bar */}
            <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="appearance-none font-mono font-bold text-xs px-3 py-2.5 rounded-lg pr-7 cursor-pointer border-none outline-none"
                        style={{
                            background: METHOD_COLORS[method] + "18",
                            color: METHOD_COLORS[method],
                            minWidth: "90px",
                        }}
                    >
                        {METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: METHOD_COLORS[method] }} />
                </div>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendRequest()}
                    className="input-base flex-1 text-sm font-mono py-2.5"
                    placeholder="https://api.example.com/endpoint"
                    spellCheck={false}
                />
                <button
                    onClick={sendRequest}
                    disabled={loading}
                    className="btn-primary flex items-center gap-1.5 py-2.5"
                >
                    <Send size={14} /> {loading ? "Sending..." : "Send"}
                </button>
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5 py-2.5">
                    <FileText size={14} /> Sample
                </button>
            </div>

            {/* Request config tabs */}
            <div className="flex items-center gap-1 mb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                {requestTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="px-3 py-1.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1"
                        style={{
                            borderColor: activeTab === tab.id ? "var(--color-primary)" : "transparent",
                            color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-muted)",
                        }}
                    >
                        {tab.id === "auth" && <Shield size={11} />}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: "var(--color-primary)", color: "white" }}>
                                {tab.count}
                            </span>
                        )}
                        {tab.id === "auth" && authType !== "none" && (
                            <span className="ml-1 w-1.5 h-1.5 rounded-full" style={{ background: "#3fb950" }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Request config content */}
            <div className="mb-3" style={{ minHeight: activeTab === "body" ? "100px" : "auto" }}>
                {/* Auth tab */}
                {activeTab === "auth" && (
                    <div className="space-y-3">
                        {/* Auth type selector */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold shrink-0" style={{ color: "var(--color-text-muted)", minWidth: "50px" }}>Type</label>
                            <div className="flex gap-1">
                                {AUTH_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setAuthType(type.id)}
                                        className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                                        style={{
                                            background: authType === type.id ? "var(--color-primary)" : "var(--color-bg-input)",
                                            color: authType === type.id ? "white" : "var(--color-text-secondary)",
                                            border: `1px solid ${authType === type.id ? "var(--color-primary)" : "var(--color-border)"}`,
                                        }}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bearer Token */}
                        {authType === "bearer" && (
                            <div className="rounded-lg p-3" style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-text-muted)" }}>Token</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Key size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                                        <input
                                            type={showToken ? "text" : "password"}
                                            value={bearerToken}
                                            onChange={(e) => setBearerToken(e.target.value)}
                                            className="input-base text-xs font-mono py-1.5 pl-8 pr-8 w-full"
                                            placeholder="Enter your bearer token..."
                                        />
                                        <button
                                            onClick={() => setShowToken(!showToken)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            style={{ color: "var(--color-text-muted)" }}
                                            title={showToken ? "Hide token" : "Show token"}
                                        >
                                            {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                                    Adds <code className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--color-bg-card)" }}>Authorization: Bearer &lt;token&gt;</code> header
                                </p>
                            </div>
                        )}

                        {/* Basic Auth */}
                        {authType === "basic" && (
                            <div className="rounded-lg p-3" style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-text-muted)" }}>Username</label>
                                        <input
                                            type="text"
                                            value={basicUsername}
                                            onChange={(e) => setBasicUsername(e.target.value)}
                                            className="input-base text-xs font-mono py-1.5 w-full"
                                            placeholder="Username"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-text-muted)" }}>Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={basicPassword}
                                                onChange={(e) => setBasicPassword(e.target.value)}
                                                className="input-base text-xs font-mono py-1.5 pr-8 w-full"
                                                placeholder="Password"
                                            />
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                                style={{ color: "var(--color-text-muted)" }}
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] mt-2" style={{ color: "var(--color-text-muted)" }}>
                                    Adds <code className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--color-bg-card)" }}>Authorization: Basic &lt;base64&gt;</code> header
                                </p>
                            </div>
                        )}

                        {/* API Key */}
                        {authType === "apikey" && (
                            <div className="rounded-lg p-3" style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}>
                                <div className="grid grid-cols-3 gap-3 mb-2">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-text-muted)" }}>Key</label>
                                        <input
                                            type="text"
                                            value={apiKeyName}
                                            onChange={(e) => setApiKeyName(e.target.value)}
                                            className="input-base text-xs font-mono py-1.5 w-full"
                                            placeholder="X-API-Key"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-text-muted)" }}>Value</label>
                                        <div className="relative">
                                            <input
                                                type={showToken ? "text" : "password"}
                                                value={apiKeyValue}
                                                onChange={(e) => setApiKeyValue(e.target.value)}
                                                className="input-base text-xs font-mono py-1.5 pr-8 w-full"
                                                placeholder="your-api-key"
                                            />
                                            <button
                                                onClick={() => setShowToken(!showToken)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                                style={{ color: "var(--color-text-muted)" }}
                                                title={showToken ? "Hide value" : "Show value"}
                                            >
                                                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-text-muted)" }}>Add to</label>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setApiKeyLocation("header")}
                                                className="px-2 py-1.5 rounded text-xs font-medium flex-1"
                                                style={{
                                                    background: apiKeyLocation === "header" ? "var(--color-primary)" : "var(--color-bg-card)",
                                                    color: apiKeyLocation === "header" ? "white" : "var(--color-text-secondary)",
                                                    border: `1px solid ${apiKeyLocation === "header" ? "var(--color-primary)" : "var(--color-border)"}`,
                                                }}
                                            >
                                                Header
                                            </button>
                                            <button
                                                onClick={() => setApiKeyLocation("query")}
                                                className="px-2 py-1.5 rounded text-xs font-medium flex-1"
                                                style={{
                                                    background: apiKeyLocation === "query" ? "var(--color-primary)" : "var(--color-bg-card)",
                                                    color: apiKeyLocation === "query" ? "white" : "var(--color-text-secondary)",
                                                    border: `1px solid ${apiKeyLocation === "query" ? "var(--color-primary)" : "var(--color-border)"}`,
                                                }}
                                            >
                                                Query
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                                    {apiKeyLocation === "header"
                                        ? <>Adds <code className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--color-bg-card)" }}>{apiKeyName || "X-API-Key"}: &lt;value&gt;</code> header</>
                                        : <>Appends <code className="font-mono px-1 py-0.5 rounded" style={{ background: "var(--color-bg-card)" }}>?{apiKeyName || "key"}=&lt;value&gt;</code> to URL</>
                                    }
                                </p>
                            </div>
                        )}

                        {authType === "none" && (
                            <div className="rounded-lg p-4 text-center" style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}>
                                <Shield size={20} className="mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    No authentication configured. Select a type above to add authorization to your request.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Headers tab */}
                {activeTab === "params" && (
                    <div className="space-y-1.5">
                        {headers.map((h, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={h.enabled}
                                    onChange={(e) => updateHeader(i, "enabled", e.target.checked)}
                                    className="shrink-0"
                                />
                                <input
                                    type="text"
                                    value={h.key}
                                    onChange={(e) => updateHeader(i, "key", e.target.value)}
                                    className="input-base text-xs font-mono py-1.5"
                                    placeholder="Header name"
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="text"
                                    value={h.value}
                                    onChange={(e) => updateHeader(i, "value", e.target.value)}
                                    className="input-base text-xs font-mono py-1.5"
                                    placeholder="Value"
                                    style={{ flex: 2 }}
                                />
                                <button onClick={() => removeHeader(i)} className="shrink-0 p-1 rounded hover:bg-red-500/10" style={{ color: "var(--color-text-muted)" }} title="Remove header">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <button onClick={addHeader} className="text-xs flex items-center gap-1 px-2 py-1" style={{ color: "var(--color-primary)" }}>
                            <Plus size={12} /> Add Header
                        </button>
                    </div>
                )}

                {/* Body tab */}
                {activeTab === "body" && (
                    <textarea
                        className="input-base font-mono text-xs w-full"
                        rows={4}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder='{"key": "value"}'
                        spellCheck={false}
                        style={{ resize: "vertical" }}
                    />
                )}
            </div>

            {/* Response section */}
            <div className="flex-1 flex flex-col min-h-0 rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                {/* Response header bar */}
                <div className="flex items-center gap-3 px-3 py-2 border-b text-xs" style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)" }}>
                    <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>Response</span>
                    {response && !response.error && (
                        <>
                            <span
                                className="font-mono font-bold px-1.5 py-0.5 rounded"
                                style={{ ...getStatusStyle(response.status), background: getStatusStyle(response.status).bg }}
                            >
                                {response.status} {response.statusText}
                            </span>
                            <span className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                                <Clock size={11} /> {response.time}ms
                            </span>
                            <span style={{ color: "var(--color-text-muted)" }}>
                                {response.size > 1024 ? (response.size / 1024).toFixed(1) + " KB" : response.size + " B"}
                            </span>

                            <div className="ml-auto flex items-center gap-1">
                                {[
                                    { id: "body", label: "Body" },
                                    { id: "headers", label: "Headers" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setResponseTab(tab.id)}
                                        className="px-2 py-0.5 rounded text-xs font-medium"
                                        style={{
                                            background: responseTab === tab.id ? "var(--color-primary)" : "transparent",
                                            color: responseTab === tab.id ? "white" : "var(--color-text-muted)",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    {response?.error && (
                        <span style={{ color: "#f85149" }}>{response.error}</span>
                    )}
                </div>

                {/* Response body */}
                <div className="flex-1 overflow-auto p-3 font-mono text-xs" style={{ background: "var(--color-bg-card)" }}>
                    {loading && (
                        <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-muted)" }}>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                                Sending request...
                            </div>
                        </div>
                    )}
                    {!loading && !response && (
                        <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-muted)" }}>
                            Enter a URL and click Send to make a request
                        </div>
                    )}
                    {!loading && response && responseTab === "body" && (
                        <div>
                            {response.body && (
                                <div className="flex gap-1 mb-2">
                                    <button onClick={() => copyToClipboard(response.body, showToast)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)", background: "var(--color-bg-input)" }}>
                                        <Copy size={11} /> Copy
                                    </button>
                                    <button onClick={formatResponseBody} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--color-primary)", background: "var(--color-bg-input)" }}>
                                        Format JSON
                                    </button>
                                </div>
                            )}
                            <pre className="whitespace-pre-wrap break-all" style={{ color: "var(--color-text-primary)", lineHeight: "1.6" }}>
                                {response.body || "(empty response)"}
                            </pre>
                        </div>
                    )}
                    {!loading && response && responseTab === "headers" && (
                        <div className="space-y-1">
                            {Object.entries(response.headers || {}).map(([k, v]) => (
                                <div key={k} className="flex gap-2">
                                    <span style={{ color: "var(--color-accent)" }}>{k}:</span>
                                    <span style={{ color: "var(--color-text-primary)" }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
