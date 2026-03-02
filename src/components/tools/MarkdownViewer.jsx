"use client";

import { useState, useMemo } from "react";
import { useToast, copyToClipboard } from "@/utils/helpers";
import { Eye, FileText, Copy, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SAMPLE_MARKDOWN = `# Welcome to Markdown Viewer

This is a **live preview** Markdown editor. Type on the left, see the rendered output on the right.

## Features

- **Bold**, *italic*, and ~~strikethrough~~ text
- [Links](https://example.com)
- Inline \`code\` and code blocks

### Code Blocks

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
}
greet("World");
\`\`\`

### Tables

| Feature | Status |
|---------|--------|
| Headers | ✅ |
| Lists | ✅ |
| Code Blocks | ✅ |
| Tables | ✅ |

### Blockquotes

> "Any fool can write code that a computer can understand.
> Good programmers write code that humans can understand."
> — Martin Fowler

### Task Lists

- [x] Implement Markdown parser
- [x] Add live preview
- [ ] Add export to HTML

---

*Powered by NucUtils*
`;

export default function MarkdownViewer() {
    const [input, setInput] = useState("");
    const { showToast, ToastComponent } = useToast();

    const loadSample = () => {
        setInput(SAMPLE_MARKDOWN);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="tool-header">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}>
                    <Eye size={18} className="text-white" />
                </div>
                <div>
                    <h2>Markdown Viewer</h2>
                    <p>Write Markdown and see a live rendered preview</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button onClick={loadSample} className="btn-secondary flex items-center gap-1.5">
                    <FileText size={14} /> Sample
                </button>
                <button onClick={() => copyToClipboard(input, showToast)} className="btn-secondary flex items-center gap-1.5" disabled={!input}>
                    <Copy size={14} /> Copy Markdown
                </button>
                <button onClick={() => setInput("")} className="btn-secondary flex items-center gap-1.5">
                    <Trash2 size={14} /> Clear
                </button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-0 min-h-0 rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                {/* Editor */}
                <div className="flex flex-col border-r min-h-0" style={{ borderColor: "var(--color-border)" }}>
                    <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-2"
                        style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                        <FileText size={12} /> Markdown
                    </div>
                    <textarea
                        className="flex-1 font-mono text-xs p-3 outline-none resize-none"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your Markdown here..."
                        spellCheck={false}
                        style={{
                            background: "var(--color-bg-card)",
                            color: "var(--color-text-primary)",
                            lineHeight: "1.7",
                            border: "none",
                        }}
                    />
                </div>

                {/* Preview */}
                <div className="flex flex-col min-h-0">
                    <div className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-2"
                        style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                        <Eye size={12} /> Preview
                    </div>
                    <div
                        className="flex-1 overflow-auto p-4 markdown-preview"
                        style={{ background: "var(--color-bg-card)" }}
                    >
                        {input ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {input}
                            </ReactMarkdown>
                        ) : (
                            <p className="italic text-sm" style={{ color: "var(--color-text-muted)" }}>
                                Start typing Markdown on the left to see the preview...
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {ToastComponent}
        </div>
    );
}
