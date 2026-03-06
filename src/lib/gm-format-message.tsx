import React from "react";
import { parseInlineFormatting } from "@/lib/format-message";

/**
 * Render a GM chat message with markdown-like formatting
 * (headings, numbered/bulleted lists, label lines, inline bold/italic).
 */
export function formatGMMessage(content: string) {
  const lines = content.split("\n");
  const elements: React.JSX.Element[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      elements.push(<div key={`br-${index}`} className="h-2" />);
      return;
    }

    if (trimmedLine.startsWith("###")) {
      const text = trimmedLine.replace(/^###+\s*/, "");
      elements.push(
        <h3
          key={index}
          className="font-bold text-base text-violet-300 mt-4 mb-2 first:mt-0"
        >
          {parseInlineFormatting(text)}
        </h3>,
      );
      return;
    }
    if (trimmedLine.startsWith("##")) {
      const text = trimmedLine.replace(/^##+\s*/, "");
      elements.push(
        <h2
          key={index}
          className="font-bold text-lg text-violet-200 mt-4 mb-2 first:mt-0"
        >
          {parseInlineFormatting(text)}
        </h2>,
      );
      return;
    }
    if (trimmedLine.startsWith("#")) {
      const text = trimmedLine.replace(/^#+\s*/, "");
      elements.push(
        <h1
          key={index}
          className="font-bold text-xl text-violet-100 mt-4 mb-3 first:mt-0"
        >
          {parseInlineFormatting(text)}
        </h1>,
      );
      return;
    }

    const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedListMatch) {
      const [, number, text] = numberedListMatch;
      elements.push(
        <div key={index} className="flex gap-2.5 mb-1.5">
          <span className="text-violet-400 font-semibold flex-shrink-0 min-w-[20px]">
            {number}.
          </span>
          <div className="flex-1 min-w-0">{parseInlineFormatting(text)}</div>
        </div>,
      );
      return;
    }
    if (/^[•\-\*]\s+/.test(trimmedLine)) {
      const text = trimmedLine.replace(/^[•\-\*]\s+/, "");
      elements.push(
        <div key={index} className="flex gap-2.5 mb-1.5">
          <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
          <div className="flex-1 min-w-0">{parseInlineFormatting(text)}</div>
        </div>,
      );
      return;
    }
    if (
      trimmedLine.endsWith(":") &&
      (trimmedLine.length < 50 || trimmedLine === trimmedLine.toUpperCase())
    ) {
      elements.push(
        <div
          key={index}
          className="font-semibold text-sm text-violet-300 mt-3 mb-1.5 first:mt-0"
        >
          {parseInlineFormatting(trimmedLine)}
        </div>,
      );
      return;
    }
    elements.push(
      <div key={index} className="mb-1.5 leading-relaxed">
        {parseInlineFormatting(trimmedLine)}
      </div>,
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}
