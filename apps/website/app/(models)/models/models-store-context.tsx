"use client";

import { allModels, type ModelDefinition } from "@airegistry/vercel-gateway";
import { createSelectorHooks, type ZustandHookSelectors } from "auto-zustand-selectors-hook";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { FilterState } from "@/app/(models)/models/model-filters";
import { useModelsQueryStates } from "./model-query-parsers";
import { MODEL_RANGE_LIMITS } from "./models-constants";
import type { SortOption } from "./models-types";

export { MODEL_RANGE_LIMITS } from "./models-constants";
export type { SortOption } from "./models-types";

const DEFAULT_FILTERS: FilterState = {
  inputModalities: [],
  outputModalities: [],
  contextLength: MODEL_RANGE_LIMITS.context,
  inputPricing: MODEL_RANGE_LIMITS.inputPricing,
  outputPricing: MODEL_RANGE_LIMITS.outputPricing,
  maxTokens: MODEL_RANGE_LIMITS.maxTokens,
  providers: [],
  features: { reasoning: false, toolCall: false, temperatureControl: false },
  series: [],
  categories: [],
  supportedParameters: [],
};

// SortOption moved to models-types.ts for reuse in parsers

export type ModelsStore = {
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
    temperatureControl: boolean;
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
  // Cached derived data to avoid infinite loops with getServerSnapshot
  _results: ModelDefinition[];
  // Derived selectors
  resultModels: () => ModelDefinition[];
  hasActiveFilters: () => boolean;
  activeFiltersCount: () => number;
};

const defaultSortBy: SortOption = "newest";

const defaultModelsState = {
  searchQuery: "",
  sortBy: defaultSortBy,
  inputModalities: DEFAULT_FILTERS.inputModalities,
  outputModalities: DEFAULT_FILTERS.outputModalities,
  contextLength: DEFAULT_FILTERS.contextLength,
  inputPricing: DEFAULT_FILTERS.inputPricing,
  outputPricing: DEFAULT_FILTERS.outputPricing,
  maxTokens: DEFAULT_FILTERS.maxTokens,
  providers: DEFAULT_FILTERS.providers,
  features: DEFAULT_FILTERS.features,
  series: DEFAULT_FILTERS.series,
  categories: DEFAULT_FILTERS.categories,
  supportedParameters: DEFAULT_FILTERS.supportedParameters,
} as const;

