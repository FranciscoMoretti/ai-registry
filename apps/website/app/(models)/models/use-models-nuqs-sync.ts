"use client";

import { useEffect, useRef } from "react";
import type { FilterState } from "@/app/(models)/models/model-filters";
import { useModelsQueryStates } from "./model-query-parsers";
import type { SortOption } from "./models-types";

// Accept a store-like to avoid circular imports
type ModelsStore = {
  searchQuery: string;
  sortBy: SortOption;
  inputModalities: string[];
  outputModalities: string[];
  contextLength: [number, number];
  inputPricing: [number, number];
  outputPricing: [number, number];
  maxTokens: [number, number];
  providers: string[];
  features: { reasoning: boolean; toolCall: boolean; temperatureControl: boolean };
  series: string[];
  categories: string[];
  supportedParameters: string[];
  setSearchQuery: (v: string) => void;
  setSortBy: (v: SortOption) => void;
  setFilters: (v: FilterState) => void;
};

type ModelsStoreApi = {
  getState: () => ModelsStore;
  subscribe: (listener: (s: ModelsStore) => void) => () => void;
};

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
): boolean => !!a.reasoning === !!b.reasoning && !!a.toolCall === !!b.toolCall && !!a.temperatureControl === !!b.temperatureControl;

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

const assembleFiltersFromStore = (s: ModelsStore): FilterState => ({
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

export const createUseModelsNuqsSync = (store: ModelsStoreApi) => {
  return function useModelsNuqsSync(): void {
    const [qs, setQs] = useModelsQueryStates();
    const syncingRef = useRef(false);

    // URL -> store
    useEffect(() => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      const s = store.getState();
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
      const current = assembleFiltersFromStore(s);
      if (!filtersEqual(current, nextFilters)) s.setFilters(nextFilters);
      syncingRef.current = false;
    }, [qs]);

    // store -> URL
    useEffect(() => {
      const unsub = store.subscribe((s) => {
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
    }, [setQs]);
  };
};


