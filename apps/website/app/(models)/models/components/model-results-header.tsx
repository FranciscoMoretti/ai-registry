"use client";

import { memo } from "react";
import { ModelListHeaders } from "./model-list-header";
import { ModelListHeaderFilters } from "./model-list-header-filters";
import { ModelResultsCount } from "./model-results-count";

export function PureModelResultsHeader() {
  return (
    <div className="mb-4 flex flex-col gap-2">
      <ModelListHeaders />
      <ModelListHeaderFilters />
      <ModelResultsCount />
    </div>
  );
}

export const ModelResultsHeader = memo(PureModelResultsHeader);