// ----- Equality helpers for granular filter updates -----
const arrayEquals = <T,>(a: readonly T[], b: readonly T[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const tupleEquals = (a: readonly [number, number], b: readonly [number, number]): boolean =>
  a[0] === b[0] && a[1] === b[1];

const featuresEquals = (
  a: NonNullable<FilterState["features"]>,
  b: NonNullable<FilterState["features"]>
): boolean =>
  !!a.reasoning === !!b.reasoning &&
  !!a.toolCall === !!b.toolCall &&
  !!a.temperatureControl === !!b.temperatureControl;

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

type StrictFeatures = { reasoning: boolean; toolCall: boolean; temperatureControl: boolean };
const normalizeFeatures = (f?: FilterState["features"]): StrictFeatures => ({
  reasoning: !!f?.reasoning,
  toolCall: !!f?.toolCall,
  temperatureControl: !!f?.temperatureControl,
});

// Assemble FilterState from flattened store
const assembleFilters = (s: Pick<
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
>): FilterState => ({
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

// ----- Store implementation (hook-based) -----
  const computeResults = (
    searchQuery: string,
    filters: FilterState,
    sortBy: SortOption
  ): ModelDefinition[] => {
    let workingList: ModelDefinition[] = allModels;

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
      if (!contextOk) {
        return false;
      }
      const maxTokensOk =
        (m.max_tokens ?? 0) >= f.maxTokens[0] &&
        (m.max_tokens ?? 0) <= f.maxTokens[1];
      if (!maxTokensOk) {
        return false;
      }
      const inputPrice = Number.parseFloat(m.pricing.input) * 1_000_000;
      const outputPrice = Number.parseFloat(m.pricing.output) * 1_000_000;
      if (inputPrice < f.inputPricing[0] || inputPrice > f.inputPricing[1]) {
        return false;
      }
    if (outputPrice < f.outputPricing[0] || outputPrice > f.outputPricing[1]) {
        return false;
      }
      if (f.features.reasoning && !m.reasoning) {
        return false;
      }
      if (f.features.toolCall && !m.toolCall) {
        return false;
      }
      if (f.features.temperatureControl && m.fixedTemperature !== undefined) {
        return false;
      }
      return true;
    });

  const sorted = [...filteredList].sort((a: ModelDefinition, b: ModelDefinition) => {
        switch (sortBy) {
          case "newest":
            return b.releaseDate.getTime() - a.releaseDate.getTime();
          case "pricing-low":
            return (
          (Number.parseFloat(a.pricing.input) + Number.parseFloat(a.pricing.output)) * 1_000_000 -
          (Number.parseFloat(b.pricing.input) + Number.parseFloat(b.pricing.output)) * 1_000_000
            );
          case "pricing-high":
            return (
          (Number.parseFloat(b.pricing.input) + Number.parseFloat(b.pricing.output)) * 1_000_000 -
          (Number.parseFloat(a.pricing.input) + Number.parseFloat(a.pricing.output)) * 1_000_000
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

const initialState = defaultModelsState;

const useModelsBase = create<ModelsStore>()(
  devtools(
    (set, get) => ({
    ...initialState,
    _results: computeResults(
      initialState.searchQuery,
      assembleFilters(initialState as unknown as ModelsStore),
      initialState.sortBy
    ),
    setSearchQuery: (v: string) =>
      set((state) => ({
        searchQuery: v,
        _results: computeResults(v, assembleFilters(state), state.sortBy),
      })),
    setSortBy: (v: SortOption) =>
      set((state) => ({
        sortBy: v,
        _results: computeResults(state.searchQuery, assembleFilters(state), v),
      })),
    // Granular setters
    setInputModalities: (v: string[]) =>
      set((state) => ({
        inputModalities: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, inputModalities: v }), state.sortBy),
      })),
    setOutputModalities: (v: string[]) =>
      set((state) => ({
        outputModalities: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, outputModalities: v }), state.sortBy),
      })),
    setContextLength: (v: [number, number]) =>
      set((state) => ({
        contextLength: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, contextLength: v }), state.sortBy),
      })),
    setInputPricing: (v: [number, number]) =>
      set((state) => ({
        inputPricing: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, inputPricing: v }), state.sortBy),
      })),
    setOutputPricing: (v: [number, number]) =>
      set((state) => ({
        outputPricing: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, outputPricing: v }), state.sortBy),
      })),
    setMaxTokens: (v: [number, number]) =>
      set((state) => ({
        maxTokens: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, maxTokens: v }), state.sortBy),
      })),
    setProviders: (v: string[]) =>
      set((state) => ({
        providers: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, providers: v }), state.sortBy),
      })),
    setFeatures: (v: Partial<ModelsStore["features"]>) =>
      set((state) => {
        const next = {
          reasoning: v.reasoning ?? state.features.reasoning,
          toolCall: v.toolCall ?? state.features.toolCall,
          temperatureControl: v.temperatureControl ?? state.features.temperatureControl,
        };
        return {
          features: next,
          _results: computeResults(state.searchQuery, assembleFilters({ ...state, features: next }), state.sortBy),
        };
      }),
    setSeries: (v: string[]) =>
      set((state) => ({
        series: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, series: v }), state.sortBy),
      })),
    setCategories: (v: string[]) =>
      set((state) => ({
        categories: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, categories: v }), state.sortBy),
      })),
    setSupportedParameters: (v: string[]) =>
      set((state) => ({
        supportedParameters: v,
        _results: computeResults(state.searchQuery, assembleFilters({ ...state, supportedParameters: v }), state.sortBy),
      })),
    setFilters: (v: FilterState) =>
      set((state) => {
          const prev = assembleFilters(state);
          // Normalize features to explicit booleans
          const next: FilterState = {
          ...v,
          features: normalizeFeatures(v.features),
          };
          if (filtersEqual(prev, next)) {
            return {};
          }
          return {
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
            _results: computeResults(state.searchQuery, next, state.sortBy),
          } as Partial<ModelsStore>;
        }),
      updateFilters: (v: Partial<FilterState>) =>
        set((state) => {
          const prev = assembleFilters(state);
          // Merge with structural sharing: reuse references if unchanged
          const mergedFeatures: StrictFeatures = normalizeFeatures({
            reasoning: v.features?.reasoning ?? prev.features?.reasoning,
            toolCall: v.features?.toolCall ?? prev.features?.toolCall,
            temperatureControl: v.features?.temperatureControl ?? prev.features?.temperatureControl,
          });
          const nextFilters: FilterState = {
            inputModalities: v.inputModalities && arrayEquals(v.inputModalities, prev.inputModalities)
              ? prev.inputModalities
              : v.inputModalities ?? prev.inputModalities,
            outputModalities: v.outputModalities && arrayEquals(v.outputModalities, prev.outputModalities)
              ? prev.outputModalities
              : v.outputModalities ?? prev.outputModalities,
            contextLength: v.contextLength && tupleEquals(v.contextLength, prev.contextLength)
              ? prev.contextLength
              : v.contextLength ?? prev.contextLength,
            inputPricing: v.inputPricing && tupleEquals(v.inputPricing, prev.inputPricing)
              ? prev.inputPricing
              : v.inputPricing ?? prev.inputPricing,
            outputPricing: v.outputPricing && tupleEquals(v.outputPricing, prev.outputPricing)
              ? prev.outputPricing
              : v.outputPricing ?? prev.outputPricing,
            maxTokens: v.maxTokens && tupleEquals(v.maxTokens, prev.maxTokens)
              ? prev.maxTokens
              : v.maxTokens ?? prev.maxTokens,
            providers: v.providers && arrayEquals(v.providers, prev.providers)
              ? prev.providers
              : v.providers ?? prev.providers,
            features: featuresEquals(mergedFeatures, prev.features ?? {})
              ? (prev.features ?? mergedFeatures)
              : mergedFeatures,
            series: v.series && arrayEquals(v.series, prev.series) ? prev.series : v.series ?? prev.series,
            categories: v.categories && arrayEquals(v.categories, prev.categories)
              ? prev.categories
              : v.categories ?? prev.categories,
            supportedParameters:
              v.supportedParameters && arrayEquals(v.supportedParameters, prev.supportedParameters)
                ? prev.supportedParameters
                : v.supportedParameters ?? prev.supportedParameters,
          };

          if (filtersEqual(prev, nextFilters)) {
            return {};
          }
        return {
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
            _results: computeResults(state.searchQuery, nextFilters, state.sortBy),
          } as Partial<ModelsStore>;
        }),
      resetFiltersAndSearch: () =>
        set({
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
          _results: computeResults(
            initialState.searchQuery,
            assembleFilters(initialState as unknown as ModelsStore),
            initialState.sortBy
          ),
        } as Partial<ModelsStore>),
    resultModels: () => get()._results,
    hasActiveFilters: () => {
      const f = assembleFilters(get());
      const rangeEquals = (a: [number, number], b: [number, number]): boolean =>
        a[0] === b[0] && a[1] === b[1];
      const anyArraysActive =
        f.inputModalities.length > 0 ||
        f.outputModalities.length > 0 ||
        f.providers.length > 0 ||
        f.series.length > 0 ||
        f.categories.length > 0 ||
        f.supportedParameters.length > 0;
      const anyFeaturesActive =
        !!f.features.reasoning ||
        !!f.features.toolCall ||
        !!f.features.temperatureControl;
      const anyRangesActive = !(
        rangeEquals(f.contextLength, DEFAULT_FILTERS.contextLength) &&
        rangeEquals(f.inputPricing, DEFAULT_FILTERS.inputPricing) &&
        rangeEquals(f.outputPricing, DEFAULT_FILTERS.outputPricing) &&
        rangeEquals(f.maxTokens, DEFAULT_FILTERS.maxTokens)
      );
      return anyArraysActive || anyFeaturesActive || anyRangesActive;
    },
    activeFiltersCount: () => {
      const f = assembleFilters(get());
      const rangeEquals = (a: [number, number], b: [number, number]): boolean =>
        a[0] === b[0] && a[1] === b[1];
      let count = 0;
      count += f.inputModalities.length;
      count += f.outputModalities.length;
      count += f.providers.length;
      count += f.series.length;
      count += f.categories.length;
      count += f.supportedParameters.length;
      count += f.features.reasoning ? 1 : 0;
      count += f.features.toolCall ? 1 : 0;
      count += f.features.temperatureControl ? 1 : 0;
        count += rangeEquals(f.contextLength, DEFAULT_FILTERS.contextLength) ? 0 : 1;
        count += rangeEquals(f.inputPricing, DEFAULT_FILTERS.inputPricing) ? 0 : 1;
        count += rangeEquals(f.outputPricing, DEFAULT_FILTERS.outputPricing) ? 0 : 1;
      count += rangeEquals(f.maxTokens, DEFAULT_FILTERS.maxTokens) ? 0 : 1;
      return count;
    },
  }), { name: "models-store" })
  );

