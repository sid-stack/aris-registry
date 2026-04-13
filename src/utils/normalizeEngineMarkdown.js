/** If the model wraps the whole answer in one ``` fence, unwrap so **bold** parses. */
export function normalizeEngineMarkdown(s) {
  if (!s || typeof s !== "string") return "";
  const t = s.trim();
  const m = t.match(/^```(?:markdown|md|txt)?\s*\n?([\s\S]*?)\n?```$/i);
  if (m) return m[1].trim();
  return s;
}
