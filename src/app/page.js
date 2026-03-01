"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import JsonBeautifier from "@/components/tools/JsonBeautifier";
import JsonParser from "@/components/tools/JsonParser";
import XmlParser from "@/components/tools/XmlParser";
import JsonXmlConverter from "@/components/tools/JsonXmlConverter";
import Base32Encoder from "@/components/tools/Base32Encoder";
import Base64Encoder from "@/components/tools/Base64Encoder";
import FormatterCompare from "@/components/tools/FormatterCompare";
import QrGenerator from "@/components/tools/QrGenerator";
import ColorConverter from "@/components/tools/ColorConverter";
import ImageBase64 from "@/components/tools/ImageBase64";
import ApiTester from "@/components/tools/ApiTester";
import MarkdownViewer from "@/components/tools/MarkdownViewer";
import RegexTester from "@/components/tools/RegexTester";
import JsonSchemaValidator from "@/components/tools/JsonSchemaValidator";
import JsonDiff from "@/components/tools/JsonDiff";

const TOOLS = {
  "json-beautifier": JsonBeautifier,
  "json-parser": JsonParser,
  "xml-parser": XmlParser,
  "json-xml-converter": JsonXmlConverter,
  "base32-encoder": Base32Encoder,
  "base64-encoder": Base64Encoder,
  "formatter-compare": FormatterCompare,
  "qr-generator": QrGenerator,
  "color-converter": ColorConverter,
  "image-base64": ImageBase64,
  "api-tester": ApiTester,
  "markdown-viewer": MarkdownViewer,
  "regex-tester": RegexTester,
  "json-schema-validator": JsonSchemaValidator,
  "json-diff": JsonDiff,
};

const TOOL_LABELS = {
  "json-beautifier": "JSON Beautifier",
  "json-parser": "JSON Parser",
  "xml-parser": "XML Parser",
  "json-xml-converter": "JSON ↔ XML Converter",
  "base32-encoder": "Base32 Encoder",
  "base64-encoder": "Base64 Encoder",
  "formatter-compare": "Formatter & Compare",
  "qr-generator": "QR Code Generator",
  "color-converter": "Color Converter",
  "image-base64": "Image ↔ Base64",
  "api-tester": "API Tester",
  "markdown-viewer": "Markdown Viewer",
  "regex-tester": "Regex Tester",
  "json-schema-validator": "JSON Schema Validator",
  "json-diff": "JSON Diff",
};

function WelcomeScreen({ onSelectTool }) {
  const quickLinks = [
    { id: "json-beautifier", icon: "{ }", label: "JSON Beautifier", desc: "Format & validate JSON" },
    { id: "json-xml-converter", icon: "↔", label: "JSON ↔ XML", desc: "Convert formats" },
    { id: "base64-encoder", icon: "B64", label: "Base64", desc: "Encode & decode" },
    { id: "color-converter", icon: "🎨", label: "Colors", desc: "Convert color formats" },
    { id: "qr-generator", icon: "▣", label: "QR Codes", desc: "Generate QR codes" },
    { id: "image-base64", icon: "🖼", label: "Image ↔ Base64", desc: "Convert images" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full tool-enter">
      <div className="text-center mb-10">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-5"
          style={{
            background: "var(--color-primary)",
          }}
        >
          N
        </div>
        <h2
          className="text-2xl font-semibold mb-2 tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Developer Utilities
        </h2>
        <p
          className="text-sm max-w-sm mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          A collection of tools to help you format, convert, encode, and generate data quickly.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-lg w-full">
        {quickLinks.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTool(item.id)}
            className="glass-card px-4 py-4 flex flex-col items-center gap-2 text-center cursor-pointer group"
          >
            <span
              className="text-lg w-10 h-10 flex items-center justify-center rounded-lg font-mono font-bold"
              style={{
                background: "var(--color-bg-active)",
                color: "var(--color-primary)",
              }}
            >
              {item.icon}
            </span>
            <div>
              <span
                className="text-xs font-semibold block"
                style={{ color: "var(--color-text-primary)" }}
              >
                {item.label}
              </span>
              <span
                className="text-[0.6875rem] block mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {item.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      <p
        className="text-xs mt-8"
        style={{ color: "var(--color-text-muted)" }}
      >
        Select a tool from the sidebar or click a card above to get started
      </p>
    </div>
  );
}

export default function Home() {
  const [activeTool, setActiveTool] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const ToolComponent = activeTool ? TOOLS[activeTool] : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
          style={{
            background: "var(--color-bg-sidebar)",
            borderColor: "var(--color-border)",
          }}
        >
          <div>
            <h2
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {activeTool ? TOOL_LABELS[activeTool] || "Tool" : "Dashboard"}
            </h2>
            <p className="text-[0.6875rem]" style={{ color: "var(--color-text-muted)" }}>
              Developer Utilities
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-auto p-5"
          style={{ background: "var(--color-bg-main)" }}
        >
          {ToolComponent ? (
            <div key={activeTool} className="tool-enter h-full">
              <ToolComponent />
            </div>
          ) : (
            <WelcomeScreen onSelectTool={setActiveTool} />
          )}
        </main>
      </div>
    </div>
  );
}