export const useModels = createSelectorHooks(
  useModelsBase
  
) as typeof useModelsBase & ZustandHookSelectors<ModelsStore>;

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [qs, setQs] = useModelsQueryStates();
  const syncingRef = useRef(false);

  // URL -> store
  useEffect(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const s = useModels.getState();
      const nextFilters: FilterState = {
        inputModalities: qs.im,
        outputModalities: qs.om,
        providers: qs.prov,
        series: qs.ser,
        categories: qs.cat,
        supportedParameters: qs.params,
        features: {
          reasoning: qs.rz,
          toolCall: qs.tc,
          temperatureControl: qs.tctl,
        },
        contextLength: [qs.cmin, qs.cmax],
        maxTokens: [qs.tmin, qs.tmax],
        inputPricing: [qs.ipmin, qs.ipmax],
        outputPricing: [qs.opmin, qs.opmax],
      };
      if (s.searchQuery !== qs.q) s.setSearchQuery(qs.q);
      if (s.sortBy !== qs.sort) s.setSortBy(qs.sort as SortOption);
    const current = assembleFilters(s);
    if (!filtersEqual(current, nextFilters)) s.setFilters(nextFilters);
    syncingRef.current = false;
  }, [qs]);

  // store -> URL
  useEffect(() => {
    const unsub = useModels.subscribe((s) => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      void setQs({
        q: s.searchQuery,
        sort: s.sortBy,
        im: s.inputModalities,
        om: s.outputModalities,
        prov: s.providers,
        ser: s.series,
        cat: s.categories,
        params: s.supportedParameters,
        rz: s.features.reasoning,
        tc: s.features.toolCall,
        tctl: s.features.temperatureControl,
        cmin: s.contextLength[0],
        cmax: s.contextLength[1],
        tmin: s.maxTokens[0],
        tmax: s.maxTokens[1],
        ipmin: s.inputPricing[0],
        ipmax: s.inputPricing[1],
        opmin: s.outputPricing[0],
        opmax: s.outputPricing[1],
      });
      syncingRef.current = false;
    });
    return unsub;
  }, []);

  return children;
}
