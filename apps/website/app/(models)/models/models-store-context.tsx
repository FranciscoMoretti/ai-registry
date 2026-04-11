"use client";

import { createContext, useContext, useRef } from "react";
import { createStore, type StoreApi, useStore } from "zustand";
import { devtools } from "zustand/middleware";
import type { FilterState } from "@/app/(models)/models/model-filters";
import type { ModelData } from "@/lib/ai/model-data";
import { computeModelRangeLimits, type ModelRangeLimits } from "./models-constants";
import type { SortOption } from "./models-types";
import { createUseModelsNuqsSync } from "./use-models-nuqs-sync";

export type { SortOption } from "./models-types";

const defaultSortBy: SortOption = "name-asc";

export type ModelsStore = {
  // All models (immutable for the lifetime of this provider)
  allModels: ModelData[];
  rangeLimits: ModelRangeLimits;

  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;

  // Flattened filter fields (granular)
  inputModalities: string[];
  outputModalities: string[];
  contextLength: [number, number];
  inputPricing: [number, number];
  outputPricing: [number, number];
  maxTokens: [number, number];
  providers: string[];
  features: {
    reasoning: boolean;
    toolCall: boolean;
  };
  series: string[];
  categories: string[];
  supportedParameters: string[];

  // Granular setters
  setInputModalities: (v: string[]) => void;
  setOutputModalities: (v: string[]) => void;
  setContextLength: (v: [number, number]) => void;
  setInputPricing: (v: [number, number]) => void;
  setOutputPricing: (v: [number, number]) => void;
  setMaxTokens: (v: [number, number]) => void;
  setProviders: (v: string[]) => void;
  setFeatures: (v: Partial<ModelsStore["features"]>) => void;
  setSeries: (v: string[]) => void;
  setCategories: (v: string[]) => void;
  setSupportedParameters: (v: string[]) => void;

  // Batch compatibility setters
  setFilters: (v: FilterState) => void;
  updateFilters: (v: Partial<FilterState>) => void;
  resetFiltersAndSearch: () => void;

  // Derived values (non-function for hook reactivity)
  resultModels: ModelData[];
  activeFiltersCount: number;
  hasActiveFilters: boolean;
};

