/**
 * Markdown Sanitizer - Post-process LLM responses to ensure clean markdown
 */
export function sanitizeMarkdown(md) {
  if (!md || typeof md !== "string") return "";

  // Strip any stray HTML tags
  const noHtml = md.replace(/<\/?[^>]+(>|$)/g, "");

  // Remove LaTeX delimiters (guard against accidental leaks)
  const noLatex = noHtml.replace(/\$\$?([^$]+)\$?\$/g, (_, expr) => `\`${expr.trim()}\``);

  // Collapse multiple blank lines
  const cleaned = noLatex.replace(/\n{3,}/g, "\n\n");

  return cleaned;
}
