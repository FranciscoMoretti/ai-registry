import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const website = fileURLToPath(new URL("../", import.meta.url));
const root = resolve(website, "../..");
const appOutput = join(website, ".next/server/app");
const imageResponseSuffix = "/next/dist/server/og/image-response.js";

// A full node_modules installation hides missing deployment dependencies.
// Reconstruct each OG function using only its build trace, then consume the
// ImageResponse stream so its lazy renderer import and WASM/font loads run.
test("OG function traces can render a PNG in isolation", async (t) => {
  const entries = await readdir(appOutput, { recursive: true });
  const traces = entries.filter(
    (entry) =>
      entry.endsWith("/route.js.nft.json") &&
      (entry.includes("opengraph-image") || entry.startsWith("api/og/"))
  );
  assert.ok(traces.length >= 4, "Build the website before running this check");

  for (const trace of traces) {
    await t.test(trace, async () => {
      const tracePath = join(appOutput, trace);
      const { files } = JSON.parse(await readFile(tracePath, "utf8"));
      const wrapper = files.find((file) => file.endsWith(imageResponseSuffix));
      assert.ok(wrapper, "Expected Next.js ImageResponse in the function trace");
      const isolated = await mkdtemp(join(tmpdir(), "ai-registry-og-trace-"));
      try {
        for (const file of files) {
          const source = resolve(dirname(tracePath), file);
          const destination = relative(root, source);
          assert.ok(!destination.startsWith(".."), "Trace escaped the repository");
          const target = join(isolated, destination);
          await mkdir(dirname(target), { recursive: true });
          await cp(source, target, { verbatimSymlinks: true });
        }
        const wrapperPath = join(
          isolated,
          relative(root, resolve(dirname(tracePath), wrapper))
        );
        execFileSync(
          process.execPath,
          [
            "--input-type=module",
            "--eval",
            `
              import assert from "node:assert/strict";
              const { ImageResponse } = await import(${JSON.stringify(pathToFileURL(wrapperPath).href)});
              const image = new ImageResponse(
                { type: "div", props: { children: "OG smoke test" } },
                { width: 300, height: 100 }
              );
              const bytes = Buffer.from(await image.arrayBuffer());
              assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
              assert.equal(bytes.readUInt32BE(16), 300);
              assert.equal(bytes.readUInt32BE(20), 100);
            `,
          ],
          { cwd: isolated, timeout: 30_000, stdio: "pipe" }
        );
      } finally {
        await rm(isolated, { recursive: true, force: true });
      }
    });
  }
});
