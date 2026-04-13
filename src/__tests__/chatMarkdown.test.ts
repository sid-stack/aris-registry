/**
 * SSR-style checks for shared ChatMarkdown (Bento + GovCon assistant bubbles).
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMarkdown, BENTO_WORKSPACE_CHAT_PALETTE } from "../components/chat/ChatMarkdown.jsx";

describe("ChatMarkdown", () => {
  it("renders bold, list, and heading — not raw ** or ##", () => {
    const md =
      "**Key risk:** Section L requires **CMMC Level 2** certification.\n\n- Clause 1\n- Clause 2\n\n## Summary";
    const html = renderToStaticMarkup(
      createElement(ChatMarkdown, { content: md, palette: BENTO_WORKSPACE_CHAT_PALETTE }),
    );
    expect(html).toMatch(/<strong[^>]*>Key risk:<\/strong>/);
    expect(html).toMatch(/<strong[^>]*>CMMC Level 2<\/strong>/);
    expect(html).toContain("<ul");
    expect(html).toContain("<h2");
    expect(html).not.toContain("**Key risk:**");
    expect(html).not.toContain("## Summary");
  });

  it("unwraps a single ```markdown fence before parsing", () => {
    const md = "```markdown\n**Hi**\n```";
    const html = renderToStaticMarkup(createElement(ChatMarkdown, { content: md }));
    expect(html).toContain("<strong");
    expect(html).not.toContain("```");
  });
});
