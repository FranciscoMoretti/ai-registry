import assert from "node:assert/strict";
import { test } from "node:test";
import { queryParsers } from "../app/(models)/models/model-query-parsers";
import { createModelsStore } from "../app/(models)/models/models-store-context";
import type { AiGatewayModel } from "./ai/ai-gateway-models-schemas";
import { toModelData } from "./ai/to-model-data";
import { formatReleaseDate, isRecentlyReleased } from "./release-date";

const base: AiGatewayModel = {
  id: "example/model", object: "model", created: 1755815280,
  owned_by: "example", name: "Example", description: "Example",
  context_window: 128000, max_tokens: 8192, type: "language", pricing: {},
};

test("formats release timestamps in UTC and leaves unknown dates unknown", () => {
  assert.equal(formatReleaseDate(1747872000), "May 22, 2025");
  assert.equal(formatReleaseDate(), "Unknown");
});

test("recent releases exclude unknown and future dates and include the boundary", () => {
  const now = Date.UTC(2026, 8, 27);
  assert.equal(isRecentlyReleased((now - 30 * 86400000) / 1000, 30, now), true);
  assert.equal(isRecentlyReleased((now - 30 * 86400000) / 1000 - 1, 30, now), false);
  assert.equal(isRecentlyReleased(now / 1000 + 1, 30, now), false);
  assert.equal(isRecentlyReleased(undefined, 30, now), false);
  assert.equal(isRecentlyReleased(undefined, 0, now), true);
});

test("store sorts dates, filters releases, counts active filters and resets", (t) => {
  const now = Date.UTC(2026, 8, 27);
  t.mock.method(Date, "now", () => now);
  const store = createModelsStore([
    toModelData({ ...base, id: "unknown", name: "A unknown" }),
    toModelData({ ...base, id: "older", released: (now - 60 * 86400000) / 1000 }),
    toModelData({ ...base, id: "recent", released: (now - 10 * 86400000) / 1000 }),
  ]);
  store.getState().setSortBy("released-desc");
  assert.deepEqual(store.getState().resultModels.map((m) => m.id), ["recent", "older", "unknown"]);
  store.getState().setReleasedWithin("30");
  assert.deepEqual(store.getState().resultModels.map((m) => m.id), ["recent"]);
  assert.equal(store.getState().activeFiltersCount, 1);
  store.getState().setReleasedWithin("90");
  assert.equal(store.getState().resultModels.length, 2);
  store.getState().resetFiltersAndSearch();
  assert.equal(store.getState().releasedWithin, "all");
  assert.equal(store.getState().resultModels.length, 3);
  assert.equal(store.getState().activeFiltersCount, 0);
});

test("URL parsers preserve release sorting and reject unsupported windows", () => {
  assert.equal(queryParsers.sort.parse("released-desc"), "released-desc");
  assert.equal(queryParsers.released.parse("30"), "30");
  assert.equal(queryParsers.released.parse("90"), "90");
  assert.equal(queryParsers.released.parse("7"), null);
});
