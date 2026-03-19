import test from "node:test";
import assert from "node:assert/strict";
import { assembleNewsInsights } from "../api/news.js";

test("assembleNewsInsights merges static report, RSS, and alert feeds", async () => {
  const fakeHtml = `
    <html><body>
      <h2>FDIC Report - Market Stress</h2>
      <h2>FDIC Report - Cyber Risk</h2>
    </body></html>
  `;

  const fakeRssXml = `
    <rss version="2.0"><channel>
      <item>
        <title>FDIC Announces New Capital Rules</title>
        <link>https://www.fdic.gov/news/2024/01/01</link>
        <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      </item>
      <item>
        <title>Consumer Complaints Rise 12%</title>
        <link>https://www.fdic.gov/news/2024/02/15</link>
        <pubDate>Thu, 15 Feb 2024 08:30:00 GMT</pubDate>
      </item>
    </channel></rss>
  `;

  const fakeAlerts = [
    {
      title: "High-risk loan concentration detected",
      url: "https://internal.example.com/alerts/123",
      date: "2024-03-10T14:22:00Z",
      source: "Audit Engine",
    },
  ];

  const result = await assembleNewsInsights({
    staticHtml: fakeHtml,
    rssXml: fakeRssXml,
    recentAlerts: fakeAlerts,
    maxItemsPerSource: 8,
  });

  assert.equal(result.length, 5);

  const staticItem = result.find((item) => item.source === "FDIC Report");
  assert.ok(staticItem);
  assert.match(staticItem.title, /(Market Stress|Cyber Risk)/);

  const rssItem = result.find((item) => item.source === "FDIC RSS");
  assert.ok(rssItem);
  assert.equal(rssItem.title, "Consumer Complaints Rise 12%");
  assert.equal(rssItem.url, "https://www.fdic.gov/news/2024/02/15");
  assert.ok(rssItem.date);

  const alertItem = result.find((item) => item.source === "Audit Engine");
  assert.ok(alertItem);
  assert.equal(alertItem.title, "High-risk loan concentration detected");

  result.forEach((item) => {
    assert.ok(item.title);
    assert.ok(item.source);
    if (item.url !== undefined) {
      assert.equal(typeof item.url, "string");
    }
  });
});

test("assembleNewsInsights tolerates RSS fetch failure", async () => {
  const result = await assembleNewsInsights({
    staticHtml: "<h2>Only Static</h2>",
    recentAlerts: [],
    fetchImpl: async () => ({ ok: false, status: 500, text: async () => "nope" }),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].source, "FDIC Report");
});

