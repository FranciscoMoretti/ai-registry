'use client';

import { allModels, type ModelDefinition } from '@ai-registry/vercel-gateway';
import { createContext, useContext, useRef } from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { createStore } from 'zustand/vanilla';
import type { FilterState } from '@/app/(models)/models/model-filters';

// Derive dynamic ranges from available models
const contextWindows = allModels
  .map((m) => m.context_window)
  .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
const maxTokensValues = allModels
  .map((m) => m.max_tokens)
  .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
const inputPrices = allModels
  .map((m) => Number.parseFloat(m.pricing.input) * 1_000_000)
  .filter((n) => Number.isFinite(n));
const outputPrices = allModels
  .map((m) => Number.parseFloat(m.pricing.output) * 1_000_000)
  .filter((n) => Number.isFinite(n));

const minContext = contextWindows.length > 0 ? Math.min(...contextWindows) : 0;
const maxContext = contextWindows.length > 0 ? Math.max(...contextWindows) : 0;
const minMaxTokens =
  maxTokensValues.length > 0 ? Math.min(...maxTokensValues) : 0;
const maxMaxTokens =
  maxTokensValues.length > 0 ? Math.max(...maxTokensValues) : 0;
const minInputPrice = inputPrices.length > 0 ? Math.min(...inputPrices) : 0;
const maxInputPrice = inputPrices.length > 0 ? Math.max(...inputPrices) : 0;
const minOutputPrice = outputPrices.length > 0 ? Math.min(...outputPrices) : 0;
const maxOutputPrice = outputPrices.length > 0 ? Math.max(...outputPrices) : 0;

export const MODEL_RANGE_LIMITS = {
  context: [minContext, maxContext] as [number, number],
  maxTokens: [minMaxTokens, maxMaxTokens] as [number, number],
  inputPricing: [minInputPrice, maxInputPrice] as [number, number],
  outputPricing: [minOutputPrice, maxOutputPrice] as [number, number],
};

const DEFAULT_FILTERS: FilterState = {
  inputModalities: [],
  outputModalities: [],
  contextLength: [minContext, maxContext],
  inputPricing: [minInputPrice, maxInputPrice],
  outputPricing: [minOutputPrice, maxOutputPrice],
  maxTokens: [minMaxTokens, maxMaxTokens],
  providers: [],
  features: { reasoning: false, toolCall: false, temperatureControl: false },
  series: [],
  categories: [],
  supportedParameters: [],
};

export type SortOption =
  | 'newest'
  | 'pricing-low'
  | 'pricing-high'
  | 'context-high'
  | 'max-output-tokens-high';