const arrayEquals = <T,>(a: readonly T[], b: readonly T[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const tupleEquals = (
  a: readonly [number, number],
  b: readonly [number, number]
): boolean => a[0] === b[0] && a[1] === b[1];

const featuresEquals = (
  a: NonNullable<FilterState["features"]>,
  b: NonNullable<FilterState["features"]>
): boolean =>
  !!a.reasoning === !!b.reasoning &&
  !!a.toolCall === !!b.toolCall;

const filtersEqual = (a: FilterState, b: FilterState): boolean =>
  arrayEquals(a.inputModalities, b.inputModalities) &&
  arrayEquals(a.outputModalities, b.outputModalities) &&
  tupleEquals(a.contextLength, b.contextLength) &&
  tupleEquals(a.inputPricing, b.inputPricing) &&
  tupleEquals(a.outputPricing, b.outputPricing) &&
  tupleEquals(a.maxTokens, b.maxTokens) &&
  arrayEquals(a.providers, b.providers) &&
  featuresEquals(a.features ?? {}, b.features ?? {}) &&
  arrayEquals(a.series, b.series) &&
  arrayEquals(a.categories, b.categories) &&
  arrayEquals(a.supportedParameters, b.supportedParameters);

type StrictFeatures = {
  reasoning: boolean;
  toolCall: boolean;
};
const normalizeFeatures = (f?: FilterState["features"]): StrictFeatures => ({
  reasoning: !!f?.reasoning,
  toolCall: !!f?.toolCall,
});

const assembleFilters = (
  s: Pick<
    ModelsStore,
    | "inputModalities"
    | "outputModalities"
    | "contextLength"
    | "inputPricing"
    | "outputPricing"
    | "maxTokens"
    | "providers"
    | "features"
    | "series"
    | "categories"
    | "supportedParameters"
  >
): FilterState => ({
  inputModalities: s.inputModalities,
  outputModalities: s.outputModalities,
  contextLength: s.contextLength,
  inputPricing: s.inputPricing,
  outputPricing: s.outputPricing,
  maxTokens: s.maxTokens,
  providers: s.providers,
  features: s.features,
  series: s.series,
  categories: s.categories,
  supportedParameters: s.supportedParameters,
});

const computeActiveFiltersCount = (
  f: FilterState,
  defaults: FilterState
): number => {
  const rangeEquals = (
    a: [number, number],
    b: [number, number]
  ): boolean => a[0] === b[0] && a[1] === b[1];
  let count = 0;
  count += f.inputModalities.length;
  count += f.outputModalities.length;
  count += f.providers.length;
  count += f.series.length;
  count += f.categories.length;
  count += f.supportedParameters.length;
  count += f.features.reasoning ? 1 : 0;
  count += f.features.toolCall ? 1 : 0;
  count += rangeEquals(f.contextLength, defaults.contextLength) ? 0 : 1;
  count += rangeEquals(f.inputPricing, defaults.inputPricing) ? 0 : 1;
  count += rangeEquals(f.outputPricing, defaults.outputPricing) ? 0 : 1;
  count += rangeEquals(f.maxTokens, defaults.maxTokens) ? 0 : 1;
  return count;
};

const computeResults = (
  allModels: ModelData[],
  searchQuery: string,
  filters: FilterState,
  sortBy: SortOption,
  rangeLimits: ModelRangeLimits
): ModelData[] => {
  const isDefaultRange = (
    range: [number, number],
    defaults: [number, number]
  ): boolean => range[0] === defaults[0] && range[1] === defaults[1];

  const parsePrice = (value?: string): number | null => {
    if (value === undefined) {
      return null;
    }
    const price = Number.parseFloat(value) * 1_000_000;
    return Number.isFinite(price) ? price : null;
  };

  let workingList: ModelData[] = allModels;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    workingList = workingList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.owned_by.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }

  const f = filters;
  const filteredList = workingList.filter((m) => {
    if (f.providers.length > 0 && !f.providers.includes(m.owned_by)) {
      return false;
    }
    if (f.inputModalities.length > 0) {
      const fi = m.input;
      const set = new Set<string>(
        [
          fi?.text ? "text" : "",
          fi?.image ? "image" : "",
          fi?.audio ? "audio" : "",
          fi?.pdf ? "pdf" : "",
          fi?.video ? "video" : "",
        ].filter(Boolean)
      );
      if (!f.inputModalities.some((val) => set.has(val))) {
        return false;
      }
    }
    if (f.outputModalities.length > 0) {
      const fo = m.output;
      const set = new Set<string>(
        [
          fo?.text ? "text" : "",
          fo?.image ? "image" : "",
          fo?.audio ? "audio" : "",
        ].filter(Boolean)
      );
      if (!f.outputModalities.some((val) => set.has(val))) {
        return false;
      }
    }
    const contextOk =
      m.context_window >= f.contextLength[0] &&
      m.context_window <= f.contextLength[1];
    if (!contextOk) return false;

    const maxTokensOk =
      (m.max_tokens ?? 0) >= f.maxTokens[0] &&
      (m.max_tokens ?? 0) <= f.maxTokens[1];
    if (!maxTokensOk) return false;

    const inputPrice = parsePrice(m.pricing.input);
    const outputPrice = parsePrice(m.pricing.output);
    const inputPricingAtDefault = isDefaultRange(
      f.inputPricing,
      rangeLimits.inputPricing
    );
    const outputPricingAtDefault = isDefaultRange(
      f.outputPricing,
      rangeLimits.outputPricing
    );

    if (
      inputPrice === null
        ? !inputPricingAtDefault
        : inputPrice < f.inputPricing[0] || inputPrice > f.inputPricing[1]
    ) {
      return false;
    }
    if (
      outputPrice === null
        ? !outputPricingAtDefault
        : outputPrice < f.outputPricing[0] || outputPrice > f.outputPricing[1]
    ) {
      return false;
    }
    if (f.features.reasoning && !m.reasoning) return false;
    if (f.features.toolCall && !m.toolCall) return false;
    return true;
  });

  const sorted = [...filteredList].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "pricing-low":
        return (
          (Number.parseFloat(a.pricing.input ?? "0") +
            Number.parseFloat(a.pricing.output ?? "0")) *
            1_000_000 -
          (Number.parseFloat(b.pricing.input ?? "0") +
            Number.parseFloat(b.pricing.output ?? "0")) *
            1_000_000
        );
      case "pricing-high":
        return (
          (Number.parseFloat(b.pricing.input ?? "0") +
            Number.parseFloat(b.pricing.output ?? "0")) *
            1_000_000 -
          (Number.parseFloat(a.pricing.input ?? "0") +
            Number.parseFloat(a.pricing.output ?? "0")) *
            1_000_000
        );
      case "context-high":
        return b.context_window - a.context_window;
      case "max-output-tokens-high":
        return (b.max_tokens ?? 0) - (a.max_tokens ?? 0);
      default:
        return 0;
    }
  });

  return sorted;
};

