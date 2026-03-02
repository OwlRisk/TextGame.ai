import { describe, it, expect } from 'vitest';
import { stripMarkdownForTTS, prepareTextForTTS } from '../voice';

// ─── stripMarkdownForTTS ──────────────────────────────────────────────────

describe('stripMarkdownForTTS – inline formatting', () => {
  it('removes bold markers', () => {
    expect(stripMarkdownForTTS('**bold text**')).toBe('bold text');
  });

  it('removes italic markers (*)', () => {
    expect(stripMarkdownForTTS('*italic text*')).toBe('italic text');
  });

  it('removes italic markers (_)', () => {
    expect(stripMarkdownForTTS('_italic text_')).toBe('italic text');
  });

  it('removes inline code backticks', () => {
    expect(stripMarkdownForTTS('Use `console.log()` here.')).toBe('Use console.log() here.');
  });

  it('removes heading markers', () => {
    expect(stripMarkdownForTTS('# Heading 1')).toBe('Heading 1');
    expect(stripMarkdownForTTS('## Heading 2')).toBe('Heading 2');
    expect(stripMarkdownForTTS('### Heading 3')).toBe('Heading 3');
  });

  it('removes unordered list markers (-, *, •)', () => {
    expect(stripMarkdownForTTS('- item one')).toBe('item one');
    expect(stripMarkdownForTTS('* item two')).toBe('item two');
    expect(stripMarkdownForTTS('• item three')).toBe('item three');
  });

  it('removes ordered list markers', () => {
    expect(stripMarkdownForTTS('1. First item')).toBe('First item');
    expect(stripMarkdownForTTS('10. Tenth item')).toBe('Tenth item');
  });

  it('collapses multiple newlines into a single space', () => {
    const result = stripMarkdownForTTS('Line one\n\nLine two');
    expect(result).toBe('Line one Line two');
  });

  it('collapses multiple spaces into one', () => {
    expect(stripMarkdownForTTS('too   many   spaces')).toBe('too many spaces');
  });

  it('trims leading and trailing whitespace', () => {
    expect(stripMarkdownForTTS('  hello  ')).toBe('hello');
  });

  it('returns plain text unchanged', () => {
    expect(stripMarkdownForTTS('Hello world')).toBe('Hello world');
  });

  it('handles mixed markdown in one string', () => {
    const input = '**Alice** suspects *Bob*.\n\n- Evidence: `clue`';
    const result = stripMarkdownForTTS(input);
    expect(result).toBe('Alice suspects Bob. Evidence: clue');
  });
});

// ─── prepareTextForTTS ────────────────────────────────────────────────────

describe('prepareTextForTTS – empty/null guards', () => {
  it('returns empty string for empty input', () => {
    expect(prepareTextForTTS('')).toBe('');
  });

  it('returns empty string for non-string input', () => {
    expect(prepareTextForTTS(null as unknown as string)).toBe('');
    expect(prepareTextForTTS(undefined as unknown as string)).toBe('');
  });
});

describe('prepareTextForTTS – inline formatting', () => {
  it('removes bold', () => {
    expect(prepareTextForTTS('**bold**')).toBe('bold');
  });

  it('removes italic (*)', () => {
    expect(prepareTextForTTS('*italic*')).toBe('italic');
  });

  it('removes italic (_)', () => {
    expect(prepareTextForTTS('_italic_')).toBe('italic');
  });

  it('removes strikethrough', () => {
    expect(prepareTextForTTS('~~deleted~~')).toBe('deleted');
  });

  it('removes inline code', () => {
    expect(prepareTextForTTS('`code`')).toBe('code');
  });

  it('removes fenced code blocks', () => {
    const result = prepareTextForTTS('Before\n```\nconst x = 1;\n```\nAfter');
    expect(result).not.toContain('const x');
    expect(result).toContain('Before');
    expect(result).toContain('After');
  });
});

describe('prepareTextForTTS – links and URLs', () => {
  it('replaces markdown links with the label text only', () => {
    expect(prepareTextForTTS('[click here](https://example.com)')).toBe('click here');
  });

  it('removes bare HTTPS URLs', () => {
    const result = prepareTextForTTS('Visit https://example.com for more.');
    expect(result).not.toContain('https://');
    expect(result).toContain('Visit');
    expect(result).toContain('for more.');
  });

  it('removes bare HTTP URLs', () => {
    const result = prepareTextForTTS('See http://example.com now.');
    expect(result).not.toContain('http://');
  });
});

describe('prepareTextForTTS – punctuation normalisation', () => {
  it('preserves ellipsis as three dots', () => {
    const result = prepareTextForTTS('Wait\u2026');
    expect(result).toBe('Wait...');
  });

  it('replaces em-dash with comma + space', () => {
    const result = prepareTextForTTS('Alice\u2014Bob');
    expect(result).toBe('Alice, Bob');
  });

  it('replaces en-dash with comma + space', () => {
    const result = prepareTextForTTS('Alice\u2013Bob');
    expect(result).toBe('Alice, Bob');
  });
});

describe('prepareTextForTTS – maxLength truncation', () => {
  it('returns full text when within maxLength', () => {
    const text = 'Hello world';
    expect(prepareTextForTTS(text, 100)).toBe('Hello world');
  });

  it('truncates at a word boundary when text exceeds maxLength', () => {
    const text = 'one two three four five six';
    const result = prepareTextForTTS(text, 15);
    expect(result.length).toBeLessThanOrEqual(15);
    expect(result).not.toMatch(/\S$/); // should not end mid-word with no space
  });

  it('does not truncate when maxLength is 0 (disabled)', () => {
    const long = 'a'.repeat(5000);
    const result = prepareTextForTTS(long, 0);
    expect(result.length).toBe(5000);
  });

  it('uses default maxLength of 4096', () => {
    const long = 'word '.repeat(1000); // ~5000 chars
    const result = prepareTextForTTS(long);
    expect(result.length).toBeLessThanOrEqual(4096);
  });
});

describe('prepareTextForTTS – real-world game messages', () => {
  it('cleans a typical Host game message', () => {
    const input = '**Night falls.** The _werewolves_ stir.\n\n- Alice is eliminated.\n- Remaining: Bob, Charlie.\n\nVisit https://rules.example.com';
    const result = prepareTextForTTS(input);
    expect(result).toContain('Night falls.');
    expect(result).toContain('werewolves');
    expect(result).toContain('Alice is eliminated.');
    expect(result).not.toContain('**');
    expect(result).not.toContain('_');
    expect(result).not.toContain('https://');
    expect(result).not.toContain('\n');
  });

  it('cleans a player accusation with inline code and bold', () => {
    const input = '**I accuse Bob!** He was near `the body` last night.';
    const result = prepareTextForTTS(input);
    expect(result).toBe('I accuse Bob! He was near the body last night.');
  });
});
