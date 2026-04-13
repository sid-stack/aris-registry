// Covers stripping of full-document ```markdown fences from LLM chat output before ReactMarkdown.
import { describe, it, expect } from "vitest";
import { normalizeEngineMarkdown } from "../utils/normalizeEngineMarkdown.js";

describe("normalizeEngineMarkdown", () => {
  // Verifies a single outer ```markdown fence is removed while inner markdown stays intact.
  it("strips a single wrapping ```markdown code fence", () => {
    const input = "```markdown\n# Hello\n\n**Bold** here.\n```";
    expect(normalizeEngineMarkdown(input)).toBe("# Hello\n\n**Bold** here.");
  });

  // Verifies plain markdown without a full-wrap fence is returned unchanged (aside from non-applicable trim rules).
  it("returns un-fenced input unchanged", () => {
    const input = "Line one\n\n**Bold** stays.";
    expect(normalizeEngineMarkdown(input)).toBe(input);
  });

  // Verifies emphasis markers are not stripped by normalization.
  it("preserves **bold** markdown through the helper", () => {
    expect(normalizeEngineMarkdown("Before **bold** after")).toBe("Before **bold** after");
  });
});
