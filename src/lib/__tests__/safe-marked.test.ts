import { describe, it, expect } from 'vitest';
import { safeMarked } from '../safe-marked';

// ─── Standard Markdown ────────────────────────────────────────────────────

describe('safeMarked – standard markdown rendering', () => {
  it('renders bold text', () => {
    const html = safeMarked('**bold**');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    const html = safeMarked('_italic_');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders headings', () => {
    const html = safeMarked('## Hello');
    expect(html).toMatch(/<h2[^>]*>Hello<\/h2>/);
  });

  it('renders unordered lists', () => {
    const html = safeMarked('- item one\n- item two');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>item one</li>');
    expect(html).toContain('<li>item two</li>');
  });

  it('renders ordered lists', () => {
    const html = safeMarked('1. first\n2. second');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>first</li>');
  });

  it('renders inline code', () => {
    const html = safeMarked('Use `console.log()` here.');
    expect(html).toContain('<code>console.log()</code>');
  });

  it('renders fenced code blocks', () => {
    const html = safeMarked('```\nconst x = 1;\n```');
    expect(html).toContain('<code>');
    expect(html).toContain('const x = 1;');
  });

  it('renders links', () => {
    const html = safeMarked('[click](https://example.com)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('click');
  });

  it('renders a horizontal rule', () => {
    const html = safeMarked('---');
    expect(html).toContain('<hr');
  });

  it('returns an empty string for empty input', () => {
    const html = safeMarked('');
    expect(html.trim()).toBe('');
  });
});

// ─── XSS / HTML Sanitisation ──────────────────────────────────────────────

describe('safeMarked – XSS prevention', () => {
  it('strips raw <script> tags', () => {
    const html = safeMarked('<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert("xss")');
  });

  it('strips inline event handlers like onerror', () => {
    const html = safeMarked('<img src="x" onerror="evil()">');
    expect(html).not.toContain('onerror');
  });

  it('strips <style> blocks', () => {
    const html = safeMarked('<style>body { display:none }</style>');
    expect(html).not.toContain('<style>');
    expect(html).not.toContain('display:none');
  });

  it('strips HTML block mixed with markdown', () => {
    const html = safeMarked('Hello **world**\n<script>bad()</script>\nEnd.');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<strong>world</strong>');
  });

  it('leaves normal paragraph text untouched', () => {
    const input = 'This is safe text.';
    const html = safeMarked(input);
    expect(html).toContain('This is safe text.');
  });
});
