import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import next from "next";

const website = fileURLToPath(new URL("../", import.meta.url));

test("missing models still return a valid OG image", { timeout: 30_000 }, async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../.next/server/app-paths-manifest.json", import.meta.url), "utf8")
  );
  const route = Object.keys(manifest).find(
    (path) => path.includes("/models/[provider]/[id]/opengraph-image")
  );
  assert.ok(route, "Build the website before running this check");
  const pathname = route
    .replace("/(models)", "")
    .replace("[provider]", "__og_test_missing_provider__")
    .replace("[id]", "__og_test_missing_model__")
    .replace(/\/route$/, "");

  const app = next({ dev: false, dir: website });
  const server = createServer(app.getRequestHandler());
  try {
    await app.prepare();
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), 1200);
    assert.equal(bytes.readUInt32BE(20), 630);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await app.close();
  }
});
