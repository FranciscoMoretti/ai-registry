import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getActiveGateway } from "../lib/ai/active-gateway";

async function fetchAndSaveModels() {
  const gateway = getActiveGateway();

  console.log(`Fetching models from '${gateway.type}' gateway...`);
  const models = await gateway.fetchModels();

  if (!models || models.length === 0) {
    throw new Error("No models returned from gateway");
  }

  const fileContent = `import type { AiGatewayModel } from "./ai-gateway-models-schemas";
import type { GatewayType } from "./gateways/registry";

export const generatedForGateway = "${gateway.type}" satisfies GatewayType;

export const models = ${JSON.stringify(models, null, 2)} as const satisfies readonly AiGatewayModel[];
`;

  const outputPath = join(
    process.cwd(),
    "lib",
    "ai",
    "models.generated.ts"
  );
  writeFileSync(outputPath, fileContent);
  console.log(
    `Wrote ${models.length} models from '${gateway.type}' gateway to ${outputPath}`
  );
}

fetchAndSaveModels().catch((err) => {
  console.error(err);
  process.exit(1);
});
