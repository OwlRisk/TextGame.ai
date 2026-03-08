import { describe, it, expect } from 'vitest';
import React from 'react';
import { parseInlineFormatting, EMOTION_EMOJI } from '../format-message';

// Helper: flatten React node tree to plain text
function toText(nodes: React.ReactNode[]): string {
  return nodes
    .map((n) => {
      if (typeof n === 'string') return n;
      if (React.isValidElement(n)) {
        const children = (n.props as { children?: React.ReactNode }).children;
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) return children.join('');
      }
      return '';
    })
    .join('');
}

// Helper: find elements of a given HTML tag
function findByTag(nodes: React.ReactNode[], tag: string): React.ReactElement[] {
  return nodes.filter(
    (n): n is React.ReactElement =>
      React.isValidElement(n) && n.type === tag
  );
}

// ─── EMOTION_EMOJI ────────────────────────────────────────────────────────

describe('EMOTION_EMOJI', () => {
  it('has emoji for sound-effect tags', () => {
    expect(EMOTION_EMOJI.cough).toBe('🤧');
    expect(EMOTION_EMOJI.sigh).toBe('😮‍💨');
    expect(EMOTION_EMOJI.clear_throat).toBe('😤');
  });

  it('does not include plain emotion words', () => {
    expect(EMOTION_EMOJI.happy).toBeUndefined();
    expect(EMOTION_EMOJI.sad).toBeUndefined();
    expect(EMOTION_EMOJI.angry).toBeUndefined();
  });

  it('all values are non-empty strings', () => {
    Object.values(EMOTION_EMOJI).forEach((v) => {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    });
  });
});

// ─── parseInlineFormatting: plain text ───────────────────────────────────

describe('parseInlineFormatting – plain text', () => {
  it('returns the original text wrapped in spans for plain input', () => {
    const nodes = parseInlineFormatting('Hello World');
    expect(toText(nodes)).toBe('Hello World');
  });

  it('returns a single span for empty string', () => {
    const nodes = parseInlineFormatting('');
    expect(nodes).toHaveLength(1);
    expect(React.isValidElement(nodes[0])).toBe(true);
  });
});

// ─── parseInlineFormatting: bold ─────────────────────────────────────────

describe('parseInlineFormatting – bold', () => {
  it('wraps **text** in <strong>', () => {
    const nodes = parseInlineFormatting('Hello **World**');
    const strongs = findByTag(nodes, 'strong');
    expect(strongs).toHaveLength(1);
    expect((strongs[0].props as { children: string }).children).toBe('World');
  });

  it('preserves text before and after bold', () => {
    const nodes = parseInlineFormatting('A **B** C');
    expect(toText(nodes)).toBe('A B C');
  });

  it('handles multiple bold spans', () => {
    const nodes = parseInlineFormatting('**A** and **B**');
    const strongs = findByTag(nodes, 'strong');
    expect(strongs).toHaveLength(2);
  });
});

// ─── parseInlineFormatting: italic ───────────────────────────────────────

describe('parseInlineFormatting – italic', () => {
  it('wraps *text* in <em>', () => {
    const nodes = parseInlineFormatting('Hello *World*');
    const ems = findByTag(nodes, 'em');
    expect(ems).toHaveLength(1);
    expect((ems[0].props as { children: string }).children).toBe('World');
  });

  it('bold takes priority over italic when overlapping markers', () => {
    const nodes = parseInlineFormatting('**bold** and *italic*');
    expect(findByTag(nodes, 'strong')).toHaveLength(1);
    expect(findByTag(nodes, 'em')).toHaveLength(1);
  });
});

// ─── parseInlineFormatting: code ─────────────────────────────────────────

describe('parseInlineFormatting – code', () => {
  it('wraps `text` in <code>', () => {
    const nodes = parseInlineFormatting('Run `npm install`');
    const codes = findByTag(nodes, 'code');
    expect(codes).toHaveLength(1);
    expect((codes[0].props as { children: string }).children).toBe('npm install');
  });
});

// ─── parseInlineFormatting: strikethrough ────────────────────────────────

describe('parseInlineFormatting – strikethrough', () => {
  it('wraps ~~text~~ in a <span>', () => {
    const nodes = parseInlineFormatting('~~deleted~~');
    // strikethrough renders as <span> with strikethrough class
    const spans = nodes.filter(
      (n): n is React.ReactElement =>
        React.isValidElement(n) &&
        n.type === 'span' &&
        typeof (n.props as { className?: string }).className === 'string' &&
        ((n.props as { className: string }).className).includes('line-through')
    );
    expect(spans).toHaveLength(1);
    expect((spans[0].props as { children: string }).children).toBe('deleted');
  });
});

// ─── parseInlineFormatting: mention ──────────────────────────────────────

describe('parseInlineFormatting – mention', () => {
  it('wraps @Name in a mention span', () => {
    const nodes = parseInlineFormatting('Hello @Alice today');
    const mentions = nodes.filter(
      (n): n is React.ReactElement =>
        React.isValidElement(n) &&
        n.type === 'span' &&
        typeof (n.props as { className?: string }).className === 'string' &&
        ((n.props as { className: string }).className).includes('violet')
    );
    expect(mentions).toHaveLength(1);
  });
});

// ─── parseInlineFormatting: emotion tags ─────────────────────────────────

describe('parseInlineFormatting – emotion', () => {
  it('replaces known sound-effect tag [cough] with its emoji', () => {
    const nodes = parseInlineFormatting('[cough]');
    const emotionSpan = nodes.find(
      (n): n is React.ReactElement =>
        React.isValidElement(n) &&
        n.type === 'span' &&
        (n.props as { children?: string }).children === EMOTION_EMOJI.cough
    );
    expect(emotionSpan).toBeDefined();
  });

  it('renders unknown emotion tags as literal text', () => {
    const nodes = parseInlineFormatting('[unknowntag]');
    const text = toText(nodes);
    expect(text).toContain('[unknowntag]');
  });

  it('renders [happy] as literal text since it is no longer mapped', () => {
    const nodes = parseInlineFormatting('[happy]');
    const text = toText(nodes);
    expect(text).toContain('[happy]');
  });
});

// ─── parseInlineFormatting: mixed / edge cases ───────────────────────────

describe('parseInlineFormatting – mixed & edge cases', () => {
  it('handles mixed formatting in one string', () => {
    const nodes = parseInlineFormatting('**Bold**, *italic*, and `code`.');
    expect(findByTag(nodes, 'strong')).toHaveLength(1);
    expect(findByTag(nodes, 'em')).toHaveLength(1);
    expect(findByTag(nodes, 'code')).toHaveLength(1);
  });

  it('does not parse partial bold markers as bold', () => {
    // Single * on one side only should not create bold
    const nodes = parseInlineFormatting('price is **10');
    expect(findByTag(nodes, 'strong')).toHaveLength(0);
  });

  it('preserves text around all formatting marks', () => {
    const input = 'Start **bold** middle *italic* end';
    const nodes = parseInlineFormatting(input);
    expect(toText(nodes)).toBe('Start bold middle italic end');
  });
});
