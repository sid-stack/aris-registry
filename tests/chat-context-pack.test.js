import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAuditContextBlock,
  capThreadMessages,
  threadToConversationText,
  auditFingerprint,
} from "../api/chat/contextPack.js";

test("buildAuditContextBlock embeds solicitation, agency, verdict, and session note", () => {
  const audit = {
    solicitation_number: "W912DY-99-X-0001",
    title: "Widget Support",
    agency: "USACE",
    verdict: { recommendation: "BID", win_probability: 72, rationale: "Strong fit" },
    requirements: [],
  };
  const block = buildAuditContextBlock(audit, "External docs on NECO");
  assert.match(block, /W912DY-99-X-0001/);
  assert.match(block, /Widget Support/);
  assert.match(block, /USACE/);
  assert.match(block, /External docs on NECO/);
  assert.match(block, /BID/);
  assert.match(block, /Structured audit summary \(JSON\):/);
});

test("buildAuditContextBlock with supplemental only (no structured audit)", () => {
  const block = buildAuditContextBlock(null, "Resume uploaded instead of RFP");
  assert.match(block, /No structured audit loaded/);
  assert.match(block, /Resume uploaded/);
});

test("threadToConversationText labels user and assistant turns", () => {
  const t = threadToConversationText([
    { role: "user", content: "What is the set-aside?" },
    { role: "assistant", content: "It is SDVOSB." },
  ]);
  assert.match(t, /User:.*set-aside/s);
  assert.match(t, /ARIS:.*SDVOSB/s);
});

test("capThreadMessages keeps last N pairs", () => {
  const msgs = [
    { role: "user", content: "1" },
    { role: "assistant", content: "a" },
    { role: "user", content: "2" },
    { role: "assistant", content: "b" },
    { role: "user", content: "3" },
    { role: "assistant", content: "c" },
    { role: "user", content: "4" },
    { role: "assistant", content: "d" },
    { role: "user", content: "5" },
    { role: "assistant", content: "e" },
  ];
  const capped = capThreadMessages(msgs, 2);
  assert.equal(capped.length, 4);
  assert.equal(capped[0].content, "4");
  assert.equal(capped[2].content, "5");
});

test("auditFingerprint stable for cache key material", () => {
  assert.equal(
    auditFingerprint({ solicitation_number: "ABC" }),
    "ABC"
  );
  assert.equal(auditFingerprint(null), "none");
});