function createModelsStore(allModels: ModelData[]): StoreApi<ModelsStore> {
  const rangeLimits = computeModelRangeLimits(allModels);
  const defaultFilters: FilterState = {
    inputModalities: [],
    outputModalities: [],
    contextLength: rangeLimits.context,
    inputPricing: rangeLimits.inputPricing,
    outputPricing: rangeLimits.outputPricing,
    maxTokens: rangeLimits.maxTokens,
    providers: [],
    features: { reasoning: false, toolCall: false },
    series: [],
    categories: [],
    supportedParameters: [],
  };

  const initialState = {
    allModels,
    rangeLimits,
    searchQuery: "",
    sortBy: defaultSortBy,
    inputModalities: defaultFilters.inputModalities,
    outputModalities: defaultFilters.outputModalities,
    contextLength: defaultFilters.contextLength,
    inputPricing: defaultFilters.inputPricing,
    outputPricing: defaultFilters.outputPricing,
    maxTokens: defaultFilters.maxTokens,
    providers: defaultFilters.providers,
    features: normalizeFeatures(defaultFilters.features),
    series: defaultFilters.series,
    categories: defaultFilters.categories,
    supportedParameters: defaultFilters.supportedParameters,
  };

  const recompute = (state: ModelsStore, partial: Partial<ModelsStore>) => {
    const next = { ...state, ...partial } as ModelsStore;
    const filters = assembleFilters(next);
    const count = computeActiveFiltersCount(filters, defaultFilters);
    return {
      ...partial,
      resultModels: computeResults(
        allModels,
        next.searchQuery,
        filters,
        next.sortBy,
        rangeLimits
      ),
      activeFiltersCount: count,
      hasActiveFilters: count > 0,
    } as Partial<ModelsStore>;
  };

  return createStore<ModelsStore>()(
    devtools(
      (set, get) => ({
        ...initialState,
        resultModels: computeResults(
          allModels,
          initialState.searchQuery,
          assembleFilters(initialState as unknown as ModelsStore),
          initialState.sortBy,
          rangeLimits
        ),
        activeFiltersCount: computeActiveFiltersCount(
          assembleFilters(initialState as unknown as ModelsStore),
          defaultFilters
        ),
        hasActiveFilters:
          computeActiveFiltersCount(
            assembleFilters(initialState as unknown as ModelsStore),
            defaultFilters
          ) > 0,

        setSearchQuery: (v) => set((s) => recompute(s, { searchQuery: v })),
        setSortBy: (v) => set((s) => recompute(s, { sortBy: v })),
        setInputModalities: (v) =>
          set((s) => recompute(s, { inputModalities: v })),
        setOutputModalities: (v) =>
          set((s) => recompute(s, { outputModalities: v })),
        setContextLength: (v) => set((s) => recompute(s, { contextLength: v })),
        setInputPricing: (v) => set((s) => recompute(s, { inputPricing: v })),
        setOutputPricing: (v) => set((s) => recompute(s, { outputPricing: v })),
        setMaxTokens: (v) => set((s) => recompute(s, { maxTokens: v })),
        setProviders: (v) => set((s) => recompute(s, { providers: v })),
        setFeatures: (v) =>
          set((s) =>
            recompute(s, {
              features: {
                reasoning: v.reasoning ?? s.features.reasoning,
                toolCall: v.toolCall ?? s.features.toolCall,
              },
            })
          ),
        setSeries: (v) => set((s) => recompute(s, { series: v })),
        setCategories: (v) => set((s) => recompute(s, { categories: v })),
        setSupportedParameters: (v) =>
          set((s) => recompute(s, { supportedParameters: v })),

        setFilters: (v) =>
          set((s) => {
            const prev = assembleFilters(s);
            const next: FilterState = {
              ...v,
              features: normalizeFeatures(v.features),
            };
            if (filtersEqual(prev, next)) return {};
            return recompute(s, {
              inputModalities: next.inputModalities,
              outputModalities: next.outputModalities,
              contextLength: next.contextLength,
              inputPricing: next.inputPricing,
              outputPricing: next.outputPricing,
              maxTokens: next.maxTokens,
              providers: next.providers,
              features: normalizeFeatures(next.features),
              series: next.series,
              categories: next.categories,
              supportedParameters: next.supportedParameters,
            });
          }),

        updateFilters: (v) =>
          set((s) => {
            const prev = assembleFilters(s);
            const mergedFeatures: StrictFeatures = normalizeFeatures({
              reasoning: v.features?.reasoning ?? prev.features?.reasoning,
              toolCall: v.features?.toolCall ?? prev.features?.toolCall,
            });
            const nextFilters: FilterState = {
              inputModalities: v.inputModalities ?? prev.inputModalities,
              outputModalities: v.outputModalities ?? prev.outputModalities,
              contextLength: v.contextLength ?? prev.contextLength,
              inputPricing: v.inputPricing ?? prev.inputPricing,
              outputPricing: v.outputPricing ?? prev.outputPricing,
              maxTokens: v.maxTokens ?? prev.maxTokens,
              providers: v.providers ?? prev.providers,
              features: mergedFeatures,
              series: v.series ?? prev.series,
              categories: v.categories ?? prev.categories,
              supportedParameters:
                v.supportedParameters ?? prev.supportedParameters,
            };
            if (filtersEqual(prev, nextFilters)) return {};
            return recompute(s, {
              inputModalities: nextFilters.inputModalities,
              outputModalities: nextFilters.outputModalities,
              contextLength: nextFilters.contextLength,
              inputPricing: nextFilters.inputPricing,
              outputPricing: nextFilters.outputPricing,
              maxTokens: nextFilters.maxTokens,
              providers: nextFilters.providers,
              features: normalizeFeatures(nextFilters.features),
              series: nextFilters.series,
              categories: nextFilters.categories,
              supportedParameters: nextFilters.supportedParameters,
            });
          }),

        resetFiltersAndSearch: () =>
          set((s) =>
            recompute(s, {
              searchQuery: initialState.searchQuery,
              sortBy: initialState.sortBy,
              inputModalities: initialState.inputModalities,
              outputModalities: initialState.outputModalities,
              contextLength: initialState.contextLength,
              inputPricing: initialState.inputPricing,
              outputPricing: initialState.outputPricing,
              maxTokens: initialState.maxTokens,
              providers: initialState.providers,
              features: initialState.features,
              series: initialState.series,
              categories: initialState.categories,
              supportedParameters: initialState.supportedParameters,
            })
          ),
      }),
      { name: "models-store" }
    )
  );
}

