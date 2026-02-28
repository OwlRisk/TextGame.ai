import { Marked } from "marked";

/**
 * A sandboxed `marked` instance that drops raw HTML blocks (e.g. <script>,
 * inline event handlers) before rendering. Standard markdown — headings, bold,
 * italic, lists, code blocks — is unaffected.
 *
 * Use this everywhere user-authored or AI-generated markdown is rendered via
 * dangerouslySetInnerHTML to prevent XSS.
 */
const _marked = new Marked();
_marked.use({
  renderer: {
    // Drop raw HTML block tokens silently.
    html: () => "",
  },
});

export function safeMarked(text: string): string {
  return _marked.parse(text, { async: false }) as string;
}
