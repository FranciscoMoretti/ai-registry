import {
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import type { SortOption } from "./models-types";

const sortParser = createParser<SortOption>({
  parse: (v) =>
    (
      [
        "released-desc",
        "name-asc",
        "name-desc",
        "pricing-low",
        "pricing-high",
        "context-high",
        "max-output-tokens-high",
      ] as const
    ).includes(v as SortOption)
      ? (v as SortOption)
      : "released-desc",
  serialize: (v) => v,
});

export const queryParsers = {
  released: parseAsStringLiteral(["all", "30", "90"] as const).withDefault("all"),
  q: parseAsString.withDefault(""),
  sort: sortParser.withDefault("released-desc"),
  im: parseAsArrayOf(parseAsString).withDefault([]),
  om: parseAsArrayOf(parseAsString).withDefault([]),
  prov: parseAsArrayOf(parseAsString).withDefault([]),
  ser: parseAsArrayOf(parseAsString).withDefault([]),
  cat: parseAsArrayOf(parseAsString).withDefault([]),
  params: parseAsArrayOf(parseAsString).withDefault([]),
  rz: parseAsBoolean.withDefault(false),
  tc: parseAsBoolean.withDefault(false),
  cmin: parseAsInteger,
  cmax: parseAsInteger,
  tmin: parseAsInteger,
  tmax: parseAsInteger,
  ipmin: parseAsInteger,
  ipmax: parseAsInteger,
  opmin: parseAsInteger,
  opmax: parseAsInteger,
};

export const useModelsQueryStates = () =>
  useQueryStates(queryParsers);