export type ModelsStore = {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  filters: FilterState;
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

const defaultModelsState: Pick<
  ModelsStore,
  'searchQuery' | 'sortBy' | 'filters'
> = {
  searchQuery: '',
  sortBy: 'newest',
  filters: DEFAULT_FILTERS,
};

export const createModelsStore = (
  initState: Pick<
    ModelsStore,
    'searchQuery' | 'sortBy' | 'filters'
  > = defaultModelsState,
) => {
  const initialState = initState;
  const computeResults = (
    searchQuery: string,
    filters: FilterState,
    sortBy: SortOption,
  ): ModelDefinition[] => {
    let workingList: ModelDefinition[] = allModels;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      workingList = workingList.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.owned_by.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q),
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
            fi?.text ? 'text' : '',
            fi?.image ? 'image' : '',
            fi?.audio ? 'audio' : '',
            fi?.pdf ? 'pdf' : '',
            fi?.video ? 'video' : '',
          ].filter(Boolean),
        );
        if (!f.inputModalities.some((val) => set.has(val))) {
          return false;
        }
      }
      if (f.outputModalities.length > 0) {
        const fo = m.output;
        const set = new Set<string>(
          [
            fo?.text ? 'text' : '',
            fo?.image ? 'image' : '',
            fo?.audio ? 'audio' : '',
          ].filter(Boolean),
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
      if (
        outputPrice < f.outputPricing[0] ||
        outputPrice > f.outputPricing[1]
      ) {
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

    const sorted = [...filteredList].sort(
      (a: ModelDefinition, b: ModelDefinition) => {
        switch (sortBy) {
          case 'newest':
            return b.releaseDate.getTime() - a.releaseDate.getTime();
          case 'pricing-low':
            return (
              (Number.parseFloat(a.pricing.input) +
                Number.parseFloat(a.pricing.output)) *
                1_000_000 -
              (Number.parseFloat(b.pricing.input) +
                Number.parseFloat(b.pricing.output)) *
                1_000_000
            );
          case 'pricing-high':
            return (
              (Number.parseFloat(b.pricing.input) +
                Number.parseFloat(b.pricing.output)) *
                1_000_000 -
              (Number.parseFloat(a.pricing.input) +
                Number.parseFloat(a.pricing.output)) *
                1_000_000
            );
          case 'context-high':
            return b.context_window - a.context_window;
          case 'max-output-tokens-high':
            return (b.max_tokens ?? 0) - (a.max_tokens ?? 0);
          default:
            return 0;
        }
      },
    );

    return sorted;
  };
  return createStore<ModelsStore>()((set, get) => ({
    ...initialState,
    _results: computeResults(
      initialState.searchQuery,
      initialState.filters,
      initialState.sortBy,
    ),
    setSearchQuery: (v: string) =>
      set((state) => ({
        searchQuery: v,
        _results: computeResults(v, state.filters, state.sortBy),
      })),
    setSortBy: (v: SortOption) =>
      set((state) => ({
        sortBy: v,
        _results: computeResults(state.searchQuery, state.filters, v),
      })),
    setFilters: (v: FilterState) =>
      set((state) => ({
        filters: v,
        _results: computeResults(state.searchQuery, v, state.sortBy),
      })),
    updateFilters: (v: Partial<FilterState>) =>
      set((state) => {
        const nextFilters = {
          ...state.filters,
          ...v,
          features: {
            ...state.filters.features,
            ...(v.features ?? {}),
          },
        } as FilterState;
        return {
          filters: nextFilters,
          _results: computeResults(
            state.searchQuery,
            nextFilters,
            state.sortBy,
          ),
        };
      }),
    resetFiltersAndSearch: () =>
      set((_state) => {
        const nextSearch = initialState.searchQuery;
        const nextSort = initialState.sortBy;
        const nextFilters = initialState.filters;
        return {
          searchQuery: nextSearch,
          sortBy: nextSort,
          filters: nextFilters,
          _results: computeResults(nextSearch, nextFilters, nextSort),
        };
      }),
    resultModels: () => get()._results,
    hasActiveFilters: () => {
      const f = get().filters;
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
      const f = get().filters;
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
      count += rangeEquals(f.contextLength, DEFAULT_FILTERS.contextLength)
        ? 0
        : 1;
      count += rangeEquals(f.inputPricing, DEFAULT_FILTERS.inputPricing)
        ? 0
        : 1;
      count += rangeEquals(f.outputPricing, DEFAULT_FILTERS.outputPricing)
        ? 0
        : 1;
      count += rangeEquals(f.maxTokens, DEFAULT_FILTERS.maxTokens) ? 0 : 1;
      return count;
    },
  }));
};

type ModelsStoreApi = ReturnType<typeof createModelsStore>;

const ModelsStoreContext = createContext<ModelsStoreApi | undefined>(undefined);

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ModelsStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createModelsStore();
  }

  return (
    <ModelsStoreContext.Provider value={storeRef.current}>
      {children}
    </ModelsStoreContext.Provider>
  );
}

export function useModels<T>(
  selector: (store: ModelsStore) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T;
export function useModels(): ModelsStore;
export function useModels<T = ModelsStore>(
  selector?: (store: ModelsStore) => T,
  equalityFn?: (a: T, b: T) => boolean,
) {
  const store = useContext(ModelsStoreContext);
  if (!store) {
    throw new Error('useModels must be used within ModelsProvider');
  }
  const selectorOrIdentity =
    (selector as (store: ModelsStore) => T) ??
    ((s: ModelsStore) => s as unknown as T);
  return useStoreWithEqualityFn(store, selectorOrIdentity, equalityFn);
}
