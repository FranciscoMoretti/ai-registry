import assert from "node:assert/strict";

// Run against `next build && next start`, never the development server.
const baseUrl = process.env.CHECK_BASE_URL || "http://localhost:3000";
const paths = [
  "/compare",
  "/compare/openai/gpt-4o",
  "/compare/openai/gpt-4o/anthropic/claude-3.5-sonnet",
];

for (const path of paths) {
  for (let request = 0; request < 2; request++) {
    const response = await fetch(new URL(path, baseUrl));
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("cache-control") || "", /s-maxage=\d+/, path);
    if (request === 1) {
      assert.ok(
        [response.headers.get("x-nextjs-cache"), response.headers.get("x-vercel-cache")].includes("HIT"),
        `${path}: repeated request must hit the page cache`
      );
    }
    assert.ok(html.includes(" | AI Registry</title>"), `${path}: comparison metadata rendered`);
    assert.match(
      html,
      path === "/compare"
        ? /<meta name="robots" content="index, follow"\/>/
        : /<meta name="robots" content="noindex, follow"\/>/,
      `${path}: preserve indexing policy`
    );
  }
  console.log(`PASS ${path}: cacheable, repeated request HIT, indexing policy preserved`);
}
