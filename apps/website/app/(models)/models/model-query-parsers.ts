import {
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { MODEL_RANGE_LIMITS } from "./models-constants";
import type { SortOption } from "./models-types";

const sortParser = createParser<SortOption>({
  parse: (v) =>
    (
      [
        "newest",
        "pricing-low",
        "pricing-high",
        "context-high",
        "max-output-tokens-high",
      ] as const
    ).includes(v as SortOption)
      ? (v as SortOption)
      : "newest",
  serialize: (v) => v,
});

export const queryParsers = {
  q: parseAsString.withDefault(""),
  sort: sortParser.withDefault("newest"),
  im: parseAsArrayOf(parseAsString).withDefault([]),
  om: parseAsArrayOf(parseAsString).withDefault([]),
  prov: parseAsArrayOf(parseAsString).withDefault([]),
  ser: parseAsArrayOf(parseAsString).withDefault([]),
  cat: parseAsArrayOf(parseAsString).withDefault([]),
  params: parseAsArrayOf(parseAsString).withDefault([]),
  rz: parseAsBoolean.withDefault(false),
  tc: parseAsBoolean.withDefault(false),
  tctl: parseAsBoolean.withDefault(false),
  cmin: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.context[0]),
  cmax: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.context[1]),
  tmin: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.maxTokens[0]),
  tmax: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.maxTokens[1]),
  ipmin: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.inputPricing[0]),
  ipmax: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.inputPricing[1]),
  opmin: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.outputPricing[0]),
  opmax: parseAsInteger.withDefault(MODEL_RANGE_LIMITS.outputPricing[1]),
};

export const useModelsQueryStates = () =>
  useQueryStates(queryParsers);


