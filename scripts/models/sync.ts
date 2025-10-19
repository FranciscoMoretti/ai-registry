#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { join } from "node:path";

async function main() {
  const ROOT = join(__dirname, "..", "..");
  const run = (cmd: string) =>
    execSync(cmd, { cwd: ROOT, stdio: "inherit", env: process.env });

  // 1) Fetch base snapshot and lists
  run("tsx scripts/models/fetch-base.ts");

  // 2) Fetch extras and generate model-extra.generated.ts
  run("bun scripts/models/fetch-extra.ts");

  // 3) Fetch endpoints and build models.generated.ts
  run("tsx scripts/models/fetch-endpoints.ts");

  // 4) Typecheck
  run("bun run test:types");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
