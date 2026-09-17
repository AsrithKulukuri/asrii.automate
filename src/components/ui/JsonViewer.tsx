"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface JsonViewerProps {
  data: unknown;
  title?: string;
  maxHeight?: string;
}

export function JsonViewer({ data, title, maxHeight = "320px" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[#222222] bg-[#0D0D0D] overflow-hidden text-xs">
      {title && (
        <div className="flex items-center justify-between px-3 py-2 bg-[#141414] border-b border-[#222222] text-[#A3A3A3] font-mono">
          <span className="font-medium text-[#D4D4D4]">{title}</span>
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 hover:text-[#F5F5F5] transition-colors p-1 rounded"
            title="Copy JSON"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#34D399]" />
                <span className="text-[#34D399]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      <pre
        style={{ maxHeight }}
        className="p-3 overflow-auto font-mono text-[#CCCCCC] leading-relaxed select-text"
      >
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
