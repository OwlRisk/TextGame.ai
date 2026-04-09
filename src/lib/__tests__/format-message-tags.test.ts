/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { parseInlineFormatting } from "../format-message";

function renderToText(nodes: React.ReactNode[]): string {
  return nodes
    .map((n) => {
      if (typeof n === "string") return n;
      if (React.isValidElement(n)) {
        const children = (n.props as Record<string, unknown>).children;
        if (typeof children === "string") return children;
        if (Array.isArray(children)) return children.join("");
      }
      return "";
    })
    .join("");
}

function getElementTypes(nodes: React.ReactNode[]): string[] {
  return nodes
    .filter(React.isValidElement)
    .map((n) => (n as React.ReactElement).type as string);
}

// ─── [ACTION] tag parsing ─────────────────────────────────────────────────

describe("[ACTION] tag parsing", () => {
  it("extracts content from [ACTION]...[/ACTION]", () => {
    const nodes = parseInlineFormatting("[ACTION]looks around the room[/ACTION]");
    const text = renderToText(nodes);
    expect(text).toContain("looks around the room");
  });

  it("renders [ACTION] content as <em> element", () => {
    const nodes = parseInlineFormatting("[ACTION]walks away[/ACTION]");
    const emElements = nodes.filter(
      (n) => React.isValidElement(n) && (n as React.ReactElement).type === "em"
    );
    expect(emElements.length).toBe(1);
  });

  it("[ACTION] element has amber styling class", () => {
    const nodes = parseInlineFormatting("[ACTION]nods slowly[/ACTION]");
    const em = nodes.find(
      (n) => React.isValidElement(n) && (n as React.ReactElement).type === "em"
    ) as React.ReactElement;
    expect(em).toBeDefined();
    expect((em.props as Record<string, string>).className).toContain("amber");
  });

  it("handles mixed text and [ACTION] tags", () => {
    const nodes = parseInlineFormatting("Hello! [ACTION]waves hand[/ACTION] Nice to meet you.");
    const text = renderToText(nodes);
    expect(text).toContain("Hello!");
    expect(text).toContain("waves hand");
    expect(text).toContain("Nice to meet you.");
  });

  it("handles multiple [ACTION] tags", () => {
    const nodes = parseInlineFormatting("[ACTION]stands up[/ACTION] and then [ACTION]walks out[/ACTION]");
    const emElements = nodes.filter(
      (n) => React.isValidElement(n) && (n as React.ReactElement).type === "em"
    );
    expect(emElements.length).toBe(2);
  });
});

// ─── Plain text ───────────────────────────────────────────────────────────

describe("plain text handling", () => {
  it("returns the original text when no formatting is present", () => {
    const nodes = parseInlineFormatting("Just plain text here");
    const text = renderToText(nodes);
    expect(text).toBe("Just plain text here");
  });

  it("returns a non-empty array for empty string", () => {
    const nodes = parseInlineFormatting("");
    expect(nodes.length).toBeGreaterThan(0);
  });
});

// ─── Bold / italic still work ─────────────────────────────────────────────

describe("standard formatting", () => {
  it("**bold** creates a <strong> element", () => {
    const nodes = parseInlineFormatting("This is **important**");
    const strong = nodes.find(
      (n) => React.isValidElement(n) && (n as React.ReactElement).type === "strong"
    );
    expect(strong).toBeDefined();
  });

  it("*italic* creates an <em> element", () => {
    const nodes = parseInlineFormatting("This is *emphasis*");
    const em = nodes.find(
      (n) => React.isValidElement(n) && (n as React.ReactElement).type === "em"
    );
    expect(em).toBeDefined();
  });

  it("`code` creates a <code> element", () => {
    const nodes = parseInlineFormatting("Run `npm install`");
    const code = nodes.find(
      (n) => React.isValidElement(n) && (n as React.ReactElement).type === "code"
    );
    expect(code).toBeDefined();
  });
});