const ModelsStoreContext = createContext<StoreApi<ModelsStore> | null>(null);

export function ModelsProvider({
  children,
  allModels,
}: {
  children: React.ReactNode;
  allModels: ModelData[];
}) {
  const storeRef = useRef<StoreApi<ModelsStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createModelsStore(allModels);
  }
  return (
    <ModelsStoreContext.Provider value={storeRef.current}>
      <NuqsSync />
      {children}
    </ModelsStoreContext.Provider>
  );
}

function NuqsSync() {
  const store = useContext(ModelsStoreContext);
  if (!store) throw new Error("ModelsStoreContext not found");
  const useNuqsSync = createUseModelsNuqsSync(store);
  useNuqsSync();
  return null;
}

function useModelsStore<T>(selector: (s: ModelsStore) => T): T {
  const store = useContext(ModelsStoreContext);
  if (!store) {
    throw new Error("useModels must be used within a ModelsProvider");
  }
  return useStore(store, selector);
}

// Public hooks API. Mirrors the previous auto-zustand-selectors-hook surface
// but reads from a per-Provider store via context.
export const useModels = {
  useAllModels: () => useModelsStore((s) => s.allModels),
  useRangeLimits: () => useModelsStore((s) => s.rangeLimits),
  useSearchQuery: () => useModelsStore((s) => s.searchQuery),
  useSetSearchQuery: () => useModelsStore((s) => s.setSearchQuery),
  useSortBy: () => useModelsStore((s) => s.sortBy),
  useSetSortBy: () => useModelsStore((s) => s.setSortBy),
  useInputModalities: () => useModelsStore((s) => s.inputModalities),
  useSetInputModalities: () => useModelsStore((s) => s.setInputModalities),
  useOutputModalities: () => useModelsStore((s) => s.outputModalities),
  useSetOutputModalities: () => useModelsStore((s) => s.setOutputModalities),
  useContextLength: () => useModelsStore((s) => s.contextLength),
  useSetContextLength: () => useModelsStore((s) => s.setContextLength),
  useMaxTokens: () => useModelsStore((s) => s.maxTokens),
  useSetMaxTokens: () => useModelsStore((s) => s.setMaxTokens),
  useInputPricing: () => useModelsStore((s) => s.inputPricing),
  useSetInputPricing: () => useModelsStore((s) => s.setInputPricing),
  useOutputPricing: () => useModelsStore((s) => s.outputPricing),
  useSetOutputPricing: () => useModelsStore((s) => s.setOutputPricing),
  useProviders: () => useModelsStore((s) => s.providers),
  useSetProviders: () => useModelsStore((s) => s.setProviders),
  useFeatures: () => useModelsStore((s) => s.features),
  useSetFeatures: () => useModelsStore((s) => s.setFeatures),
  useResultModels: () => useModelsStore((s) => s.resultModels),
  useActiveFiltersCount: () => useModelsStore((s) => s.activeFiltersCount),
  useHasActiveFilters: () => useModelsStore((s) => s.hasActiveFilters),
  useResetFiltersAndSearch: () =>
    useModelsStore((s) => s.resetFiltersAndSearch),
};
