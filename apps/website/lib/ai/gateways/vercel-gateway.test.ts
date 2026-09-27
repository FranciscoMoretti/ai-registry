import assert from "node:assert/strict";
import { test } from "node:test";
import { VercelGateway } from "./vercel-gateway";

const model = {
  id: "example/model", object: "model", created: 1755815280,
  released: 1747872000, owned_by: "example", name: "Example",
  description: "Example model", context_window: 128000, max_tokens: 8192,
  type: "language", pricing: { input: "0.000001" },
};

test("fetches supported models when new types omit language limits and tiers omit min", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    object: "list", data: [
      { ...model, pricing: { input_tiers: [{ cost: "0.000001", max: 200001 }] } },
      { id: "example/speech", type: "speech" },
      { ...model, id: "example/unknown-date", released: undefined },
    ],
  }));
  const models = await new VercelGateway().fetchModels();
  assert.deepEqual(models.map((m) => m.id), ["example/model", "example/unknown-date"]);
  assert.equal(Reflect.get(models[0], "released"), 1747872000);
  assert.equal(Reflect.get(models[1], "released"), undefined);
  assert.equal(models[0].pricing.input_tiers?.[0].min, undefined);
});
